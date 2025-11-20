const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const wranglerPath = path.join(__dirname, 'wrangler.toml');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

// Parse .env.local file
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envVars[key] = value;
    }
  }
});

// Variables to inject
const varsToInject = {
  'OPENAI_API_KEY': envVars.OPENAI_API_KEY,
  'REPLICATE_API_KEY': envVars.REPLICATE_API_KEY || envVars.REPLICATE_API_TOKEN,
  'RUNWARE_API_KEY': envVars.RUNWARE_API_KEY,
  'SUPABASE_URL': envVars.SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL,
  'SUPABASE_SERVICE_KEY': envVars.SUPABASE_SERVICE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY
};

// Read wrangler.toml
if (!fs.existsSync(wranglerPath)) {
  console.error('❌ wrangler.toml file not found');
  process.exit(1);
}

let wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');

// Replace empty values in [vars] section
Object.keys(varsToInject).forEach(key => {
  const value = varsToInject[key];
  if (value) {
    // Replace empty value: KEY = "" with KEY = "value"
    const emptyPattern = new RegExp(`(${key}\\s*=\\s*)"[^"]*"`, 'g');
    wranglerContent = wranglerContent.replace(emptyPattern, `$1"${value}"`);
  }
});

// Write updated wrangler.toml
fs.writeFileSync(wranglerPath, wranglerContent, 'utf-8');

console.log('✔ Environment secrets injected into wrangler.toml');

