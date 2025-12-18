// lib/campaigns/engine.ts
// Auto Campaign Engine - Core Logic

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Status types that can trigger campaigns
export const LISTING_STATUSES = {
  coming_soon: 'Coming Soon',
  just_listed: 'Just Listed',
  open_house: 'Open House',
  price_drop: 'Price Improvement',
  under_contract: 'Under Contract',
  sold: 'Sold',
} as const;

export type ListingStatus = keyof typeof LISTING_STATUSES;

interface TriggerCampaignParams {
  userId: string;
  listingId: string;
  newStatus: ListingStatus;
  previousStatus?: string;
}

interface QueueItem {
  content_type: 'social_post' | 'email' | 'video' | 'property_site_update';
  platform?: string;
  scheduled_for: Date;
  content_data: Record<string, any>;
}

// Main function: Trigger a campaign when listing status changes
export async function triggerCampaign({
  userId,
  listingId,
  newStatus,
  previousStatus,
}: TriggerCampaignParams): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check if user has a trigger configured for this status
    const { data: trigger, error: triggerError } = await supabase
      .from('campaign_triggers')
      .select('*, campaign_templates(*)')
      .eq('user_id', userId)
      .eq('trigger_status', newStatus)
      .eq('is_active', true)
      .single();

    if (triggerError || !trigger) {
      // No trigger configured - check for default template
      const { data: defaultTemplate } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('trigger_status', newStatus)
        .eq('is_default', true)
        .single();

      if (!defaultTemplate) {
        return { success: false, error: 'No campaign trigger configured for this status' };
      }

      // Use default template with default settings
      return await createCampaignWithTemplate({
        supabase,
        userId,
        listingId,
        newStatus,
        previousStatus,
        template: defaultTemplate,
        settings: {
          auto_approve: false,
          generate_social: true,
          generate_email: true,
          generate_video: false,
          update_property_site: true,
          platforms: ['instagram', 'facebook', 'linkedin'],
        },
      });
    }

    // Use user's configured trigger
    const template = trigger.campaign_templates || await getDefaultTemplate(supabase, newStatus);
    
    return await createCampaignWithTemplate({
      supabase,
      userId,
      listingId,
      newStatus,
      previousStatus,
      template,
      settings: {
        auto_approve: trigger.auto_approve,
        generate_social: trigger.generate_social,
        generate_email: trigger.generate_email,
        generate_video: trigger.generate_video,
        update_property_site: trigger.update_property_site,
        platforms: trigger.platforms || ['instagram', 'facebook', 'linkedin'],
      },
    });
  } catch (error) {
    console.error('Campaign trigger error:', error);
    return { success: false, error: 'Failed to trigger campaign' };
  }
}

async function getDefaultTemplate(supabase: any, status: string) {
  const { data } = await supabase
    .from('campaign_templates')
    .select('*')
    .eq('trigger_status', status)
    .eq('is_default', true)
    .single();
  return data;
}

async function createCampaignWithTemplate({
  supabase,
  userId,
  listingId,
  newStatus,
  previousStatus,
  template,
  settings,
}: {
  supabase: any;
  userId: string;
  listingId: string;
  newStatus: string;
  previousStatus?: string;
  template: any;
  settings: {
    auto_approve: boolean;
    generate_social: boolean;
    generate_email: boolean;
    generate_video: boolean;
    update_property_site: boolean;
    platforms: string[];
  };
}) {
  // 1. Get listing data
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('*, photos(*)')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    return { success: false, error: 'Listing not found' };
  }

  // 2. Create campaign record
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      user_id: userId,
      listing_id: listingId,
      template_id: template?.id,
      trigger_status: newStatus,
      previous_status: previousStatus,
      status: 'active',
    })
    .select()
    .single();

  if (campaignError) {
    console.error('Campaign creation error:', campaignError);
    return { success: false, error: 'Failed to create campaign' };
  }

  // 3. Generate queue items
  const queueItems: QueueItem[] = [];
  const now = new Date();

  // Social posts from schedule
  if (settings.generate_social && template?.social_schedule) {
    const schedule = typeof template.social_schedule === 'string' 
      ? JSON.parse(template.social_schedule) 
      : template.social_schedule;

    for (const item of schedule) {
      // Filter platforms based on user settings
      const platforms = (item.platforms || []).filter((p: string) => 
        settings.platforms.includes(p)
      );

      for (const platform of platforms) {
        const scheduledDate = new Date(now);
        scheduledDate.setDate(scheduledDate.getDate() + (item.day || 0));
        if (item.hour) {
          scheduledDate.setHours(item.hour, 0, 0, 0);
        }

        queueItems.push({
          content_type: 'social_post',
          platform,
          scheduled_for: scheduledDate,
          content_data: {
            template_style: item.template_style,
            tone: item.tone || 'professional',
            listing_status: newStatus,
          },
        });
      }
    }
  }

  // Email blast
  if (settings.generate_email) {
    queueItems.push({
      content_type: 'email',
      scheduled_for: now,
      content_data: {
        subject_template: template?.email_subject_template,
        email_template: template?.email_template || 'professional',
        listing_status: newStatus,
      },
    });
  }

  // Property site update
  if (settings.update_property_site) {
    queueItems.push({
      content_type: 'property_site_update',
      scheduled_for: now,
      content_data: {
        new_status: newStatus,
        update_banner: true,
      },
    });
  }

  // Video generation
  if (settings.generate_video) {
    queueItems.push({
      content_type: 'video',
      scheduled_for: now,
      content_data: {
        listing_status: newStatus,
        include_voiceover: true,
      },
    });
  }

  // 4. Insert queue items
  const queueInserts = queueItems.map(item => ({
    user_id: userId,
    campaign_id: campaign.id,
    listing_id: listingId,
    content_type: item.content_type,
    platform: item.platform,
    scheduled_for: item.scheduled_for.toISOString(),
    content_data: item.content_data,
    status: settings.auto_approve ? 'approved' : 'pending',
    requires_approval: !settings.auto_approve,
  }));

  const { error: queueError } = await supabase
    .from('campaign_queue')
    .insert(queueInserts);

  if (queueError) {
    console.error('Queue insert error:', queueError);
  }

  // 5. Update campaign stats
  await supabase
    .from('campaigns')
    .update({ total_items: queueItems.length })
    .eq('id', campaign.id);

  // 6. Log to history
  await supabase.from('campaign_history').insert({
    user_id: userId,
    campaign_id: campaign.id,
    listing_id: listingId,
    action: 'triggered',
    details: {
      trigger_status: newStatus,
      previous_status: previousStatus,
      items_created: queueItems.length,
      template_name: template?.name,
    },
  });

  return { success: true, campaignId: campaign.id };
}

// Approve a queue item
export async function approveQueueItem(
  userId: string,
  queueItemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('campaign_queue')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: userId,
    })
    .eq('id', queueItemId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Approve all pending items in a campaign
export async function approveAllInCampaign(
  userId: string,
  campaignId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('campaign_queue')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: userId,
    })
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: data?.length || 0 };
}

// Skip a queue item
export async function skipQueueItem(
  userId: string,
  queueItemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('campaign_queue')
    .update({ status: 'skipped' })
    .eq('id', queueItemId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Pause a campaign
export async function pauseCampaign(
  userId: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('id', campaignId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from('campaign_history').insert({
    user_id: userId,
    campaign_id: campaignId,
    action: 'paused',
  });

  return { success: true };
}

// Resume a campaign
export async function resumeCampaign(
  userId: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'active' })
    .eq('id', campaignId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from('campaign_history').insert({
    user_id: userId,
    campaign_id: campaignId,
    action: 'resumed',
  });

  return { success: true };
}

// Cancel a campaign
export async function cancelCampaign(
  userId: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Cancel all pending queue items
  await supabase
    .from('campaign_queue')
    .update({ status: 'skipped' })
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .in('status', ['pending', 'approved']);

  // Update campaign status
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'cancelled' })
    .eq('id', campaignId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from('campaign_history').insert({
    user_id: userId,
    campaign_id: campaignId,
    action: 'cancelled',
  });

  return { success: true };
}

// Get user's campaign triggers (automation settings)
export async function getUserTriggers(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('campaign_triggers')
    .select('*, campaign_templates(*)')
    .eq('user_id', userId)
    .order('trigger_status');

  if (error) {
    console.error('Get triggers error:', error);
    return [];
  }

  return data || [];
}

// Update or create a trigger
export async function upsertTrigger(
  userId: string,
  triggerStatus: ListingStatus,
  settings: {
    is_active: boolean;
    auto_approve: boolean;
    generate_social: boolean;
    generate_email: boolean;
    generate_video: boolean;
    update_property_site: boolean;
    platforms: string[];
    template_id?: string;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('campaign_triggers')
    .upsert({
      user_id: userId,
      trigger_status: triggerStatus,
      ...settings,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,trigger_status',
    })
    .select()
    .single();

  if (error) {
    console.error('Upsert trigger error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, trigger: data };
}
