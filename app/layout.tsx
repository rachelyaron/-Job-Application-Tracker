import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מעקב מועמדויות",
  description: "מעקב אחר בקשות עבודה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}
