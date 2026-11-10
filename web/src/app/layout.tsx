import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GUDANGKU — Manajemen Persediaan",
  description: "Aplikasi manajemen stok dan gudang yang sederhana, rapi, dan aman.",
  applicationName: "GUDANGKU",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "GUDANGKU",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#236b4b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
