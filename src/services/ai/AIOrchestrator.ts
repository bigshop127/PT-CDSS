import { GoogleGenerativeAI } from "@google/generative-ai";
import { Node, Edge } from "reactflow";
import { useFlowStore } from "@/store/useFlowStore";
import { IntentRouter, IntentResponse } from "./IntentRouter";

/**
 * Interface for AI-proposed Ghost Nodes as defined in Section 3.C
 */
export interface GhostNodeProposal {
  id: string;
  label: string;
  type: "default" | "redFlag";
  position: { x: number; y: number };
  citation?: string;
  parentId?: string;
}

const PRO_SYSTEM_PROMPT = `
You are the "Clinical Logic Engine" (Gemini 3.1 Pro) for a PT-CDSS. 
Your task is to propose modifications to a React Flow clinical flowchart based on user requests and existing medical knowledge (22 core textbooks).

COMMUNICATION STYLE:
- Extremely concise and bullet-pointed.
- Tone: Neutral, objective, and emotion-free.
- No filler words, apologies, or conversational fluff.

CONTEXT:
1. Current Canvas State (JSON).
2. Semantic History (Recent movements/edits).

OUTPUT RULES:
- You MUST propose "Ghost Nodes" (semi-transparent suggestions).
- For every proposed node, specify if it is a [Red Flag].
- Include a "citation" field referencing the specific textbook or guideline (e.g., "Magee's Orthopedic Physical Assessment").
- You MUST output ONLY a JSON array of proposals.
- Format:
[
  {
    "id": "ghost_1",
    "label": "Cervical Myelopathy Screening",
    "type": "redFlag",
    "position": { "x": 100, "y": 200 },
    "citation": "Cook et al., 2007 - Clinical Prediction Rule",
    "parentId": "source_node_id"
  }
]
`;

export class AIOrchestrator {
  private proModel;
  private router: IntentRouter;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.router = new IntentRouter(apiKey);
    
    this.proModel = genAI.getGenerativeModel({
      model: "gemini-flash-latest", // Optimized for 2026 quota and latency
      systemInstruction: PRO_SYSTEM_PROMPT
    });
  }

  /**
   * Section 3.C: Main Orchestration Loop
   */
  async processRequest(userInput: string, semanticHistory: string) {
    const store = useFlowStore.getState();
    
    // 1. Layer 2: Intent Classification
    const classification = await this.router.classify(userInput);
    console.log("[AI Orchestrator] Intent:", classification.intent);

    if (classification.intent === "CANVAS_EDIT") {
      await this.handleCanvasEdit(userInput, semanticHistory, store.nodes, store.edges);
    } else if (classification.intent === "KNOWLEDGE_QUERY") {
      // Handle knowledge query (Standard Chat)
    }
  }

  /**
   * Section 3.C: Canvas Driven Logic (Layer 3)
   */
  private async handleCanvasEdit(
    userInput: string, 
    semanticHistory: string,
    nodes: Node[],
    edges: Edge[]
  ) {
    const prompt = `
      USER REQUEST: ${userInput}
      SEMANTIC HISTORY: ${semanticHistory}
      CURRENT NODES: ${JSON.stringify(nodes)}
      CURRENT EDGES: ${JSON.stringify(edges)}
      
      PROPOSE LOGICAL NEXT STEPS AS GHOST NODES.
    `;

    try {
      const result = await this.proModel.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const proposals: GhostNodeProposal[] = JSON.parse(cleanJson);
      console.log("[AI Orchestrator] Proposals received:", proposals);

      this.applyGhostNodes(proposals);
    } catch (error) {
      console.error("[AI Orchestrator] Pro Model Error:", error);
    }
  }

  /**
   * Applies semi-transparent suggestions to the Zustand Store.
   */
  private applyGhostNodes(proposals: GhostNodeProposal[]) {
    const store = useFlowStore.getState();
    
    const ghostNodes: Node[] = proposals.map(p => ({
      id: p.id,
      type: p.type === 'redFlag' ? 'redFlag' : 'default',
      position: p.position,
      data: { 
        label: p.label, 
        isGhost: true, // Used for CSS semi-transparency
        citation: p.citation,
        isRedFlag: p.type === 'redFlag'
      },
      style: { opacity: 0.5, borderStyle: 'dashed' }
    }));

    const ghostEdges: Edge[] = proposals
      .filter(p => p.parentId)
      .map(p => ({
        id: `e_${p.parentId}_${p.id}`,
        source: p.parentId!,
        target: p.id,
        animated: true,
        style: { strokeDasharray: '5,5', opacity: 0.5 }
      }));

    store.setNodes([...store.nodes, ...ghostNodes]);
    store.setEdges([...store.edges, ...ghostEdges]);
  }
}
