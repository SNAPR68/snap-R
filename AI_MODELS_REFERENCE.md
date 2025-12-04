# AI Models & Providers Reference

## Overview
This document lists all AI models, providers, tools, and routing logic used in SnapR.

---

## Provider Summary

| Provider | Purpose | Models Used | Status |
|----------|---------|-------------|--------|
| **Replicate** | Image enhancement & generation | 5 models | ✅ Active |
| **OpenAI** | Vision analysis & quality control | 2 models | ✅ Active |
| **Runware** | Image enhancement (alternative) | 1 model | ✅ Available |
| **AutoEnhance.ai** | Auto-enhancement service | API-based | ⚠️ Available but not routed |

---

## 1. REPLICATE Provider

**Location:** `lib/ai/providers/replicate.ts`  
**API Key:** `REPLICATE_API_TOKEN`

### Models Used:

#### 1.1 Flux Kontext (`black-forest-labs/flux-kontext-dev`)
- **Purpose:** Creative image editing and enhancement
- **Used by tools:**
  - `sky-replacement` - Replaces sky with different weather conditions
  - `virtual-twilight` - Transforms daytime to twilight/dusk
  - `lawn-repair` - Enhances grass/lawn areas
  - `hdr` - HDR-style exposure and color enhancement
  - `virtual-staging` - Adds furniture to empty rooms
  - `declutter` - Fallback method for removing clutter
- **Parameters:**
  - `guidance`: 3.5
  - `num_inference_steps`: 28
  - `aspect_ratio`: 'match_input_image'
  - `output_format`: 'jpg'
  - `output_quality`: 90
- **Timeout:** 120 seconds

#### 1.2 Grounded SAM (`schananas/grounded_sam`)
- **Purpose:** Semantic segmentation for object detection
- **Used by tool:** `declutter` (primary method)
- **Function:** Creates masks for clutter items
- **Parameters:**
  - `image`: Input image URL
  - `mask_prompt`: Text description of items to mask
- **Timeout:** 60 seconds

#### 1.3 SDXL Inpainting (`lucataco/sdxl-inpainting`)
- **Purpose:** Precise inpainting with masks
- **Used by tool:** `declutter` (primary method, step 2)
- **Function:** Removes masked objects and fills background
- **Parameters:**
  - `num_inference_steps`: 30
  - `guidance_scale`: 7.5
  - `strength`: 0.99
  - `scheduler`: 'K_EULER'
- **Timeout:** 120 seconds

#### 1.4 Real-ESRGAN (`nightmareai/real-esrgan`)
- **Purpose:** Image upscaling
- **Used by tool:** `upscale` (not in main router, but available)
- **Parameters:**
  - `scale`: 2-4 (max 4)
  - `face_enhance`: false
- **Timeout:** 180 seconds

---

## 2. OPENAI Provider

**Location:** `lib/ai/providers/openai-vision.ts`  
**API Key:** `OPENAI_API_KEY`

### Models Used:

#### 2.1 GPT-4o (Vision)
- **Purpose:** Image analysis and quality control
- **Used by:**
  - `analyzeImage()` - Analyzes real estate photos for enhancement recommendations
  - `scoreEnhancementQuality()` - Quality control scoring
- **Endpoints:**
  - `/api/analyze` - Main analysis endpoint
- **Parameters:**
  - `max_tokens`: 500 (analysis), 300 (quality scoring)
  - Vision capabilities: Image URL input via `image_url` content type
- **Analysis Output:**
  ```typescript
  {
    sky_replacement_needed: boolean;
    sky_condition: 'good' | 'overcast' | 'blown_out' | 'dull';
    lawn_repair_needed: boolean;
    lawn_condition: 'good' | 'brown' | 'patchy' | 'weeds';
    declutter_needed: boolean;
    declutter_items: string[];
    virtual_staging_candidate: boolean;
    room_type: string;
    lighting_issues: string[];
    perspective_correction_needed: boolean;
    day_to_dusk_candidate: boolean;
    overall_quality: number; // 1-10
    recommended_enhancements: string[];
  }
  ```

#### 2.2 GPT-4o-mini
- **Purpose:** General chat completions (via Cloudflare Workers)
- **Location:** `functions/api/openai/index.ts`
- **Default model** for chat completions
- **Parameters:**
  - `temperature`: 0.6 (default)
  - Configurable via request body

#### 2.3 GPT-4o-mini (Worker)
- **Purpose:** Image captioning and metadata generation
- **Location:** `src/workers/imageEnhanceWorker.js`
- **Used for:** Generating detailed descriptions of real estate photos
- **Input:** Base64 encoded images

---

## 3. RUNWARE Provider

**Location:** `lib/ai/providers/runware.ts`  
**API Key:** `RUNWARE_API_KEY`  
**API Endpoint:** `https://api.runware.ai/v1`

### Models Used:

#### 3.1 Runware Model (`runware:100@1`)
- **Default model:** `runware:100@1`
- **Purpose:** Image enhancement and inpainting
- **Used by:**
  - `runwareEnhance()` - General image enhancement
  - `runwareSkyReplacement()` - Multi-step sky replacement
- **Task Types:**
  - `imageInference` - Image-to-image generation
  - `imageUpload` - Image upload to Runware
  - `imageBackgroundRemoval` - Mask generation
- **Parameters:**
  - `steps`: 25
  - `CFGScale`: 7
  - `strength`: 0.7 (enhance), 0.85 (sky replacement)
  - `outputFormat`: 'JPEG'
- **Timeout:** 60 seconds
- **Status:** Available but not actively used in main router

---

## 4. AUTOENHANCE.AI Provider

**Location:** `lib/ai/providers/autoenhance.ts`  
**API Key:** `AUTOENHANCE_API_KEY`  
**API Endpoint:** `https://api.autoenhance.ai/v3/`

### Service Details:
- **Purpose:** Automated HDR and perspective correction
- **Method:** REST API with upload/poll workflow
- **Workflow:**
  1. Create image record via POST `/images`
  2. Upload image to S3 via presigned URL
  3. Poll GET `/images/{id}` until status is 'processed' or 'completed'
- **Timeout:** 60 seconds (max 20 polls × 3 seconds)
- **Status:** ⚠️ **Available but NOT routed in main router**
  - The `auto-enhance` tool currently routes to Replicate's `hdr` function instead
  - AutoEnhance provider exists but is not used in `processEnhancement()`

---

## Tool Routing Logic

**Location:** `lib/ai/router.ts`

### Available Tools (ToolId):

| Tool ID | Provider | Model/Function | Credits | Routing |
|---------|----------|----------------|---------|---------|
| `sky-replacement` | Replicate | Flux Kontext | 1 | ✅ Direct |
| `virtual-twilight` | Replicate | Flux Kontext | 2 | ✅ Direct |
| `lawn-repair` | Replicate | Flux Kontext | 1 | ✅ Direct |
| `declutter` | Replicate | Grounded SAM + SDXL Inpainting (primary)<br>Flux Kontext (fallback) | 2 | ✅ Two-step with fallback |
| `hdr` | Replicate | Flux Kontext | 1 | ✅ Direct |
| `virtual-staging` | Replicate | Flux Kontext | 3 | ✅ Direct |
| `auto-enhance` | Replicate | Flux Kontext (via `hdr`) | 1 | ⚠️ Routes to `hdr`, not AutoEnhance.ai |

### Routing Function: `processEnhancement()`

```typescript
export async function processEnhancement(
  toolId: ToolId,
  imageUrl: string,
  options: {
    skyType?: 'sunny' | 'sunset' | 'dramatic' | 'cloudy';
    roomType?: string;
    style?: string;
    scale?: number;
    maskUrl?: string;
  } = {},
): Promise<EnhancementResult>
```

### Routing Switch Statement:

```typescript
switch (toolId) {
  case 'sky-replacement':
    → skyReplacement(imageUrl, options.skyType || 'sunny')
    → Uses: Flux Kontext
    
  case 'virtual-twilight':
    → virtualTwilight(imageUrl)
    → Uses: Flux Kontext
    
  case 'lawn-repair':
    → lawnRepair(imageUrl)
    → Uses: Flux Kontext
    
  case 'declutter':
    → declutter(imageUrl)
    → Step 1: Grounded SAM (mask generation)
    → Step 2: SDXL Inpainting (removal)
    → Fallback: Flux Kontext (if mask fails)
    
  case 'hdr':
    → hdr(imageUrl)
    → Uses: Flux Kontext
    
  case 'virtual-staging':
    → virtualStaging(imageUrl, roomType, style)
    → Uses: Flux Kontext
    
  case 'auto-enhance':
    → hdr(imageUrl)  // ⚠️ Routes to HDR, not AutoEnhance.ai
    → Uses: Flux Kontext
    
  default:
    → Error: Unknown tool
}
```

---

## Tool Credits

**Location:** `lib/ai/router.ts` (TOOL_CREDITS)

| Tool | Credits |
|------|---------|
| `sky-replacement` | 1 |
| `virtual-twilight` | 2 |
| `lawn-repair` | 1 |
| `declutter` | 2 |
| `hdr` | 1 |
| `virtual-staging` | 3 |
| `auto-enhance` | 1 |

---

## API Endpoints

### Enhancement Endpoint
- **Route:** `/api/enhance`
- **Method:** POST
- **Body:**
  ```json
  {
    "imageId": "uuid",
    "toolId": "sky-replacement" | "virtual-twilight" | "lawn-repair" | "declutter" | "hdr" | "virtual-staging" | "auto-enhance",
    "options": {
      "skyType": "sunny" | "sunset" | "dramatic" | "cloudy",
      "roomType": "string",
      "style": "string"
    }
  }
  ```
- **Router:** Uses `processEnhancement()` from `lib/ai/router.ts`

### Analysis Endpoint
- **Route:** `/api/analyze`
- **Method:** POST
- **Body:**
  ```json
  {
    "imageUrl": "https://..."
  }
  ```
- **Provider:** OpenAI GPT-4o (Vision)
- **Function:** `analyzeImage()` from `lib/ai/providers/openai-vision.ts`

### OpenAI Proxy (Cloudflare Workers)
- **Route:** `/functions/api/openai`
- **Method:** POST
- **Model:** `gpt-4o-mini` (default, configurable)
- **Purpose:** General chat completions

---

## Provider Handle Summary

### Replicate
- **Handle:** `replicate`
- **Tools:** sky-replacement, virtual-twilight, lawn-repair, declutter, hdr, virtual-staging, auto-enhance (via hdr)
- **Models:**
  - `black-forest-labs/flux-kontext-dev`
  - `schananas/grounded_sam`
  - `lucataco/sdxl-inpainting`
  - `nightmareai/real-esrgan`

### OpenAI
- **Handle:** `openai`
- **Tools:** Image analysis, quality control, captioning
- **Models:**
  - `gpt-4o` (Vision)
  - `gpt-4o-mini` (Chat)

### Runware
- **Handle:** `runware`
- **Tools:** Available but not actively routed
- **Models:**
  - `runware:100@1`

### AutoEnhance
- **Handle:** `autoenhance`
- **Tools:** Available but not actively routed (auto-enhance uses Replicate instead)
- **Service:** REST API (no specific model name)

---

## Notes

1. **Auto-Enhance Discrepancy:** The `auto-enhance` tool is configured but routes to Replicate's HDR function instead of the AutoEnhance.ai provider. To use AutoEnhance.ai, the router would need to be updated.

2. **Runware Availability:** Runware provider is implemented but not used in the main enhancement router. It's available for future use or direct calls.

3. **Declutter Two-Step:** The declutter tool uses a sophisticated two-step process (mask + inpaint) with a fallback to instruction-based editing.

4. **All Enhancements via Replicate:** Currently, all active enhancement tools route through Replicate, primarily using Flux Kontext.

5. **OpenAI for Analysis Only:** OpenAI is used for image analysis and quality control, not for image generation/enhancement.

---

## Environment Variables Required

```bash
REPLICATE_API_TOKEN=...
OPENAI_API_KEY=...
RUNWARE_API_KEY=...
AUTOENHANCE_API_KEY=...
```

---

*Last updated: Based on codebase analysis*

