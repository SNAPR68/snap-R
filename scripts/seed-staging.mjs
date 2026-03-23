#!/usr/bin/env node
/**
 * Staging Data Seeder
 * Seeds a staging environment with realistic data for testing.
 *
 * Usage: node scripts/seed-staging.mjs
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env from .env.local
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
} catch {
  console.error('Could not read .env.local — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY manually');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const STAGING_EMAIL = 'staging@snap-r.com';

async function getOrCreateStagingUser() {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', STAGING_EMAIL)
    .single();

  if (existing) {
    console.log(`Found staging user: ${existing.id}`);
    return existing.id;
  }

  // Create auth user via admin API
  const { data: authUser, error } = await supabase.auth.admin.createUser({
    email: STAGING_EMAIL,
    password: 'staging-password-2026',
    email_confirm: true,
  });

  if (error) {
    console.error('Failed to create staging user:', error.message);
    process.exit(1);
  }

  console.log(`Created staging user: ${authUser.user.id}`);
  return authUser.user.id;
}

async function cleanOldData(userId) {
  console.log('Cleaning old staging data...');
  await supabase.from('published_posts').delete().eq('user_id', userId);
  await supabase.from('scheduled_posts').delete().eq('user_id', userId);
  await supabase.from('marketing_jobs').delete().eq('user_id', userId);
  await supabase.from('photos').delete().match({ user_id: userId });
  await supabase.from('property_leads').delete().eq('user_id', userId);
  await supabase.from('listings').delete().eq('user_id', userId);
  console.log('Old data cleaned.');
}

function randomAddress() {
  const streets = ['Oak St', 'Maple Ave', 'Cedar Ln', 'Pine Rd', 'Elm Blvd', 'Birch Dr', 'Walnut Ct', 'Cherry Way'];
  const cities = ['Austin', 'Denver', 'Portland', 'Nashville', 'Raleigh', 'Boise', 'Tampa', 'Charlotte'];
  const states = ['TX', 'CO', 'OR', 'TN', 'NC', 'ID', 'FL', 'NC'];
  const i = Math.floor(Math.random() * streets.length);
  return {
    address: `${100 + Math.floor(Math.random() * 900)} ${streets[i]}`,
    city: cities[i],
    state: states[i],
    zip: String(10000 + Math.floor(Math.random() * 90000)),
  };
}

async function seedListings(userId, count = 20) {
  console.log(`Seeding ${count} listings...`);
  const statuses = ['draft', 'preparing', 'prepared', 'active', 'active', 'active', 'sold', 'archived'];
  const types = ['Residential', 'Condo', 'Townhouse', 'Single Family'];
  const listings = [];

  for (let i = 0; i < count; i++) {
    const addr = randomAddress();
    listings.push({
      user_id: userId,
      ...addr,
      price: 200000 + Math.floor(Math.random() * 800000),
      bedrooms: 2 + Math.floor(Math.random() * 4),
      bathrooms: 1 + Math.floor(Math.random() * 3),
      sqft: 1000 + Math.floor(Math.random() * 3000),
      year_built: 1960 + Math.floor(Math.random() * 65),
      description: `Beautiful ${types[i % types.length]} in ${addr.city}. Features updated kitchen, hardwood floors, and spacious backyard.`,
      property_type: types[i % types.length],
      status: statuses[i % statuses.length],
      preparation_status: statuses[i % statuses.length] === 'active' ? 'prepared' : 'pending',
    });
  }

  const { data, error } = await supabase.from('listings').insert(listings).select('id');
  if (error) {
    console.error('Failed to seed listings:', error.message);
    return [];
  }
  console.log(`Seeded ${data.length} listings.`);
  return data.map((l) => l.id);
}

async function seedLeads(userId, count = 50) {
  console.log(`Seeding ${count} leads...`);
  const stages = ['new', 'contacted', 'qualified', 'touring', 'offer', 'closed', 'lost'];
  const firstNames = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const leads = [];

  for (let i = 0; i < count; i++) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    leads.push({
      user_id: userId,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      phone: `555-${String(1000 + i).padStart(4, '0')}`,
      stage: stages[i % stages.length],
      score: Math.floor(Math.random() * 100),
      source: ['website', 'referral', 'zillow', 'realtor.com', 'open_house'][i % 5],
    });
  }

  const { error } = await supabase.from('property_leads').insert(leads);
  if (error) {
    console.error('Failed to seed leads:', error.message);
  } else {
    console.log(`Seeded ${count} leads.`);
  }
}

async function seedPublishedPosts(userId, count = 30) {
  console.log(`Seeding ${count} published posts...`);
  const platforms = ['facebook', 'instagram', 'linkedin', 'tiktok'];
  const posts = [];

  for (let i = 0; i < count; i++) {
    posts.push({
      user_id: userId,
      platform: platforms[i % platforms.length],
      content: `Check out this stunning property! #realestate #listing${i}`,
      post_id: `post-${Date.now()}-${i}`,
      post_url: `https://example.com/post/${i}`,
      published_at: new Date(Date.now() - i * 86400000).toISOString(),
      likes: Math.floor(Math.random() * 200),
      comments: Math.floor(Math.random() * 30),
      shares: Math.floor(Math.random() * 50),
      impressions: Math.floor(Math.random() * 5000),
      reach: Math.floor(Math.random() * 3000),
      engagement_rate: Math.random() * 10,
    });
  }

  const { error } = await supabase.from('published_posts').insert(posts);
  if (error) {
    console.error('Failed to seed posts:', error.message);
  } else {
    console.log(`Seeded ${count} published posts.`);
  }
}

async function main() {
  console.log('=== SnapR Staging Data Seeder ===\n');

  const userId = await getOrCreateStagingUser();
  await cleanOldData(userId);

  const listingIds = await seedListings(userId, 20);
  await seedLeads(userId, 50);
  await seedPublishedPosts(userId, 30);

  console.log(`\n=== Staging seed complete ===`);
  console.log(`User: ${STAGING_EMAIL}`);
  console.log(`Listings: ${listingIds.length}`);
  console.log(`Leads: 50`);
  console.log(`Published posts: 30`);
}

main().catch(console.error);
