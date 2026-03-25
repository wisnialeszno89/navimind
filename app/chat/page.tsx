import ChatWindow from "../components/ChatWindow";

type Props = {
  searchParams: {
    tryb?: string;
    sciezka?: string;
    from?: string;
  };
};

export default function ChatPage({ searchParams }: Props) {
  return (
    <ChatWindow
      initialContext={{
        tryb: searchParams.tryb,
        sciezka: searchParams.sciezka,
        from: searchParams.from,
      }}
    />
  );
}