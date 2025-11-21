const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

export interface ImageJobMessage {
  jobId: string;
  listingId: string;
  userId: string;
  variant: string;
  photos: Array<{ id: string; raw_url: string | null }>;
}

export async function enqueueImageJob(message: ImageJobMessage) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const queueName = process.env.CLOUDFLARE_IMAGE_QUEUE || "image-jobs";

  if (!accountId || !token) {
    throw new Error("Missing Cloudflare account credentials");
  }

  const endpoint = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/queues/${queueName}/messages`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          body: JSON.stringify(message),
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to enqueue job: ${res.status} ${text}`);
  }
}
