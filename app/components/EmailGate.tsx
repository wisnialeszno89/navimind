"use client";

import { useState } from "react";

export default function EmailGate({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);

    const res = await fetch("/api/free/email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (res.ok) {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h2 className="text-lg font-semibold mb-2">
          Zostańmy w kontakcie
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Zostaw maila i dostaniesz <b>+10 wiadomości gratis</b>.
        </p>

        <input
          type="email"
          placeholder="Twój email"
          className="w-full border rounded-lg px-3 py-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-2"
        >
          {loading ? "..." : "Odbierz 10 wiadomości"}
        </button>
      </div>
    </div>
  );
}
