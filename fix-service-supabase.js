#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/organization/route.ts',
  'app/api/staging/route.ts',
  'app/api/cma/route.ts',
  'app/api/admin/contacts/update-status/route.ts',
  'app/api/admin/users/export/route.ts',
];

filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Pattern 1: const serviceSupabase = createServiceClient(...)
  const servicePattern = /const serviceSupabase = createServiceClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\);/gs;
  
  const serviceReplacement = `function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}`;
  
  content = content.replace(servicePattern, serviceReplacement);
  
  // Pattern 2: const supabase = createClient(...) - direct supabase-js
  const supabasePattern = /const supabase = createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\);/gs;
  
  const supabaseReplacement = `function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}`;
  
  content = content.replace(supabasePattern, supabaseReplacement);
  
  // Replace serviceSupabase. with getServiceSupabase().
  content = content.replace(/serviceSupabase\./g, 'getServiceSupabase().');
  content = content.replace(/await serviceSupabase\b/g, 'await getServiceSupabase()');
  
  // Replace standalone supabase. calls (but not getSupabase or createClient)
  // Only if we converted it above
  if (content.includes('function getSupabase()')) {
    content = content.replace(/([^a-zA-Z])supabase\./g, '$1getSupabase().');
    content = content.replace(/^supabase\./gm, 'getSupabase().');
    content = content.replace(/await supabase\b(?!\.auth)/g, 'await getSupabase()');
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fixed: ${file}`);
});

console.log('\n🎉 All files fixed! Run npm run build to verify.');
