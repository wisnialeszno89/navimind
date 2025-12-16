import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      <body className={`${inter.className} bg-[#020617] text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}