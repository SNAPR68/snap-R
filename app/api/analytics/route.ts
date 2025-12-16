export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, subscription_tier')
    .eq('id', user.id)
    .single();

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, variant, created_at, completed_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  const { count: totalPhotos } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const completedJobs = jobs || [];
  const totalEnhancements = completedJobs.length;

  const enhancementsByType: Record<string, number> = {};
  completedJobs.forEach((job) => {
    const type = job.variant || 'other';
    enhancementsByType[type] = (enhancementsByType[type] || 0) + 1;
  });

  const enhancementsList = Object.entries(enhancementsByType)
    .map(([type, count]) => ({
      type: formatVariantName(type),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const timeSavedMinutes = totalEnhancements * 5;
  const moneySaved = totalEnhancements * 15;
  const recentActivity = getWeeklyActivity(completedJobs);
  const creditsUsed = totalEnhancements;

  return NextResponse.json({
    totalPhotos: totalPhotos || 0,
    totalEnhancements,
    creditsUsed,
    creditsRemaining: profile?.credits || 0,
    subscriptionTier: profile?.subscription_tier || 'free',
    timeSaved: timeSavedMinutes,
    moneySaved,
    enhancementsByType: enhancementsList,
    recentActivity,
  });
}

function formatVariantName(variant: string): string {
  const names: Record<string, string> = {
    sky_replacement: 'Sky Replacement',
    virtual_twilight: 'Virtual Twilight',
    virtual_staging: 'Virtual Staging',
    hdr: 'HDR Enhancement',
    declutter: 'AI Declutter',
    lawn_enhancement: 'Lawn Enhancement',
    upscale: 'Upscale',
    auto_enhance: 'Auto Enhance',
    other: 'Other',
  };
  return names[variant] || variant.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getWeeklyActivity(jobs: any[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay()];
    const dateStr = date.toISOString().split('T')[0];

    const count = jobs.filter((job) => {
      const jobDate = new Date(job.created_at).toISOString().split('T')[0];
      return jobDate === dateStr;
    }).length;

    result.push({ date: dayName, count });
  }

  return result;
}
