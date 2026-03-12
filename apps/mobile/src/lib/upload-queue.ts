/**
 * Upload Queue
 * Manages photo uploads with offline support and retry logic.
 * Photos are stored locally and uploaded when connectivity returns.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

export interface QueuedUpload {
  id: string;
  localUri: string;
  listingId: string;
  fileName: string;
  roomType?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  retries: number;
  createdAt: number;
  error?: string;
}

interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  uploading: number;
  pending: number;
}

type ProgressCallback = (progress: UploadProgress) => void;

const QUEUE_DIR = `${FileSystem.documentDirectory}upload-queue/`;
const QUEUE_INDEX = `${QUEUE_DIR}index.json`;
const MAX_RETRIES = 3;
const CONCURRENT_UPLOADS = 3;

let queue: QueuedUpload[] = [];
let isProcessing = false;
let progressCallback: ProgressCallback | null = null;

/** Ensure queue directory exists */
async function ensureQueueDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(QUEUE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(QUEUE_DIR, { intermediates: true });
  }
}

/** Save queue index to disk */
async function saveQueue(): Promise<void> {
  await ensureQueueDir();
  await FileSystem.writeAsStringAsync(QUEUE_INDEX, JSON.stringify(queue));
}

/** Load queue from disk */
async function loadQueue(): Promise<void> {
  try {
    await ensureQueueDir();
    const data = await FileSystem.readAsStringAsync(QUEUE_INDEX);
    queue = JSON.parse(data) as QueuedUpload[];
    // Reset any stuck 'uploading' items to 'pending'
    for (const item of queue) {
      if (item.status === 'uploading') {
        item.status = 'pending';
      }
    }
  } catch {
    queue = [];
  }
}

/** Get current upload progress */
function getProgress(): UploadProgress {
  return {
    total: queue.length,
    completed: queue.filter(q => q.status === 'completed').length,
    failed: queue.filter(q => q.status === 'failed').length,
    uploading: queue.filter(q => q.status === 'uploading').length,
    pending: queue.filter(q => q.status === 'pending').length,
  };
}

/** Upload a single photo to Supabase Storage */
async function uploadSingle(item: QueuedUpload): Promise<void> {
  item.status = 'uploading';
  progressCallback?.(getProgress());

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(item.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert to array buffer for Supabase upload
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const storagePath = `${session.user.id}/${item.listingId}/${Date.now()}-${item.fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(storagePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Insert photo record
    const { error: dbError } = await supabase
      .from('photos')
      .insert({
        listing_id: item.listingId,
        user_id: session.user.id,
        raw_url: storagePath,
        status: 'pending',
        variant: 'original',
      });

    if (dbError) {
      throw new Error(dbError.message);
    }

    item.status = 'completed';
  } catch (error: unknown) {
    item.retries += 1;
    const message = error instanceof Error ? error.message : 'Upload failed';
    item.error = message;

    if (item.retries >= MAX_RETRIES) {
      item.status = 'failed';
    } else {
      item.status = 'pending';
    }
  }

  await saveQueue();
  progressCallback?.(getProgress());
}

/** Process pending uploads in batches */
async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const pending = queue.filter(q => q.status === 'pending');

    // Process in batches of CONCURRENT_UPLOADS
    for (let i = 0; i < pending.length; i += CONCURRENT_UPLOADS) {
      const batch = pending.slice(i, i + CONCURRENT_UPLOADS);
      await Promise.all(batch.map(item => uploadSingle(item)));
    }
  } finally {
    isProcessing = false;
  }
}

// --- Public API ---

/** Initialize queue from disk */
export async function initUploadQueue(): Promise<void> {
  await loadQueue();
}

/** Add photos to upload queue */
export async function enqueuePhotos(
  photos: { uri: string; fileName: string; roomType?: string }[],
  listingId: string
): Promise<void> {
  await ensureQueueDir();

  for (const photo of photos) {
    // Copy photo to queue directory for persistence
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localUri = `${QUEUE_DIR}${id}.jpg`;

    await FileSystem.copyAsync({
      from: photo.uri,
      to: localUri,
    });

    queue.push({
      id,
      localUri,
      listingId,
      fileName: photo.fileName,
      roomType: photo.roomType,
      status: 'pending',
      retries: 0,
      createdAt: Date.now(),
    });
  }

  await saveQueue();
  progressCallback?.(getProgress());

  // Start processing
  processQueue();
}

/** Get current queue state */
export function getUploadQueue(): QueuedUpload[] {
  return [...queue];
}

/** Get upload progress */
export function getUploadProgress(): UploadProgress {
  return getProgress();
}

/** Register progress callback */
export function onUploadProgress(callback: ProgressCallback | null): void {
  progressCallback = callback;
}

/** Retry all failed uploads */
export async function retryFailedUploads(): Promise<void> {
  for (const item of queue) {
    if (item.status === 'failed') {
      item.status = 'pending';
      item.retries = 0;
      item.error = undefined;
    }
  }
  await saveQueue();
  progressCallback?.(getProgress());
  processQueue();
}

/** Clear completed uploads from queue */
export async function clearCompletedUploads(): Promise<void> {
  const completed = queue.filter(q => q.status === 'completed');

  // Delete local files
  for (const item of completed) {
    try {
      await FileSystem.deleteAsync(item.localUri, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  queue = queue.filter(q => q.status !== 'completed');
  await saveQueue();
  progressCallback?.(getProgress());
}

/** Clear entire queue */
export async function clearQueue(): Promise<void> {
  for (const item of queue) {
    try {
      await FileSystem.deleteAsync(item.localUri, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }
  }
  queue = [];
  await saveQueue();
  progressCallback?.(getProgress());
}
