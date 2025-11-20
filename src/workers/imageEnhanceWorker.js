export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const job = message.body;
        const { key, type = "enhance" } = job;

        console.log("🔥 Processing job:", job);

        // 1. Fetch original image from R2
        const image = await env.UPLOADS.get(key, { type: "arrayBuffer" });
        if (!image) {
          console.error("❌ Image not found:", key);
          message.ack();
          continue;
        }

        let output;
        let outputKey;

        // ======================================================
        // 1️⃣ CLOUDLFARE AI (Enhancement / Basic Flux)
        // ======================================================
        if (type === "enhance") {
          console.log("⚡ Running Cloudflare AI (Flux Schnell)...");
          output = await env.AI.run(
            "@cf/black-forest-labs/flux-schnell",
            image
          );

          outputKey = `enhanced/${crypto.randomUUID()}.png`;
        }

        // ======================================================
        // 2️⃣ OPENAI VISION — Caption, Metadata, Analysis
        // ======================================================
        if (type === "caption") {
          console.log("🧠 Running OpenAI Vision...");

          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(image))
          );

          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "input_image",
                      image_url: `data:image/png;base64,${base64}`
                    },
                    { type: "text", text: "Describe this real-estate photo in detail. Identify: room type, materials, lighting, and special features." }
                  ]
                }
              ]
            })
          });

          const result = await response.json();

          // Save metadata as JSON
          output = JSON.stringify(result, null, 2);
          outputKey = `metadata/${crypto.randomUUID()}.json`;
        }

        // ======================================================
        // 3️⃣ REPLICATE — Upscaling, SD, Virtual Staging
        // ======================================================
        if (type === "upscale") {
          console.log("📈 Running Replicate Upscale (Real-ESRGAN 4x)...");

          const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${env.REPLICATE_API_KEY}`
            },
            body: JSON.stringify({
              version: "real-esrgan/4x",
              input: { image }
            })
          });

          const prediction = await response.json();
          const outUrl = prediction.output[0];
          const enhanced = await fetch(outUrl).then(r => r.arrayBuffer());

          output = enhanced;
          outputKey = `upscaled/${crypto.randomUUID()}.png`;
        }

        if (type === "stage") {
          console.log("🏡 Running Replicate Virtual Staging...");

          const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${env.REPLICATE_API_KEY}`
            },
            body: JSON.stringify({
              version: "sd3-virtual-staging",
              input: { image }
            })
          });

          const result = await response.json();
          const outUrl = result.output[0];
          const staged = await fetch(outUrl).then(r => r.arrayBuffer());

          output = staged;
          outputKey = `staged/${crypto.randomUUID()}.png`;
        }

        // ======================================================
        // 4️⃣ RUNWARE — GPU Bulk Enhancement (Fast)
        // ======================================================
        if (type === "bulk") {
          console.log("🚀 Running Runware Bulk Enhancement...");

          const response = await fetch("https://api.runware.ai/v1/infer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.RUNWARE_API_KEY}`,
            },
            body: JSON.stringify({
              model: "runware:enhance-fast",
              image
            }),
          });

          const rw = await response.arrayBuffer();
          output = rw;
          outputKey = `bulk/${crypto.randomUUID()}.png`;
        }

        // ======================================================
        // SAVE OUTPUT
        // ======================================================
        console.log("💾 Saving output:", outputKey);
        await env.UPLOADS.put(outputKey, output);

        // Mark job as done
        message.ack();
        console.log("✅ Completed job:", job);

      } catch (err) {
        console.error("🔥 Worker Error:", err);
        // Auto-retry by NOT acking
      }
    }
  }
};
