export async function onRequestPost(context: { request: Request; env: Record<string, string>; params: Record<string, string> }) {
  const { request, env } = context;
  
  const body = await request.json();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: body.model || "gpt-4o-mini",
      messages: body.messages,
      temperature: body.temperature ?? 0.6
    }),
    signal: AbortSignal.timeout(30000),
  });

  return new Response(await response.text(), {
    status: response.status
  });
}

