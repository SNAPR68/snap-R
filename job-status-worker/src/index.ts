import { createClient } from "@supabase/supabase-js";
import { Env } from "../../backend/workers/types";
import { enhanceImagePipeline } from "../../pipelines/enhancement";

export default {
  async queue(batch: MessageBatch, env: Env) {
    try {
      for (const msg of batch.messages) {
        const body = msg.body as { jobId: string; files: string[] };
        const { jobId, files } = body;

        console.log("🚀 Processing job:", jobId);

        // Initialize Supabase client
        const supabase = createClient(
          env.SUPABASE_URL,
          env.SUPABASE_SERVICE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Update job status to processing
        await supabase
          .from("jobs")
          .update({ 
            status: "processing", 
            updated_at: new Date().toISOString() 
          })
          .eq("id", jobId);

        const processedPhotos = [];

        // Process each file
        for (const r2Key of files) {
          try {
            console.log("📥 Fetching original from R2:", r2Key);

            // Get original image from R2
            const r2Object = await env.R2.get(r2Key);
            if (!r2Object) {
              console.error("❌ Original file missing in R2:", r2Key);
              continue;
            }

            const buffer = await r2Object.arrayBuffer();

            // Process through enhancement pipeline
            console.log("✨ Enhancing image:", r2Key);
            const processedUrl = await enhanceImagePipeline(buffer, env);

            console.log("✅ Enhanced image URL:", processedUrl);

            // Get R2 public URL for raw image
            // Use R2 key as raw_url (will be converted to public URL on frontend if needed)
            const rawUrl = r2Key;

            // Insert photo record with raw_url and processed_url
            const { data: photo, error: photoError } = await supabase
              .from("photos")
              .insert({
                job_id: jobId,
                raw_url: rawUrl,
                processed_url: processedUrl,
                status: "completed",
                created_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (photoError) {
              console.error("❌ Error inserting photo:", photoError);
              continue;
            }

            processedPhotos.push(photo);
            console.log("📝 Photo saved to database:", photo.id);
          } catch (err: any) {
            console.error(`❌ Error processing file ${r2Key}:`, err);
            // Continue processing other files even if one fails
          }
        }

        // Update job status to completed
        await supabase
          .from("jobs")
          .update({ 
            status: "completed", 
            updated_at: new Date().toISOString() 
          })
          .eq("id", jobId);

        console.log("✅ Job completed:", jobId, `(${processedPhotos.length} photos processed)`);
      }
    } catch (err: any) {
      console.error("❌ Queue processing error:", err);
      // Re-throw to allow Cloudflare to retry
      throw err;
    }
  },
};
