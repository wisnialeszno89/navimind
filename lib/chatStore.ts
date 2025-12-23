import { create } from "zustand";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

const MESSAGE_LIMIT = 20;

type ChatState = {
  messages: Message[];
  messageCount: number;
  limitReached: boolean;

  add: (m: Message) => void;
  clear: () => void;

  // 🔥 KONTROLA WYSYŁKI
  getAllMessages: () => Message[];
  getLastUserMessageOnly: () => Message[];
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  messageCount: 0,
  limitReached: false,

  add: (m) =>
    set((state) => {
      // nie zaczynamy od assistant
      if (m.role === "assistant" && state.messages.length === 0) {
        return state;
      }

      // blokada po limicie
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

  // 👉 normalna rozmowa
  getAllMessages: () => get().messages,

  // 👉 HARD CUT — tylko ostatnia wiadomość usera
  getLastUserMessageOnly: () => {
    const msgs = get().messages;
    const lastUser = [...msgs].reverse().find(m => m.role === "user");
    return lastUser ? [lastUser] : [];
  },
}));