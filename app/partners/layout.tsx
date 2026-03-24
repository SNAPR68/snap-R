import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SnapR Partners | Recurring Revenue for Real Estate Referrals',
  description: 'Join the SnapR partner program and earn recurring revenue by referring AI real estate photo enhancement tools to agents, teams, and brokerages.',
  alternates: {
    canonical: '/partners',
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
