"use client";

import { useRef, useState } from "react";
import { useLanguage } from "../lib/useLanguage";

type Props = {
  onResult: (text: string) => void;
};

const MAX_DURATION_MS = 3 * 60 * 1000; // 3 minuty

export default function MicrophoneButton({ onResult }: Props) {
  const { lang } = useLanguage();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ▶️ START
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Brak dostępu do mikrofonu.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = handleStop;

    recorder.start();
    setIsRecording(true);
    setSeconds(0);

    // ⏱️ licznik sekund
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // ⛔ twardy limit 3 min
    timeoutRef.current = setTimeout(() => {
      stopRecording();
    }, MAX_DURATION_MS);
  }

  // ⏹️ STOP
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  // 🧠 Po zatrzymaniu → transkrypcja
  async function handleStop() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });

    if (!blob.size) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("lang", lang);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.text) onResult(data.text);
    } catch (err) {
      console.error("Transcription error:", err);
      alert("Błąd transkrypcji.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isProcessing}
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-3 py-2 rounded-xl text-sm transition ${
          isRecording
            ? "bg-red-500/30 text-red-100 animate-pulse"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
      >
        {isProcessing
          ? "..."
          : isRecording
          ? `● STOP (${seconds}s)`
          : "🎙️"}
      </button>

      <div className="text-[10px] text-white/40">
        max 3 min • cisza nie przerywa
      </div>
    </div>
  );
}
