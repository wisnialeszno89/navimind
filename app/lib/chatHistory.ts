import { kv } from "@vercel/kv";
import type { ChatMessage, ChatMeta } from "./chatTypes";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function chatsIndexKey(email: string) {
  return `chats:${normalizeEmail(email)}`;
}

function chatKey(email: string, chatId: string) {
  return `chat:${normalizeEmail(email)}:${chatId}`;
}

type ChatState = {
  messages: ChatMessage[];
  updatedAt: number;
};

function sortChats(chats: ChatMeta[]) {
  // newest first
  return [...chats].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export async function listChatsByEmail(email: string): Promise<ChatMeta[]> {
  const key = chatsIndexKey(email);
  const chats = (await kv.get<ChatMeta[]>(key)) ?? [];
  return sortChats(chats);
}

export async function createChatByEmail(email: string, chat: ChatMeta) {
  const key = chatsIndexKey(email);
  const existing = (await kv.get<ChatMeta[]>(key)) ?? [];

  // newest first, limit listy np 50
  const next = sortChats([chat, ...existing]).slice(0, 50);
  await kv.set(key, next);

  // init state
  const state: ChatState = { messages: [], updatedAt: chat.updatedAt };
  await kv.set(chatKey(email, chat.id), state);
}

export async function getChatMessagesByEmail(
  email: string,
  chatId: string
): Promise<ChatMessage[]> {
  const state = await kv.get<ChatState>(chatKey(email, chatId));
  return state?.messages ?? [];
}

async function touchChatMeta(email: string, chatId: string) {
  const indexKey = chatsIndexKey(email);
  const chats = (await kv.get<ChatMeta[]>(indexKey)) ?? [];

  const now = Date.now();

  const updatedChats = chats.map((c) =>
    c.id === chatId ? { ...c, updatedAt: now } : c
  );

  await kv.set(indexKey, sortChats(updatedChats));
}

export async function appendChatMessageByEmail(
  email: string,
  chatId: string,
  msg: ChatMessage
) {
  const key = chatKey(email, chatId);
  const state = await kv.get<ChatState>(key);

  const messages = state?.messages ?? [];
  const nextMessages = [...messages, msg].slice(-200); // limit wiadomości

  // zapis stanu rozmowy + updatedAt
  await kv.set(key, { messages: nextMessages, updatedAt: Date.now() });

  // update meta updatedAt w indexie + sort
  await touchChatMeta(email, chatId);
}

export async function deleteChatByEmail(email: string, chatId: string) {
  await kv.del(chatKey(email, chatId));

  const indexKey = chatsIndexKey(email);
  const chats = (await kv.get<ChatMeta[]>(indexKey)) ?? [];
  const next = chats.filter((c) => c.id !== chatId);

  await kv.set(indexKey, sortChats(next));
}