"use client";

import ChatWindow from "../components/ChatWindow";
import AppShell from "../components/AppShell";
import { useEffect } from "react";
import { useChatStore } from "../lib/chatStore";

type Props = {
  searchParams: {
    tryb?: string;
    sciezka?: string;
    from?: string;
  };
};

export default function ChatPage({ searchParams }: Props) {
  const add = useChatStore((s) => s.add);
  const messages = useChatStore((s) => s.messages);
  const plan = useChatStore((s) => s.plan);

  useEffect(() => {
    // 🔥 tylko PRO + pusty chat
    if (plan !== "free" && messages.length === 0) {
      add({
        role: "assistant",
        content: "Tu możemy wejść głębiej. Nie musisz się spieszyć.",
      });
    }
  }, [plan]);

  return (
    <AppShell>
      <ChatWindow
        initialContext={{
          tryb: searchParams.tryb,
          sciezka: searchParams.sciezka,
          from: searchParams.from,
        }}
      />
    </AppShell>
  );
}