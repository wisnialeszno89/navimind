"use client";

import { create } from "zustand";
import { texts } from "./i18n";

export type Lang = "pl" | "en";

type LangState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: <K extends keyof typeof texts.pl>(key: K) => string;
};

export const useLanguage = create<LangState>((set, get) => ({
  lang: "pl",

  setLang: (lang) => {
    set({ lang });
    if (typeof window !== "undefined") {
      localStorage.setItem("navimind_lang", lang);
    }
  },

  t: (key) => {
    const { lang } = get();
    return texts[lang][key] ?? texts.pl[key];
  },
}));

/* =========================
   INIT (JEDNORAZOWO)
   ========================= */
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("navimind_lang") as Lang | null;

  if (saved === "pl" || saved === "en") {
    useLanguage.getState().setLang(saved);
  } else if (navigator.language.startsWith("en")) {
    useLanguage.getState().setLang("en");
  }
}