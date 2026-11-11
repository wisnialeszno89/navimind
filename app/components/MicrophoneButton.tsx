"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/useLanguage";

type Props = { onResult: (text: string) => void; disabled?: boolean };

export default function MicrophoneButton({ onResult, disabled = false }: Props) {
  const { lang } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const callbackRef = useRef(onResult);
  callbackRef.current = onResult;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  async function start() {
    setError("");
    setBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Ta przeglądarka nie udostępnia nagrywania mikrofonu.");
      }
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
        .find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error("Przeglądarka nie obsługuje formatu nagrania.");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        stream.getTracks().forEach(track => track.stop());
        if (!mountedRef.current) return;
        setRecording(false);
        setBusy(true);
        try {
          const form = new FormData();
          form.append("audio", new Blob(chunks, { type: mimeType }), mimeType.includes("mp4") ? "command.mp4" : "command.webm");
          form.append("language", lang === "pl" ? "pl" : "en");
          const response = await fetch("/api/workspace/transcribe", { method: "POST", body: form });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Nie udało się odczytać nagrania.");
          if (!result.text?.trim()) throw new Error("Nagranie nie zawiera rozpoznanej wypowiedzi.");
          if (mountedRef.current) callbackRef.current(result.text.trim());
        } catch (problem) {
          if (mountedRef.current) setError(problem instanceof Error ? problem.message : "Błąd nagrania.");
        } finally {
          if (mountedRef.current) setBusy(false);
        }
      };
      recorder.onerror = () => {
        recorder.onstop = null;
        if (timerRef.current) clearTimeout(timerRef.current);
        if (recorder.state === "recording") recorder.stop();
        stream.getTracks().forEach(track => track.stop());
        if (mountedRef.current) {
          setRecording(false);
          setBusy(false);
          setError("Nagrywanie zostało przerwane.");
        }
      };
      recorder.start();
      setRecording(true);
      timerRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 60000);
    } catch (problem) {
      streamRef.current?.getTracks().forEach(track => track.stop());
      setError(problem instanceof Error ? problem.message : "Sprawdź zgodę na użycie mikrofonu.");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" disabled={busy || disabled} aria-pressed={recording}
        onClick={() => {
          if (!recording) { start(); return; }
          if (recorderRef.current?.state === "recording") {
            setBusy(true);
            recorderRef.current.stop();
          }
        }}
        className={`rounded-lg px-3 py-2 text-sm disabled:opacity-50 ${recording ? "bg-red-700" : "bg-slate-700"}`}>
        {recording ? "Zatrzymaj nagranie" : busy ? "Odczytuję nagranie…" : "Nagraj polecenie"}
      </button>
      {error && <p role="alert" className="max-w-sm text-xs text-red-300">{error}</p>}
    </div>
  );
}
