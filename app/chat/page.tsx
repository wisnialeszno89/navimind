import ChatWindow from "../../components/ChatWindow";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-2 sm:px-4">
      <div
        className="
          w-full
          sm:max-w-3xl
          h-[100dvh] sm:h-[85vh]
          sm:rounded-2xl
          bg-white/5
          sm:border sm:border-white/10
          sm:shadow-2xl
          backdrop-blur
        "
      >
        <ChatWindow />
      </div>
    </div>
  );
}