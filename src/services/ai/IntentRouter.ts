import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Section 3.C: Layer 2 Intent Router (Gemini Flash).
 * Classifies user input into specific intents to drive the 3-Tier Pipeline.
 */
export type Intent = "CANVAS_EDIT" | "KNOWLEDGE_QUERY" | "CHIT_CHAT";

export interface IntentResponse {
  intent: Intent;
  confidence: number;
  reason?: string;
}

const SYSTEM_PROMPT = `
You are a highly efficient Intent Classifier for a Physical Therapy Clinical Decision Support System (PT-CDSS).
Your goal is to categorize the user's input into one of three intents.

INTENTS:
1. CANVAS_EDIT: User wants to modify the flowchart, add nodes, delete connections, or reorganize the logic.
2. KNOWLEDGE_QUERY: User is asking about clinical guidelines, medical knowledge, red flags, or anatomy (e.g., "What are the red flags for cervical myelopathy?").
3. CHIT_CHAT: General greetings, meta-talk about the AI, or non-clinical/non-canvas related talk.

OUTPUT RULE:
- You MUST output ONLY a valid JSON object.
- DO NOT include markdown formatting like \`\`\`json.
- Format: { "intent": "CANVAS_EDIT" | "KNOWLEDGE_QUERY" | "CHIT_CHAT", "confidence": number, "reason": "short explanation" }
`;

export class IntentRouter {
  private model;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT 
    });
  }

  async classify(userInput: string): Promise<IntentResponse> {
    try {
      const result = await this.model.generateContent(userInput);
      const responseText = result.response.text().trim();
      
      // Attempt to parse JSON
      // Handle cases where model might include markdown blocks even if told not to
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson) as IntentResponse;
    } catch (error) {
      console.error("Intent Classification Error:", error);
      // Default fallback
      return { intent: "CHIT_CHAT", confidence: 0 };
    }
  }
}
