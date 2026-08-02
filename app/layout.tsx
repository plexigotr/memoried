import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memoried",
  description: "Foto\u011fraf, video, ses ve notlarla ya\u015fayan an\u0131lar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
