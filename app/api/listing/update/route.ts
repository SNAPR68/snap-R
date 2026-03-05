/**
 * PATCH /api/listing/update
 * Updates editable listing fields (title, address, price, description, etc.)
 * Used by the property site editor to save changes.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().max(2).nullable().optional(),
  postal_code: z.string().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().min(0).nullable().optional(),
  square_feet: z.number().int().min(0).nullable().optional(),
  description: z.string().nullable().optional(),
  property_type: z.string().nullable().optional(),
  year_built: z.number().int().min(1800).max(2100).nullable().optional(),
  lot_size: z.string().nullable().optional(),
  parking: z.string().nullable().optional(),
  mls_number: z.string().nullable().optional(),
  hoa_fees: z.number().min(0).nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  virtual_tour_url: z.string().url().nullable().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    const { id, ...fields } = parsed.data

    // Strip undefined fields so we only update what was sent
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) updates[k] = v
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
