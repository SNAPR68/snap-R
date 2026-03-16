#!/usr/bin/env node

/**
 * Generate explainer video voiceover using OpenAI TTS API.
 *
 * Usage: node scripts/generate-voiceover.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// 1. Read OPENAI_API_KEY from .env.local
const envPath = resolve(ROOT, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const match = envContent.match(/^OPENAI_API_KEY=(.+)$/m);
if (!match) {
  console.error('ERROR: OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}
const apiKey = match[1].trim().replace(/^["']|["']$/g, '');
console.log('Found OPENAI_API_KEY (length: %d)', apiKey.length);

// 2. Voiceover text — synced to v6 scenes (full product walkthrough, 14 scenes + intro + closing)
//
// Scene timing plan (must match SCENES in ExplainerVideo.tsx):
//   Intro card:             0-4s     (no voiceover)
//   1. Homepage:            4-14s    → paragraph 1 (~10s)
//   2. Dashboard:          14-24s    → paragraph 2 (~10s)
//   3. AI Studio:          24-36s    → paragraph 3 (~12s)
//   4. Content Studio:     36-46s    → paragraph 4 (~10s)
//   5. Video Creator:      46-54s    → paragraph 5 (~8s)
//   6. Social Publish:     54-63s    → paragraph 6 (~9s)
//   7. Calendar:           63-71s    → paragraph 7 (~8s)
//   8. Analytics:          71-81s    → paragraph 8 (~10s)
//   9. Lead CRM:           81-91s    → paragraph 9 (~10s)
//   10. Open Houses:       91-99s    → paragraph 10 (~8s)
//   11. Broker Dashboard:  99-111s   → paragraph 11 (~12s)
//   12. Photographer:     111-121s   → paragraph 12 (~10s)
//   13. Booking Form:     121-129s   → paragraph 13 (~8s)
//   14. Pricing:          129-137s   → paragraph 14 (~8s)
//   Closing CTA:          137-143s   (no voiceover — music only)
//
// Target: ~310 words at 130 wpm. Video is 134s; voiceover (139s) extends
// ~5s into the closing card — intentional overlap before music-only CTA.
//
const text = `SnapR is the AI-powered marketing platform built for real estate. Upload your property photos, and we handle everything — from enhancement to publishing to lead conversion.

Your dashboard is mission control. Every listing, its preparation status, marketing progress, upcoming posts, leads, and recent activity — all in one place.

The AI Studio gives you fifteen professional enhancement tools. Replace skies. Stage empty rooms. Add twilight lighting. Remove clutter. Correct perspectives. Each with instant before-and-after previews.

Once photos are enhanced, marketing kicks in automatically. SnapR generates property descriptions, platform-specific captions, hashtags, a cinematic video, and a branded property website — all in seconds.

Create cinematic property videos with AI voiceover. Choose from five templates, pick a script style, select a voice, and render in three aspect ratios — vertical for Reels, landscape for YouTube, square for feeds.

Connect your accounts — Facebook, Instagram, LinkedIn, TikTok, and Twitter. SnapR publishes directly to all five platforms with UTM tracking built in.

The content calendar shows every scheduled and published post. Drag and drop to reschedule. Campaign triggers auto-generate fresh content when listing status changes — price drops, open houses, and sold.

Track everything. Impressions, engagement, clicks, and cost per lead — broken down by platform, by listing, and by content type. Know exactly what is working and double down.

Every lead flows into a built-in CRM. View them as a list, or drag them through a Kanban pipeline — from New, to Contacted, to Closed. Auto-scoring tracks engagement. Drip sequences and bulk email nurture leads on autopilot.

Manage open house events with digital check-in pages. Attendees register on their phones, and their data flows straight into your lead pipeline with automatic scoring.

Brokers get a team command center. See every agent's listings, lead counts, and performance charts. Invite agents with role-based access — admins manage the team, editors create content, viewers observe. One dashboard for the entire brokerage.

Photographers get their own portal. Manage packages, set availability, track bookings from pending to delivered, and monitor revenue — all from a single pipeline view.

Agents book shoots through your branded public page. They pick a package, enter property details, choose a date, and submit. You get notified instantly.

Start free with all fifteen AI tools. Upgrade to Gold or Platinum for social publishing, video creation, and full marketing automation. Enterprise unlocks API access, custom domains, and embeddable widgets.`;

console.log('Voiceover text length: %d characters', text.length);
console.log('Calling OpenAI TTS API (model: tts-1-hd, voice: shimmer)...');

// 3. Call OpenAI TTS API — using "shimmer" for a warm, friendly, professional female voice
const startTime = Date.now();

const response = await fetch('https://api.openai.com/v1/audio/speech', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'tts-1-hd',
    voice: 'shimmer',
    input: text,
    response_format: 'mp3',
  }),
  signal: AbortSignal.timeout(120000),
});

if (!response.ok) {
  const errorBody = await response.text();
  console.error('API request failed with status %d: %s', response.status, errorBody);
  process.exit(1);
}

console.log('API responded with status %d in %d ms', response.status, Date.now() - startTime);

// 4. Read the response as a buffer and save to file
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

const outputPath = resolve(ROOT, 'public', 'explainer-voiceover.mp3');
writeFileSync(outputPath, buffer);

const fileSizeKB = (buffer.byteLength / 1024).toFixed(1);
console.log('Saved voiceover MP3 to: %s (%s KB)', outputPath, fileSizeKB);
console.log('Total time: %d ms', Date.now() - startTime);
