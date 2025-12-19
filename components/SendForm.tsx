"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../lib/chatStore";

type Props = {
  setIsTyping: (v: boolean) => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function SendForm({ setIsTyping }: Props) {
  const add = useChatStore((s) => s.add);

  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ===============================
     MICROPHONE (VOICE → TEXT)
     =============================== */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pl-PL";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript.trim());
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  function toggleMic() {
    if (!micSupported || !recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  /* ===============================
     PDF UPLOAD
     =============================== */
  async function handlePdfUpload(file: File) {
    setPdfLoading(true);
    setPdfText(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.text) {
        setPdfText(data.text);

        add({
          role: "assistant",
          content:
            "📄 Dokument PDF został załadowany.\n\nMożemy go przeanalizować. Sprawdźmy, co w nim jest istotne.",
        });
      } else {
        throw new Error("Brak tekstu z PDF");
      }
    } catch (e) {
      add({
        role: "assistant",
        content:
          "⚠️ Nie udało się przetworzyć PDF. Jeśli to skan, ten format może nie zawierać tekstu.",
      });
    } finally {
      setPdfLoading(false);
    }
  }

  /* ===============================
     SEND MESSAGE
     =============================== */
  async function send() {
    if (!text.trim()) return;

    let finalText = text;

    if (pdfText) {
      finalText =
        `Kontekst (PDF):\n${pdfText.slice(0, 6000)}\n\nPytanie:\n` + text;
    }

    add({ role: "user", content: text });
    setText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: useChatStore.getState().messages.map((m) =>
            m.role === "user" && m.content === text
              ? { ...m, content: finalText }
              : m
          ),
        }),
      });

      const data = await res.json();
      add({ role: "assistant", content: data.text });
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      style={{
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: 12,
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          listening
            ? "Nagrywam…"
            : pdfLoading
            ? "Przetwarzam PDF…"
            : "Napisz wiadomość…"
        }
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: 12,
          padding: "10px 14px",
          color: "white",
          outline: "none",
        }}
      />

      {/* PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePdfUpload(file);
          e.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        title="Dodaj PDF"
        onClick={() => fileInputRef.current?.click()}
        style={{
          background: "rgba(255,255,255,0.1)",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "0 14px",
          height: 40,
          cursor: "pointer",
        }}
      >
        📄
      </button>

      {/* MICROPHONE */}
      {micSupported && (
        <button
          type="button"
          onClick={toggleMic}
          title={listening ? "Zatrzymaj" : "Mów"}
          style={{
            background: listening ? "#2563eb" : "rgba(255,255,255,0.1)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "0 14px",
            height: 40,
            cursor: "pointer",
          }}
        >
          🎤
        </button>
      )}

      <button
        type="submit"
        style={{
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "0 16px",
          height: 40,
          cursor: "pointer",
        }}
      >
        ➤
      </button>
    </form>
  );
}