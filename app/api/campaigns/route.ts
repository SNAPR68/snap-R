// app/api/campaigns/route.ts
// Campaign Engine API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import {
  triggerCampaign,
  approveQueueItem,
  approveAllInCampaign,
  skipQueueItem,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  getUserTriggers,
  upsertTrigger,
  LISTING_STATUSES,
} from '@/lib/campaigns/engine';
import { processQueueItem, processCampaignContent } from '@/lib/campaigns/content-generator';

// GET - Fetch campaigns, queue, or triggers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const admin = adminSupabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'campaigns';
    const campaignId = searchParams.get('campaignId');
    const status = searchParams.get('status');

    switch (type) {
      case 'campaigns': {
        let query = admin
          .from('campaigns')
          .select(`
            *,
            listings (id, address, city, state, photos!photos_listing_id_fkey(raw_url, processed_url)),
            campaign_templates (name)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;
        return NextResponse.json({ campaigns: data });
      }

      case 'queue': {
        let query = admin
          .from('campaign_queue')
          .select(`
            *,
            listings (id, address, city, state),
            campaigns (trigger_status)
          `)
          .eq('user_id', userId)
          .order('scheduled_for', { ascending: true });

        if (campaignId) {
          query = query.eq('campaign_id', campaignId);
        }

        if (status) {
          query = query.eq('status', status);
        } else {
          query = query.in('status', ['pending', 'approved']);
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;
        return NextResponse.json({ queue: data });
      }

      case 'triggers': {
        const triggers = await getUserTriggers(userId);
        return NextResponse.json({
          triggers,
          availableStatuses: LISTING_STATUSES,
        });
      }

      case 'templates': {
        const { data, error } = await admin
          .from('campaign_templates')
          .select('*')
          .eq('is_active', true)
          .order('trigger_status');

        if (error) throw error;
        return NextResponse.json({ templates: data });
      }

      case 'history': {
        const { data, error } = await admin
          .from('campaign_history')
          .select(`
            *,
            campaigns (trigger_status),
            listings (address)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        return NextResponse.json({ history: data });
      }

      case 'stats': {
        // Get campaign stats for user
        const { data: campaigns } = await admin
          .from('campaigns')
          .select('status')
          .eq('user_id', userId);

        const { data: queueItems } = await admin
          .from('campaign_queue')
          .select('status')
          .eq('user_id', userId);

        const stats = {
          totalCampaigns: campaigns?.length || 0,
          activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0,
          pendingApprovals: queueItems?.filter(q => q.status === 'pending').length || 0,
          scheduledPosts: queueItems?.filter(q => q.status === 'approved').length || 0,
          publishedPosts: queueItems?.filter(q => q.status === 'published').length || 0,
        };

        return NextResponse.json({ stats });
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch data';
    console.error('Campaign GET error:', message);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Trigger campaign or perform actions
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'trigger': {
        // Trigger a new campaign
        const { listingId, newStatus, previousStatus } = body;

        if (!listingId || !newStatus) {
          return NextResponse.json({ error: 'listingId and newStatus required' }, { status: 400 });
        }

        const result = await triggerCampaign({
          userId,
          listingId,
          newStatus,
          previousStatus,
        });

        if (result.success && result.campaignId) {
          // Generate content for all queue items
          await processCampaignContent(result.campaignId);
        }

        return NextResponse.json(result);
      }

      case 'approve_item': {
        const { queueItemId } = body;
        if (!queueItemId) {
          return NextResponse.json({ error: 'queueItemId required' }, { status: 400 });
        }
        const result = await approveQueueItem(userId, queueItemId);
        return NextResponse.json(result);
      }

      case 'approve_all': {
        const { campaignId } = body;
        if (!campaignId) {
          return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
        }
        const result = await approveAllInCampaign(userId, campaignId);
        return NextResponse.json(result);
      }

      case 'skip_item': {
        const { queueItemId } = body;
        if (!queueItemId) {
          return NextResponse.json({ error: 'queueItemId required' }, { status: 400 });
        }
        const result = await skipQueueItem(userId, queueItemId);
        return NextResponse.json(result);
      }

      case 'pause': {
        const { campaignId } = body;
        if (!campaignId) {
          return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
        }
        const result = await pauseCampaign(userId, campaignId);
        return NextResponse.json(result);
      }

      case 'resume': {
        const { campaignId } = body;
        if (!campaignId) {
          return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
        }
        const result = await resumeCampaign(userId, campaignId);
        return NextResponse.json(result);
      }

      case 'cancel': {
        const { campaignId } = body;
        if (!campaignId) {
          return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
        }
        const result = await cancelCampaign(userId, campaignId);
        return NextResponse.json(result);
      }

      case 'regenerate': {
        const { queueItemId } = body;
        if (!queueItemId) {
          return NextResponse.json({ error: 'queueItemId required' }, { status: 400 });
        }
        const result = await processQueueItem(queueItemId);
        return NextResponse.json(result);
      }

      case 'update_trigger': {
        const { triggerStatus, settings } = body;
        if (!triggerStatus || !settings) {
          return NextResponse.json({ error: 'triggerStatus and settings required' }, { status: 400 });
        }
        const result = await upsertTrigger(userId, triggerStatus, settings);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    console.error('Campaign POST error:', message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
