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

// 2. Voiceover text — synced to v5 scenes (full product walkthrough, ~141s of scene content)
//
// Scene timing plan (must match SCENES in ExplainerVideo.tsx):
//   Intro card:             0-4s     (no voiceover)
//   1. Homepage:            4-16s    → paragraph 1 (~10s)
//   2. Dashboard:          16-28s    → paragraph 2 (~10s)
//   3. AI Studio:          28-40s    → paragraph 3 (~11s)
//   4. Content Studio:     40-50s    → paragraph 4 (~9s)
//   5. Video Creator:      50-59s    → paragraph 5 (~8s)
//   6. Social Publish:     59-68s    → paragraph 6 (~8s)
//   7. Calendar:           68-77s    → paragraph 7 (~8s)
//   8. Analytics:          77-89s    → paragraph 8 (~10s)
//   9. Lead CRM:           89-100s   → paragraph 9 (~10s)
//   10. Open Houses:      100-109s   → paragraph 10 (~8s)
//   11. Broker Dashboard: 109-123s   → paragraph 11 (~12s)
//   12. Photographer:     123-136s   → paragraph 12 (~12s)
//   13. Pricing:          136-145s   → paragraph 13 (~8s)
//   Closing CTA:          145-151s   (no voiceover — music only)
//
// Target: ~290 words at 130 words/minute = ~134 seconds
//
const text = `SnapR is the AI-powered marketing platform built for real estate. Upload your property photos, and we handle everything else.

Your dashboard is mission control. Every listing, its preparation status, marketing progress, upcoming posts, and recent activity — all in one place.

The AI Studio gives you fifteen professional enhancement tools. Replace skies. Stage empty rooms. Add twilight lighting. Remove clutter. Correct perspectives. Each with instant before-and-after previews.

Once photos are enhanced, marketing kicks in automatically. SnapR generates property descriptions, platform-specific captions, hashtags, and a branded property website — all in seconds.

Create cinematic property videos with AI voiceover. Choose a script style, pick a voice, select your aspect ratio, and render in minutes.

Connect your accounts — Facebook, Instagram, LinkedIn, TikTok, and Twitter. SnapR publishes directly to all five platforms with UTM tracking built in.

The content calendar shows every scheduled and published post. Drag and drop to reschedule. Never miss a posting window.

Track everything. Impressions, engagement, clicks, and cost per lead — broken down by platform, by listing, and by content type. Know exactly what's working.

Every lead flows into a built-in CRM. View them as a list, or drag them through a Kanban pipeline — from New, to Contacted, to Closed. Auto-scoring tracks engagement. Drip sequences nurture leads on autopilot.

Manage open house events with guest check-in pages. Attendees register on their phones, and their data flows straight into your lead pipeline.

Brokers get a team command center. See every agent's listings, lead counts, and performance. Invite agents with role-based access — admins manage the team, editors create content, viewers observe. One dashboard for the entire brokerage.

Photographers get their own white-label portal. Deliver enhanced photos to clients with branded gallery links — your logo, your colors, zero SnapR branding. Agents book shoots through your public page. You manage the pipeline from pending to delivered.

Start free with all fifteen AI tools. Upgrade when you're ready — Starter, Pro, or Agency. Social publishing and full automation unlock on Pro.`;

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
