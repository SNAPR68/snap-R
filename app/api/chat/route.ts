import { NextResponse, type NextRequest } from 'next/server';
import OpenAI from 'openai';
import { adminSupabase } from '@/lib/supabase/admin';
import { buildPropertyChatPrompt } from '@/lib/chat/system-prompt';
import { assessQualification } from '@/lib/chat/qualification';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const chatMessageSchema = z.object({
  sessionId: z.string().uuid().optional(),
  propertySiteId: z.string().uuid(),
  listingId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  visitorId: z.string().min(1).max(100),
  visitorName: z.string().max(200).optional(),
  visitorEmail: z.string().email().max(200).optional(),
  visitorPhone: z.string().max(30).optional(),
});

// ── POST: Send message and stream AI response ──────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }

    const {
      sessionId,
      propertySiteId,
      listingId,
      message,
      visitorId,
      visitorName,
      visitorEmail,
      visitorPhone,
    } = parsed.data;

    const admin = adminSupabase();

    // Fetch listing details for context
    const { data: listing } = await admin
      .from('listings')
      .select('address, price, bedrooms, bathrooms, square_feet, description, detected_features, detected_style, detected_condition, user_id')
      .eq('id', listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Fetch brand profile for agent context
    const { data: brand } = await admin
      .from('brand_profiles')
      .select('business_name, phone, email, brokerage_name')
      .eq('user_id', listing.user_id)
      .maybeSingle();

    // Build system prompt
    const detectedFeatures = listing.detected_features as Record<string, string[]> | null;
    const allFeatures = detectedFeatures
      ? Object.values(detectedFeatures).flat()
      : [];

    const systemPrompt = buildPropertyChatPrompt(
      {
        address: listing.address ?? undefined,
        price: listing.price ?? undefined,
        beds: listing.bedrooms ?? undefined,
        baths: listing.bathrooms ?? undefined,
        sqft: listing.square_feet ?? undefined,
        description: listing.description ?? undefined,
        style: (listing.detected_style as string) ?? undefined,
        condition: (listing.detected_condition as string) ?? undefined,
      },
      brand ? {
        name: brand.business_name ?? undefined,
        phone: brand.phone ?? undefined,
        email: brand.email ?? undefined,
        brokerage: brand.brokerage_name ?? undefined,
      } : undefined,
      allFeatures.length > 0 ? allFeatures : undefined,
    );

    // Get or create session
    let sessionIdForClosure = sessionId ?? '';

    if (!sessionId) {
      const { data: newSession, error: sessionError } = await admin
        .from('chat_sessions')
        .insert({
          property_site_id: propertySiteId,
          listing_id: listingId,
          user_id: listing.user_id,
          visitor_id: visitorId,
          visitor_name: visitorName ?? null,
          visitor_email: visitorEmail ?? null,
          visitor_phone: visitorPhone ?? null,
          status: 'active',
          message_count: 0,
        })
        .select('id')
        .single();

      if (sessionError || !newSession) {
        logger.error('[chat] Session creation failed:', sessionError?.message);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      sessionIdForClosure = newSession.id;
    }

    // Store user message
    await admin.from('chat_messages').insert({
      session_id: sessionIdForClosure,
      role: 'user',
      content: message,
    });

    // Fetch conversation history
    const { data: history } = await admin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionIdForClosure)
      .order('created_at', { ascending: true })
      .limit(20);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...(history ?? []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Stream response
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 300,
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content, sessionId: sessionIdForClosure })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch {
          controller.close();
        }

        // Post-stream: store assistant response and run qualification
        try {
          await admin.from('chat_messages').insert({
            session_id: sessionIdForClosure,
            role: 'assistant',
            content: fullResponse,
          });

          // Update message count
          await admin
            .from('chat_sessions')
            .update({
              message_count: (history?.length ?? 0) + 2,
              visitor_name: visitorName ?? undefined,
              visitor_email: visitorEmail ?? undefined,
              visitor_phone: visitorPhone ?? undefined,
            })
            .eq('id', sessionIdForClosure);

          // Run qualification
          const allMessages = [
            ...(history ?? []).map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user' as const, content: message },
            { role: 'assistant' as const, content: fullResponse },
          ];

          const qualification = assessQualification(allMessages);

          await admin
            .from('chat_sessions')
            .update({
              qualification_score: qualification.score,
              qualification_data: qualification,
              is_hot_lead: qualification.isHotLead,
            })
            .eq('id', sessionIdForClosure);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          logger.error('[chat] Post-stream error:', msg);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[chat] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
