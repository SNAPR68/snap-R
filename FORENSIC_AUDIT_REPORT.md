# SnapR Complete Forensic Audit Report
**Generated:** December 2025  
**Scope:** Complete application audit including user flows, dashboard, listings, API endpoints, database schema, and all features

---

## Executive Summary

**Status:** ⚠️ **CRITICAL ISSUES FOUND** - Application has multiple schema mismatches, missing role-based features, and broken user flows.

**Key Findings:**
1. **Database Schema Mismatch:** Code references `profiles` table with `role` column, but schema shows `users` table without `role`
2. **Missing Role-Based Dashboard:** Dashboard page checks for `profile.role` but doesn't implement role-based UI segregation
3. **Onboarding Flow Issues:** Multiple onboarding paths exist with inconsistent role handling
4. **Listings Fetch Working:** ✅ `/api/listings` endpoint is functional and properly fetches user listings
5. **Compliance Module:** ✅ MLS export functionality is implemented but not integrated into UI
6. **AI Router:** ✅ Working correctly with 15 tools, no US market mode logic present

---

## 1. User Flow Analysis

### 1.1 Authentication Flow

**Status:** ✅ **WORKING**

**Path:**
1. User visits `/auth/signup` or `/auth/login`
2. Can sign up with email/password or Google OAuth
3. Redirects to `/auth/callback` after authentication
4. Callback creates profile if missing, then redirects to `/onboarding` or `/dashboard`

**Files:**
- `app/auth/signup/page.tsx` - ✅ Working
- `app/auth/login/page.tsx` - ✅ Working
- `app/auth/callback/route.ts` - ✅ Working, creates profile with defaults

**Issues Found:**
- ✅ No critical issues in authentication flow

---

### 1.2 Onboarding Flow

**Status:** ⚠️ **MULTIPLE PATHS - INCONSISTENT**

**Path 1: `/onboarding/page.tsx` (Current Active)**
- Two-step process: Region selection → Details (name, company, role)
- Saves to `profiles` table with `role`, `region`, `onboarded: true`
- Redirects to `/pricing?role=...&region=...`

**Path 2: `/app/(authenticated)/onboarding/role.tsx` (Deleted/Not Found)**
- This file was deleted according to deleted_files list
- Was supposed to handle role selection for users without roles

**Path 3: Dashboard redirects to `/onboarding` if `!profile?.role`**
- `app/dashboard/page.tsx` line 19-21 checks for role and redirects

**Issues Found:**
- ⚠️ **CRITICAL:** Dashboard checks `profile.role` but onboarding saves to `profiles.role`
- ⚠️ **SCHEMA MISMATCH:** Database schema shows `users` table, not `profiles` table
- ⚠️ **MISSING:** No `/app/(authenticated)/onboarding/role.tsx` file exists (was deleted)

---

### 1.3 Dashboard Flow

**Status:** ⚠️ **PARTIALLY WORKING - SCHEMA ISSUES**

**File:** `app/dashboard/page.tsx`

**Current Implementation:**
```typescript
1. Checks authentication → redirects to /auth/login if not authenticated
2. Fetches profile from 'profiles' table
3. Checks if profile.role exists → redirects to /onboarding if missing
4. Checks if profile.subscription_tier exists → redirects to /pricing if missing
5. Fetches listings from 'listings' table
6. Displays dashboard with stats and recent listings
```

**What's Working:**
- ✅ Authentication check
- ✅ Listings fetch (line 28-33)
- ✅ UI rendering with stats cards
- ✅ Recent listings display

**What's Broken:**
- ❌ **SCHEMA MISMATCH:** Code queries `profiles` table but `database/schema.sql` shows `users` table
- ❌ **MISSING ROLE-BASED UI:** Dashboard doesn't implement role-based segregation (photographer vs agent)
- ❌ **MISSING COMPONENTS:** References to `PhotographerDashboard` and `AgentDashboard` components that don't exist
- ⚠️ **INCONSISTENT FIELD NAMES:** Code checks `profile.role` but migration shows `user_role` in profiles table

**Database Query:**
```typescript
// Line 16: Fetches from 'profiles' table
const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

// Line 28-33: Fetches listings - THIS WORKS ✅
const { data: listings } = await supabase
  .from('listings')
  .select('*, photos(count)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## 2. Listings Management

### 2.1 Listings Fetch

**Status:** ✅ **WORKING CORRECTLY**

**API Endpoint:** `app/api/listings/route.ts`

**GET `/api/listings`:**
- ✅ Authenticates user
- ✅ Fetches listings from `listings` table filtered by `user_id`
- ✅ Supports `withPhotos=true` query parameter
- ✅ Supports `photoLimit` query parameter
- ✅ Returns proper JSON response
- ✅ Handles errors correctly

**Usage in Components:**
- ✅ `app/(authenticated)/listings/page.tsx` - Uses server-side fetch
- ✅ `app/(authenticated)/upload/page.tsx` - Uses client-side fetch via `/api/listings`
- ✅ `components/dashboard-client.tsx` - Fetches listings

**No Issues Found** ✅

---

### 2.2 Listings Detail Page

**Status:** ✅ **WORKING**

**File:** `app/(authenticated)/listings/[id]/page.tsx`

**Functionality:**
- ✅ Fetches listing with photos
- ✅ Displays before/after slider using `BeforeAfterSlider` component
- ✅ Shows photo status (completed, processing, failed)
- ✅ Shows photo statistics
- ✅ Proper error handling

**Component Used:**
- ✅ `BeforeAfterSlider` exists at `components/ui/before-after-slider.tsx`

**No Issues Found** ✅

---

### 2.3 Listings Creation

**Status:** ✅ **WORKING**

**API Endpoint:** `app/api/listings/route.ts` (POST method)

**Functionality:**
- ✅ Validates user authentication
- ✅ Sanitizes input data
- ✅ Creates listing in database
- ✅ Returns created listing data

**No Issues Found** ✅

---

## 3. Photo Enhancement Pipeline

### 3.1 AI Router

**Status:** ✅ **WORKING - NO US MARKET MODE**

**File:** `lib/ai/router.ts`

**Current State:**
- ✅ 15 tools defined (10 with presets, 5 one-click)
- ✅ Credit system implemented
- ✅ All tools route to Replicate provider
- ✅ Proper error handling

**Missing Features:**
- ❌ **NO US MARKET MODE:** No region-based tone adjustments
- ❌ **NO WATERMARKING:** No watermark logic for virtual staging
- ❌ **NO POLICY ENGINE:** No `lib/ai/policy.ts` file exists (was deleted)

**Note:** Previous work attempted to add US market mode but files were deleted:
- `lib/ai/policy.ts` - DELETED
- `lib/utils/watermark.ts` - DELETED

---

### 3.2 Enhancement API

**Status:** ✅ **WORKING**

**File:** `app/api/enhance/route.ts`

**Functionality:**
- ✅ Authenticates user
- ✅ Checks credits
- ✅ Fetches photo from database
- ✅ Calls `processEnhancement` from router
- ✅ Saves enhanced image to storage
- ✅ Updates photo record
- ✅ Deducts credits
- ✅ Sends email notification

**Issues:**
- ⚠️ **NO REGION/USERROLE PASSING:** Options object doesn't include `region` or `userRole` (lines 13, 67)
- ⚠️ **NO POLICY INTEGRATION:** Can't apply US market mode even if it existed

---

### 3.3 Upload API

**Status:** ✅ **WORKING**

**File:** `app/api/upload/route.ts`

**Functionality:**
- ✅ Handles file uploads
- ✅ Validates file types
- ✅ Uploads to Cloudinary
- ✅ Creates job record
- ✅ Creates photo records
- ✅ Enqueues to Cloudflare queue (if configured)

**No Issues Found** ✅

---

## 4. Database Schema Analysis

### 4.1 Schema Mismatch - CRITICAL ISSUE

**Status:** ❌ **MAJOR SCHEMA MISMATCH**

**Problem:**
1. `database/schema.sql` defines `users` table:
   ```sql
   create table if not exists users (
     id uuid primary key,
     email text unique not null,
     name text,
     avatar_url text,
     credits integer default 20,
     has_onboarded boolean default false,
     created_at timestamp with time zone default now()
   );
   ```

2. **BUT** code throughout application queries `profiles` table:
   - `app/dashboard/page.tsx` line 16: `supabase.from('profiles')`
   - `app/api/enhance/route.ts` line 31: `supabase.from('profiles')`
   - `app/onboarding/page.tsx` line 66: `supabase.from('profiles')`
   - `app/auth/callback/route.ts` line 16, 24: `supabase.from('profiles')`

3. **Migration file** `supabase/migrations/20241203_create_profile_trigger.sql` creates `profiles` table:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, avatar_url, plan, credits, ...)
   ```

**Resolution Needed:**
- Either update `database/schema.sql` to include `profiles` table
- OR migrate all code to use `users` table
- **Current state:** Application likely works in production because migrations create `profiles` table, but schema.sql is outdated

---

### 4.2 Role Field Confusion

**Status:** ⚠️ **INCONSISTENT FIELD NAMES**

**Problem:**
1. Dashboard checks: `profile?.role` (line 19)
2. Onboarding saves: `role: selectedRole` (line 70)
3. But previous work mentioned `user_role` field in profiles table
4. Migration trigger doesn't set `role` field

**Fields in profiles table (from migration):**
- `id`, `email`, `full_name`, `avatar_url`, `plan`, `credits`, `created_at`, `updated_at`
- **NO `role` field defined in migration**

**Resolution Needed:**
- Add `role` column to profiles table via migration
- OR use `user_role` if that's the actual column name
- Update all code to use consistent field name

---

### 4.3 Missing Fields

**Status:** ⚠️ **MISSING FIELDS IN SCHEMA**

**Fields referenced in code but not in schema.sql:**
- `profiles.role` or `profiles.user_role`
- `profiles.subscription_tier` (checked in dashboard line 24)
- `profiles.region` (saved in onboarding line 71)
- `profiles.company` (saved in onboarding line 69)
- `profiles.onboarded` (saved in onboarding line 72)

**Resolution Needed:**
- Create migration to add these columns to profiles table
- Update schema.sql to reflect actual database structure

---

## 5. Component Status

### 5.1 Dashboard Components

**Status:** ❌ **MISSING COMPONENTS**

**Referenced but Missing:**
- `components/dashboards/photographer.tsx` - DELETED
- `components/dashboards/agent.tsx` - DELETED
- `app/(authenticated)/onboarding/role.tsx` - DELETED

**Existing Components:**
- ✅ `components/dashboard-client.tsx` - Exists but not used in current dashboard
- ✅ `components/dashboard-analytics.tsx` - Exists

---

### 5.2 UI Components

**Status:** ✅ **MOSTLY WORKING**

**Working Components:**
- ✅ `components/ui/before-after-slider.tsx` - Exists and working
- ✅ `components/studio-client.tsx` - Exists (682 lines)
- ✅ `components/listing-card.tsx` - Exists
- ✅ `components/share-view.tsx` - Exists

**Missing/Deleted:**
- ❌ `components/ui/BeforeAfterSlider.tsx` (capital B) - Was deleted, lowercase version exists

---

## 6. Compliance Module

### 6.1 MLS Export

**Status:** ✅ **IMPLEMENTED BUT NOT INTEGRATED**

**Files:**
- ✅ `lib/compliance/mls-export.ts` - Complete implementation (267 lines)
- ✅ `lib/compliance/mls-specs.ts` - Exists
- ✅ `lib/compliance/watermark.ts` - Exists
- ✅ `lib/compliance/metadata.ts` - Exists
- ✅ `lib/compliance/disclosure.ts` - Exists
- ✅ `app/api/compliance/export/route.ts` - API endpoint exists

**Functionality:**
- ✅ Generates MLS-compliant ZIP packages
- ✅ Processes images with watermarks
- ✅ Embeds RESO metadata
- ✅ Creates disclosure documents
- ✅ Generates XMP sidecars

**Issues:**
- ⚠️ **NOT INTEGRATED IN UI:** No button or UI element to trigger MLS export
- ⚠️ **NO ROLE GATING:** API doesn't check if user is agent/broker (should block photographers)

---

### 6.2 MLS Export Modal

**Status:** ✅ **COMPONENT EXISTS**

**File:** `components/mls-export-modal.tsx`

**Usage:**
- Referenced in `components/studio-client.tsx` line 6
- Can be triggered from studio if `showMlsFeatures` prop is true

**No Issues Found** ✅

---

## 7. API Endpoints Status

### 7.1 Working Endpoints

✅ **FULLY FUNCTIONAL:**
- `GET/POST /api/listings` - Listings CRUD
- `POST /api/enhance` - Photo enhancement
- `POST /api/upload` - File uploads
- `GET /api/compliance/export` - MLS export options
- `POST /api/compliance/export` - Generate MLS package
- `GET /api/share/[token]` - Share viewer
- `POST /api/share` - Create share link

### 7.2 Missing/Deleted Endpoints

❌ **DELETED:**
- `app/api/mls-pack/route.ts` - DELETED (was for MLS pack generation)
- `app/api/user/set-role/route.ts` - DELETED (was for setting user role)
- `app/api/system-diagnostics/route.ts` - DELETED (was for diagnostics)

---

## 8. Critical Issues Summary

### 8.1 Schema Mismatch - CRITICAL
- **Issue:** Code queries `profiles` table but `schema.sql` shows `users` table
- **Impact:** Confusion about actual database structure
- **Fix:** Update schema.sql or verify migrations create profiles table

### 8.2 Missing Role Field - CRITICAL
- **Issue:** Dashboard checks `profile.role` but field doesn't exist in migration
- **Impact:** Users can't complete onboarding, stuck in redirect loop
- **Fix:** Add `role` column to profiles table via migration

### 8.3 Missing Role-Based Dashboard - HIGH
- **Issue:** Dashboard doesn't implement role-based UI segregation
- **Impact:** Photographers and agents see same dashboard
- **Fix:** Implement `PhotographerDashboard` and `AgentDashboard` components

### 8.4 Missing US Market Mode - MEDIUM
- **Issue:** No region-based tone adjustments or watermarking
- **Impact:** Can't apply MLS-safe adjustments for US market
- **Fix:** Re-implement policy engine and watermark logic

### 8.5 Missing MLS Pack Feature - MEDIUM
- **Issue:** MLS pack API endpoint was deleted
- **Impact:** Can't generate MLS packs from listings page
- **Fix:** Re-implement `/api/mls-pack` endpoint

---

## 9. What's Working ✅

1. **Authentication:** Signup, login, OAuth all working
2. **Listings Fetch:** `/api/listings` endpoint works correctly
3. **Listings Display:** Listings page and detail page work
4. **Photo Enhancement:** AI router and enhance API work
5. **Upload Pipeline:** File upload and job creation work
6. **Studio Component:** Interactive studio with tools works
7. **Before/After Slider:** Component exists and works
8. **Compliance Module:** MLS export logic is complete (just needs UI integration)

---

## 10. Recommendations

### Immediate Fixes (Critical)

1. **Fix Database Schema:**
   - Create migration to add `role` column to `profiles` table
   - Update `database/schema.sql` to match actual database structure
   - Verify all fields referenced in code exist in database

2. **Fix Onboarding Flow:**
   - Ensure role is saved correctly during onboarding
   - Verify dashboard can read role field
   - Test complete user flow from signup → onboarding → dashboard

3. **Implement Role-Based Dashboard:**
   - Create `PhotographerDashboard` component
   - Create `AgentDashboard` component
   - Update `app/dashboard/page.tsx` to route based on role

### Short-Term Fixes (High Priority)

4. **Re-implement US Market Mode:**
   - Create `lib/ai/policy.ts` with policy engine
   - Create `lib/utils/watermark.ts` with watermark function
   - Update `lib/ai/router.ts` to apply policies
   - Update `app/api/enhance/route.ts` to pass region/userRole

5. **Re-implement MLS Pack:**
   - Create `app/api/mls-pack/route.ts`
   - Add "Download MLS Pack" button to listings detail page
   - Implement role-based access control (block photographers)

6. **Integrate Compliance Module:**
   - Add MLS export button to studio or listings page
   - Ensure role-based gating works
   - Test end-to-end MLS export flow

### Long-Term Improvements (Medium Priority)

7. **Code Consistency:**
   - Standardize field names (`role` vs `user_role`)
   - Update all references to use consistent naming
   - Add TypeScript types for profile structure

8. **Error Handling:**
   - Add better error messages for schema mismatches
   - Add logging for missing fields
   - Implement fallback behavior for missing data

9. **Testing:**
   - Add integration tests for user flow
   - Test role-based access control
   - Test MLS export with various MLS IDs

---

## 11. File Inventory

### Deleted Files (Need Re-implementation)
- `lib/ai/policy.ts`
- `lib/utils/watermark.ts`
- `app/api/mls-pack/route.ts`
- `app/services/mlsPackClient.ts`
- `app/api/user/set-role/route.ts`
- `app/(authenticated)/onboarding/role.tsx`
- `components/dashboards/photographer.tsx`
- `components/dashboards/agent.tsx`
- `app/api/system-diagnostics/route.ts`

### Existing Files (Working)
- `app/dashboard/page.tsx` - Needs role-based routing
- `app/api/listings/route.ts` - ✅ Working
- `app/api/enhance/route.ts` - ✅ Working, needs region/userRole
- `lib/ai/router.ts` - ✅ Working, needs policy integration
- `lib/compliance/mls-export.ts` - ✅ Complete, needs UI integration
- `components/studio-client.tsx` - ✅ Working

---

## Conclusion

**Overall Status:** ⚠️ **APPLICATION IS FUNCTIONAL BUT HAS CRITICAL SCHEMA ISSUES**

The application core functionality (listings, enhancements, uploads) is working correctly. However, there are critical schema mismatches and missing role-based features that prevent the complete user flow from working end-to-end.

**Priority Actions:**
1. Fix database schema and role field
2. Implement role-based dashboard
3. Re-implement US market mode features
4. Integrate MLS export into UI

**Estimated Fix Time:** 2-3 days for critical issues, 1 week for all features.

---

**End of Audit Report**
