import Script from 'next/script';
import type { Metadata, Viewport } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import './globals.css';
import { CookieConsent } from '@/components/cookie-consent';
import { AIChatbot } from '@/components/ai-chatbot';
import { ToastProvider } from '@/components/toast';
import { SkipNav } from '@/components/skip-nav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const newsreader = Newsreader({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-newsreader' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#D4A017',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://snap-r.com'),
  title: {
    default: 'SnapR | AI Real Estate Photo Enhancement for Listings',
    template: '%s | SnapR',
  },
  description: 'Enhance real estate listing photos in seconds with AI sky replacement, virtual staging, twilight edits, and marketing-ready assets built for agents and brokerages.',
  keywords: ['AI real estate photo enhancement', 'real estate photo editing', 'virtual staging', 'sky replacement', 'listing photos', 'real estate marketing', 'property photos'],
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
    title: 'SnapR | AI Real Estate Photo Enhancement for Listings',
    description: 'Enhance real estate listing photos in seconds with AI sky replacement, virtual staging, twilight edits, and marketing-ready assets built for agents and brokerages.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'SnapR - AI Real Estate Photo Enhancement' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapR | AI Real Estate Photo Enhancement for Listings',
    description: 'Enhance real estate listing photos in seconds with AI sky replacement, virtual staging, twilight edits, and marketing-ready assets.',
    images: ['/og-image.jpg'],
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SnapR" />
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
      <body className={`${inter.variable} ${newsreader.variable} font-sans`}>
        <SkipNav />
        <ToastProvider>
        <div id="main-content">
        {children}
        </div>
        </ToastProvider>
        <CookieConsent />
        <AIChatbot />
        <Script src="https://t.contentsquare.net/uxa/72ac82fa71720.js" strategy="afterInteractive" id="contentsquare" />
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
