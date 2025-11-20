export const onRequestPost: PagesFunction<{
  REPLICATE_API_KEY: string;
}> = async ({ request, env }) => {
  const payload = await request.json();

  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${env.REPLICATE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return Response.json(data);
};
