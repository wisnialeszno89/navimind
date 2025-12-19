"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onResult: (text: string) => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function MicrophoneButton({ onResult }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // INIT
  useEffect(() => {
    const Speech =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Speech) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const rec = new Speech();
    rec.lang = "pl-PL";
    rec.interimResults = false;
    rec.continuous = false;

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = rec;
  }, [onResult]);

  const toggle = () => {
    if (!supported) {
      alert("Mikrofon działa w Chrome lub Edge (desktop).");
      return;
    }

    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={
        supported
          ? listening
            ? "Zatrzymaj nagrywanie"
            : "Mów"
          : "Mikrofon niedostępny"
      }
      className={`px-3 py-2 rounded transition
        ${
          listening
            ? "bg-blue-600 animate-pulse"
            : "bg-white/10 hover:bg-white/20"
        }`}
    >
      🎤
    </button>
  );
}