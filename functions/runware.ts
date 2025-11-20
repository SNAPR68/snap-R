export const onRequestPost: PagesFunction<{
  RUNWARE_API_KEY: string;
}> = async ({ request, env }) => {
  const payload = await request.json();

  const res = await fetch("https://api.runware.ai/v1/infer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return Response.json(data);
};
