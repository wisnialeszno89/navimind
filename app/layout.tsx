import "./globals.css";
import HeaderClient from "./components/HeaderClient";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body
        style={{
          background: "var(--nm-bg-main)",
          color: "var(--nm-text-main)",
        }}
      >
        <HeaderClient />
        {children}
      </body>
    </html>
  );
}
