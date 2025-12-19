import ChatWindow from "../../components/ChatWindow";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      {/* „BIURKO” */}
      <div className="w-full max-w-3xl h-[85vh] rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur">
        <ChatWindow />
      </div>
    </div>
  );
}