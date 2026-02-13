"use client";

import { useLanguage } from "../lib/useLanguage";

type Props = {
  onClose: () => void;
};

export default function ProNotice({ onClose }: Props) {
  const { lang } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#0b1020] border border-white/10 rounded-xl p-6 max-w-sm w-full text-center">
        <div className="text-xl mb-3">⭐ PRO</div>

        <p className="text-sm text-blue-200 mb-5">
          {lang === "pl"
            ? "Analiza dokumentów PDF i obrazów jest dostępna wyłącznie w wersji PRO."
            : "PDF and image analysis is available only in the PRO version."}
        </p>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition text-white text-sm"
        >
          {lang === "pl" ? "Rozumiem" : "Got it"}
        </button>
      </div>
    </div>
  );
}