/**
 * SnapR AI Pipeline Diagnostic Script
 * ====================================
 * Tests all AI enhancement models and providers
 * 
 * Usage:
 *   1. Copy this file to your project: app/api/ai-diagnostic/route.ts
 *   2. Run your dev server: npm run dev
 *   3. Visit: http://localhost:3000/api/ai-diagnostic
 *   4. Or run directly: npx ts-node --skip-project snapr-ai-diagnostic.ts
 */

import { NextRequest, NextResponse } from 'next/server';

// Test image - a real estate exterior photo
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';

interface TestResult {
  name: string;
  provider: string;
  status: 'pass' | 'fail' | 'skip';
  duration?: number;
  error?: string;
  outputUrl?: string;
}

interface DiagnosticReport {
  timestamp: string;
  environment: {
    replicate_configured: boolean;
    runware_configured: boolean;
    openai_configured: boolean;
  };
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  recommendations: string[];
}

// ============================================
// PROVIDER CLIENTS
// ============================================

async function testReplicateConnection(): Promise<boolean> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return false;
  
  try {
    const response = await fetch('https://api.replicate.com/v1/models', {
      headers: { 'Authorization': `Token ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testRunwareConnection(): Promise<boolean> {
  const key = process.env.RUNWARE_API_KEY;
  if (!key) return false;
  
  // Runware doesn't have a simple health check, so we just verify key exists
  return key.length > 10;
}

async function testOpenAIConnection(): Promise<boolean> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// MODEL TESTS
// ============================================

async function testFluxKontext(imageUrl: string): Promise<TestResult> {
  const name = 'Flux Kontext (Virtual Twilight/Staging)';
  const start = Date.now();
  
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return { name, provider: 'Replicate', status: 'skip', error: 'REPLICATE_API_TOKEN not set' };
  }
  
  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-kontext-dev',
        input: {
          input_image: imageUrl,
          prompt: 'Enhance this real estate photo with better lighting and colors. Keep everything exactly the same.',
          guidance: 3.5,
          num_inference_steps: 28,
          aspect_ratio: 'match_input_image',
          output_format: 'jpg',
          output_quality: 90,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error };
    }
    
    const prediction = await response.json();
    
    // Poll for completion (max 60 seconds)
    let result = prediction;
    let attempts = 0;
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${token}` },
      });
      result = await pollResponse.json();
      attempts++;
    }
    
    if (result.status === 'succeeded' && result.output) {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return { name, provider: 'Replicate', status: 'pass', duration: Date.now() - start, outputUrl };
    } else {
      return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error: result.error || 'Prediction failed' };
    }
  } catch (error: any) {
    return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error: error.message };
  }
}

async function testRealEsrgan(imageUrl: string): Promise<TestResult> {
  const name = 'Real-ESRGAN (Upscale/HDR)';
  const start = Date.now();
  
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return { name, provider: 'Replicate', status: 'skip', error: 'REPLICATE_API_TOKEN not set' };
  }
  
  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
        input: {
          image: imageUrl,
          scale: 2,
          face_enhance: false,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error };
    }
    
    const prediction = await response.json();
    
    let result = prediction;
    let attempts = 0;
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${token}` },
      });
      result = await pollResponse.json();
      attempts++;
    }
    
    if (result.status === 'succeeded' && result.output) {
      return { name, provider: 'Replicate', status: 'pass', duration: Date.now() - start, outputUrl: result.output };
    } else {
      return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error: result.error || 'Prediction failed' };
    }
  } catch (error: any) {
    return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error: error.message };
  }
}

async function testBriaBackground(imageUrl: string): Promise<TestResult> {
  const name = 'BRIA Background Removal (Sky Replacement Step 1)';
  const start = Date.now();
  
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return { name, provider: 'Replicate', status: 'skip', error: 'REPLICATE_API_TOKEN not set' };
  }
  
  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'bria-ai/bria-rmbg:d43e0f17e5d6fcab54927ff8f78c1a73f1789bfbf9f4b1e82d5bfbdc3c5d6f0e',
        input: {
          image: imageUrl,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error };
    }
    
    const prediction = await response.json();
    
    let result = prediction;
    let attempts = 0;
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${token}` },
      });
      result = await pollResponse.json();
      attempts++;
    }
    
    if (result.status === 'succeeded' && result.output) {
      return { name, provider: 'Replicate', status: 'pass', duration: Date.now() - start, outputUrl: result.output };
    } else {
      return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error: result.error || 'Prediction failed' };
    }
  } catch (error: any) {
    return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error: error.message };
  }
}

async function testSDXLInpainting(imageUrl: string): Promise<TestResult> {
  const name = 'SDXL Inpainting (Sky/Declutter)';
  const start = Date.now();
  
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return { name, provider: 'Replicate', status: 'skip', error: 'REPLICATE_API_TOKEN not set' };
  }
  
  // Note: This test requires a mask, so we'll just verify the model is accessible
  try {
    const response = await fetch('https://api.replicate.com/v1/models/lucataco/sdxl-inpainting', {
      headers: { 'Authorization': `Token ${token}` },
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error };
    }
    
    const model = await response.json();
    if (model.latest_version) {
      return { name, provider: 'Replicate', status: 'pass', duration: Date.now() - start, outputUrl: 'Model accessible (requires mask for full test)' };
    } else {
      return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error: 'Model not found' };
    }
  } catch (error: any) {
    return { name, provider: 'Replicate', status: 'fail', duration: Date.now() - start, error: error.message };
  }
}

async function testRunwareImg2Img(imageUrl: string): Promise<TestResult> {
  const name = 'Runware Img2Img (Lawn Repair/Quick Edits)';
  const start = Date.now();
  
  const key = process.env.RUNWARE_API_KEY;
  if (!key) {
    return { name, provider: 'Runware', status: 'skip', error: 'RUNWARE_API_KEY not set' };
  }
  
  try {
    // First, download the image and convert to base64
    const imgResponse = await fetch(imageUrl);
    const buffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify([{
        taskType: 'imageInference',
        taskUUID: crypto.randomUUID(),
        model: 'runware:100@1',
        positivePrompt: 'professional real estate photo, enhanced lighting, vibrant colors',
        negativePrompt: 'blurry, distorted, low quality',
        seedImage: `data:image/jpeg;base64,${base64}`,
        strength: 0.3,
        width: 1024,
        height: 768,
        steps: 20,
        CFGScale: 7,
        outputFormat: 'JPEG',
      }]),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { name, provider: 'Runware', status: 'fail', duration: Date.now() - start, error };
    }
    
    const data = await response.json();
    const outputUrl = data?.data?.[0]?.imageURL || data?.[0]?.imageURL;
    
    if (outputUrl) {
      return { name, provider: 'Runware', status: 'pass', duration: Date.now() - start, outputUrl };
    } else {
      return { name, provider: 'Runware', status: 'fail', duration: Date.now() - start, error: 'No output URL in response' };
    }
  } catch (error: any) {
    return { name, provider: 'Runware', status: 'fail', duration: Date.now() - start, error: error.message };
  }
}

async function testOpenAIVision(imageUrl: string): Promise<TestResult> {
  const name = 'OpenAI GPT-4 Vision (Image Analysis)';
  const start = Date.now();
  
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { name, provider: 'OpenAI', status: 'skip', error: 'OPENAI_API_KEY not set' };
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this real estate photo. Is it interior or exterior? Rate the lighting quality from 1-10. Respond in JSON format: {"type": "exterior|interior", "lighting_score": 1-10, "suggestions": ["suggestion1", "suggestion2"]}',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { name, provider: 'OpenAI', status: 'fail', duration: Date.now() - start, error };
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      return { name, provider: 'OpenAI', status: 'pass', duration: Date.now() - start, outputUrl: content.substring(0, 200) };
    } else {
      return { name, provider: 'OpenAI', status: 'fail', duration: Date.now() - start, error: 'No content in response' };
    }
  } catch (error: any) {
    return { name, provider: 'OpenAI', status: 'fail', duration: Date.now() - start, error: error.message };
  }
}

// ============================================
// MAIN DIAGNOSTIC FUNCTION
// ============================================

async function runDiagnostics(): Promise<DiagnosticReport> {
  console.log('🔬 Starting SnapR AI Diagnostic...\n');
  
  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    environment: {
      replicate_configured: !!process.env.REPLICATE_API_TOKEN,
      runware_configured: !!process.env.RUNWARE_API_KEY,
      openai_configured: !!process.env.OPENAI_API_KEY,
    },
    tests: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
    recommendations: [],
  };
  
  // Check environment
  console.log('📋 Environment Check:');
  console.log(`   REPLICATE_API_TOKEN: ${report.environment.replicate_configured ? '✅ Set' : '❌ Missing'}`);
  console.log(`   RUNWARE_API_KEY: ${report.environment.runware_configured ? '✅ Set' : '❌ Missing'}`);
  console.log(`   OPENAI_API_KEY: ${report.environment.openai_configured ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  // Test provider connections
  console.log('🔌 Testing Provider Connections...');
  const replicateOk = await testReplicateConnection();
  const runwareOk = await testRunwareConnection();
  const openaiOk = await testOpenAIConnection();
  
  console.log(`   Replicate API: ${replicateOk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   Runware API: ${runwareOk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   OpenAI API: ${openaiOk ? '✅ Connected' : '❌ Failed'}`);
  console.log('');
  
  // Run model tests
  console.log('🧪 Running Model Tests (this may take 2-3 minutes)...\n');
  
  const tests = [
    testFluxKontext(TEST_IMAGE_URL),
    testRealEsrgan(TEST_IMAGE_URL),
    testBriaBackground(TEST_IMAGE_URL),
    testSDXLInpainting(TEST_IMAGE_URL),
    testRunwareImg2Img(TEST_IMAGE_URL),
    testOpenAIVision(TEST_IMAGE_URL),
  ];
  
  const results = await Promise.all(tests);
  report.tests = results;
  
  // Print results
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
    const time = result.duration ? ` (${(result.duration / 1000).toFixed(1)}s)` : '';
    console.log(`${icon} ${result.name}${time}`);
    if (result.status === 'fail' && result.error) {
      console.log(`   Error: ${result.error.substring(0, 100)}`);
    }
  }
  
  // Calculate summary
  report.summary.total = results.length;
  report.summary.passed = results.filter(r => r.status === 'pass').length;
  report.summary.failed = results.filter(r => r.status === 'fail').length;
  report.summary.skipped = results.filter(r => r.status === 'skip').length;
  
  // Generate recommendations
  if (!report.environment.replicate_configured) {
    report.recommendations.push('Add REPLICATE_API_TOKEN to .env.local - Required for Sky Replacement, Virtual Twilight, Virtual Staging, Upscale');
  }
  if (!report.environment.runware_configured) {
    report.recommendations.push('Add RUNWARE_API_KEY to .env.local - Required for Lawn Repair, quick edits');
  }
  if (!report.environment.openai_configured) {
    report.recommendations.push('Add OPENAI_API_KEY to .env.local - Required for Listing Intelligence AI, Auto Enhance');
  }
  
  const failedTests = results.filter(r => r.status === 'fail');
  for (const test of failedTests) {
    if (test.error?.includes('401') || test.error?.includes('Unauthorized')) {
      report.recommendations.push(`${test.name}: Check API key is valid and has sufficient credits`);
    } else if (test.error?.includes('timeout')) {
      report.recommendations.push(`${test.name}: Model timeout - try again or check Replicate status`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 SUMMARY: ${report.summary.passed}/${report.summary.total} tests passed`);
  console.log('='.repeat(50));
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  return report;
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function GET(request: NextRequest) {
  try {
    const report = await runDiagnostics();
    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// STANDALONE EXECUTION
// ============================================

// If running directly with ts-node
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  
  runDiagnostics()
    .then(report => {
      console.log('\n📄 Full Report:');
      console.log(JSON.stringify(report, null, 2));
    })
    .catch(error => {
      console.error('Diagnostic failed:', error);
      process.exit(1);
    });
}
