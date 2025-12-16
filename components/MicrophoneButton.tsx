"use client";

export default function MicrophoneButton({
  onResult,
}: {
  onResult: (t: string) => void;
}) {
  const start = () => {
    const Speech =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Speech) return alert("Brak wsparcia mikrofonu");

    const rec = new Speech();
    rec.lang = "pl-PL";
    rec.onresult = (e: any) =>
      onResult(e.results[0][0].transcript);
    rec.start();
  };

  return (
    <button onClick={start} className="px-3 py-2 bg-white/10 rounded">
      🎙️
    </button>
  );
}