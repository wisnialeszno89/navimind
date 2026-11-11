"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MicrophoneButton from "./MicrophoneButton";
import type { TableContext } from "@/lib/desktop-plan";
import { localRequest, pairingCode } from "@/lib/desktop-connection";

type Message = { role: "user" | "assistant"; content: string };
type AgentStatus = { status: string; protocol: number; warning?: string | null; currentTable: (TableContext & { file: string }) | null };
type TaskResult = { status: "verified" | "review"; message: string; file?: string; rows?: { label: string; width_mm: number; height_mm: number; quantity: number }[] };
function resultText(result: TaskResult) {
  if (result.status !== "verified") return "**Zadanie wymaga sprawdzenia.** " + result.message;
  const rows = result.rows || [];
  return `**Wykonano i sprawdzono plik.** ${result.message}\n\nPlik: ${result.file}\n\n` +
    "| Pozycja | Opis | Szerokość [mm] | Wysokość [mm] | Sztuki |\n|---|---|---:|---:|---:|\n" +
    rows.map((row, index) => `| ${index + 1} | ${row.label.replace(/\|/g, "\\|")} | ${row.width_mm} | ${row.height_mm} | ${row.quantity} |`).join("\n");
}

export default function WorkspaceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pairing, setPairing] = useState(false);
  const [pairingError, setPairingError] = useState("");
  const [code, setCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [desktopMode, setDesktopMode] = useState(false);
  const [agent, setAgent] = useState<AgentStatus | null>(null);
  const [pendingJob, setPendingJob] = useState<string | null>(null);
  const tokenRef = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function connect() {
    if (connecting) return;
    setConnecting(true);
    setPairingError("");
    try {
      const token = pairingCode(code);
      const status: AgentStatus = await localRequest(token, "/status");
      if (status.status !== "ready" || status.protocol !== 1) throw new Error("Zaktualizuj lokalnego wykonawcę.");
      tokenRef.current = token;
      setAgent(status);
      setConnected(true);
      setDesktopMode(true);
      setCode("");
      setPairing(false);
    } catch (problem) {
      setPairingError(problem instanceof Error ? problem.message : "Błąd połączenia z lokalnym wykonawcą.");
    } finally { setConnecting(false); }
  }

  function disconnect() {
    tokenRef.current = "";
    setConnected(false);
    setDesktopMode(false);
    setAgent(null);
  }

  async function recover() {
    if (!pendingJob || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    try {
      const result: TaskResult = await localRequest(tokenRef.current, "/result/" + pendingJob);
      setMessages(previous => [...previous, { role: "assistant", content: resultText(result) }]);
      setPendingJob(null);
      setAgent(await localRequest(tokenRef.current, "/status"));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Brak potwierdzenia. Nie ponawiaj zadania automatycznie.");
    } finally { sendingRef.current = false; setSending(false); }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content || sendingRef.current || pendingJob) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    const previousMessages = messages;
    const history = previousMessages.slice(-12);
    setMessages(previous => [...previous, { role: "user", content }]);
    setText("");
    let executionStarted = false;
    try {
      if (desktopMode) {
        if (!connected || !tokenRef.current) throw new Error("Najpierw połącz komputer.");
        const status: AgentStatus = await localRequest(tokenRef.current, "/status");
        if (status.status !== "ready" || status.protocol !== 1) throw new Error("Wykonawca nie jest gotowy.");
        setAgent(status);
        const currentTable = status.currentTable ? {
          folder: status.currentTable.folder, rows: status.currentTable.rows, revision: status.currentTable.revision,
        } : null;
        const response = await fetch("/api/workspace/desktop-plan", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history, currentTable }),
        });
        const plan = await response.json();
        if (!response.ok) throw new Error(plan.message || "Nie udało się przygotować zadania.");
        if (!plan.task) {
          setMessages(previous => [...previous, { role: "assistant", content: plan.reply }]);
          return;
        }
        const id = crypto.randomUUID();
        setPendingJob(id);
        executionStarted = true;
        const result: TaskResult = await localRequest(tokenRef.current, "/execute", { id, task: plan.task, expectedRevision: plan.expectedRevision });
        setMessages(previous => [...previous, { role: "assistant", content: resultText(result) }]);
        setPendingJob(null);
        // The confirmed result above remains visible even if a later status read fails.
        try { setAgent(await localRequest(tokenRef.current, "/status")); } catch { setAgent(null); }
      } else {
        const response = await fetch("/api/workspace/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Nie udało się wysłać wiadomości.");
        setMessages(previous => [...previous, { role: "assistant", content: result.reply }]);
      }
    } catch (problem) {
      if (executionStarted) {
        setMessages(previous => [...previous, { role: "assistant", content: "**Brak potwierdzenia wyniku.** Połączenie przerwano podczas wykonania. Kliknij „Sprawdź wynik zadania”; nie wysyłaj ponownie tego samego polecenia." }]);
      } else {
        setMessages(previousMessages);
        setText(content);
        setError(problem instanceof Error ? problem.message : "Błąd połączenia.");
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 py-5 text-slate-100">
      <header className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-semibold">NaviMind · przestrzeń pracy</h1>
        <p className="mt-2 text-sm text-slate-300">Oferty, dokumenty i zadania dla lokalnego agenta.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p role="status" className={`text-sm ${connected ? "text-emerald-300" : "text-amber-200"}`}>
            {connected ? "Komputer połączony w tej karcie" : "Komputer niepołączony — działa rozmowa"}
          </p>
          <button type="button" disabled={sending || connecting || !!pendingJob} onClick={() => connected ? disconnect() : setPairing(value => !value)} className="rounded border border-slate-500 px-3 py-1 disabled:opacity-50">
            {connected ? "Rozłącz" : "Połącz komputer"}
          </button>
          {connected && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={desktopMode} disabled={sending || !!pendingJob} onChange={event => setDesktopMode(event.target.checked)} />Praca na komputerze</label>}
        </div>
        {pairing && <div className="mt-3 space-y-2 rounded-lg bg-slate-800 p-3">
          <p className="text-sm">Uruchom lokalnego wykonawcę w PowerShell. Wklej tutaj kod parowania z tego okna. Kod zostaje w tej karcie i służy wyłącznie do połączenia lokalnego.</p>
          <label htmlFor="pairing-code" className="block text-sm">Kod parowania</label>
          <div className="flex gap-2"><input id="pairing-code" type="password" autoComplete="off" value={code} onChange={event => { setCode(event.target.value); setPairingError(""); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void connect(); } }} aria-describedby="pairing-help" aria-invalid={!!pairingError} className="min-w-0 flex-1 rounded bg-slate-900 p-2" /><button type="button" onClick={connect} disabled={connecting || !code.trim()} className="rounded bg-blue-600 px-3 py-2 disabled:opacity-50">{connecting ? "Sprawdzam połączenie…" : "Połącz"}</button></div>
          <p id="pairing-help" className="text-xs text-slate-300">Kod musi pochodzić z wykonawcy uruchomionego na tym samym komputerze. Zostaw jego okno otwarte.</p>
          {connecting && <p role="status" className="text-sm text-blue-200">Łączę z lokalnym wykonawcą. Sprawdź pytanie przeglądarki o dostęp lokalny. Test odpowiedzi potrwa do 10 sekund.</p>}
          {pairingError && <p role="alert" className="rounded border border-red-400 bg-red-950 p-3 text-sm text-red-100">{pairingError}</p>}
        </div>}
        {connected && <p className="mt-2 text-xs text-slate-300">Pilot: tworzenie tekstowej tabeli okien i korekta szerokości wskazanej pozycji przez Notatnik. Pliki: Pulpit / NaviMind-Praca.{agent?.currentTable && ` Aktywna tabela: ${agent.currentTable.folder}.`}</p>}
        {agent?.warning && <p role="alert" className="mt-2 text-sm text-amber-200">{agent.warning}</p>}
      </header>
      <section aria-label="Rozmowa" aria-live="polite" className="flex-1 space-y-4 py-6">
        {messages.length === 0 && <p className="text-slate-300">Napisz zadanie lub nagraj polecenie. Po nagraniu sprawdź tekst i naciśnij Wyślij.</p>}
        {messages.map((message, index) => (
          <article key={index} className={`rounded-xl p-4 ${message.role === "user" ? "ml-6 bg-blue-900" : "mr-6 bg-slate-800"}`}>
            <p className="mb-2 text-xs text-slate-300">{message.role === "user" ? "Ty" : "NaviMind"}</p>
            <div className="space-y-2 overflow-x-auto break-words"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>
          </article>
        ))}
        {sending && <p role="status">{desktopMode ? "Agent przygotowuje zadanie, wykonuje je i sprawdza wynik…" : "NaviMind przygotowuje odpowiedź…"}</p>}
        {pendingJob && !sending && <button type="button" onClick={recover} className="rounded border border-amber-300 px-3 py-2">Sprawdź wynik zadania</button>}
        <div ref={bottomRef} />
      </section>
      <form onSubmit={send} className="sticky bottom-0 space-y-3 border-t border-slate-700 bg-slate-950 py-4">
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <label htmlFor="workspace-command" className="block text-sm">{desktopMode ? "Polecenie do wykonania na komputerze" : "Wiadomość"}</label>
        <textarea id="workspace-command" ref={inputRef} value={text} rows={3} maxLength={8000}
          disabled={sending || !!pendingJob} onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          className="w-full resize-y rounded-xl border border-slate-600 bg-slate-900 p-3"
          placeholder={desktopMode ? "Utwórz folder Oferta Top Trans i tabelę: 2 okna DKR 1000×1000 mm…" : "Napisz wiadomość…"} />
        <div className="flex items-start justify-between gap-3">
          <MicrophoneButton disabled={sending || !!pendingJob} onResult={transcript => setText(previous => [previous.trim(), transcript].filter(Boolean).join(" "))} />
          <button type="submit" disabled={sending || !!pendingJob || !text.trim()} className="rounded-lg bg-blue-600 px-5 py-2 disabled:opacity-50">{desktopMode ? "Wykonaj" : "Wyślij"}</button>
        </div>
        <p className="text-xs text-slate-400">Historia i parowanie działają w bieżącej karcie. Po odświeżeniu połącz komputer ponownie. Nagranie wysyłane jest do rozpoznania mowy po zatrzymaniu.</p>
      </form>
    </main>
  );
}
