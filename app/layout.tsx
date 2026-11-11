import "./globals.css";
import { isPrivateWorkspace } from "./lib/workspace";
import HeaderClient from "./components/HeaderClient";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body
        className="nm-breath-bg"
        style={{
          background: "var(--nm-bg-main)",
          color: "var(--nm-text-main)",
        }}
      >
        {!isPrivateWorkspace() && <HeaderClient />}
        {children}
      </body>
    </html>
  );
}