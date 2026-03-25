import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SnapR Pricing | AI Real Estate Photo Editing Plans',
  description: 'Compare SnapR pricing for AI real estate photo editing, virtual staging, twilight conversion, and marketing tools. Choose the plan that fits your listing volume.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'SnapR Pricing | AI Real Estate Photo Editing Plans',
    description: 'Compare SnapR pricing for AI real estate photo editing, virtual staging, twilight conversion, and marketing tools. Choose the plan that fits your listing volume.',
    url: 'https://snap-r.com/pricing',
  },
  twitter: {
    title: 'SnapR Pricing | AI Real Estate Photo Editing Plans',
    description: 'Compare SnapR pricing for AI real estate photo editing, virtual staging, twilight conversion, and marketing tools.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
