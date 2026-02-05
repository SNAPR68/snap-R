import { EnhancementExecutor } from './services/enhancement-executor.js';

export async function processPhotos(photos: any[], strategy: any, env: any, supabase: any) {
  const executor = new EnhancementExecutor(env);
  
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const tools = strategy.assignments?.[photo.id] || [];
    
    console.log(`[Worker] Photo ${i + 1}/${photos.length}: ${photo.id}, tools: ${tools.join(', ') || 'none'}`);
    
    if (tools.length === 0) {
      await supabase.from('photos').update({ status: 'completed' }).eq('id', photo.id);
      continue;
    }

    const context = {
      url: photo.signed_url,
      skyComplexity: photo.analysis?.skyCondition === 'clear' ? 'simple' : 'complex',
      roomType: photo.analysis?.roomType
    };

    for (const toolId of tools) {
      try {
        const result = await executor.execute(photo.id, toolId, context);
        
        if (result.success) {
          console.log(`[Worker]   ✓ ${toolId}: ${result.processingTimeMs}ms`);
        } else {
          console.log(`[Worker]   ✗ ${toolId}: ${result.error}`);
        }
        
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`[Worker]   ✗ ${toolId} crashed:`, err);
      }
    }

    await supabase.from('photos').update({ status: 'completed' }).eq('id', photo.id);
    console.log(`[Worker] Photo ${i + 1} DONE`);
  }
}
