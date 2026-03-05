import { adminSupabase } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import BookingForm from './BookingForm'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = adminSupabase()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, platform_name')
    .eq('slug', slug)
    .single()

  return {
    title: org ? `Book a Shoot — ${org.platform_name || org.name}` : 'Book a Shoot',
    description: 'Book a professional real estate photography shoot',
  }
}

export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = adminSupabase()

  // Fetch photographer's organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, owner_id, name, platform_name, logo_url, primary_color, secondary_color, custom_support_email')
    .eq('slug', slug)
    .single()

  if (!org) notFound()

  // Fetch photographer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, phone')
    .eq('id', org.owner_id)
    .single()

  // Fetch active packages
  const { data: packages } = await supabase
    .from('photographer_packages')
    .select('id, name, description, price_cents, includes_photos, max_photos, includes_video, includes_drone, includes_floor_plan, includes_virtual_staging, includes_twilight, estimated_duration_minutes, sort_order')
    .eq('photographer_id', org.owner_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Fetch availability
  const { data: availability } = await supabase
    .from('photographer_availability')
    .select('weekly_schedule, max_shoots_per_day, blocked_dates, buffer_minutes')
    .eq('photographer_id', org.owner_id)
    .single()

  return (
    <BookingForm
      photographer={{
        id: org.owner_id,
        name: profile?.full_name || org.name,
        avatar: profile?.avatar_url ?? undefined,
        phone: profile?.phone ?? undefined,
        email: org.custom_support_email ?? undefined,
      }}
      brand={{
        name: org.platform_name || org.name,
        logo: org.logo_url ?? undefined,
        primaryColor: org.primary_color || '#D4A017',
        secondaryColor: org.secondary_color || '#1A1A1A',
      }}
      packages={packages || []}
      availability={availability ? {
        weekly_schedule: availability.weekly_schedule as Record<string, { start: string | null; end: string | null; available: boolean }>,
        max_shoots_per_day: availability.max_shoots_per_day,
        blocked_dates: (availability.blocked_dates || []) as string[],
        buffer_minutes: availability.buffer_minutes,
      } : undefined}
    />
  )
}
