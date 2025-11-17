// Lazy initialization - only access env vars when called, not at module load time
export function getCloudflareConfig() {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    apiToken: process.env.CLOUDFLARE_API_TOKEN!,
    r2Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
    r2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL!,
  };
}

// Legacy export with lazy getter - only access env vars when accessed
// This prevents build-time execution while maintaining backward compatibility
function createLazyExport<T>(getter: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      return (getter() as any)[prop];
    },
  });
}

export const CF = createLazyExport(() => getCloudflareConfig());



