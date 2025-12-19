export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617]">
      <div className="w-full max-w-3xl h-[85vh] bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}