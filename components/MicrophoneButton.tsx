"use client";

type Props = {
  onResult: (text: string) => void;
};

export default function MicrophoneButton({ onResult }: Props) {
  const start = () => {
    const Speech =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!Speech) {
      alert("Mikrofon działa tylko w Chrome/Edge na komputerze");
      return;
    }

    const rec = new Speech();
    rec.lang = "pl-PL";

    rec.onresult = (e: any) => {
      onResult(e.results[0][0].transcript);
    };

    rec.start();
  };

  return (
    <button
      type="button"
      onClick={start}
      className="px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition"
      title="Mów (desktop)"
    >
      🎙️
    </button>
  );
}