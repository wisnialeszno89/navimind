import { create } from "zustand";

export type Msg = {
  role: "user" | "assistant" | "system";
  content: string;
};

interface ChatState {
  messages: Msg[];
  loading: boolean;

  addMessage: (m: Msg) => void;
  updateLastAssistantMessage: (content: string) => void;

  setLoading: (v: boolean) => void;
  reset: () => void;

  getMessages: () => Msg[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,

  addMessage: (m) =>
    set((s) => ({
      messages: [...s.messages, m],
    })),

  // 🔥 KLUCZ DO STREAMINGU
  updateLastAssistantMessage: (content) =>
    set((s) => {
      const messages = [...s.messages];
      const last = messages[messages.length - 1];

      if (last && last.role === "assistant") {
        last.content = content;
      }

      return { messages };
    }),

  setLoading: (v) => set({ loading: v }),

  reset: () => set({ messages: [] }),

  getMessages: () => get().messages,
}));