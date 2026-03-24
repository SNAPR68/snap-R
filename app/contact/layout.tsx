import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact SnapR | Sales, Support, and Partnerships',
  description: 'Contact SnapR for sales, support, partnerships, or enterprise questions about AI real estate photo enhancement and marketing tools.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
