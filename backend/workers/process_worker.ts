export default {
    async queue(batch, env, ctx) {
      console.log("📥 Received queue batch:", batch.messages.length);
  
      for (const msg of batch.messages) {
        const job = msg.body;
  
        console.log("Processing job:", job);
  
        try {
          // Example: call your job processing pipeline
          const response = await fetch(`${env.SUPABASE_URL}/functions/v1/process`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify(job),
          });
  
          console.log("Job processed:", await response.text());
        } catch (err) {
          console.error("Job failed:", err);
        }
      }
    }
  };
  



