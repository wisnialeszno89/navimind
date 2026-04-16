"use client";

import { useChatStore } from "../lib/chatStore";
import { useLanguage } from "../lib/useLanguage";

type Props = {
  onClose: () => void;
};

export default function ProNotice({ onClose }: Props) {
  const { lang } = useLanguage();
  const plan = useChatStore((s) => s.plan);

  // 🔥 TYLKO FREE widzi popup
  if (plan !== "free") return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#0b1020] border border-white/10 rounded-xl p-6 max-w-sm w-full text-center">

        <div className="text-xl mb-3">⭐ NaviMind PRO</div>

        <p className="text-sm text-blue-200 mb-5 leading-relaxed">
          {lang === "pl"
            ? "Chcesz analizować i edytować zdjęcia oraz PDF-y?\n\nOdblokuj pełną moc NaviMind w wersji PRO."
            : "Unlock image & PDF analysis and editing with NaviMind PRO."}
        </p>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm"
        >
          {lang === "pl" ? "Zobacz PRO" : "See PRO"}
        </button>
      </div>
    </div>
  );
}