import ChatWindow from "../components/ChatWindow";
import AppShell from "../components/AppShell";

type Props = {
  searchParams: {
    tryb?: string;
    sciezka?: string;
    from?: string;
  };
};

export default function ChatPage({ searchParams }: Props) {
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