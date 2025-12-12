import "./globals.css";

export const metadata = {
  title: "NaviMind – Testowa wersja",
  description: "Rozmawiasz z Nio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <main
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "20px",
            color: "white",
            minHeight: "100vh",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}