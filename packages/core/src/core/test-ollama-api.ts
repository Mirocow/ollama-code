/**
 * Test script for Ollama Native API
 * Tests all required API endpoints with qwen3-coder:30b model
 */

import {
  createOllamaNativeClient,
  DEFAULT_OLLAMA_NATIVE_URL,
} from './ollamaNativeClient.js';

const MODEL = 'qwen3-coder:30b';
const client = createOllamaNativeClient({ baseUrl: DEFAULT_OLLAMA_NATIVE_URL });

async function main() {
  console.log('='.repeat(60));
  console.log('Ollama Native API Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${DEFAULT_OLLAMA_NATIVE_URL}`);
  console.log(`Model: ${MODEL}`);
  console.log('');

  try {
    // 1. Test /api/version
    console.log('1. Testing GET /api/version');
    console.log('-'.repeat(40));
    const version = await client.getVersion();
    console.log(`   Ollama Version: ${version.version}`);
    console.log('   ✓ Success\n');

    // 2. Test GET /api/tags
    console.log('2. Testing GET /api/tags');
    console.log('-'.repeat(40));
    const tags = await client.listModels();
    console.log(`   Found ${tags.models.length} local models:`);
    tags.models.slice(0, 5).forEach((m) => {
      console.log(`   - ${m.name} (${(m.size / 1024 / 1024 / 1024).toFixed(2)} GB)`);
    });
    if (tags.models.length > 5) {
      console.log(`   ... and ${tags.models.length - 5} more`);
    }
    console.log('   ✓ Success\n');

    // 3. Test POST /api/show
    console.log(`3. Testing POST /api/show (model: ${MODEL})`);
    console.log('-'.repeat(40));
    try {
      const show = await client.showModel(MODEL);
      console.log(`   Model: ${MODEL}`);
      console.log(`   Family: ${show.details?.family || 'N/A'}`);
      console.log(`   Parameter Size: ${show.details?.parameter_size || 'N/A'}`);
      console.log(`   Quantization: ${show.details?.quantization_level || 'N/A'}`);
      console.log('   ✓ Success\n');
    } catch (e) {
      console.log(`   ⚠ Model ${MODEL} not found, skipping show test\n`);
    }

    // 4. Test GET /api/ps (running models)
    console.log('4. Testing GET /api/ps');
    console.log('-'.repeat(40));
    const ps = await client.listRunningModels();
    console.log(`   Running models: ${ps.models.length}`);
    ps.models.forEach((m) => {
      console.log(`   - ${m.name} (VRAM: ${(m.size_vram / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('   ✓ Success\n');

    // 5. Test POST /api/generate (non-streaming)
    console.log(`5. Testing POST /api/generate (non-streaming, model: ${MODEL})`);
    console.log('-'.repeat(40));
    try {
      const genResponse = await client.generate({
        model: MODEL,
        prompt: 'Say "Hello, World!" in one line.',
        stream: false,
        options: { num_predict: 50, temperature: 0.1 },
      });
      console.log(`   Response: ${genResponse.response.trim()}`);
      console.log(`   Eval count: ${genResponse.eval_count}`);
      console.log(`   Total duration: ${((genResponse.total_duration || 0) / 1000000000).toFixed(2)}s`);
      console.log('   ✓ Success\n');
    } catch (e: any) {
      console.log(`   ⚠ Error: ${e.message}\n`);
    }

    // 6. Test POST /api/generate (streaming)
    console.log(`6. Testing POST /api/generate (streaming, model: ${MODEL})`);
    console.log('-'.repeat(40));
    try {
      let fullResponse = '';
      await client.generate(
        {
          model: MODEL,
          prompt: 'Count from 1 to 5.',
          stream: true,
          options: { num_predict: 30, temperature: 0.1 },
        },
        (chunk) => {
          process.stdout.write(chunk.response);
          fullResponse += chunk.response;
        },
      );
      console.log('\n   ✓ Success (streaming)\n');
    } catch (e: any) {
      console.log(`\n   ⚠ Error: ${e.message}\n`);
    }

    // 7. Test POST /api/chat (non-streaming)
    console.log(`7. Testing POST /api/chat (non-streaming, model: ${MODEL})`);
    console.log('-'.repeat(40));
    try {
      const chatResponse = await client.chat({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Be concise.' },
          { role: 'user', content: 'What is 2 + 2?' },
        ],
        stream: false,
        options: { num_predict: 50, temperature: 0.1 },
      });
      console.log(`   Response: ${chatResponse.message.content.trim()}`);
      console.log(`   Eval count: ${chatResponse.eval_count}`);
      console.log('   ✓ Success\n');
    } catch (e: any) {
      console.log(`   ⚠ Error: ${e.message}\n`);
    }

    // 8. Test POST /api/chat (streaming)
    console.log(`8. Testing POST /api/chat (streaming, model: ${MODEL})`);
    console.log('-'.repeat(40));
    try {
      let fullContent = '';
      await client.chat(
        {
          model: MODEL,
          messages: [
            { role: 'user', content: 'List 3 programming languages.' },
          ],
          stream: true,
          options: { num_predict: 100, temperature: 0.1 },
        },
        (chunk) => {
          if (chunk.message?.content) {
            process.stdout.write(chunk.message.content);
            fullContent += chunk.message.content;
          }
        },
      );
      console.log('\n   ✓ Success (streaming)\n');
    } catch (e: any) {
      console.log(`\n   ⚠ Error: ${e.message}\n`);
    }

    console.log('='.repeat(60));
    console.log('All tests completed!');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

main();
