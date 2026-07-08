import {
  StateGraph
}
  from "@langchain/langgraph";

import {
  AgentState
}
  from "./state.js";

import {
  routerNode
}
  from "./router.node.js";

import {
  chatAgent
}
  from "../agents/chat.agent.js";

import {
  codingAgent
}
  from "../agents/coding.agent.js";

import {
  searchAgent
}
  from "../agents/search.agent.js";


import { visionAgent } from "../agents/vision.agent.js";
import { pdfRagAgent } from "../agents/pdfRag.agent.js";

const workflow =
  new StateGraph(
    AgentState
  );

workflow.addNode(
  "router",
  routerNode
);

workflow.addNode(
  "chat",
  chatAgent
);

workflow.addNode(
  "coding",
  codingAgent
);

workflow.addNode(
  "search",
  searchAgent
);


workflow.addNode(
  "vision",
  visionAgent
);
workflow.addNode(
  "pdf_rag",
  pdfRagAgent
);
workflow.addEdge(
  "__start__",
  "router"
);

workflow.addConditionalEdges(

  "router",

  (state) => {

    switch (state.agent) {

      case "search":
        return "search";

      case "coding":
        return "coding";



      case "vision":
        return "vision";
      case "pdf_rag":
        return "pdf_rag";

      default:
        return "chat";

    }

  },

  {

    chat: "chat",

    search: "search",

    coding: "coding",


    vision: "vision",
    pdf_rag: "pdf_rag"

  }

);

workflow.addEdge(
  "coding",
  "__end__"
);


workflow.addEdge(
  "search",
  "chat"
);



workflow.addEdge(
  "chat",
  "__end__"
);

workflow.addEdge(
  "vision",
  "__end__"
);

workflow.addEdge(
  "pdf_rag",
  "__end__"
);

export const graph =
  workflow.compile();