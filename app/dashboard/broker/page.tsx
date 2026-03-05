/**
 * /dashboard/broker — Broker Team Dashboard
 * Provides team overview, agent roster, and aggregated listing stats
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BrokerDashboardClient from './BrokerDashboardClient'

export const dynamic = 'force-dynamic'

export default async function BrokerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's current team
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_team_id')
    .eq('id', user.id)
    .single()

  let team = null
  let members: Array<{
    id: string
    user_id: string
    role: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    listing_count: number
  }> = []
  let listings: Array<{
    id: string
    title: string | null
    address: string | null
    price: number | null
    preparation_status: string | null
    marketing_status: string | null
    user_id: string
    owner_name: string | null
    hero_photo_url: string | null
  }> = []
  let totalLeads = 0

  if (profile?.current_team_id) {
    // Fetch team
    const { data: teamData } = await supabase
      .from('teams')
      .select('id, name, slug, logo_url')
      .eq('id', profile.current_team_id)
      .single()

    team = teamData

    if (team) {
      // Fetch team members with profiles
      const { data: memberData } = await supabase
        .from('team_members')
        .select('id, user_id, role')
        .eq('team_id', team.id)

      if (memberData) {
        const memberProfiles = await Promise.all(
          memberData.map(async (m) => {
            const { data: p } = await supabase
              .from('profiles')
              .select('full_name, email, avatar_url')
              .eq('id', m.user_id)
              .single()

            // Count listings per agent
            const { count } = await supabase
              .from('listings')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', m.user_id)

            return {
              id: m.id,
              user_id: m.user_id,
              role: m.role,
              full_name: p?.full_name ?? null,
              email: p?.email ?? null,
              avatar_url: p?.avatar_url ?? null,
              listing_count: count ?? 0,
            }
          })
        )
        members = memberProfiles
      }

      // Fetch team listings
      const memberIds = members.map(m => m.user_id)
      if (memberIds.length > 0) {
        const { data: listingData } = await supabase
          .from('listings')
          .select('id, title, address, price, preparation_status, marketing_status, user_id')
          .in('user_id', memberIds)
          .order('created_at', { ascending: false })
          .limit(50)

        if (listingData) {
          listings = listingData.map(l => ({
            ...l,
            owner_name: members.find(m => m.user_id === l.user_id)?.full_name ?? null,
            hero_photo_url: null,
          }))
        }

        // Count total leads across team listings
        const listingIds = listings.map(l => l.id)
        if (listingIds.length > 0) {
          const { count } = await supabase
            .from('property_leads')
            .select('id', { count: 'exact', head: true })
            .in('listing_id', listingIds)
          totalLeads = count ?? 0
        }
      }
    }
  }

  return (
    <BrokerDashboardClient
      team={team}
      members={members}
      listings={listings}
      stats={{
        totalAgents: members.length,
        activeListings: listings.length,
        totalLeads,
      }}
    />
  )
}
