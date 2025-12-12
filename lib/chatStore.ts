import { create } from "zustand";

export type Msg = {
  role: "user" | "assistant" | "system";
  content: string;
};

interface ChatState {
  messages: Msg[];
  loading: boolean;
  addMessage: (m: Msg) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  loading: false,

  addMessage: (m) =>
    set((s) => ({
      messages: [...s.messages, m],
    })),

  setLoading: (v) => set({ loading: v }),

  reset: () => set({ messages: [] }),
}));