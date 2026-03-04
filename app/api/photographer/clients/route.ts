/**
 * SnapR API — Photographer Clients (CRM)
 * ========================================
 * GET:    List photographer's clients
 * POST:   Create or upsert a client
 * PATCH:  Update client details
 * DELETE: Remove a client
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

const clientCreateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().nullable(),
  brokerage: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

const clientUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(30).optional().nullable(),
  brokerage: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
})

const clientDeleteSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminSupabase()
    const url = new URL(request.url)
    const search = url.searchParams.get('search')

    let query = admin
      .from('photographer_clients')
      .select('*')
      .eq('photographer_id', user.id)
      .order('name', { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,brokerage.ilike.%${search}%`)
    }

    const { data: clients, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Get delivery link counts per client
    const clientIds = (clients || []).map(c => c.id)
    const { data: deliveryCounts } = await admin
      .from('delivery_links')
      .select('client_id, id, download_count')
      .in('client_id', clientIds)

    const countsByClient = (deliveryCounts || []).reduce<Record<string, { deliveries: number; downloads: number }>>((acc, dl) => {
      if (!dl?.client_id) return acc
      const cid = dl.client_id as string
      if (!acc[cid]) acc[cid] = { deliveries: 0, downloads: 0 }
      acc[cid]!.deliveries++
      acc[cid]!.downloads += (dl.download_count as number) || 0
      return acc
    }, {})

    const enriched = (clients || []).map(c => ({
      ...c,
      delivery_count: countsByClient[c.id]?.deliveries ?? 0,
      download_count: countsByClient[c.id]?.downloads ?? 0,
    }))

    return NextResponse.json({ clients: enriched })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = clientCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 })
    }

    const admin = adminSupabase()
    const { data: client, error } = await admin
      .from('photographer_clients')
      .upsert({
        photographer_id: user.id,
        ...parsed.data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'photographer_id,email' })
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        return NextResponse.json({ error: 'A client with this email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ client })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = clientUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 })
    }

    const { id, ...updates } = parsed.data
    const admin = adminSupabase()

    const { data: client, error } = await admin
      .from('photographer_clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('photographer_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ client })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = clientDeleteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const admin = adminSupabase()
    const { error } = await admin
      .from('photographer_clients')
      .delete()
      .eq('id', parsed.data.id)
      .eq('photographer_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
