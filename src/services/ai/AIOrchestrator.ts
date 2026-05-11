import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { Node, Edge } from "reactflow";
import { useFlowStore } from "@/store/useFlowStore";
import { useUserStore } from "@/store/useUserStore";

export interface GhostNodeProposal {
  id: string;
  label: string;
  type: "default" | "redFlag";
  position: { x: number; y: number };
  citation?: string;
  parentId?: string;
}

export interface Citation {
  book: string;
  page: number;
  excerpt: string;
}

interface AIRequestData {
  userInput: string;
  semanticHistory: string;
  nodes: Node[];
  edges: Edge[];
  userApiKey?: string;
  model?: string;
}

interface AIResponseData {
  intent: "CANVAS_EDIT" | "KNOWLEDGE_QUERY" | "CHIT_CHAT";
  proposals?: GhostNodeProposal[];
  message?: string;
  citations?: Citation[];
}

export class AIOrchestrator {
  private callGeminiProxy: ReturnType<typeof httpsCallable<AIRequestData, AIResponseData>>;

  constructor() {
    const functions = getFunctions(getApp(), "asia-east1");
    this.callGeminiProxy = httpsCallable<AIRequestData, AIResponseData>(functions, "geminiProxy");
  }

  async processRequest(userInput: string, semanticHistory: string): Promise<AIResponseData> {
    const { geminiKey, preferredModel } = useUserStore.getState().settings;
    const store = useFlowStore.getState();
    
    const result = await this.callGeminiProxy({
      userInput,
      semanticHistory,
      nodes: store.nodes,
      edges: store.edges,
      userApiKey: geminiKey,
      model: preferredModel
    });

    const data = result.data;
    if (data.intent === "CANVAS_EDIT" && data.proposals) {
      this.applyGhostNodes(data.proposals);
    }
    return data;
  }

  private applyGhostNodes(proposals: GhostNodeProposal[]) {
    const store = useFlowStore.getState();

    const ghostNodes: Node[] = proposals.map((p) => ({
      id: p.id,
      type: p.type === "redFlag" ? "redFlag" : "default",
      position: p.position,
      data: {
        label: p.label,
        isGhost: true,
        citation: p.citation,
        isRedFlag: p.type === "redFlag",
      },
      style: { opacity: 0.5, borderStyle: "dashed" },
    }));

    const ghostEdges: Edge[] = proposals
      .filter((p) => p.parentId)
      .map((p) => ({
        id: `e_${p.parentId}_${p.id}`,
        source: p.parentId!,
        target: p.id,
        animated: true,
        style: { strokeDasharray: "5,5", opacity: 0.5 },
      }));

    store.setNodes([...store.nodes, ...ghostNodes]);
    store.setEdges([...store.edges, ...ghostEdges]);
  }
}
