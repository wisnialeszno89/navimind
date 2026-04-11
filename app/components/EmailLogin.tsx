"use client";

import { useState } from "react";

export default function EmailLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true);

    await fetch("/api/auth/request-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    setLoading(false);
    setStep("code");
  }

  async function verify() {
    setLoading(true);

    await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, code })
    });

    window.location.reload();
  }

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-white font-medium mb-2">
        Masz już zakupioną wersję?
      </div>

      <div className="text-sm text-white/60 mb-4">
        Podaj email użyty przy zakupie, aby się zalogować.
      </div>

      {step === "email" && (
        <>
          <input
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
            placeholder="Twój email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={sendCode}
            disabled={loading}
            className="mt-3 w-full bg-white text-black rounded-lg py-2 font-medium"
          >
            Wyślij kod
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <input
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
            placeholder="Kod z maila"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button
            onClick={verify}
            disabled={loading}
            className="mt-3 w-full bg-white text-black rounded-lg py-2 font-medium"
          >
            Zaloguj
          </button>
        </>
      )}
    </div>
  );
}