import { createClient } from "@supabase/supabase-js";
import { Env } from "../../backend/workers/types";
import { enhanceImagePipeline } from "../../pipelines/enhancement";

async function enhanceImageWithOpenAI(env, imageBytes) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));

  const prompt = `
You are an advanced real-estate photo enhancement system. 
Improve the image with the following transformations:
- HDR boost
- Exposure correction
- White balance fix
- Sharpening
- Noise reduction
- Straighten verticals
- Sky replacement if needed
- Remove clutter (wires, bottles, bins, random objects)
- Make the image look luxury, warm, bright, and magazine-quality
Return ONLY the enhanced image.

`;

  const resp = await env.OPENAI_API_KEY.images.generate({
    model: "gpt-image-1",
    prompt,
    image: base64,
    size: "2048x2048"
  });

  const enhancedBase64 = resp.data[0].b64_json;
  return Uint8Array.from(atob(enhancedBase64), c => c.charCodeAt(0));
}

async function enhanceWithRunware(env, imageBytes) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));
  
  const resp = await fetch("https://api.runware.ai/v1/clean", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RUNWARE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image: base64,
      mode: "real_estate_cleanup"
    })
  });

  const json = await resp.json();
  const enhancedBase64 = json.output;
  return Uint8Array.from(atob(enhancedBase64), c => c.charCodeAt(0));
}

/////////////////////////
// Image Utilities
/////////////////////////

const toBase64 = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)));

const fromBase64 = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function callOpenAIImageModel(env, prompt, imageBytes) {
  const base64 = toBase64(imageBytes);

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      image: base64,
      prompt,
      size: "2048x2048"
    })
  });

  const json = await response.json();

  if (!json.data || !json.data[0]?.b64_json) {
    throw new Error("Invalid OpenAI response");
  }

  return fromBase64(json.data[0].b64_json);
}

async function callRunWare(env, mode, imageBytes) {
  const base64 = toBase64(imageBytes);

  const response = await fetch("https://api.runware.ai/v1/clean", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RUNWARE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image: base64,
      mode
    })
  });

  const json = await response.json();

  if (!json.output) throw new Error("Invalid RunWare response");

  return fromBase64(json.output);
}

///////////////////////////////////////////
// SNAP-R MULTI-STAGE ENHANCEMENT MODULE //
///////////////////////////////////////////

// -------- Stage 1: Base Enhancement --------
async function enhanceBase(env, imageBytes) {
  const prompt = `
    You are a real estate photo enhancement engine.
    Apply the following improvements ONLY:
    - Correct white balance
    - Improve clarity and sharpness
    - Reduce noise
    - Fix lens distortion
    - Clean color cast
    - Improve exposure slightly
    DO NOT add fake objects, do not hallucinate.
  `;
  return await callOpenAIImageModel(env, prompt, imageBytes);
}

// -------- Stage 2: HDR / Tone Mapping --------
async function enhanceHDR(env, imageBytes) {
  const prompt = `
    Apply professional HDR processing:
    - Lift shadows without noise
    - Recover highlights
    - Balance dynamic range
    - Increase depth and richness
    - Maintain natural colors (no oversaturation)
    DO NOT distort architecture or hallucinate.
  `;
  return await callOpenAIImageModel(env, prompt, imageBytes);
}

// -------- Stage 3: Perspective Correction --------
async function correctPerspective(env, imageBytes) {
  const prompt = `
    Correct real estate vertical perspective:
    - Straighten vertical lines
    - Fix wide-angle distortion
    - Crop edges cleanly
    - Maintain aspect ratio
    DO NOT modify objects or lighting.
  `;
  return await callOpenAIImageModel(env, prompt, imageBytes);
}

// -------- Stage 4: Interior Cleanup (Declutter) --------
async function cleanInterior(env, imageBytes) {
  // RunWare does this BEST. Very clean output.
  return await callRunWare(env, "declutter", imageBytes);
}

// -------- Stage 5: Window Enhancement --------
async function enhanceWindows(env, imageBytes) {
  const prompt = `
    Identify window areas.
    Improve window visibility:
    - Pull highlights down
    - Bring out exterior detail
    - Remove glare and reflections
    - Balance exposure interior vs exterior
    DO NOT replace the exterior; preserve real details.
  `;
  return await callOpenAIImageModel(env, prompt, imageBytes);
}

// -------- Stage 6: Sky Replacement (Exterior only) --------
async function replaceSky(env, imageBytes) {
  const prompt = `
    If the image is an EXTERIOR photo:
    - Replace dull or blown-out sky with a natural blue sky.
    - Blend edges cleanly.
    - Avoid unrealistic lighting.
    If image is interior, do nothing—return same image.
  `;
  return await callOpenAIImageModel(env, prompt, imageBytes);
}

// -------- Stage 7: Luxury Color Grading --------
async function applyLuxuryGrade(env, imageBytes) {
  const prompt = `
    Apply luxury interior real estate grading:
    - Clean whites
    - Rich warm wood tones
    - Crisp shadows
    - Natural depth
    - Subtle contrast
    - Premium editorial look
    No artificial objects. No harsh saturation.
  `;
  return await callOpenAIImageModel(env, prompt, imageBytes);
}

///////////////////////////////
// FINAL PIPELINE INTEGRATION //
///////////////////////////////

async function processPhotoPipeline(env, key, r2) {
  console.log("📥 Fetching original:", key);

  // 1. Get original image from R2
  const obj = await env.R2.get(key);
  if (!obj) throw new Error("Original file missing in R2: " + key);
  let imageBytes = await obj.arrayBuffer();

  // ---- RUN FULL SNAP-R PIPELINE ----

  console.log("Stage 1: Base Enhancement...");
  imageBytes = await enhanceBase(env, imageBytes);

  console.log("Stage 2: HDR...");
  imageBytes = await enhanceHDR(env, imageBytes);

  console.log("Stage 3: Perspective Correction...");
  imageBytes = await correctPerspective(env, imageBytes);

  console.log("Stage 4: Interior Declutter...");
  imageBytes = await cleanInterior(env, imageBytes);

  console.log("Stage 5: Window Enhancement...");
  imageBytes = await enhanceWindows(env, imageBytes);

  console.log("Stage 6: Sky Replacement...");
  imageBytes = await replaceSky(env, imageBytes);

  console.log("Stage 7: Luxury Grading...");
  imageBytes = await applyLuxuryGrade(env, imageBytes);

  // ---- SAVE OUTPUT ----
  const outputKey = key.replace("raw/", "enhanced/");
  console.log("📤 Saving enhanced image:", outputKey);

  await env.R2.put(outputKey, imageBytes, {
    httpMetadata: { contentType: "image/jpeg" }
  });

  return outputKey;
}

// --------------------------
// QUEUE CONSUMER (MAIN LOOP)
// --------------------------

export default {
  async queue(batch, env) {
    try {
      for (const msg of batch.messages) {
        const { jobId, files } = msg.body;

        console.log("🚀 Processing job:", jobId);

        const enhancedFiles = [];

        for (const key of files) {
          const enhancedKey = await processPhotoPipeline(env, key);
          enhancedFiles.push(enhancedKey);
        }

        // Write enhanced results to Supabase
        console.log("📝 Updating Supabase...", jobId);

        const supabase = createClient(
          env.SUPABASE_URL,
          env.SUPABASE_SERVICE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Update job status → completed
        await supabase.from("jobs")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", jobId);

        // Insert each enhanced photo
        for (const key of enhancedFiles) {
          await supabase.from("photos").insert({
            job_id: jobId,
            enhanced_key: key,
            created_at: new Date().toISOString()
          });
        }

        console.log("✅ Job completed:", jobId);
      }
    } catch (err) {
      console.error("❌ Pipeline error:", err);
    }
  }
};
