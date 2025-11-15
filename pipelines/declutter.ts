import { Env } from "@/backend/workers/types";

export async function declutterImage(base64: string, env: Env) {
  const result = await fetch("https://api.runware.ai/v1/ai/declutter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify({ image: base64 }),
  }).then((r) => r.json());

  return result?.clean_image;
}



