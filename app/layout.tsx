import Script from 'next/script';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CookieConsent } from '@/components/cookie-consent';
import { AIChatbot } from '@/components/ai-chatbot';
import { ToastProvider } from '@/components/toast';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://snap-r.com',
    siteName: 'SnapR',
    title: 'SnapR - AI Real Estate Photo Enhancement',
    description: 'Transform ordinary property listings into luxury showcases in seconds. AI-powered photo enhancement for real estate professionals.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapR - AI Real Estate Photo Enhancement',
    description: 'Transform ordinary property listings into luxury showcases in seconds.',
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
        {/* Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'SnapR',
              applicationCategory: 'BusinessApplication',
              description: 'AI-powered real estate photo enhancement and marketing automation platform',
              url: 'https://snap-r.com',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free tier with 3 listings per month',
              },
              publisher: {
                '@type': 'Organization',
                name: 'SnapR',
                url: 'https://snap-r.com',
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ToastProvider>
        {children}
        </ToastProvider>
        <CookieConsent />
        <AIChatbot />
        {/* Contentsquare disabled — its overlay blocks video controls from receiving clicks
        <Script src="https://t.contentsquare.net/uxa/72ac82fa71720.js" strategy="afterInteractive" id="contentsquare" />
        */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
