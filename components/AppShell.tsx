export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="panel">{children}</div>;
}