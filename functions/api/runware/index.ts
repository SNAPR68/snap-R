export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  const body = await request.json();

  const response = await fetch("https://api.runware.ai/v1/infer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RUNWARE_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  return new Response(await response.text(), {
    status: response.status
  });
}

