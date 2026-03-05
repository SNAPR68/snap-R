/**
 * /dashboard/content-studio/sites/[id]
 * Property site editor — edit listing content, agent info, theme, publish toggle
 */

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import SiteEditorClient from './SiteEditorClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SiteEditorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = adminSupabase()

  // Fetch the property site
  const { data: site } = await admin
    .from('property_sites')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!site) notFound()

  // Fetch the listing
  const { data: listing } = await admin
    .from('listings')
    .select('id, title, address, city, state, postal_code, price, bedrooms, bathrooms, square_feet, description, property_type, year_built, lot_size, parking, features, mls_number, hoa_fees, virtual_tour_url')
    .eq('id', site.listing_id)
    .single()

  return (
    <SiteEditorClient
      site={site}
      listing={listing}
    />
  )
}
