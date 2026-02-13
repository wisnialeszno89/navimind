export type Role = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};

export type ChatMeta = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};