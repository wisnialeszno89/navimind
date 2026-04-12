"use client";

import { useState } from "react";

export default function EmailLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setLoading(true);
    setError("");

    try {
      await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      setStep("code");
    } catch {
      setError("Błąd wysyłki kodu");
    }

    setLoading(false);
  }

  async function verify() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();

      if (data.ok) {
        window.location.href = "/chat";
      } else {
        setError("Nieprawidłowy kod");
      }
    } catch {
      setError("Błąd logowania");
    }

    setLoading(false);
  }

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-white font-medium mb-2">
        Masz już dostęp?
      </div>

      <div className="text-sm text-white/60 mb-4">
        Podaj email użyty przy zakupie
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
            {loading ? "Wysyłanie..." : "Wyślij kod"}
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
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>

          {error && (
            <div className="text-red-400 text-sm mt-3">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}