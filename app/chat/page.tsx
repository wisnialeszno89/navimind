import ChatWindow from "../components/ChatWindow";
import AppShell from "../components/AppShell";
import PlanWatcher from "../components/PlanWatcher";

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

      <PlanWatcher />

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