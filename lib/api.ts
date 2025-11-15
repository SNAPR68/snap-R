export async function api(path: string, options: RequestInit = {}) {
  // Use Next.js API routes if NEXT_PUBLIC_API_URL is not set, otherwise use external URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const url = `${baseUrl}${path}`;

  const headers: any = {
    'Content-Type': 'application/json',
  };

  return fetch(url, { ...options, headers });
}

// Upload (multipart)
export async function apiUpload(path: string, formData: FormData) {
  // Use Next.js API routes if NEXT_PUBLIC_API_URL is not set, otherwise use external URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const url = `${baseUrl}${path}`;
  return fetch(url, {
    method: 'POST',
    body: formData,
  });
}

