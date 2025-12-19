"use client";

import { useState } from "react";

type Props = {
  onResult: (text: string) => void;
};

export default function MicrophoneButton({ onResult }: Props) {
  const [listening, setListening] = useState(false);

  const start = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Mikrofon działa tylko w Chrome lub Edge (desktop).");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "pl-PL";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onerror = () => {
      setListening(false);
      alert("Nie udało się uruchomić mikrofonu.");
    };

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };

    rec.start();
  };

  return (
    <button
      type="button"
      onClick={start}
      title={listening ? "Słucham…" : "Mów (Chrome / Edge)"}
      className={`px-3 py-2 rounded transition ${
        listening
          ? "bg-red-500/30"
          : "bg-white/10 hover:bg-white/20"
      }`}
    >
      {listening ? "🎙️…" : "🎙️"}
    </button>
  );
}