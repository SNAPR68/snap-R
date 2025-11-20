# Production Launch Checklist for snap-r.com

## ✅ Completed Setup

### 1. Global Metadata
- ✅ Updated `app/layout.tsx` with comprehensive metadata
- ✅ Added OpenGraph tags
- ✅ Added Twitter card metadata
- ✅ Added theme color and icons
- ✅ Set metadataBase to https://snap-r.com

### 2. Public Files Created
- ✅ `public/manifest.json` - PWA manifest
- ✅ `public/robots.txt` - Search engine directives
- ✅ `public/favicon.ico` - Placeholder (needs actual icon)
- ✅ `public/apple-touch-icon.png` - Placeholder (needs actual icon)
- ✅ `public/og-image.jpg` - Placeholder (needs actual 1200x630 image)

### 3. Sitemap
- ✅ Created `app/sitemap.ts` with all main routes

### 4. Environment Variables
All environment variables are properly referenced:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- ✅ `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_JWT_SECRET`

## ⚠️ Remaining Tasks

### 1. Replace Placeholder Images
The following files are placeholders and need actual images:
- `public/favicon.ico` - Create 48x48 favicon
- `public/apple-touch-icon.png` - Create 180x180 PNG icon
- `public/og-image.jpg` - Create 1200x630 Open Graph image

### 2. Environment Variables in Production
Ensure these are set in your deployment platform (Vercel/Cloudflare):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_SITE_URL=https://snap-r.com
```

### 3. Domain Configuration
- Configure DNS to point snap-r.com to your hosting provider
- Set up SSL certificate
- Configure custom domain in hosting platform

### 4. Per-Page Canonical URLs (Optional)
For better SEO, consider adding canonical URLs to individual pages:
```typescript
export const metadata = {
  alternates: {
    canonical: 'https://snap-r.com/your-page'
  }
}
```

### 5. Testing Checklist
- [ ] Test all pages load correctly
- [ ] Verify metadata appears in social media previews
- [ ] Test PWA installation
- [ ] Verify sitemap.xml is accessible
- [ ] Test robots.txt
- [ ] Verify all environment variables work in production
- [ ] Test authentication flow
- [ ] Test upload functionality
- [ ] Verify Cloudinary integration

## Files Created
1. `public/manifest.json`
2. `public/robots.txt`
3. `public/favicon.ico` (placeholder)
4. `public/apple-touch-icon.png` (placeholder)
5. `public/og-image.jpg` (placeholder)
6. `app/sitemap.ts`
7. `LAUNCH_CHECKLIST.md` (this file)

## Files Modified
1. `app/layout.tsx` - Added comprehensive metadata

