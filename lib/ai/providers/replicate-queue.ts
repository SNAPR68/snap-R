type QueueState = {
  queue: Promise<any>;
  lastAt: number;
};

const GLOBAL_KEY = '__snapr_replicate_queue__';

function getState(): QueueState {
  const globalAny = globalThis as typeof globalThis & { [key: string]: QueueState };
  if (!globalAny[GLOBAL_KEY]) {
    globalAny[GLOBAL_KEY] = { queue: Promise.resolve(), lastAt: 0 };
  }
  return globalAny[GLOBAL_KEY];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enqueueReplicate<T>(
  fn: () => Promise<T>,
  minIntervalMs: number = Number(process.env.REPLICATE_MIN_INTERVAL_MS || 10000)
): Promise<T> {
  const state = getState();
  const run = async () => {
    const now = Date.now();
    const waitMs = Math.max(0, minIntervalMs - (now - state.lastAt));
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    state.lastAt = Date.now();
    return fn();
  };
  state.queue = state.queue.then(run, run);
  return state.queue;
}
