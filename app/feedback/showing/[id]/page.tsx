/**
 * Public showing feedback form — /feedback/showing/[id]
 * Buyer fills out interest rating and optional comments after a showing.
 * No authentication required. Showing UUID is the access token.
 */

import { adminSupabase } from '@/lib/supabase/admin';
import ShowingFeedbackForm from './ShowingFeedbackForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShowingFeedbackPage({ params }: Props) {
  const { id } = await params;
  const supabase = adminSupabase();

  const { data: showing } = await supabase
    .from('showings')
    .select('id, contact_name, scheduled_at, listings(address, city, state, title)')
    .eq('id', id)
    .single();

  if (!showing) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-white/50 text-lg">This feedback link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  const listingData = showing.listings as { address?: string; city?: string; state?: string; title?: string } | null;
  const propertyLabel = listingData?.address
    ? `${listingData.address}${listingData.city ? `, ${listingData.city}` : ''}`
    : 'the property';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <ShowingFeedbackForm
        showingId={showing.id}
        contactName={showing.contact_name}
        propertyLabel={propertyLabel}
        scheduledAt={showing.scheduled_at}
      />
    </div>
  );
}
