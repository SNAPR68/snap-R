/**
 * PATCH /api/notifications/[id] — Mark a single notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Validate UUID format
    const uuidResult = uuidSchema.safeParse(id);
    if (!uuidResult.success) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Notification update failed:', error);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Notifications/[id]] PATCH error:', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
