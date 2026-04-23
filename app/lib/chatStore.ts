import { create } from "zustand";

type Msg = {
  role: "user" | "assistant";
  content: string;
  highlight?: string | null;
};

export type Plan = "free" | "pro" | "pro_plus";

export type ReplyMode = "auto" | "fast" | "concrete" | "plan" | "deep";

type Store = {
  messages: Msg[];
  plan: Plan;

  // chat session
  activeChatId: string | null;

  // pdf context
  pdfContext: string;
  pdfFileName: string;
  lastPdfResult: string;

  // ✅ PRO+ reply mode
  replyMode: ReplyMode;

  // actions
  add: (msg: Msg) => void;
  setMessages: (msgs: Msg[]) => void;

  setPlan: (plan: Plan) => void;
  setActiveChatId: (id: string | null) => void;

  setPdfContext: (t: string) => void;
  setPdfFileName: (name: string) => void;
  setLastPdfResult: (t: string) => void;

  setReplyMode: (m: ReplyMode) => void;
};

export const useChatStore = create<Store>((set) => ({
  messages: [],
  plan: "pro_plus",

  activeChatId: null,

  pdfContext: "",
  pdfFileName: "",
  lastPdfResult: "",

  replyMode: "auto",

  add: (msg) =>
    set((s) => ({
      messages: [...s.messages, msg],
    })),

  setMessages: (msgs) => set({ messages: msgs }),

  setPlan: (plan) => set({ plan }),

  setActiveChatId: (id) => set({ activeChatId: id }),

  setPdfContext: (t) => set({ pdfContext: t }),
  setPdfFileName: (name) => set({ pdfFileName: name }),
  setLastPdfResult: (t) => set({ lastPdfResult: t }),

  setReplyMode: (m) => set({ replyMode: m }),
}));