# SynctisAI

A multi-agent AI platform built on a MERN microservices architecture. Users can chat, generate and preview code, search the web, analyze images, and ask questions over their own PDFs — all routed automatically to the right specialized agent by an LLM-based supervisor built with LangGraph.

## Features

- **Multi-agent orchestration** — A LangGraph supervisor/router node classifies each user request and dispatches it to one of five specialized agents:
  - **Chat Agent** — general conversation with memory
  - **Coding Agent** — code generation, review, explanation, debugging, optimization, and language conversion
  - **Search Agent** — real-time web search grounding via Tavily
  - **Vision Agent** — image analysis / OCR
  - **PDF RAG Agent** — document ingestion (parse → chunk → embed → vector search) for hallucination-resistant document Q&A over uploaded PDFs
- **Microservices backend** — independent Gateway, Auth, Chat, and Agent services, each a standalone Express app
- **Centralized API Gateway** — CORS, Helmet security headers, request logging, cookie-based session auth, and header-injecting proxying to downstream services
- **Redis-backed sessions** — session validation middleware backed by Redis, with clean 401 responses for missing/expired sessions
- **Per-agent rate limiting** — Redis `INCR`/`EXPIRE` sliding-window limiter (60s window) with configurable per-agent thresholds and structured 429 responses (remaining quota, retry-after)
- **Firebase Authentication** for login/logout
- **React + Redux Toolkit frontend** with a code editor (Monaco), Markdown rendering, and an artifact panel for generated code

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Redux Toolkit, React Router, Tailwind CSS, Vite, Monaco Editor, Framer Motion |
| Backend | Node.js, Express 5, microservices (Gateway, Auth, Chat, Agent) |
| AI / Orchestration | LangChain, LangGraph, Google Gemini, Groq, DeepSeek, Tavily (web search) |
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
      ├── /api/chat    → Chat Service    (MongoDB)
      └── /api/agent   → Agent Service   (LangGraph supervisor)
                                │
                                ├── Chat Agent
                                ├── Coding Agent
                                ├── Search Agent   (Tavily)
                                ├── Vision Agent
                                └── PDF RAG Agent  (Qdrant vector store)

Redis is shared across services for sessions, rate limiting, and caching.
```

## Project Structure

```
SynctisAI/
├── backend/
│   ├── docker-compose.yml       # Redis service
│   ├── shared/redis/            # shared Redis client
│   ├── gateway/                 # API Gateway (auth, proxying, security)
│   └── services/
│       ├── auth/                 # Login/logout, Firebase, MongoDB user store
│       ├── chat/                 # Conversations & messages
│       └── agent/                # LangGraph agents, RAG pipeline, rate limiting
└── frontend/                    # React + Vite client
```

## Prerequisites

- Node.js (v18+ recommended)
- npm
- Docker & Docker Compose (for Redis)
- MongoDB instance (local or Atlas)
- A Qdrant instance (local via Docker, or Qdrant Cloud)
- API keys: Google Gemini, Tavily, and any other LLM providers you enable (Groq, DeepSeek, etc.)
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
AGENT_SERVICE=http://localhost:5003
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
PORT=5003
MONGODB_URL=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
GOOGLE_API_KEY=your_google_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:5000
# Firebase client config (apiKey, authDomain, projectId, etc.)
```

> Also place your Firebase service account JSON (referenced by `config/firebase.js`) securely — it's git-ignored by default.

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
| `POST /api/agent/chat` | Agent | Send a prompt (and optional file) to the multi-agent pipeline |

Requests to `/api/chat/*` and `/api/agent/*` require an authenticated session (cookie-based) and are forwarded with `x-user-id`, `x-user-email`, and `x-user-avatar` headers.

## Rate Limiting

The Agent service enforces per-agent, per-user request limits using a Redis sliding window:

| Agent | Limit |
|---|---|
| Chat | 20 requests / minute |
| Coding | 5 requests / minute |
| Search | 5 requests / minute |

Exceeding a limit returns a `429` with `limit`, `remainingTime`, and `retryAfter` details.


