import { createClient } from "@supabase/supabase-js";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/description" && request.method === "POST") {
      return this.generate(request, env);
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  },

  async generate(request: Request, env: Env) {
    // Create Supabase client for Workers environment
    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return new Response(JSON.stringify({ error: "Missing listingId" }), {
        status: 400,
      });
    }

    // Fetch photos for listing
    const { data: photos } = await supabaseAdmin
      .from("photos")
      .select("*")
      .eq("listing_id", listingId);

    const urls = photos?.map((p) => p.processed_url).slice(0, 6) ?? [];

    const prompt = `
      Generate a premium real estate listing description.
      Photos: ${urls.join(", ")}
      Tone: luxury, clear, inviting.
      Length: 2 paragraphs.
    `;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
      }),
    }).then((r) => r.json());

    const text = aiRes.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ description: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};



