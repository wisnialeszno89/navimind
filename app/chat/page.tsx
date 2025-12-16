import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="w-full max-w-[960px]">
        <ChatWindow />
      </div>
    </div>
  );
}
