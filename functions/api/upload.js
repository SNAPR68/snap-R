export async function onRequestPost(context) {
  const formData = await context.request.formData();
  // TODO: Add your upload logic here
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

