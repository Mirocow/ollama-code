/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Example usage of OllamaNativeClient.
 * This file demonstrates how to use the native Ollama REST API endpoints.
 */

import { createOllamaNativeClient } from './ollamaNativeClient.js';

async function main() {
  // Create client
  const client = createOllamaNativeClient({
    baseUrl: 'http://localhost:11434', // default
  });

  console.log('=== Ollama Native API Client Examples ===\n');

  // Example 1: Check server status and version
  console.log('1. Server Status:');
  const isRunning = await client.isServerRunning();
  if (isRunning) {
    const { version } = await client.getVersion();
    console.log(`   Server running: Ollama v${version}`);
  } else {
    console.log('   Server not running!');
    return;
  }

  // Example 2: List local models (GET /api/tags)
  console.log('\n2. List Models (GET /api/tags):');
  const { models } = await client.listModels();
  console.log(`   Found ${models.length} models:`);
  models.forEach((m) => {
    console.log(`   - ${m.name} (${(m.size / 1e9).toFixed(2)} GB)`);
  });

  // Example 3: List running models (GET /api/ps)
  console.log('\n3. Running Models (GET /api/ps):');
  const { models: running } = await client.listRunningModels();
  if (running.length > 0) {
    running.forEach((m) => console.log(`   - ${m.name}`));
  } else {
    console.log('   No models currently loaded');
  }

  // Use first available model for examples
  const modelName = models[0]?.name?.split(':')[0] || 'llama3.2';
  console.log(`\n   Using model: ${modelName}`);

  // Example 4: Generate text (POST /api/generate)
  console.log('\n4. Generate Text (POST /api/generate):');
  const genResult = await client.generate({
    model: modelName,
    prompt: 'Say "Hello" in exactly one word.',
    options: { temperature: 0.1, num_predict: 5 },
  });
  console.log(`   Response: "${genResult.response.trim()}"`);

  // Example 5: Chat (POST /api/chat)
  console.log('\n5. Chat (POST /api/chat):');
  const chatResult = await client.chat({
    model: modelName,
    messages: [
      { role: 'system', content: 'Be very brief.' },
      { role: 'user', content: '2+2=?' },
    ],
    options: { temperature: 0.1, num_predict: 5 },
  });
  console.log(`   Response: "${chatResult.message.content.trim()}"`);

  // Example 6: Show model info (POST /api/show)
  if (models.length > 0) {
    console.log('\n6. Model Info (POST /api/show):');
    const info = await client.showModel(modelName);
    console.log(`   Family: ${info.details?.family}`);
    console.log(`   Parameters: ${info.details?.parameter_size}`);
    console.log(`   Quantization: ${info.details?.quantization_level}`);
  }

  // Example 7: Streaming generate
  console.log('\n7. Streaming Generate:');
  process.stdout.write('   ');
  await client.generate(
    {
      model: modelName,
      prompt: 'Count from 1 to 3, one per line.',
      options: { temperature: 0.1, num_predict: 20 },
    },
    (chunk) => {
      process.stdout.write(chunk.response);
    },
  );
  console.log('\n');

  // Example 8: Streaming chat
  console.log('8. Streaming Chat:');
  process.stdout.write('   ');
  await client.chat(
    {
      model: modelName,
      messages: [{ role: 'user', content: 'Say "Bye"' }],
      options: { temperature: 0.1, num_predict: 10 },
    },
    (chunk) => {
      if (chunk.message?.content) {
        process.stdout.write(chunk.message.content);
      }
    },
  );
  console.log('\n');

  console.log('=== All examples completed ===');
}

main().catch(console.error);
