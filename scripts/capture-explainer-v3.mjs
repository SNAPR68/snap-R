#!/usr/bin/env node

/**
 * Capture explainer video screenshots v3 — Full-page captures.
 *
 * Instead of discrete viewport screenshots at scroll positions,
 * this captures FULL-PAGE HEIGHT screenshots for each page.
 * Remotion then animates smooth scrolling over these tall images.
 *
 * Auth strategy: Supabase REST token + cookie injection.
 * We call the Supabase /auth/v1/token REST endpoint, then replicate
 * exactly how @supabase/ssr createBrowserClient stores the session:
 *   cookie name: sb-{project-ref}-auth-token
 *   cookie value: base64-{base64url(JSON.stringify(session))}
 * If the encoded value > 3180 chars, it's split into .0 / .1 chunks.
 *
 * Usage: node scripts/capture-explainer-v3.mjs
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'explainer-frames-v3');

const WIDTH = 1920;
const HEIGHT = 1080;
const BASE = 'https://snap-r.com';

// Supabase config (public anon key — safe for local scripts)
const SUPABASE_URL = 'https://asoiwonhqoesbvcilqwd.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzb2l3b25ocW9lc2J2Y2lscXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODQ2ODAsImV4cCI6MjA3ODc2MDY4MH0.7bz9c81EyG7MGtFyZwFr2bVQlxd2U0yS11-0b5fJ6nM';
const PROJECT_REF = 'asoiwonhqoesbvcilqwd';

// Demo account credentials
const EMAIL = 'demo@snap-r.com';
const PASSWORD = 'DemoVideo2026x';

// Known listing IDs
const LISTING_ID = '2d032018-af8b-4cef-a3f2-1a69f12923c8'; // Stunning Modern Estate

// ── Base64URL encoding — matches @supabase/ssr internals exactly ─────────────
const TO_BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('');

function stringToBase64URL(str) {
  const base64 = [];
  let queue = 0;
  let queuedBits = 0;

  // UTF-8 encode the string to bytes
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let cp = str.charCodeAt(i);
    if (cp > 0xd7ff && cp <= 0xdbff) {
      const hi = ((cp - 0xd800) * 0x400) & 0xffff;
      const lo = (str.charCodeAt(++i) - 0xdc00) & 0xffff;
      cp = (lo | hi) + 0x10000;
    }
    if (cp <= 0x7f) bytes.push(cp);
    else if (cp <= 0x7ff) {
      bytes.push(0xc0 | (cp >> 6));
      bytes.push(0x80 | (cp & 0x3f));
    } else if (cp <= 0xffff) {
      bytes.push(0xe0 | (cp >> 12));
      bytes.push(0x80 | ((cp >> 6) & 0x3f));
      bytes.push(0x80 | (cp & 0x3f));
    } else {
      bytes.push(0xf0 | (cp >> 18));
      bytes.push(0x80 | ((cp >> 12) & 0x3f));
      bytes.push(0x80 | ((cp >> 6) & 0x3f));
      bytes.push(0x80 | (cp & 0x3f));
    }
  }

  // Encode bytes as base64url
  for (const byte of bytes) {
    queue = (queue << 8) | byte;
    queuedBits += 8;
    while (queuedBits >= 6) {
      base64.push(TO_BASE64URL[(queue >> (queuedBits - 6)) & 63]);
      queuedBits -= 6;
    }
  }
  if (queuedBits > 0) {
    queue = queue << (6 - queuedBits);
    base64.push(TO_BASE64URL[(queue >> 0) & 63]);
  }
  return base64.join('');
}

// ── Cookie chunking — matches @supabase/ssr chunker.js ───────────────────────
const MAX_CHUNK_SIZE = 3180;

function createChunks(key, value) {
  let encodedValue = encodeURIComponent(value);
  if (encodedValue.length <= MAX_CHUNK_SIZE) {
    return [{ name: key, value }];
  }
  const chunks = [];
  while (encodedValue.length > 0) {
    let head = encodedValue.slice(0, MAX_CHUNK_SIZE);
    const lastEsc = head.lastIndexOf('%');
    if (lastEsc > MAX_CHUNK_SIZE - 3) head = head.slice(0, lastEsc);
    let valueHead = '';
    while (head.length > 0) {
      try {
        valueHead = decodeURIComponent(head);
        break;
      } catch {
        head = head.slice(0, head.length - 3);
      }
    }
    chunks.push(valueHead);
    encodedValue = encodedValue.slice(encodeURIComponent(valueHead).length);
  }
  return chunks.map((v, i) => ({ name: `${key}.${i}`, value: v }));
}

/**
 * Build Puppeteer cookies from a Supabase session object.
 * Replicates exactly what createBrowserClient (cookieEncoding: "base64url") does.
 */
function buildAuthCookies(session) {
  const cookieKey = `sb-${PROJECT_REF}-auth-token`;
  const sessionJson = JSON.stringify(session);
  const encoded = 'base64-' + stringToBase64URL(sessionJson);
  return createChunks(cookieKey, encoded);
}

// Clean output directory
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const oldFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.png') || f === 'manifest.json');
oldFiles.forEach((f) => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
console.log(`Cleaned ${oldFiles.length} old files`);

const manifest = [];

async function captureFullPage(page, filename, label) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const filepath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filepath, type: 'png', fullPage: true });
  const stats = fs.statSync(filepath);
  console.log(
    `  [${filename}] ${label} — ${scrollHeight}px tall, ${(stats.size / 1024 / 1024).toFixed(1)}MB`
  );
  manifest.push({ filename, label, scrollHeight, viewportHeight: HEIGHT });
}

async function captureViewport(page, filename, label) {
  const filepath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filepath, type: 'png' });
  const stats = fs.statSync(filepath);
  console.log(`  [${filename}] ${label} — viewport only, ${(stats.size / 1024).toFixed(0)}KB`);
  manifest.push({ filename, label, scrollHeight: HEIGHT, viewportHeight: HEIGHT });
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function dismissOverlays(page) {
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate((el) => el.textContent?.trim());
      if (text === 'Decline' || text === 'Accept') {
        await btn.click();
        await wait(500);
        break;
      }
    }
  } catch {
    // ignore
  }
  try {
    await page.evaluate(() => {
      document
        .querySelectorAll('[class*="chatbot"], [id*="chatbot"], [class*="Ansel"], [class*="ansel"]')
        .forEach((el) => {
          el.style.display = 'none';
        });
      document
        .querySelectorAll('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]')
        .forEach((el) => {
          el.style.display = 'none';
        });
      document
        .querySelectorAll('div[style*="position: fixed"], div[class*="fixed"]')
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom > 900 && rect.right > 1600 && rect.width < 300) el.style.display = 'none';
          if (rect.bottom > 900 && rect.width > 600 && rect.height < 200) el.style.display = 'none';
        });
    });
  } catch {
    // ignore
  }
}

/**
 * Get a Supabase session via REST API (bypasses React form).
 */
async function getSupabaseSession() {
  console.log(`\nAuthenticating as ${EMAIL} via Supabase REST...`);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase auth failed (${res.status}): ${body}`);
  }

  const session = await res.json();
  if (!session.access_token) {
    throw new Error(`Supabase auth returned no access_token: ${JSON.stringify(session)}`);
  }

  console.log(`  Auth OK — user: ${session.user?.email}, expires_in: ${session.expires_in}s`);
  return session;
}

/**
 * Inject Supabase auth cookies into Puppeteer page.
 * Encodes exactly as @supabase/ssr createBrowserClient (base64url + chunking).
 */
async function injectAuthCookies(page, session) {
  const cookies = buildAuthCookies(session);
  for (const { name, value } of cookies) {
    await page.setCookie({
      name,
      value,
      domain: 'snap-r.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    });
  }
  const names = cookies.map((c) => c.name).join(', ');
  console.log(`  Injected ${cookies.length} cookie(s): ${names}`);
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [`--window-size=${WIDTH},${HEIGHT}`, '--no-sandbox'],
    defaultViewport: { width: WIDTH, height: HEIGHT },
  });

  const page = await browser.newPage();

  // ── AUTH ────────────────────────────────────────────────────────────────
  let session = null;
  try {
    session = await getSupabaseSession();
  } catch (err) {
    console.error(`\n  AUTH ERROR: ${err.message}`);
    console.error('  Authenticated pages will show login page. Check credentials.\n');
  }

  // ── 1. HOMEPAGE (full page) ─────────────────────────────────────────────
  console.log('\n--- 1. Homepage ---');
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(3000);
  await dismissOverlays(page);
  await wait(500);
  await dismissOverlays(page);
  await captureFullPage(page, 'homepage.png', 'Homepage full scroll');

  // ── 2. PRICING (full page) ──────────────────────────────────────────────
  console.log('\n--- 2. Pricing ---');
  await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);
  await dismissOverlays(page);
  await captureFullPage(page, 'pricing.png', 'Pricing page');

  // ── 3. SIGNUP (viewport only) ───────────────────────────────────────────
  console.log('\n--- 3. Signup ---');
  await page.goto(`${BASE}/auth/signup`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);
  await dismissOverlays(page);
  await captureViewport(page, 'signup.png', 'Signup page');

  // ── 4. LOGIN (viewport — filled) ───────────────────────────────────────
  console.log('\n--- 4. Login ---');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);
  await dismissOverlays(page);
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.click('input[type="email"]');
    await page.keyboard.type(EMAIL, { delay: 20 });
    await page.click('input[type="password"]');
    await page.keyboard.type(PASSWORD, { delay: 20 });
    await wait(300);
  } catch {
    // Form may not be interactive
  }
  await captureViewport(page, 'login.png', 'Login filled');

  // ── INJECT AUTH COOKIES before authenticated pages ──────────────────────
  if (session) {
    await injectAuthCookies(page, session);
  }

  // ── 5. DASHBOARD (full page) ────────────────────────────────────────────
  console.log('\n--- 5. Dashboard ---');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(4000);
  await dismissOverlays(page);
  await wait(1000);
  const dashUrl = page.url();
  console.log(`  URL: ${dashUrl}`);
  if (dashUrl.includes('/dashboard') && !dashUrl.includes('/auth/')) {
    await captureFullPage(page, 'dashboard.png', 'Dashboard');
  } else {
    console.log('  AUTH FAILED — capturing login page as fallback');
    await captureViewport(page, 'dashboard.png', 'Dashboard (auth failed)');
  }

  // ── 6. AI STUDIO (full page) ────────────────────────────────────────────
  console.log('\n--- 6. AI Studio ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/studio?id=${LISTING_ID}`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await wait(5000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureFullPage(page, 'studio.png', 'AI Studio');

  // ── 7. CONTENT STUDIO (full page) ──────────────────────────────────────
  console.log('\n--- 7. Content Studio ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/content-studio`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(3000);
  await dismissOverlays(page);
  try {
    const cards = await page.$$('div[class*="cursor-pointer"], a[href*="content-studio"]');
    for (const card of cards) {
      const text = await card.evaluate((el) => el.textContent);
      if (text && text.includes('Stunning Modern Estate')) {
        await card.click();
        await wait(3000);
        break;
      }
    }
  } catch {
    // Continue with whatever is showing
  }
  console.log(`  URL: ${page.url()}`);
  await captureFullPage(page, 'content-studio.png', 'Content Studio');

  // ── 8. VIDEO CREATOR (viewport) ─────────────────────────────────────────
  console.log('\n--- 8. Video Creator ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/content-studio/video`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await wait(3000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureViewport(page, 'video-creator.png', 'Video Creator');

  // ── 9. ANALYTICS (full page) ────────────────────────────────────────────
  console.log('\n--- 9. Analytics ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/analytics`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(3000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureFullPage(page, 'analytics.png', 'Analytics');

  // ── 10. SOCIAL SETTINGS (viewport) ──────────────────────────────────────
  console.log('\n--- 10. Social Settings ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/settings/social`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await wait(3000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureViewport(page, 'social-settings.png', 'Social Settings');

  // ── 11. CALENDAR (viewport) ──────────────────────────────────────────────
  console.log('\n--- 11. Calendar ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/content-studio/calendar`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await wait(3000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureViewport(page, 'calendar.png', 'Calendar');

  // ── 12. LEADS CRM (full page) ────────────────────────────────────────────
  console.log('\n--- 12. Leads CRM ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/leads`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await wait(4000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureFullPage(page, 'leads.png', 'Lead CRM');

  // ── 13. OPEN HOUSES (full page) ──────────────────────────────────────────
  console.log('\n--- 13. Open Houses ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/open-houses`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await wait(4000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureFullPage(page, 'open-houses.png', 'Open Houses');

  // ── 14. BROKER DASHBOARD (full page) ─────────────────────────────────────
  console.log('\n--- 14. Broker Dashboard ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/broker`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await wait(4000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureFullPage(page, 'broker.png', 'Broker Dashboard');

  // ── 15. PHOTOGRAPHER BOOKINGS (full page) ────────────────────────────────
  console.log('\n--- 15. Photographer Bookings ---');
  if (session) await injectAuthCookies(page, session);
  await page.goto(`${BASE}/dashboard/photographer/bookings`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await wait(4000);
  await dismissOverlays(page);
  console.log(`  URL: ${page.url()}`);
  await captureFullPage(page, 'photographer.png', 'Photographer Bookings');

  // ── 16. PUBLIC BOOKING FORM (viewport) ───────────────────────────────────
  console.log('\n--- 16. Booking Form ---');
  // Public page — no auth needed. Use first available photographer slug.
  // If no booking page exists, capture placeholder
  try {
    await page.goto(`${BASE}/book/demo`, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });
    await wait(3000);
    await dismissOverlays(page);
    console.log(`  URL: ${page.url()}`);
    await captureViewport(page, 'booking-form.png', 'Public Booking Form');
  } catch {
    console.log('  Booking form page not available — skipping');
  }

  // ── DONE ─────────────────────────────────────────────────────────────────
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  await browser.close();

  console.log(`\nDone! ${manifest.length} captures.`);
  manifest.forEach((m) => console.log(`  ${m.filename}: ${m.scrollHeight}px`));
})();
