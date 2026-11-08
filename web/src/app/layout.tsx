import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GUDANGKU — Manajemen Persediaan",
  description: "Aplikasi manajemen stok dan gudang yang sederhana, rapi, dan aman.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
