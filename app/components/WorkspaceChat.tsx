"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MicrophoneButton from "./MicrophoneButton";

type Message = { role: "user" | "assistant"; content: string };

export default function WorkspaceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    const previousMessages = messages;
    const history = previousMessages.slice(-12);
    setMessages(previous => [...previous, { role: "user", content }]);
    setText("");
    try {
      const response = await fetch("/api/workspace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Nie udało się wysłać wiadomości.");
      setMessages(previous => [...previous, { role: "assistant", content: result.reply }]);
    } catch (problem) {
      setMessages(previousMessages);
      setText(content);
      setError(problem instanceof Error ? problem.message : "Błąd połączenia.");
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
        <p className="mt-2 text-sm text-slate-300">Oferty, dokumenty i przygotowanie zadań dla agenta.</p>
        <p className="mt-2 text-xs text-amber-200">Połączenie z agentem Windows czeka na konfigurację. Czat przygotowuje odpowiedzi i plany.</p>
      </header>
      <section aria-label="Rozmowa" aria-live="polite" className="flex-1 space-y-4 py-6">
        {messages.length === 0 && <p className="text-slate-300">Napisz zadanie lub nagraj polecenie. Po nagraniu sprawdź tekst i naciśnij Wyślij.</p>}
        {messages.map((message, index) => (
          <article key={index} className={`rounded-xl p-4 ${message.role === "user" ? "ml-6 bg-blue-900" : "mr-6 bg-slate-800"}`}>
            <p className="mb-2 text-xs text-slate-300">{message.role === "user" ? "Ty" : "NaviMind"}</p>
            <div className="space-y-2 break-words"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>
          </article>
        ))}
        {sending && <p role="status">NaviMind przygotowuje odpowiedź…</p>}
        <div ref={bottomRef} />
      </section>
      <form onSubmit={send} className="sticky bottom-0 space-y-3 border-t border-slate-700 bg-slate-950 py-4">
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <label htmlFor="workspace-command" className="block text-sm">Wiadomość lub polecenie</label>
        <textarea id="workspace-command" ref={inputRef} value={text} rows={3} maxLength={8000}
          disabled={sending} onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          className="w-full resize-y rounded-xl border border-slate-600 bg-slate-900 p-3"
          placeholder="Np. przygotuj opis okna 1000 × 1000 mm DKR, antracyt jednostronny…" />
        <div className="flex items-start justify-between gap-3">
          <MicrophoneButton disabled={sending} onResult={transcript => setText(previous => [previous.trim(), transcript].filter(Boolean).join(" "))} />
          <button type="submit" disabled={sending || !text.trim()} className="rounded-lg bg-blue-600 px-5 py-2 disabled:opacity-50">Wyślij</button>
        </div>
        <p className="text-xs text-slate-400">Historia tej rozmowy jest przechowywana w bieżącej karcie. Nagranie jest wysyłane do rozpoznania mowy po zatrzymaniu.</p>
      </form>
    </main>
  );
}
