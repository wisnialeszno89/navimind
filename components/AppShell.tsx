export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col overflow-hidden bg-black">
      {children}
    </div>
  );
}