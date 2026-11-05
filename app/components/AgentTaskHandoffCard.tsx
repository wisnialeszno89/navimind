"use client";

import { useState } from "react";
import type { AgentTaskHandoff } from "../lib/chat/agentTaskHandoff";

type Props = { task: AgentTaskHandoff };

export default function AgentTaskHandoffCard({ task }: Props) {
  const [message, setMessage] = useState("");

  function downloadDraft() {
    // A portable, inert TXT file: local Windows agent must be launched and
    // separately authorized by its operator before any action can execute.
    const blob = new Blob([task.goal.trim() + "\n"], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "navimind-agent-task.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Zlecenie pobrane. Uruchom agenta lokalnie, aby je sprawdzić.");
  }

  async function copyGoal() {
    try {
      await navigator.clipboard.writeText(task.goal);
      setMessage("Treść zlecenia skopiowana.");
    } catch {
      setMessage("Kopiowanie niedostępne. Użyj pobierania pliku.");
    }
  }

  return (
    <section
      aria-label="Przygotowane zadanie dla agenta"
      className="mt-3 border border-blue-400/30 rounded-xl bg-blue-900/10 p-3 space-y-2"
    >
      <div className="text-sm font-semibold">Zlecenie dla agenta</div>
      <div className="text-xs opacity-80">
        Status: przygotowane, nieuruchomione · {task.target === "windowhub" ? "WindowHub" : "Agent komputerowy"}
      </div>
      <p className="text-sm whitespace-pre-wrap break-words">{task.goal}</p>
      <p className="text-xs opacity-75">
        To projekt zadania. NaviMind nie sterował komputerem ani nie zapisał żadnych danych.
        Po pobraniu przekaż plik lokalnemu agentowi i zatwierdź jego działania.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={downloadDraft} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500">
          Pobierz zlecenie TXT
        </button>
        <button type="button" onClick={copyGoal} className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
          Kopiuj polecenie
        </button>
      </div>
      {message && <div role="status" className="text-xs opacity-80">{message}</div>}
    </section>
  );
}
