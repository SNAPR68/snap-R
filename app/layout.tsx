import Script from 'next/script';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CookieConsent } from '@/components/cookie-consent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://snap-r.com'),
  title: {
    default: 'SnapR - AI Real Estate Photo Enhancement',
    template: '%s | SnapR',
  },
  description: 'Transform ordinary property listings into luxury showcases in seconds. AI-powered sky replacement, virtual staging, twilight conversion & more.',
  keywords: ['real estate photography', 'photo enhancement', 'AI photo editing', 'virtual staging', 'sky replacement', 'property photos', 'real estate marketing'],
  authors: [{ name: 'SnapR' }],
  creator: 'SnapR',
  publisher: 'SnapR',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://snap-r.com',
    siteName: 'SnapR',
    title: 'SnapR - AI Real Estate Photo Enhancement',
    description: 'Transform ordinary property listings into luxury showcases in seconds. AI-powered photo enhancement for real estate professionals.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SnapR - AI Real Estate Photo Enhancement',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapR - AI Real Estate Photo Enhancement',
    description: 'Transform ordinary property listings into luxury showcases in seconds.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://snap-r.com" />
      </head>
      <body className={inter.className}>
        {children}
        <CookieConsent />
        <Script src="https://t.contentsquare.net/uxa/72ac82fa71720.js" strategy="afterInteractive" id="contentsquare" />
      </body>
    </html>
  );
}
