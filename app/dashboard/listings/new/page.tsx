import { redirect } from 'next/navigation'

/**
 * Redirect /dashboard/listings/new → /listings/new
 *
 * Several internal links historically pointed to /dashboard/listings/new,
 * but the actual listing creation page lives at /listings/new.
 * This redirect ensures those links don't dead-end.
 */
export default function DashboardListingsNewRedirect() {
  redirect('/listings/new')
}
