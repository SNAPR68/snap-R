import { redirect } from 'next/navigation';

// Legacy billing page — redirect to the current dashboard billing page
export default function LegacyBillingPage() {
  redirect('/dashboard/billing');
}
