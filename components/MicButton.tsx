"use client";
import { useState } from "react";

export default function MicButton({ onResult }: { onResult: (t: string) => void }) {
  const [rec, setRec] = useState(false);

  const start = () => {
    const anyWin = window as any;

    const Speech =
      anyWin.SpeechRecognition || anyWin.webkitSpeechRecognition;

    if (!Speech) {
      alert("Twoja przeglądarka nie wspiera rozpoznawania mowy 🎤");
      return;
    }

    const recognition = new Speech();
    recognition.lang = "pl-PL";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");

      onResult(text);
      setRec(false);
      recognition.stop();
    };

    recognition.onerror = () => {
      setRec(false);
      recognition.stop();
    };

    recognition.start();
    setRec(true);
  };

  return (
    <button className="button" onClick={start}>
      {rec ? "Nagrywam..." : "🎤"}
    </button>
  );
}