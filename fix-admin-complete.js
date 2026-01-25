#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();

// Step 1: Fix the admin.ts file
const adminFile = path.join(baseDir, 'lib/supabase/admin.ts');
const newAdminContent = `import { createClient } from '@supabase/supabase-js';

export function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
`;

fs.writeFileSync(adminFile, newAdminContent);
console.log('✅ Fixed: lib/supabase/admin.ts');

// Step 2: Update all files that use adminSupabase
const filesToUpdate = [
  'app/admin/contacts/page.tsx',
  'app/admin/logs/page.tsx',
  'app/admin/users/page.tsx',
  'app/admin/revenue/page.tsx',
  'app/admin/page.tsx',
  'app/admin/analytics/page.tsx',
  'app/api/user/delete-account/route.ts',
];

filesToUpdate.forEach(file => {
  const fullPath = path.join(baseDir, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace adminSupabase. with adminSupabase().
  // But be careful not to replace adminSupabase()
  content = content.replace(/adminSupabase\.from\(/g, 'adminSupabase().from(');
  content = content.replace(/adminSupabase\.storage/g, 'adminSupabase().storage');
  content = content.replace(/adminSupabase\.auth/g, 'adminSupabase().auth');
  content = content.replace(/adminSupabase\.rpc\(/g, 'adminSupabase().rpc(');
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Updated: ${file}`);
});

console.log('\n🎉 All adminSupabase usages fixed! Run npm run build to verify.');
