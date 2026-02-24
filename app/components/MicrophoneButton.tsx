"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/useLanguage";

type Props = {
  onResult: (text: string) => void;
};

export default function MicrophoneButton({ onResult }: Props) {
  const { lang } = useLanguage();

  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "pl" ? "pl-PL" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      onResult(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [lang, onResult]);

  function start() {
    if (!recognitionRef.current) return;
    recognitionRef.current.start();
    setIsRecording(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  if (!isSupported) {
    return null; // fallback – brak Web Speech API
  }

  return (
    <button
      type="button"
      onClick={isRecording ? stop : start}
      className={`px-3 py-2 rounded-xl text-sm transition ${
        isRecording
          ? "bg-red-500/30 text-red-100 animate-pulse"
          : "bg-white/10 hover:bg-white/20 text-white"
      }`}
    >
      {isRecording ? "● MÓWIĘ" : "🎙️"}
    </button>
  );
}