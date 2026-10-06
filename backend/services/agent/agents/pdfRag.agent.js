import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { createVectorStore } from "../utils/vectorStore.js";
import { getModel } from "../utils/model.js";


const MIN_TEXT_LENGTH = 100;

// OCR: send the PDF to Gemini and get the text back
async function extractTextWithOCR(buffer) {
  const llm = getModel("vision");

  const response = await llm.invoke([
    new HumanMessage({
      content: [
        {
          type: "text",
          text:
            "Extract all the text from this document exactly as written. " +
            "Keep the original reading order. " +
            "Output only the extracted text, with no commentary.",
        },
        {
          type: "media",
          mimeType: "application/pdf",
          data: buffer.toString("base64"),
        },
      ],
    }),
  ]);

  return typeof response.content === "string"
    ? response.content
    : response.content.map((part) => part.text ?? "").join("");
}

export const pdfRagAgent = async (state) => {
  const collectionName = `pdf-${Date.now()}`;
  let vectorStore = null;

  try {
    const buffer = fs.readFileSync(state.file.path);

    // 1. Normal text extraction
    let text = "";
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      text = result.text || "";
    } finally {
      await parser.destroy?.();
    }

    // 2. Scanned / image PDF -> OCR
    if (text.trim().length < MIN_TEXT_LENGTH) {
      text = await extractTextWithOCR(buffer);
    }

    if (!text.trim()) {
      return {
        ...state,
        response: "I couldn't extract any text from this PDF.",
      };
    }

    // 3. Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([text]);

    
    vectorStore = await createVectorStore(collectionName, docs);

    const relevantDocs = await vectorStore.similaritySearch(state.prompt, 5);

    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    // 5. Answer from the retrieved context
    const llm = getModel("pdf-rag");

    const messages = [
      new SystemMessage(`
You are SynctisAI PDF Assistant.

Rules:

- Answer ONLY from the uploaded PDF.
- Never make up information.
- If the answer is not present in the PDF, reply:
"I couldn't find this information in the uploaded PDF."
- Use Markdown formatting.
`),
      new HumanMessage(`
Context:

${context}

Question:

${state.prompt}
`),
    ];

    const response = await llm.invoke(messages);

    return {
      ...state,
      docs,
      response: response.content,
    };
  } finally {
    // Cleanup
    try {
      fs.unlinkSync(state.file.path);
    } catch (err) {
      console.log("File cleanup:", err.message);
    }

    if (vectorStore) {
      try {
        await vectorStore.client.deleteCollection(collectionName);
      } catch (err) {
        console.log("Collection cleanup:", err.message);
      }
    }
  }
};
