import { create } from "zustand";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatState = {
  messages: Message[];
  add: (m: Message) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  add: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clear: () => set({ messages: [] }),
}));

