export const onRequestPost: PagesFunction<{
  UPLOADS: R2Bucket;
  IMAGE_JOBS: Queue;
}> = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
      });
    }

    const key = `${Date.now()}-${file.name}`;
    await env.UPLOADS.put(key, file.stream());

    await env.IMAGE_JOBS.send({
      key,
      status: "queued",
      createdAt: Date.now(),
    });

    return Response.json({ key, status: "queued" });
  } catch (err) {
    return Response.json({ error: err.toString() }, { status: 500 });
  }
};
