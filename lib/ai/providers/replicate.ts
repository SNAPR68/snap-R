import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

export async function replicateUpscale(imageUrl: string, scale: number = 2): Promise<string> {
  const output = await replicate.run(
    'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa' as any,
    { input: { image: imageUrl, scale, face_enhance: false } }
  );
  return Array.isArray(output) ? output[0] : String(output);
}
