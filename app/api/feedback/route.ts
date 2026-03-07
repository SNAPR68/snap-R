import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { feedbackSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); const validated = parseBody(feedbackSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); } const { type, message, email, source, conversation } = body;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Build the message with conversation context if provided
    let fullMessage = message;
    if (conversation) {
      fullMessage = `${message}\n\n--- Recent Conversation ---\n${conversation}`;
    }

    // Map feedback types to subject prefixes
    const typeMap: Record<string, string> = {
      'bug': 'BUG',
      'positive': 'POSITIVE',
      'negative': 'NEGATIVE',
      'feature': 'FEATURE',
      'question': 'QUESTION'
    };
    const typePrefix = typeMap[type] || type.toUpperCase();
    const sourceTag = source ? ` [${source.toUpperCase()}]` : '';

    const { error } = await supabase.from('contacts').insert({
      name: email || user?.email || 'Anonymous',
      email: email || user?.email || 'no-email@feedback.com',
      subject: `[${typePrefix}${sourceTag}] Feedback from ${user?.email || 'Anonymous'}`,
      message: fullMessage,
      status: 'pending',
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

