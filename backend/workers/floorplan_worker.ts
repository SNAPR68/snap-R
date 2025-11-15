import { createClient } from "@supabase/supabase-js";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/floorplan" && request.method === "POST") {
      return this.createFloorplan(request, env);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  },

  async createFloorplan(request: Request, env: Env) {
    // Create Supabase client for Workers environment
    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const listingId = formData.get("listingId") as string;

    if (!file || !listingId) {
      return new Response(JSON.stringify({ error: "Missing file or listingId" }), {
        status: 400,
      });
    }

    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    // ---- CALL REPLICATE AI MODEL ----
    const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "pixtral-40/convert-floorplan", // example model
        input: {
          image: `data:image/png;base64,${base64}`,
        },
      }),
    }).then((r) => r.json());

    const outputBase64 =
      replicateRes?.output?.[0]?.replace("data:image/png;base64,", "");

    if (!outputBase64) {
      return new Response(JSON.stringify({ error: "Floorplan failed" }), {
        status: 500,
      });
    }

    // ---- UPLOAD TO CLOUDINARY ----
    const cloudForm = new FormData();
    cloudForm.append("file", `data:image/png;base64,${outputBase64}`);
    cloudForm.append("upload_preset", "snapr_auto");
    cloudForm.append("api_key", env.CLOUDINARY_API_KEY);

    const cloud = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: cloudForm,
      }
    ).then((r) => r.json());

    const url = cloud.secure_url;

    // ---- SAVE IN DATABASE ----
    await supabaseAdmin.from("floorplans").insert({
      listing_id: listingId,
      source_url: "uploaded",
      processed_url: url,
    });

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}



