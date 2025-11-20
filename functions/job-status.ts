export const onRequestGet: PagesFunction<{
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}> = async ({ request, env }) => {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("id");

  if (!jobId) {
    return Response.json({ error: "Job ID missing" }, { status: 400 });
  }

  const supabaseRes = await fetch(`${env.SUPABASE_URL}/rest/v1/jobs?id=eq.${jobId}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
  });

  const job = await supabaseRes.json();

  const photosRes = await fetch(`${env.SUPABASE_URL}/rest/v1/photos?job_id=eq.${jobId}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
  });

  const photos = await photosRes.json();

  return Response.json({ job: job?.[0] || null, photos });
};
