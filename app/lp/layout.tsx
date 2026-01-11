import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SnapR - Transform Real Estate Photos in 30 Seconds | AI Photo Enhancement',
  description: 'AI-powered real estate photo enhancement. Sky replacement, virtual twilight, declutter in 30 seconds. Used by 2,000+ photographers & agents. Start free trial.',
  openGraph: {
    title: 'SnapR - Transform Real Estate Photos in 30 Seconds',
    description: 'AI-powered photo enhancement for real estate. Sky replacement, virtual twilight, declutter — instant results.',
    type: 'website',
  },
}

export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Meta Pixel Code - Replace YOUR_PIXEL_ID with your actual Pixel ID from Meta Ads Manager */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', 'YOUR_PIXEL_ID');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      {children}
    </>
  )
}
