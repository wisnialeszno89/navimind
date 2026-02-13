"use client";

type Props = {
  content: string;
  title?: string;
};

export default function PdfDownloadButton({
  content,
  title = "Dokument",
}: Props) {
  async function download() {
    if (!content) return;

    const res = await fetch("/api/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
      }),
    });

    if (!res.ok) {
      alert("Nie udało się wygenerować PDF");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "navimind.pdf";
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="mt-3 inline-flex items-center gap-2
                 px-4 py-2 rounded
                 bg-white/10 hover:bg-white/20
                 text-sm text-blue-200 transition"
      title="Pobierz jako PDF"
    >
      📥 Pobierz PDF
    </button>
  );
}