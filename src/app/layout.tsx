import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
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
        {/* Load at the top of the page. Otherwise the browser restores the old
            scroll position on reload, and because widgets stream in and grow
            the page afterwards, that restore drifts down onto a widget. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{history.scrollRestoration='manual'}catch(e){}`,
          }}
        />
        <SiteHeader />
        {children}
        <Analytics />
      </body>
      {process.env.VERCEL_ENV === "production" && <GoogleAnalytics gaId="G-4BJPJ1RZR6" />}
    </html>
  );
}
