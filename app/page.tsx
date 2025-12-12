import ChatWindow from "@/components/ChatWindow";

export default function HomePage() {
  return (
    <div style={{ marginTop: 30 }}>
<h2 style={{ opacity: 0.7, textAlign: "center", marginBottom: 20 }}>
  🔧 Wersja testowa NaviMind
  <br />
  Hej, jak się masz? Co dziś Cię trapi? 👀
</h2>

      <ChatWindow />
    </div>
  );
}