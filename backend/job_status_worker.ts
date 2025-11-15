import { supabaseAdmin } from "@/lib/supabase";
import { Env } from "./types";

export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);

    if (url.pathname === "/job-status") {
      const id = url.searchParams.get("id");

      const { data: job } = await supabaseAdmin
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      const { data: photos } = await supabaseAdmin
        .from("photos")
        .select("*")
        .eq("job_id", id);

      return new Response(
        JSON.stringify({
          status: job?.status,
          photos: photos ?? [],
        }),
        { status: 200 }
      );
    }

    return new Response("Not found", { status: 404 });
  },
};
