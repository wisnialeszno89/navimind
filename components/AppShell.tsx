export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4">
      <div className="w-full max-w-4xl h-[85vh] rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}