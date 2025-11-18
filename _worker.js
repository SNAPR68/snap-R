import { createRequestHandler, createMetadataHandler } from "open-next/cloudflare";

export const onRequest = createRequestHandler();
export const onMeta = createMetadataHandler();
