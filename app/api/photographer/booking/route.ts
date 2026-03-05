/**
 * POST /api/photographer/booking
 * Creates a booking request for a photographer shoot.
 * Public endpoint — no auth required (clients book via /book/[slug]).
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { photographerBookingSchema } from '@/lib/validation/schemas'
import { adminSupabase } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = photographerBookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const d = parsed.data

    const supabase = adminSupabase()

    // Verify photographer exists
    const { data: photographer } = await supabase
      .from('profiles')
      .select('id, account_type')
      .eq('id', d.photographerId)
      .single()

    if (!photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 })
    }

    // Verify package exists if provided
    if (d.packageId) {
      const { data: pkg } = await supabase
        .from('photographer_packages')
        .select('id')
        .eq('id', d.packageId)
        .eq('photographer_id', d.photographerId)
        .eq('is_active', true)
        .single()

      if (!pkg) {
        return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
      }
    }

    // Generate booking reference (8 chars, uppercase)
    const reference = crypto.randomBytes(4).toString('hex').toUpperCase()

    // Build the booking record
    const bookingRecord: Record<string, unknown> = {
      photographer_id: d.photographerId,
      package_id: d.packageId ?? null,
      client_name: d.clientName,
      client_email: d.clientEmail,
      client_phone: d.clientPhone ?? null,
      client_brokerage: d.clientBrokerage ?? null,
      property_address: d.propertyAddress,
      property_city: d.propertyCity ?? null,
      property_state: d.propertyState ?? null,
      property_zip: d.propertyZip ?? null,
      property_type: d.propertyType ?? null,
      bedrooms: d.bedrooms ?? null,
      bathrooms: d.bathrooms ?? null,
      square_feet: d.squareFeet ?? null,
      preferred_date: d.preferredDate ?? null,
      preferred_time: d.preferredTime ?? null,
      special_instructions: d.specialInstructions ?? null,
      access_info: d.accessInfo ?? null,
      add_ons: d.addOns ?? [],
      reference,
      status: 'pending',
    }

    const { data: booking, error: insertError } = await supabase
      .from('booking_requests')
      .insert(bookingRecord)
      .select('id, reference, status')
      .single()

    if (insertError) {
      console.error('[booking] Insert failed:', insertError.message)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Upsert into photographer_clients if not already tracked
    const { error: clientError } = await supabase
      .from('photographer_clients')
      .upsert(
        {
          photographer_id: d.photographerId,
          name: d.clientName,
          email: d.clientEmail,
          phone: d.clientPhone ?? null,
          brokerage: d.clientBrokerage ?? null,
          status: 'active',
        },
        { onConflict: 'photographer_id,email' }
      )

    if (clientError) {
      // Non-blocking — booking was already created
      console.warn('[booking] Client upsert warning:', clientError.message)
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[booking] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
