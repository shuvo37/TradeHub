// src/lib/ai-api.ts
import { apiRequest, jsonInit } from "@/lib/api";

// One message of the chat. "user" = what I asked, "model" = what the AI answered (Gemini's own role names).
export interface AiChatMessage {
  role: "user" | "model";
  text: string;
}

// AiAskResponse from the backend: the answer, and which data the AI looked at to write it.
export interface AiAskResponse {
  answer: string;
  toolsUsed: string[];
}

// The longest question the backend accepts (AiAskRequest).
export const AI_MAX_QUESTION = 500;

// How many earlier questions (with their answers) are sent back with a new question.
export const AI_MEMORY_QUESTIONS = 10;

// Sends the question plus the chat memory. The server keeps nothing: it answers from my live data and forgets the chat.
export async function askAi(question: string, history: AiChatMessage[]): Promise<AiAskResponse> {
  const res = await apiRequest("/api/ai/ask", jsonInit("POST", { question, history }));
  return res.json();
}
