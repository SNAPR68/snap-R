export const onRequestPost: PagesFunction<{
  OPENAI_API_KEY: string;
}> = async ({ request, env }) => {
  const body = await request.json();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: body.messages,
    }),
  });

  const data = await res.json();
  return Response.json(data);
};
