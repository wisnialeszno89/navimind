import "./globals.css";

export const metadata = {
  title: "NaviMind",
  description: "Rozmowa, która ma sens.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          background: "#020617",
          color: "white",
        }}
      >
        {children}
      </body>
    </html>
  );
}