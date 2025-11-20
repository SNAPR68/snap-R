export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  // Parse multipart form
  const form = await request.formData();
  const file = form.get("file") as File;

  if (!file) {
    return new Response("File missing", { status: 400 });
  }

  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Create unique key inside R2
  const key = `uploads/${crypto.randomUUID()}-${file.name}`;

  // Store raw uploaded file into R2
  await env.UPLOADS.put(key, arrayBuffer);

  // Queue the image for background AI processing
  await env.IMAGE_JOBS.send({ key });

  // Return response to frontend immediately
  return Response.json({
    key,
    status: "queued",
  });
}

