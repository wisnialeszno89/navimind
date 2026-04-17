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
      <div className="text-xl mb-3">⭐ NaviMind PRO</div>

    <p className="text-sm text-blue-200 mb-5 leading-relaxed whitespace-pre-line">
    {lang === "pl"
    ? "Odblokuj edycję plików:\n\n✔ zdjęcia i PDF\n✔ generowanie wyników\n✔ pobieranie plików\n\n👉 PRO to dostęp\n🚀 PRO+ to pełna swoboda (większe limity)"
    : "Unlock file editing:\n\n✔ images & PDFs\n✔ generate results\n✔ download files\n\n👉 PRO = access\n🚀 PRO+ = full power"}
    </p>

    <div className="flex flex-col gap-2">
    <button
    onClick={() => window.location.href = "/pro"}
    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm"
    >
    {lang === "pl" ? "🔓 Odblokuj PRO" : "Unlock PRO"}
    </button>

    <button
    onClick={() => window.location.href = "/pro#proplus"}
    className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-sm"
    >
    🚀 PRO+
    </button>
  </div>
    </div>
  );
}