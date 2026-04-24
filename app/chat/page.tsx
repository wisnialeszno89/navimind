"use client";

import ChatWindow from "../components/ChatWindow";
import AppShell from "../components/AppShell";
import { useEffect, useRef } from "react";
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

 const initialized = useRef(false);

useEffect(() => {
  if (initialized.current) return;

  if (plan !== "free" && messages.length === 0) {
    add({
      role: "assistant",
      content: "Cześć. Możesz tu napisać wszystko, bez pośpiechu i bez oceniania."    });
  }

  initialized.current = true;
}, [plan, messages.length]);

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