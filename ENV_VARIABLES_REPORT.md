# ENVIRONMENT VARIABLES REPORT
**Search Results for: SUPABASE, CLOUDINARY, RUNWARE, OPENAI, CLOUDFLARE**

---

## 📄 env.template

All variables are **EMPTY** (no values set):

```bash
NEXT_PUBLIC_API_URL=

CLOUDFLARE_WORKER_URL=

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

CLOUDFLARE_ACCOUNT_ID=

CLOUDFLARE_API_TOKEN=

CLOUDFLARE_R2_BUCKET=

CLOUDFLARE_R2_PUBLIC_URL=

NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

OPENAI_API_KEY=

RUNWARE_API_KEY=

REPLICATE_API_TOKEN=
```

---

## 📄 .env Files

**Status:** No `.env`, `.env.local`, or `.env.dev` files found in project.

---

## 📄 lib/supabase.ts

**Variables Used (from process.env):**
- `NEXT_PUBLIC_SUPABASE_URL` - **No value** (used with `!` assertion)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - **No value** (used with `!` assertion)
- `SUPABASE_SERVICE_ROLE_KEY` - **No value** (used with `!` assertion)

**Code:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

---

## 📄 lib/cloudflare.ts

**Variables Used (from process.env):**
- `CLOUDFLARE_ACCOUNT_ID` - **No value** (used with `!` assertion)
- `CLOUDFLARE_API_TOKEN` - **No value** (used with `!` assertion)
- `CLOUDFLARE_R2_BUCKET` - **No value** (used with `!` assertion)
- `CLOUDFLARE_R2_PUBLIC_URL` - **No value** (used with `!` assertion)

**Code:**
```typescript
export const CF = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
  r2Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
  r2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL!,
};
```

---

## 📄 lib/utils.ts

**Variables Used (from process.env):**
- `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL` - **No value** (optional, may be undefined)

**Code:**
```typescript
const publicUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;
```

---

## 📄 lib/api.ts

**Variables Used (from process.env):**
- `NEXT_PUBLIC_API_URL` - **No value** (defaults to `'/api'` if not set)

**Code:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
```

---

## 📄 app/api/upload/route.ts

**Variables Used (from process.env):**
- `CLOUDFLARE_WORKER_URL` - **No value** (required, returns error if missing)

**Code:**
```typescript
const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
if (!cloudflareWorkerUrl) {
  return NextResponse.json(
    { error: "CLOUDFLARE_WORKER_URL not configured" },
    { status: 500 }
  );
}
```

---

## 📄 next.config.mjs

**Status:** No environment variables referenced in this file.

---

## 📄 job-status-worker/wrangler.toml

**Variables (All set to placeholders "YOUR_VALUE"):**

```toml
[vars]
SUPABASE_URL = "YOUR_VALUE"
SUPABASE_SERVICE_KEY = "YOUR_VALUE"
OPENAI_API_KEY = "YOUR_VALUE"
RUNWARE_API_KEY = "YOUR_VALUE"
CLOUDINARY_CLOUD_NAME = "YOUR_VALUE"
CLOUDINARY_API_KEY = "YOUR_VALUE"
CLOUDINARY_API_SECRET = "YOUR_VALUE"
CLOUDFLARE_R2_PUBLIC_URL = "YOUR_VALUE"
```

**Note:** These are placeholders and need to be replaced with actual values.

---

## 📄 upload-worker/wrangler.toml

**Variables (All set to placeholders "YOUR_VALUE"):**

```toml
[vars]
SUPABASE_URL = "YOUR_VALUE"
SUPABASE_SERVICE_KEY = "YOUR_VALUE"
OPENAI_API_KEY = "YOUR_VALUE"
RUNWARE_API_KEY = "YOUR_VALUE"
CLOUDINARY_CLOUD_NAME = "YOUR_VALUE"
CLOUDINARY_API_KEY = "YOUR_VALUE"
CLOUDINARY_API_SECRET = "YOUR_VALUE"
```

**Note:** These are placeholders and need to be replaced with actual values.

---

## 📄 job-status-worker/worker-configuration.d.ts

**Variables (Type definitions with placeholder strings):**

```typescript
interface Env {
  SUPABASE_URL: "${NEXT_PUBLIC_SUPABASE_URL}";
  SUPABASE_SERVICE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}";
  CLOUDINARY_CLOUD_NAME: "${CLOUDINARY_CLOUD_NAME}";
  CLOUDINARY_API_KEY: "${CLOUDINARY_API_KEY}";
  CLOUDINARY_API_SECRET: "${CLOUDINARY_API_SECRET}";
  RUNWARE_API_KEY: "${RUNWARE_API_KEY}";
  R2: R2Bucket;
}
```

**Note:** These are TypeScript type definitions with placeholder strings (not actual values).

---

## 📄 upload-worker/worker-configuration.d.ts

**Variables (Type definitions with placeholder strings):**

```typescript
interface Env {
  SUPABASE_URL: "${NEXT_PUBLIC_SUPABASE_URL}";
  SUPABASE_SERVICE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}";
  R2_BUCKET: "${CLOUDFLARE_R2_BUCKET}";
  CLOUDINARY_CLOUD_NAME: "${CLOUDINARY_CLOUD_NAME}";
  CLOUDINARY_API_KEY: "${CLOUDINARY_API_KEY}";
  CLOUDINARY_API_SECRET: "${CLOUDINARY_API_SECRET}";
  OPENAI_API_KEY: "${OPENAI_API_KEY}";
  RUNWARE_API_KEY: "${RUNWARE_API_KEY}";
  R2: R2Bucket;
  JOB_QUEUE: Queue;
}
```

**Note:** These are TypeScript type definitions with placeholder strings (not actual values).

---

## 📊 SUMMARY

### **Variables Found (No Actual Values):**

#### **Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Empty in env.template
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Empty in env.template
- `SUPABASE_SERVICE_ROLE_KEY` - Empty in env.template
- `SUPABASE_URL` - Placeholder "YOUR_VALUE" in wrangler.toml files
- `SUPABASE_SERVICE_KEY` - Placeholder "YOUR_VALUE" in wrangler.toml files

#### **Cloudinary:**
- `CLOUDINARY_CLOUD_NAME` - Empty in env.template, placeholder in wrangler.toml
- `CLOUDINARY_API_KEY` - Empty in env.template, placeholder in wrangler.toml
- `CLOUDINARY_API_SECRET` - Empty in env.template, placeholder in wrangler.toml

#### **RunWare:**
- `RUNWARE_API_KEY` - Empty in env.template, placeholder in wrangler.toml

#### **OpenAI:**
- `OPENAI_API_KEY` - Empty in env.template, placeholder in wrangler.toml

#### **Cloudflare:**
- `CLOUDFLARE_WORKER_URL` - Empty in env.template
- `CLOUDFLARE_ACCOUNT_ID` - Empty in env.template
- `CLOUDFLARE_API_TOKEN` - Empty in env.template
- `CLOUDFLARE_R2_BUCKET` - Empty in env.template
- `CLOUDFLARE_R2_PUBLIC_URL` - Empty in env.template
- `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL` - Empty in env.template
- `CLOUDFLARE_R2_PUBLIC_URL` - Placeholder "YOUR_VALUE" in job-status-worker/wrangler.toml

#### **Other:**
- `NEXT_PUBLIC_API_URL` - Empty in env.template (optional, defaults to '/api')
- `REPLICATE_API_TOKEN` - Empty in env.template

---

## ⚠️ **FINDINGS:**

1. **No Actual Values Found** - All environment variables are either:
   - Empty in `env.template`
   - Set to placeholder `"YOUR_VALUE"` in wrangler.toml files
   - Referenced in code but not defined anywhere

2. **Missing .env Files** - No `.env`, `.env.local`, or `.env.dev` files exist (expected for security)

3. **Placeholder Values** - All wrangler.toml files use `"YOUR_VALUE"` placeholders that must be replaced

4. **Type Definitions** - worker-configuration.d.ts files contain placeholder strings in type definitions (not actual runtime values)

5. **Required Variables Not Set:**
   - `CLOUDFLARE_WORKER_URL` - Required by `/app/api/upload/route.ts`
   - All Supabase variables - Required by `lib/supabase.ts`
   - All Cloudflare variables - Required by `lib/cloudflare.ts`

---

## 📝 **RECOMMENDATIONS:**

1. Create a `.env.local` file (gitignored) with actual values for development
2. Replace all `"YOUR_VALUE"` placeholders in wrangler.toml files with actual values
3. Set up environment variables in your deployment platform (Vercel, Cloudflare, etc.)
4. Ensure `CLOUDFLARE_WORKER_URL` is added to env.template for documentation

---

**Report Generated:** December 2024
**Status:** ⚠️ **NO ACTUAL VALUES FOUND** - All variables are empty or placeholders

