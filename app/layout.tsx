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
        className="min-h-screen bg-[#020617] text-white flex flex-col"
      >
        {children}
      </body>
    </html>
  );
}