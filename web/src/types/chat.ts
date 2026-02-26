// Shared chat types (used by both web and mobile)

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string; // ISO date string
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  type: "image" | "document";
  url: string;
  name: string;
  mimeType: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  growContext?: {
    stage?: string;
    week?: number;
    strainType?: string;
  };
  createdAt: string;
  updatedAt: string;
}
