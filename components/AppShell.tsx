"use client";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <div className="stars-bg" />
      <div className="app-content">
        {children}
      </div>
    </div>
  );
}