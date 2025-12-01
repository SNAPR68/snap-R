# SnapR AI Pipeline - Production Model Reference

## Verified Models (All from Official Replicate Documentation)

### 1. SKY REPLACEMENT
**Model:** `bria/generate-background`
- **Why:** Official Replicate model, trained on licensed data, commercial-safe
- **How it works:** Automatically detects foreground (house), generates new background (sky) from text prompt
- **No mask needed** - the model handles foreground/background separation automatically
- **Source:** https://replicate.com/bria/generate-background

### 2. VIRTUAL TWILIGHT
**Model:** `google/nano-banana`
- **Why:** Replicate's featured instruction-based editor, Gemini 2.5 powered, excellent prompt following
- **How it works:** Natural language instructions: "Transform to twilight, add window glow"
- **Source:** https://replicate.com/google/nano-banana
- **Replicate blog quote:** "Nano-banana could truly be the end of Photoshop"

### 3. LAWN REPAIR
**Model:** `google/nano-banana`
- **Why:** Instruction-based editing is perfect for "make grass greener" type requests
- **How it works:** "Transform brown grass to lush green lawn"

### 4. DECLUTTER
**Model:** `google/nano-banana` (auto) or `bria/eraser` (with mask)
- **Auto mode:** Instruction-based: "Remove clutter from room"
- **With mask:** User draws on objects to remove, bria/eraser fills naturally
- **bria/eraser:** SOTA object removal, commercial-safe
- **Source:** https://replicate.com/bria/eraser

### 5. HDR ENHANCEMENT
**Model:** `google/nano-banana`
- **Why:** Instruction-based lighting adjustments work well for HDR
- **How it works:** "Brighten shadows, balance highlights, enhance colors"

### 6. VIRTUAL STAGING
**Model:** `google/nano-banana` (auto) or `bria/genfill` (with mask)
- **Auto mode:** Instruction-based: "Add modern furniture to this living room"
- **With mask:** User draws area, bria/genfill adds furniture to that region
- **bria/genfill:** Context-aware inpainting, commercial-safe
- **Source:** https://replicate.com/bria/genfill

### 7. UPSCALE
**Model:** `nightmareai/real-esrgan`
- **Why:** Battle-tested, fast, reliable, widely used
- **Supports:** Up to 4x scaling
- **Source:** https://replicate.com/nightmareai/real-esrgan

---

## Model Comparison (From Replicate's Official Blog)

Based on https://replicate.com/blog/compare-image-editing-models:

| Task | Best Models |
|------|-------------|
| Object Removal | SeedEdit 3.0, Qwen Image Edit |
| Background Editing | SeedEdit 3.0, Seedream 4 (ByteDance) |
| Text Editing | FLUX.1 Kontext Pro, Nano Banana |
| Style Transfer | Nano Banana, Seedream 4 |
| Perspective Changes | GPT Image 1, Qwen Image Edit |

**For Real Estate (Background/Sky):** Bria models are specifically designed for commercial use with licensed training data.

---

## Why These Models?

### bria/generate-background
- **Official model** with green tag on Replicate
- **Commercial-safe** - trained exclusively on licensed data
- **Automatic foreground detection** - no need for manual masking
- **Purpose-built** for background replacement

### google/nano-banana
- **Featured by Replicate** as top instruction-based editor
- **Multi-image input** support
- **Fast** - designed for quick edits
- **Excellent prompt following** from Gemini 2.5

### bria/eraser & bria/genfill
- **SOTA object removal/addition**
- **Commercial-safe** - licensed training data
- **Preserves original resolution**
- **Pixel-perfect** preservation of unedited areas

### nightmareai/real-esrgan
- **Industry standard** for upscaling
- **Fast and reliable**
- **Supports faces** with face_enhance option

---

## API Examples

### Sky Replacement
```typescript
await replicate.run('bria/generate-background', {
  input: {
    image: imageUrl,
    prompt: 'beautiful clear blue sky with white clouds',
    refine_prompt: true,
  },
});
```

### Instruction-Based Edit
```typescript
await replicate.run('google/nano-banana', {
  input: {
    image: imageUrl,
    prompt: 'Transform to twilight scene with warm window lights',
  },
});
```

### Object Removal (with mask)
```typescript
await replicate.run('bria/eraser', {
  input: {
    image: imageUrl,
    mask: maskUrl, // white = remove, black = keep
  },
});
```

### Upscale
```typescript
await replicate.run('nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa', {
  input: {
    image: imageUrl,
    scale: 2,
    face_enhance: false,
  },
});
```

---

## Pricing (Approximate)

| Model | Cost per Image |
|-------|---------------|
| bria/generate-background | ~$0.02-0.03 |
| google/nano-banana | ~$0.01-0.02 |
| bria/eraser | ~$0.02 |
| bria/genfill | ~$0.02-0.03 |
| real-esrgan | ~$0.01 |

---

## Files to Replace

1. **`lib/ai/providers/replicate.ts`** - Main provider with all model implementations
2. **`lib/ai/providers/router.ts`** - Router that maps tools to models

---

## Key Differences from Previous Attempts

| Previous | Now |
|----------|-----|
| Flux Kontext Dev (hallucinated) | bria/generate-background (purpose-built) |
| Grounded SAM (404 errors) | No segmentation needed - bria handles it |
| SDXL Inpainting (wrong masks) | google/nano-banana (instruction-based) |
| Runware (aspect ratio issues) | Not used - Replicate only |
| Complex mask pipelines | Simple: auto-detect or instruction-based |

---

## Testing Checklist

- [ ] Sky Replacement - sunny
- [ ] Sky Replacement - sunset
- [ ] Sky Replacement - dramatic
- [ ] Sky Replacement - cloudy
- [ ] Virtual Twilight
- [ ] Lawn Repair
- [ ] Declutter (auto)
- [ ] HDR Enhancement
- [ ] Virtual Staging (living room, modern)
- [ ] Upscale 2x

