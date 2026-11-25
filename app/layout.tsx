import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// خط الواجهة: Cairo (OFL) مستضاف مع الموقع نفسه، بدون طلبات لخوادم خارجية.
const cairo = localFont({
  src: "../public/fonts/Cairo-VF.woff",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-cairo",
  adjustFontFallback: false,
});

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
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head />
      <body>{children}</body>
    </html>
  );
}
