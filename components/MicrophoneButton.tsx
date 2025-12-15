"use client";

type Props = {
  onResult: (text: string) => void;
};

export default function MicrophoneButton({ onResult }: Props) {
  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Twoja przeglądarka nie obsługuje mikrofonu.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pl-PL";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      onResult(event.results[0][0].transcript);
    };

    recognition.start();
  }

  return (
    <button
      type="button"
      onClick={startListening}
      title="Mów"
    >
      🎙️
    </button>
  );
}