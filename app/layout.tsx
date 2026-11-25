import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "زاد، الصلاة والقرآن والأذكار",
  description: "مواقيت الصلاة والقبلة والأذكار. بدون حسابات.",
  manifest: "./manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0d1412",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
