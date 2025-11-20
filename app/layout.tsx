import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SnapR – AI Enhanced Realty",
  description: "Transform your real estate photos with AI-powered enhancements: sky replacement, HDR, declutter, twilight mode, and more.",
  metadataBase: new URL("https://snap-r.com"),
  keywords: ["real estate", "photo enhancement", "AI editing", "HDR", "sky replacement", "property marketing"],
  openGraph: {
    title: "SnapR – AI Enhanced Realty",
    description: "Instantly enhance property photos with AI. Built for agents and brokers.",
    url: "https://snap-r.com",
    siteName: "SnapR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapR – AI Enhanced Realty",
    description: "AI-powered real estate photo enhancement.",
    images: ["/og-image.png"]
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="preload"
          as="font"
          type="font/woff"
          href="/fonts/GeistVF.woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff"
          href="/fonts/GeistMonoVF.woff"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://asoiwonhqoesbvcilqwd.supabase.co" />
        <link rel="dns-prefetch" href="https://asoiwonhqoesbvcilqwd.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
