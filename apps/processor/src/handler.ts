/**
 * Legacy handler stub.
 *
 * Photo processing is handled by the main worker entry point (index.ts).
 * This file is kept for backward compatibility but is not actively used.
 */

interface PhotoInput {
  id: string;
  signed_url: string;
  analysis?: { skyCondition?: string; roomType?: string };
}

interface StrategyInput {
  assignments?: Record<string, string[]>;
}

interface SupabaseClient {
  from(table: string): {
    update(data: Record<string, unknown>): {
      eq(column: string, value: string): Promise<unknown>;
    };
  };
}

export async function processPhotos(
  photos: PhotoInput[],
  strategy: StrategyInput,
  _env: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<void> {
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const tools = strategy.assignments?.[photo.id] || [];

    console.log(`[Worker] Photo ${i + 1}/${photos.length}: ${photo.id}, tools: ${tools.join(', ') || 'none'}`);

    if (tools.length === 0) {
      await supabase.from('photos').update({ status: 'completed' }).eq('id', photo.id);
      continue;
    }

    // Tool execution is handled by the main worker (index.ts executeTool)
    await supabase.from('photos').update({ status: 'completed' }).eq('id', photo.id);
    console.log(`[Worker] Photo ${i + 1} DONE`);
  }
}
