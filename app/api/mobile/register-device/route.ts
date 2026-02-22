/**
 * POST /api/mobile/register-device
 * Stores device push token for sending notifications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    pushToken?: string;
    platform?: string;
    deviceName?: string;
  };

  if (!body.pushToken || typeof body.pushToken !== 'string') {
    return NextResponse.json(
      { error: 'pushToken is required' },
      { status: 400 }
    );
  }

  // Upsert device token into profiles.notification_preferences JSONB
  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', user.id)
    .single();

  const currentPrefs =
    (profile?.notification_preferences as Record<string, unknown>) ?? {};

  const devices = (currentPrefs.devices ?? []) as Array<{
    pushToken: string;
    platform: string;
    deviceName?: string;
    registeredAt: string;
  }>;

  // Remove existing entry for this token (dedup)
  const filtered = devices.filter(d => d.pushToken !== body.pushToken);

  // Add new entry
  filtered.push({
    pushToken: body.pushToken,
    platform: body.platform ?? 'unknown',
    deviceName: body.deviceName,
    registeredAt: new Date().toISOString(),
  });

  // Keep only last 5 devices
  const trimmed = filtered.slice(-5);

  const { error } = await supabase
    .from('profiles')
    .update({
      notification_preferences: {
        ...currentPrefs,
        devices: trimmed,
        pushEnabled: true,
      },
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
