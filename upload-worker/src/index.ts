import { createClient } from "@supabase/supabase-js";
import { Env } from "../../backend/workers/types";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/test" && request.method === "POST") {
      const testJob = {
        jobId: crypto.randomUUID(),
        files: [],
        type: "test",
        created_at: new Date().toISOString(),
      };

      await env.JOB_QUEUE.send(testJob);

      return new Response(
        JSON.stringify({ status: "queued", job_id: testJob.id }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/upload" && request.method === "POST") {
      return this.upload(request, env);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  },

  async upload(request: Request, env: Env) {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return new Response(JSON.stringify({ error: "No files" }), {
        status: 400,
      });
    }

    // Create Supabase client for Workers environment
    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create job record
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("jobs")
      .insert([{ status: "queued" }])
      .select()
      .single();

    if (jobErr) {
      return new Response(JSON.stringify({ error: jobErr.message }), {
        status: 500,
      });
    }

    const uploadedFiles: string[] = [];

    // Upload raw files to R2
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const key = `raw/${job.id}/${file.name}`;

      await env.R2.put(key, arrayBuffer, {
        httpMetadata: { contentType: file.type },
      });

      uploadedFiles.push(key);
    }

    // Send a processing job to queue
    await env.JOB_QUEUE.send({
      jobId: job.id,
      files: uploadedFiles,
    });

    return new Response(JSON.stringify({ jobId: job.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

