import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <div className="app-root">
          {children}
        </div>
      </body>
    </html>
  );
}