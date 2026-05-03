// Intent classification has moved to Firebase Functions (B6).
// This file is retained for type compatibility only.
export type Intent = "CANVAS_EDIT" | "KNOWLEDGE_QUERY" | "CHIT_CHAT";

export interface IntentResponse {
  intent: Intent;
  confidence: number;
  reason?: string;
}
