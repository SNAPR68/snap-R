import { Env } from "../backend/workers/types";

export async function enhanceImagePipeline(
  buffer: ArrayBuffer,
  env: Env
): Promise<string> {
  // Convert to base64 for API usage
  const base64 = arrayBufferToBase64(buffer);

  // ----- STEP 1: RUNWARE ENHANCEMENT -----
  const result = await fetch("https://api.runware.ai/v1/ai/enhance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify({
      image: base64,
      features: [
        "hdr",
        "light_boost",
        "sky_replace",
        "noise_reduction",
        "detail_enhance",
      ],
    }),
  }).then((r) => r.json());

  const enhancedBase64 = result?.enhanced_image;

  if (!enhancedBase64) {
    throw new Error("Enhancement failed.");
  }

  // ----- STEP 2: UPLOAD TO CLOUDINARY -----

  const uploadForm = new FormData();
  uploadForm.append("file", `data:image/jpeg;base64,${enhancedBase64}`);
  uploadForm.append("upload_preset", "snapr_auto");
  uploadForm.append("api_key", env.CLOUDINARY_API_KEY);

  const cloudinaryRes = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: uploadForm,
    }
  ).then((r) => r.json());

  return cloudinaryRes.secure_url;
}

// Helper: Convert ArrayBuffer → base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

