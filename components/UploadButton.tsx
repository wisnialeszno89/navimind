"use client";

export default function UploadButton() {
  const upload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);

    await fetch("/api/upload", {
      method: "POST",
      body: form,
    });
  };

  return (
    <input
      type="file"
      accept="application/pdf"
      onChange={(e) =>
        e.target.files && upload(e.target.files[0])
      }
    />
  );
}