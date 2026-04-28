import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Learn AI Layer by Layer",
    template: "%s — Learn AI Layer by Layer",
  },
  description:
    "An interactive, visual guide to understanding AI from first principles. Learn neural networks, transformers, and modern AI through hands-on experimentation.",
  openGraph: {
    type: "website",
    siteName: "Learn AI Layer by Layer",
    title: "Learn AI Layer by Layer",
    description:
      "An interactive, visual guide to understanding AI from first principles.",
    images: ["/og/site.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn AI Layer by Layer",
    description:
      "An interactive, visual guide to understanding AI from first principles.",
    images: ["/og/site.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
