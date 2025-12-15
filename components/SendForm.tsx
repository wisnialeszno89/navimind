"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/chatStore";
import MicrophoneButton from "./MicrophoneButton";
import UploadButton from "./UploadButton";
import TypingIndicator from "./TypingIndicator";

export default function SendForm() {
  const [msg, setMsg] = useState("");
  const [typing, setTyping] = useState(false);

  const addMessage = useChatStore((s) => s.addMessage);
  const updateLast = useChatStore(
    (s) => s.updateLastAssistantMessage
  );
  const getMessages = useChatStore((s) => s.getMessages);

  async function send() {
    if (!msg.trim()) return;

    addMessage({ role: "user", content: msg });
    setMsg("");

    // pusta odpowiedź AI (pod streaming)
    addMessage({ role: "assistant", content: "" });
    setTyping(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: getMessages(),
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    let aiText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      aiText += decoder.decode(value);
      updateLast(aiText);
    }

    setTyping(false);
  }

  return (
    <div>
      {typing && <TypingIndicator />}

      <textarea
        className="chat-input"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Napisz..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={send}>Wyślij</button>

        <MicrophoneButton
          onResult={(text) => setMsg(text)}
        />

        <UploadButton
          onText={(text) =>
            addMessage({ role: "user", content: text })
          }
        />
      </div>
    </div>
  );
}