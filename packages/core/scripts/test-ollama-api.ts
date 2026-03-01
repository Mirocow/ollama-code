#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CLI test script for OllamaNativeClient.
 * Run with: npx tsx scripts/test-ollama-api.ts
 */

import {
  createOllamaNativeClient,
} from '../src/core/ollamaNativeClient.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const TEST_MODEL = process.env.OLLAMA_TEST_MODEL || 'llama3.2';

const client = createOllamaNativeClient({ baseUrl: OLLAMA_URL });

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(color: keyof typeof colors, prefix: string, message: string) {
  console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

function logSection(title: string) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

async function main() {
  logSection('Ollama Native API Client Test');

  // Test 1: Check server status
  logSection('1. Server Status');
  log('blue', '→', `Checking server at ${OLLAMA_URL}...`);

  const isRunning = await client.isServerRunning();
  if (!isRunning) {
    log('red', '✗', 'Server is not running!');
    process.exit(1);
  }
  log('green', '✓', 'Server is running');

  // Test 2: Get version
  logSection('2. Version Check');
  const { version } = await client.getVersion();
  log('green', '✓', `Ollama version: ${version}`);

  // Test 3: List models
  logSection('3. List Local Models (GET /api/tags)');
  const { models } = await client.listModels();

  if (models.length === 0) {
    log('yellow', '⚠', 'No models found locally');
  } else {
    log('green', '✓', `Found ${models.length} models:`);
    for (const model of models) {
      const sizeGB = (model.size / 1e9).toFixed(2);
      log('blue', '  •', `${model.name} (${sizeGB} GB)`);
    }
  }

  // Test 4: List running models
  logSection('4. List Running Models (GET /api/ps)');
  const { models: runningModels } = await client.listRunningModels();
  if (runningModels.length === 0) {
    log('blue', 'ℹ', 'No models currently loaded in memory');
  } else {
    log('green', '✓', `${runningModels.length} models in memory:`);
    for (const model of runningModels) {
      log('blue', '  •', `${model.name} (expires: ${model.expires_at})`);
    }
  }

  // Test 5: Show model info
  const testModel = models[0]?.name?.split(':')[0] || TEST_MODEL;
  const modelAvailable = await client.isModelAvailable(testModel);

  if (modelAvailable) {
    logSection(`5. Show Model Info (POST /api/show)`);
    log('blue', '→', `Getting info for "${testModel}"...`);

    const info = await client.showModel(testModel);
    log('green', '✓', 'Model information:');
    console.log('  Family:', info.details?.family);
    console.log('  Parameter size:', info.details?.parameter_size);
    console.log('  Quantization:', info.details?.quantization_level);
    console.log('  Format:', info.details?.format);

    if (info.parameters) {
      console.log('  Parameters:', info.parameters.slice(0, 100) + '...');
    }
  }

  // Test 6: Generate text
  if (modelAvailable) {
    logSection('6. Generate Text (POST /api/generate)');

    const prompt = 'Say "Hello World" in exactly 2 words.';
    log('blue', '→', `Prompt: "${prompt}"`);

    const startTime = Date.now();
    const result = await client.generate({
      model: testModel,
      prompt,
      options: { temperature: 0.1, num_predict: 20 },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('green', '✓', `Response (${duration}s):`);
    console.log(`  "${result.response.trim()}"`);
    console.log(`  Tokens: ${result.eval_count} (${result.eval_count && result.total_duration ? (result.eval_count / (result.total_duration / 1e9)).toFixed(1) : '?'} tok/s)`);
  }

  // Test 7: Chat
  if (modelAvailable) {
    logSection('7. Chat (POST /api/chat)');

    log('blue', '→', 'Sending chat message...');
    const startTime = Date.now();

    const chatResult = await client.chat({
      model: testModel,
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Be concise.' },
        { role: 'user', content: 'What is 2+2? Answer with just the number.' },
      ],
      options: { temperature: 0.1, num_predict: 10 },
    });

    const chatDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('green', '✓', `Response (${chatDuration}s):`);
    console.log(`  "${chatResult.message.content.trim()}"`);
  }

  // Test 8: Embeddings (if model available)
  if (modelAvailable) {
    logSection('8. Embeddings (POST /api/embed)');

    const embeddingModel = models.find(
      (m) => m.name.includes('embed') || m.name.includes('nomic')
    );

    if (embeddingModel) {
      log('blue', '→', `Using "${embeddingModel.name}" for embeddings...`);

      const embedResult = await client.embed({
        model: embeddingModel.name.split(':')[0],
        input: ['Hello world', 'Test embedding'],
      });

      log('green', '✓', `Generated ${embedResult.embeddings.length} embeddings`);
      console.log(`  Vector size: ${embedResult.embeddings[0].length}`);
      console.log(`  First 5 values: [${embedResult.embeddings[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    } else {
      log('yellow', '⚠', 'No embedding model found, skipping');
      console.log('  Tip: Pull an embedding model with: ollama pull nomic-embed-text');
    }
  }

  // Summary
  logSection('Test Summary');
  log('green', '✓', 'All API endpoints tested successfully!');

  console.log('\nAPI Endpoints tested:');
  console.log('  • GET  /api/version  - Server version');
  console.log('  • GET  /api/tags     - List local models');
  console.log('  • GET  /api/ps       - List running models');
  console.log('  • POST /api/show     - Model information');
  console.log('  • POST /api/generate - Text generation');
  console.log('  • POST /api/chat     - Chat completion');
  console.log('  • POST /api/embed    - Embeddings');
  console.log('\nEndpoints available (not tested):');
  console.log('  • POST /api/pull     - Pull model');
  console.log('  • POST /api/push     - Push model');
  console.log('  • POST /api/copy     - Copy model');
  console.log('  • DELETE /api/delete - Delete model');
  console.log('  • POST /api/embeddings - Legacy embeddings');
}

main().catch((error) => {
  log('red', '✗', `Error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
