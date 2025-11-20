# SnapR Branding Assets Generation Guide

## Source Logo
The source logo file is located at: `/public/snapr-logo.png`

## Required Assets

Generate the following assets from `/public/snapr-logo.png`:

### 1. Favicon Files
- **`/public/favicon.ico`** - 32x32 or 48x48 ICO format
- **`/public/favicon.png`** - 32x32 PNG format

### 2. Apple Touch Icon
- **`/public/apple-touch-icon.png`** - 180x180 PNG format

### 3. PWA Icons
- **`/public/icon-192.png`** - 192x192 PNG format
- **`/public/icon-512.png`** - 512x512 PNG format

### 4. Open Graph Image
- **`/public/og-image.png`** - 1200x630 PNG format (recommended for social sharing)

## Generation Instructions

### Using ImageMagick (Command Line)
```bash
# Navigate to public directory
cd public

# Generate favicon.ico (requires ImageMagick with ICO support)
convert snapr-logo.png -resize 48x48 favicon.ico

# Generate favicon.png
convert snapr-logo.png -resize 32x32 favicon.png

# Generate apple-touch-icon.png
convert snapr-logo.png -resize 180x180 apple-touch-icon.png

# Generate PWA icons
convert snapr-logo.png -resize 192x192 icon-192.png
convert snapr-logo.png -resize 512x512 icon-512.png

# Generate OG image (create a branded image with logo + text)
convert snapr-logo.png -resize 1200x630 -gravity center -extent 1200x630 -background white og-image.png
```

### Using Online Tools
1. **Favicon Generator**: https://realfavicongenerator.net/
   - Upload `snapr-logo.png`
   - Generate all required sizes
   - Download and place in `/public`

2. **PWA Icon Generator**: https://www.pwabuilder.com/imageGenerator
   - Upload `snapr-logo.png`
   - Generate 192x192 and 512x512 icons

3. **OG Image Generator**: https://www.opengraph.xyz/
   - Create a 1200x630 image with SnapR branding
   - Include logo and tagline: "SnapR – AI Enhanced Realty"

### Using Design Tools (Figma/Photoshop)
1. Open `snapr-logo.png`
2. Export each size:
   - 32x32 → `favicon.png`
   - 48x48 → `favicon.ico` (convert PNG to ICO)
   - 180x180 → `apple-touch-icon.png`
   - 192x192 → `icon-192.png`
   - 512x512 → `icon-512.png`
   - 1200x630 → `og-image.png` (create branded composition)

## Verification Checklist
- [ ] All files exist in `/public` directory
- [ ] `favicon.ico` displays correctly in browser tab
- [ ] `apple-touch-icon.png` works on iOS devices
- [ ] PWA icons (`icon-192.png`, `icon-512.png`) are properly sized
- [ ] `og-image.png` displays correctly when sharing on social media
- [ ] All images maintain logo quality and aspect ratio

## Notes
- Ensure all generated assets maintain the logo's visual quality
- Use transparent backgrounds where appropriate
- For `og-image.png`, consider adding text overlay: "SnapR – AI Enhanced Realty"
- Test all icons in their respective contexts (browser, mobile, PWA)

