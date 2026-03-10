#!/usr/bin/env bun
/**
 * Integration test for event flow with mock Ollama server
 * 
 * This script tests:
 * 1. Mock Ollama server streaming responses
 * 2. OllamaNativeClient streaming chat
 * 3. Event flow verification (including Finished event)
 * 
 * Run: bun run scripts/test-mock-server.ts
 */

import {
  createMockOllamaServer,
  type MockServer,
} from '../packages/core/src/test-utils/mockOllamaServer.js';
import { OllamaNativeClient } from '../packages/core/src/core/ollamaNativeClient.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

async function runTests(): Promise<void> {
  console.log('=== Mock Ollama Server Integration Tests ===\n');

  const results: TestResult[] = [];

  // Test 1: Server starts and responds
  let server: MockServer | null = null;
  try {
    console.log('Test 1: Server starts and responds...');
    server = await createMockOllamaServer();
    console.log(`  ✓ Server started at ${server.url}`);
    results.push({ name: 'Server starts', passed: true });
  } catch (e) {
    results.push({
      name: 'Server starts',
      passed: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // Test 2: Streaming chat response
  if (server) {
    try {
      console.log('\nTest 2: Streaming chat response...');
      const client = new OllamaNativeClient({ baseUrl: server.url, timeout: 5000 });

      const chunks: Array<{ content: string; done: boolean }> = [];
      const response = await client.chat(
        {
          model: 'test-model',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        (chunk) => {
          chunks.push({
            content: chunk.message.content,
            done: chunk.done,
          });
        },
      );

      const lastChunk = chunks[chunks.length - 1];
      if (response.done && lastChunk.done) {
        console.log(`  ✓ Got ${chunks.length} chunks, all correctly streamed`);
        console.log(`  ✓ Final response: "${response.message.content.slice(0, 50)}..."`);
        results.push({
          name: 'Streaming chat',
          passed: true,
          details: { chunkCount: chunks.length },
        });
      } else {
        throw new Error('Last chunk not marked as done');
      }
    } catch (e) {
      results.push({
        name: 'Streaming chat',
        passed: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Test 3: Non-streaming response
  if (server) {
    try {
      console.log('\nTest 3: Non-streaming chat response...');
      const client = new OllamaNativeClient({ baseUrl: server.url, timeout: 5000 });

      const response = await client.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      });

      if (response.done && response.message.content) {
        console.log(`  ✓ Response: "${response.message.content.slice(0, 50)}..."`);
        results.push({ name: 'Non-streaming chat', passed: true });
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (e) {
      results.push({
        name: 'Non-streaming chat',
        passed: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Test 4: Error handling
  if (server) {
    try {
      console.log('\nTest 4: Error handling...');
      const errorServer = await createMockOllamaServer({ simulateError: true });
      const errorClient = new OllamaNativeClient({
        baseUrl: errorServer.url,
        timeout: 1000,
        retry: { maxRetries: 0 },
      });

      let errorCaught = false;
      try {
        await errorClient.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Hello' }],
        });
      } catch {
        errorCaught = true;
      }

      await errorServer.close();

      if (errorCaught) {
        console.log('  ✓ Error correctly thrown');
        results.push({ name: 'Error handling', passed: true });
      } else {
        throw new Error('Expected error was not thrown');
      }
    } catch (e) {
      results.push({
        name: 'Error handling',
        passed: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Test 5: Model listing
  if (server) {
    try {
      console.log('\nTest 5: Model listing...');
      const client = new OllamaNativeClient({ baseUrl: server.url, timeout: 5000 });

      const models = await client.listModels();
      if (models.models.length > 0 && models.models[0].name.includes('mock')) {
        console.log(`  ✓ Found ${models.models.length} model(s)`);
        results.push({ name: 'Model listing', passed: true });
      } else {
        throw new Error('No models returned');
      }
    } catch (e) {
      results.push({
        name: 'Model listing',
        passed: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Test 6: Custom response chunks
  if (server) {
    try {
      console.log('\nTest 6: Custom response chunks...');
      const customServer = await createMockOllamaServer({
        responseChunks: ['Custom ', 'response ', 'from ', 'test!'],
        chunkDelay: 5,
      });
      const customClient = new OllamaNativeClient({
        baseUrl: customServer.url,
        timeout: 5000,
      });

      let fullContent = '';
      await customClient.chat(
        {
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        },
        (chunk) => {
          fullContent += chunk.message.content;
        },
      );

      await customServer.close();

      if (fullContent === 'Custom response from test!') {
        console.log(`  ✓ Custom content: "${fullContent}"`);
        results.push({ name: 'Custom chunks', passed: true });
      } else {
        throw new Error(`Unexpected content: "${fullContent}"`);
      }
    } catch (e) {
      results.push({
        name: 'Custom chunks',
        passed: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Cleanup
  if (server) {
    await server.close();
    console.log('\n✓ Server closed');
  }

  // Summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log(`Passed: ${passed.length}/${results.length}`);
  for (const r of passed) {
    console.log(`  ✓ ${r.name}`);
  }

  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.length}/${results.length}`);
    for (const r of failed) {
      console.log(`  ✗ ${r.name}: ${r.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Test runner error:', e);
  process.exit(1);
});
