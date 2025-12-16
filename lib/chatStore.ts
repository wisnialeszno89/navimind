import { create } from "zustand";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

const MESSAGE_LIMIT = 15;

type ChatState = {
  messages: Message[];
  messageCount: number;
  limitReached: boolean;

  add: (m: Message) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  messageCount: 0,
  limitReached: false,

  add: (m) =>
    set((state) => {
      // 🔒 BEZPIECZNIK: nie pozwól zacząć rozmowy od assistant
      if (
        m.role === "assistant" &&
        state.messages.length === 0
      ) {
        return state;
      }

      // 🔒 jeśli limit osiągnięty, blokujemy kolejne user messages
      if (state.limitReached && m.role === "user") {
        return state;
      }

      const isUser = m.role === "user";
      const newCount = isUser
        ? state.messageCount + 1
        : state.messageCount;

      return {
        messages: [...state.messages, m],
        messageCount: newCount,
        limitReached: newCount >= MESSAGE_LIMIT,
      };
    }),

  clear: () =>
    set({
      messages: [],
      messageCount: 0,
      limitReached: false,
    }),
}));