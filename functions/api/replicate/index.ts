export async function onRequestPost(context: { request: Request; env: Record<string, string>; params: Record<string, string> }) {
  const { request, env } = context;
  
  const body = await request.json();

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${env.REPLICATE_API_KEY}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  return new Response(await response.text(), {
    status: response.status
  });
}

