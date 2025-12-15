"use client";

type Props = {
  onText: (text: string) => void;
};

export default function UploadButton({ onText }: Props) {
  async function handleFile(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      alert("Błąd uploadu PDF");
      return;
    }

    const data = await res.json();

    if (data.text) {
      onText(
        `Poniżej treść dokumentu PDF:\n\n${data.text}`
      );
    }
  }

  return (
    <input
      type="file"
      accept="application/pdf"
      onChange={handleFile}
    />
  );
}