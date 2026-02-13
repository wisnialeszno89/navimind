"use client";

import { useState } from "react";

type Props = {
  title: string;
  subtitle: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  messagePlaceholder: string;
  sendLabel: string;
  successMsg: string;
  errorMsg: string;
  footerNote: string;
};

export default function ContactForm({
  title,
  subtitle,
  namePlaceholder,
  emailPlaceholder,
  messagePlaceholder,
  sendLabel,
  successMsg,
  errorMsg,
  footerNote,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error();

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-xl w-full px-4">
      <h2 className="text-2xl font-semibold text-white mb-2">
        {title}
      </h2>

      <p className="text-sm text-blue-300 mb-6">
        {subtitle}
      </p>

      <form onSubmit={send} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder={namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/10 rounded px-4 py-3 text-white outline-none"
        />

        <input
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/10 rounded px-4 py-3 text-white outline-none"
        />

        <textarea
          required
          placeholder={messagePlaceholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="bg-white/10 rounded px-4 py-3 text-white outline-none resize-none"
        />

        <button
          type="submit"
          className="mt-2 px-4 py-3 bg-blue-600 rounded text-white"
        >
          {sendLabel}
        </button>

        {status === "sent" && (
          <p className="text-green-400 text-sm mt-2">
            {successMsg}
          </p>
        )}

        {status === "error" && (
          <p className="text-red-400 text-sm mt-2">
            {errorMsg}
          </p>
        )}
      </form>

      <p className="text-xs text-blue-300 opacity-70 mt-4">
        {footerNote}
      </p>
    </div>
  );
}