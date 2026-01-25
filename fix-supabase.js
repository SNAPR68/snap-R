#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/admin/contacts/update-status/route.ts',
  'app/api/admin/users/export/route.ts',
  'app/api/debug-share/route.ts',
  'app/api/social/facebook-deletion/route.ts',
  'app/api/social/callback/facebook/route.ts',
  'app/api/notify-approval/route.ts',
  'app/api/approve-photo/route.ts',
  'app/api/analytics/track/route.ts',
];

const oldPattern = `const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);`;

const newPattern = `function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}`;

filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace the module-level client with function
  content = content.replace(oldPattern, newPattern);
  
  // Replace all instances of 'supabase.' with 'getSupabase().'
  // But only for standalone supabase calls, not inside other words
  content = content.replace(/([^a-zA-Z])supabase\./g, '$1getSupabase().');
  content = content.replace(/^supabase\./gm, 'getSupabase().');
  
  // Also handle 'await supabase' patterns
  content = content.replace(/await supabase\b/g, 'await getSupabase()');
  
  // Handle 'const { data } = await supabase' patterns  
  content = content.replace(/= await getSupabase\(\)\./g, '= await getSupabase().');
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fixed: ${file}`);
});

console.log('\n🎉 All files fixed! Run npm run build to verify.');
