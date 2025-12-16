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
      <body>
        {children}
      </body>
    </html>
  );
}