import { createClient } from "@supabase/supabase-js";

type ImageJobMessage = {
  jobId: string;
  listingId: string;
  userId: string;
  variant: string;
  photos: Array<{ id: string; raw_url: string | null }>;
};

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RUNWARE_API_KEY?: string;
};

export default {
  async queue(batch: MessageBatch<ImageJobMessage>, env: Env, ctx: ExecutionContext) {
    for (const message of batch.messages) {
      ctx.waitUntil(handleMessage(message, env));
    }
  },
};

async function handleMessage(message: Message<ImageJobMessage>, env: Env) {
  try {
    const payload = message.body;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    await supabase
      .from("jobs")
      .update({ status: "processing", error: null })
      .eq("id", payload.jobId);

    for (const photo of payload.photos) {
      if (!photo.raw_url) {
        await supabase
          .from("photos")
          .update({ status: "failed", error: "Missing raw_url" })
          .eq("id", photo.id);
        continue;
      }

      await supabase
        .from("photos")
        .update({ status: "processing", error: null })
        .eq("id", photo.id);

      try {
        const processedUrl = await runwareEnhance(photo.raw_url, payload.variant, env);

        await supabase
          .from("photos")
          .update({
            status: "completed",
            processed_url: processedUrl,
            processed_at: new Date().toISOString(),
          })
          .eq("id", photo.id);
      } catch (error: any) {
        console.error("Photo processing failed", photo.id, error);
        await supabase
          .from("photos")
          .update({ status: "failed", error: error?.message?.slice(0, 255) })
          .eq("id", photo.id);
      }
    }

    const { data: incomplete } = await supabase
      .from("photos")
      .select("id")
      .eq("job_id", payload.jobId)
      .neq("status", "completed");

    const nextStatus = incomplete && incomplete.length > 0 ? "failed" : "completed";

    await supabase
      .from("jobs")
      .update({
        status: nextStatus,
        completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", payload.jobId);

    message.ack();
  } catch (error) {
    console.error("Queue handler error", error);
    message.retry();
  }
}

async function runwareEnhance(rawUrl: string, variant: string, env: Env): Promise<string> {
  if (!env.RUNWARE_API_KEY) {
    throw new Error("RUNWARE_API_KEY is missing");
  }

  const response = await fetch("https://api.runware.ai/v1/infer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify({
      model: variant,
      input: rawUrl,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Runware error ${response.status}: ${text}`);
  }

  const json = await response.json();
  const url = json?.output?.[0]?.url || json?.result?.url || json?.output_url;
  if (!url) {
    throw new Error("Runware response missing output url");
  }
  return url;
}
