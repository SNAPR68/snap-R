/**
 * /dashboard/photographer — Photographer bulk delivery management
 *
 * Server component: fetches listings + clients, renders PhotographerDashboard client.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PhotographerDashboard from './PhotographerDashboard'

export const dynamic = 'force-dynamic'

export default async function PhotographerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <PhotographerDashboard />
}
