import { create } from "zustand";

type Msg = {
  role: "user" | "assistant";
  content: string;
  highlight?: string | null;
};

export type Plan = "free" | "pro" | "pro_plus";

export type ReplyMode = "auto" | "fast" | "concrete" | "plan" | "deep";

type ProgressItem = {
  text: string;
  done: boolean;
};

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

  // 🔥 PROGRESS
  progress: ProgressItem[];

  // actions
  add: (msg: Msg) => void;
  setMessages: (msgs: Msg[]) => void;

  setPlan: (plan: Plan) => void;
  setActiveChatId: (id: string | null) => void;

  setPdfContext: (t: string) => void;
  setPdfFileName: (name: string) => void;
  setLastPdfResult: (t: string) => void;

  setReplyMode: (m: ReplyMode) => void;

  // 🔥 PROGRESS ACTIONS
  addProgress: (step: string) => void;
  removeProgress: (index: number) => void;
  toggleProgress: (index: number) => void;
};

export const useChatStore = create<Store>((set) => ({
  messages: [],
  plan: "pro_plus",

  activeChatId: null,

  pdfContext: "",
  pdfFileName: "",
  lastPdfResult: "",

  replyMode: "auto",

  // 🔥 PROGRESS STATE
  progress: [],

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

  // 🔥 ADD STEP
  addProgress: (step) =>
    set((s) => ({
      progress: [...s.progress, { text: step, done: false }],
    })),

  // 🔥 REMOVE STEP
  removeProgress: (index) =>
    set((s) => ({
      progress: s.progress.filter((_, i) => i !== index),
    })),

  // 🔥 TOGGLE DONE
  toggleProgress: (index) =>
    set((s) => ({
      progress: s.progress.map((p, i) =>
        i === index ? { ...p, done: !p.done } : p
      ),
    })),
}));