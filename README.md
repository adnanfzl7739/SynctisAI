# SynctisAI

A multi-agent AI platform built on a MERN microservices architecture. Users can chat, generate and preview code, search the web, analyze images, and ask questions over their own PDFs, including scanned (image-based) PDFs. All requests are routed automatically to the right specialized agent by an LLM-based supervisor built with LangGraph.

## Features

- **Multi-agent orchestration**: A LangGraph supervisor/router node classifies each user request and dispatches it to one of five specialized agents:
  - **Chat Agent**: general conversation with memory
  - **Coding Agent**: code generation, review, explanation, debugging, optimization, and language conversion
  - **Search Agent**: real-time web search grounding via Tavily
  - **Vision Agent**: image analysis and text extraction using Gemini
  - **PDF RAG Agent**: document Q&A over uploaded PDFs (parse → OCR fallback → chunk → embed → vector search → answer), answering only from the document to avoid hallucination
- **Automatic file routing**: uploaded images always go to the Vision Agent and uploaded PDFs always go to the PDF RAG Agent, regardless of the selected agent
- **Scanned PDF support**: if a PDF has no text layer (scanned or image-based), the PDF RAG Agent extracts the text with Gemini OCR and then continues through the normal RAG pipeline
- **Temporary vector collections**: each PDF request creates its own Qdrant collection, which is deleted along with the uploaded temp file once the response is generated
- **Microservices backend**: independent Gateway, Auth, Chat, and Agent services, each a standalone Express app
- **Centralized API Gateway**: CORS, Helmet security headers, request logging, cookie-based session auth, and header-injecting proxying to downstream services
- **Redis-backed sessions**: session validation middleware backed by Redis, with clean 401 responses for missing/expired sessions
- **Per-agent rate limiting**: Redis `INCR`/`EXPIRE` sliding-window limiter (60s window) with configurable per-agent thresholds and structured 429 responses (remaining quota, retry-after)
- **Firebase Authentication** for login/logout
- **React + Redux Toolkit frontend** with a code editor (Monaco), Markdown rendering, and an artifact panel for generated code

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Redux Toolkit, React Router, Tailwind CSS, Vite, Monaco Editor, Framer Motion |
| Backend | Node.js, Express 5, microservices (Gateway, Auth, Chat, Agent) |
| AI / Orchestration | LangChain, LangGraph |
| LLMs and embeddings | Google Gemini (vision, PDF OCR, embeddings), Groq (chat, search, PDF answers), DeepSeek via OpenRouter (coding) |
| Search | Tavily |
| Document processing | pdf-parse, LangChain recursive text splitter |
| Data | MongoDB (Mongoose), Redis (sessions, rate limiting, caching), Qdrant (vector store) |
| Auth | Firebase Admin / Firebase Auth |
| Infra | Docker, Docker Compose |

## Architecture

```
Client (React)
      │
      ▼
 API Gateway  ── CORS, Helmet, session auth, proxying
      │
      ├── /api/auth   → Auth Service    (MongoDB, Firebase)
      ├── /api/chat   → Chat Service    (MongoDB)
      └── /api/agent  → Agent Service   (LangGraph supervisor)
                                │
                                ▼
                          Router node
                                │
        image upload ───────────┼──────────── PDF upload
                │               │                  │
                ▼               ▼                  ▼
          Vision Agent    Chat / Coding /     PDF RAG Agent
           (Gemini)       Search Agents       (OCR fallback + Qdrant)
                                │
                          Search → Chat

Redis is shared across services for sessions, rate limiting, and caching.
```

### Router logic

1. If a file is uploaded and it is an image, route to the **Vision Agent**.
2. If a file is uploaded and it is a PDF, route to the **PDF RAG Agent**.
3. If the client selected a specific agent (not `auto`), use that agent.
4. Otherwise, an LLM classifies the prompt as `chat`, `search`, or `coding`.

### PDF RAG pipeline

1. Read the uploaded PDF and extract its text with `pdf-parse`.
2. If the extracted text is shorter than 100 characters, the PDF is treated as scanned and sent to Gemini to extract the text (OCR).
3. If no text can be extracted, return a clear "couldn't extract any text" response.
4. Split the text into chunks (1000 characters, 200 overlap).
5. Embed the chunks with `gemini-embedding-001` and store them in a temporary Qdrant collection (`pdf-<timestamp>`).
6. Run a similarity search and retrieve the top 5 chunks for the user's question.
7. Send the retrieved context and the question to the LLM, which answers only from the PDF.
8. Cleanup: delete the temp file and the Qdrant collection.

## Project Structure

```
SynctisAI/
├── backend/
│   ├── docker-compose.yml       # Redis service
│   ├── shared/redis/            # shared Redis client
│   ├── gateway/                 # API Gateway (auth, proxying, security)
│   └── services/
│       ├── auth/                # Login/logout, Firebase, MongoDB user store
│       ├── chat/                # Conversations & messages
│       └── agent/               # LangGraph agents, RAG pipeline, rate limiting
│           ├── agents/          # chat, coding, search, vision, pdfRag
│           ├── config/          # per-agent rate limit config
│           ├── utils/           # model.js, embedding.js, vectorStore.js
│           └── temp/            # temporary uploads (auto-deleted)
└── frontend/                    # React + Vite client
```

## Prerequisites

- Node.js (v18+ recommended)
- npm
- Docker & Docker Compose (for Redis)
- MongoDB instance (local or Atlas)
- A Qdrant instance (local via Docker, or Qdrant Cloud)
- API keys: Google Gemini, Groq, OpenRouter, Tavily
- A Firebase project (for authentication)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/adnanfzl7739/SynctisAI.git
cd SynctisAI
```

### 2. Start Redis

```bash
cd backend
docker compose up -d
```

### 3. Install dependencies

Each service has its own `package.json`, so install dependencies individually:

```bash
# Gateway
cd backend/gateway && npm install

# Auth service
cd ../services/auth && npm install

# Chat service
cd ../chat && npm install

# Agent service
cd ../agent && npm install

# Frontend
cd ../../../frontend && npm install
```

### 4. Configure environment variables

Each backend service needs its own `.env` file. At minimum:

**`backend/gateway/.env`**
```env
PORT=5000
AUTH_SERVICE=http://localhost:5001
CHAT_SERVICE=http://localhost:5002
AGENT_SERVICE=http://localhost:8003
REDIS_URL=redis://localhost:6379
```

**`backend/services/auth/.env`**
```env
PORT=5001
MONGODB_URL=your_mongodb_connection_string
# Firebase Admin service account credentials
```

**`backend/services/chat/.env`**
```env
PORT=5002
MONGODB_URL=your_mongodb_connection_string
```

**`backend/services/agent/.env`**
```env
PORT=8003
MONGODB_URL=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379

# Gemini: vision, PDF OCR and embeddings
GOOGLE_API_KEY=your_google_gemini_api_key

# Chat, search and PDF answers
GROQ_API_KEY=your_groq_api_key

# Coding agent (DeepSeek via OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key

TAVILY_API_KEY=your_tavily_api_key

# Qdrant Cloud: include the port, and use a key with manage/write access
QDRANT_URL=https://your-cluster-id.your-region.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
```

> Do not wrap values in quotes or add spaces around `=`. Qdrant Cloud shows an API key only once when it is created, so copy it immediately. If you lose it, create a new one under your cluster's **API Keys** tab.

> Also place your Firebase service account JSON (referenced by `config/firebase.js`) securely. It's git-ignored by default.

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:5000
# Firebase client config (apiKey, authDomain, projectId, etc.)
```

### 5. Run the services

In separate terminals:

```bash
# Gateway
cd backend/gateway && npm run dev

# Auth service
cd backend/services/auth && npm run dev

# Chat service
cd backend/services/chat && npm run dev

# Agent service
cd backend/services/agent && npm run dev

# Frontend
cd frontend && npm run dev
```

The frontend will be available at `http://localhost:5173`, proxying API calls to the Gateway at `http://localhost:5000`.

## Model Configuration

Models are configured in `backend/services/agent/utils/`:

| File | What it sets |
|---|---|
| `model.js` | Chat models for each agent (Gemini for vision and OCR, Groq for chat/search/PDF answers, DeepSeek via OpenRouter for coding) |
| `embedding.js` | Embedding model (`gemini-embedding-001`) used for the Qdrant vector store |

Provider model names change over time. If a model is retired, update the name in these files and restart the Agent service. Model names must not contain leading or trailing spaces.

## API Overview

All client requests go through the Gateway, which handles session auth and proxies to the appropriate service.

| Route | Service | Description |
|---|---|---|
| `POST /api/auth/login` | Auth | Log in (Firebase) |
| `GET /api/auth/logout` | Auth | Log out |
| `GET /api/me` | Gateway | Get current authenticated user |
| `POST /api/chat/create-conversation` | Chat | Create a new conversation |
| `GET /api/chat/get-conversations` | Chat | List a user's conversations |
| `POST /api/chat/update-conversation` | Chat | Update a conversation |
| `POST /api/chat/save-message` | Chat | Save a message |
| `GET /api/chat/get-messages/:id` | Chat | Get messages for a conversation |
| `POST /api/agent/chat` | Agent | Send a prompt (and optional image or PDF) to the multi-agent pipeline |

`POST /api/agent/chat` accepts `multipart/form-data` with these fields:

| Field | Description |
|---|---|
| `prompt` | The user's question |
| `conversationId` | Conversation the message belongs to |
| `agent` | `auto` (default) or a specific agent |
| `file` | Optional image or PDF. Images go to the Vision Agent, PDFs to the PDF RAG Agent |

Requests to `/api/chat/*` and `/api/agent/*` require an authenticated session (cookie-based) and are forwarded with `x-user-id`, `x-user-email`, and `x-user-avatar` headers.

## Rate Limiting

The Agent service enforces per-agent, per-user request limits using a Redis sliding window:

| Agent | Limit |
|---|---|
| Chat | 20 requests / minute |
| Coding | 5 requests / minute |
| Search | 5 requests / minute |

Vision requests are also limited (the `image` key). Thresholds for every agent are configured in `backend/services/agent/config/agentRateLimit.js`.

Exceeding a limit returns a `429` with `limit`, `remainingTime`, and `retryAfter` details.

## Troubleshooting

| Error | Cause and fix |
|---|---|
| `403 Forbidden` from Qdrant (`getCollections`) | `QDRANT_API_KEY` is missing, wrong, read-only, or belongs to a different cluster. Create a new key with manage/write access, update `.env`, and restart the Agent service. |
| `404 ... model is no longer available` from Gemini | The Gemini model name has been retired. Update it in `utils/model.js` (or `utils/embedding.js` for embeddings). |
| `This model does not support images` | The Gemini model name has a typo or a leading space (for example `" gemini-3.8-flash"`). LangChain checks the name to decide whether the model accepts images. |
| Environment variables are `undefined` | Make sure `dotenv` is loaded before the code that reads them (`import "dotenv/config"` at the top of the entry file and in `model.js` / `embedding.js`). |
| Scanned PDF fails or returns "couldn't extract any text" | The file may be too large for inline OCR (see limitations), or the scan quality is too low. |

## Known Limitations

- **Scanned PDF OCR runs only when the whole document has almost no text.** A PDF with a typed cover page and scanned pages after it may skip OCR and miss the scanned content.
- **OCR size limit.** PDFs are sent to Gemini inline, which supports roughly 20 MB. Larger scanned PDFs need the Gemini Files API.
- **OCR quality depends on the scan.** Blurry or handwritten pages can produce errors that carry into the answer.
- **No persistence between questions.** The Qdrant collection is deleted after each response, so a PDF is re-processed on every request.
