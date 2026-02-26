#!/usr/bin/env npx tsx
/**
 * Test script for Ollama API
 * 
 * Usage: npx tsx test-ollama-api.ts
 * 
 * This script tests all Ollama API endpoints:
 * - /api/tags - List models
 * - /api/show - Show model info
 * - /api/generate - Generate text
 * - /api/chat - Chat with model
 */

import {
  OllamaNativeClient,
  createOllamaNativeClient,
  DEFAULT_OLLAMA_NATIVE_URL,
} from './packages/core/src/core/ollamaNativeClient.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || DEFAULT_OLLAMA_NATIVE_URL;
const TEST_MODEL = process.env.OLLAMA_MODEL || 'qwen3-coder:30b';

async function main() {
  console.log('='.repeat(60));
  console.log('Ollama API Test');
  console.log('='.repeat(60));
  console.log(`Ollama Host: ${OLLAMA_HOST}`);
  console.log(`Test Model: ${TEST_MODEL}`);
  console.log('');

  const client = createOllamaNativeClient({ baseUrl: OLLAMA_HOST });

  // Test 1: Check server status
  console.log('1. Checking server status...');
  try {
    const isRunning = await client.isServerRunning();
    if (isRunning) {
      const version = await client.getVersion();
      console.log(`   ✓ Server running: Ollama v${version.version}`);
    } else {
      console.log('   ✗ Server not running!');
      console.log('   Please start Ollama: ollama serve');
      process.exit(1);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error}`);
    process.exit(1);
  }
  console.log('');

  // Test 2: List models (/api/tags)
  console.log('2. Listing models (GET /api/tags)...');
  try {
    const tags = await client.listModels();
    console.log(`   ✓ Found ${tags.models.length} models:`);
    for (const model of tags.models.slice(0, 5)) {
      const size = (model.size / 1024 / 1024 / 1024).toFixed(2);
      console.log(`     - ${model.name} (${size} GB)`);
    }
    if (tags.models.length > 5) {
      console.log(`     ... and ${tags.models.length - 5} more`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error}`);
  }
  console.log('');

  // Test 3: Show model info (/api/show)
  console.log(`3. Showing model info (POST /api/show)...`);
  try {
    const modelInfo = await client.showModel(TEST_MODEL);
    console.log(`   ✓ Model: ${TEST_MODEL}`);
    console.log(`     Family: ${modelInfo.details?.family || 'unknown'}`);
    console.log(`     Parameter size: ${modelInfo.details?.parameter_size || 'unknown'}`);
    console.log(`     Quantization: ${modelInfo.details?.quantization_level || 'unknown'}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error}`);
    console.log(`   Hint: Pull the model with: ollama pull ${TEST_MODEL}`);
  }
  console.log('');

  // Test 4: Generate text (/api/generate)
  console.log('4. Testing text generation (POST /api/generate)...');
  try {
    console.log('   Prompt: "Why is the sky blue? Answer in one sentence."');
    const startTime = Date.now();
    const response = await client.generate({
      model: TEST_MODEL,
      prompt: 'Why is the sky blue? Answer in one sentence.',
      stream: false,
    });
    const duration = Date.now() - startTime;
    console.log(`   ✓ Response (${duration}ms, ${response.eval_count || 0} tokens):`);
    console.log(`     "${response.response.trim()}"`);
  } catch (error) {
    console.log(`   ✗ Error: ${error}`);
  }
  console.log('');

  // Test 5: Chat (/api/chat)
  console.log('5. Testing chat (POST /api/chat)...');
  try {
    console.log('   Message: "Hello! Reply with a greeting."');
    const startTime = Date.now();
    const chatResponse = await client.chat({
      model: TEST_MODEL,
      messages: [
        { role: 'user', content: 'Hello! Reply with a greeting.' }
      ],
      stream: false,
    });
    const duration = Date.now() - startTime;
    console.log(`   ✓ Response (${duration}ms):`);
    console.log(`     "${chatResponse.message.content.trim()}"`);
  } catch (error) {
    console.log(`   ✗ Error: ${error}`);
  }
  console.log('');

  // Test 6: Streaming generate
  console.log('6. Testing streaming generation...');
  try {
    console.log('   Prompt: "Count from 1 to 5."');
    process.stdout.write('   Response: "');
    await client.generate(
      {
        model: TEST_MODEL,
        prompt: 'Count from 1 to 5. Just output the numbers.',
        stream: true,
      },
      (chunk) => {
        process.stdout.write(chunk.response);
      }
    );
    console.log('"');
    console.log('   ✓ Streaming completed');
  } catch (error) {
    console.log(`   ✗ Error: ${error}`);
  }
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('All tests completed!');
  console.log('='.repeat(60));
}

main().catch(console.error);
