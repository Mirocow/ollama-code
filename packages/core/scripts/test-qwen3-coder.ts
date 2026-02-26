#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CLI test script specifically for qwen3-coder:30b model.
 * Focuses on code generation capabilities.
 *
 * Run with:
 *   OLLAMA_URL=http://your-ollama:11434 npx tsx scripts/test-qwen3-coder.ts
 *
 * Or with default localhost:
 *   npx tsx scripts/test-qwen3-coder.ts
 */

import {
  createOllamaNativeClient,
} from '../src/core/ollamaNativeClient.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'qwen3-coder:30b';

const client = createOllamaNativeClient({ baseUrl: OLLAMA_URL });

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

function logCode(code: string) {
  console.log(`${colors.magenta}┌──────────────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(code.split('\n').map(line => `${colors.magenta}│${colors.reset} ${line}`).join('\n'));
  console.log(`${colors.magenta}└──────────────────────────────────────────────────────────────────────────────${colors.reset}`);
}

// Test prompts for code generation
const CODE_TESTS = [
  {
    name: 'Function Generation',
    prompt: `Write a TypeScript function that calculates the Fibonacci sequence up to n numbers. Include proper typing and JSDoc comments.`,
    maxTokens: 500,
  },
  {
    name: 'Algorithm Implementation',
    prompt: `Implement a binary search algorithm in Python with proper error handling and docstring.`,
    maxTokens: 400,
  },
  {
    name: 'Code Review',
    prompt: `Review this code and suggest improvements:

function fetchData(url) {
  return fetch(url).then(r => r.json())
}

Include specific suggestions for error handling, typing, and best practices.`,
    maxTokens: 400,
  },
  {
    name: 'Bug Fix',
    prompt: `Find and fix the bug in this code:

def count_words(text):
    words = text.split()
    count = {}
    for word in words:
        count[word] = +1
    return count

Explain what was wrong and how you fixed it.`,
    maxTokens: 300,
  },
  {
    name: 'API Design',
    prompt: `Design a RESTful API for a todo list application. Include endpoints for CRUD operations, proper HTTP methods, status codes, and example requests/responses.`,
    maxTokens: 600,
  },
];

async function main() {
  logSection(`Testing Model: ${MODEL}`);

  // Test 1: Check server status
  logSection('1. Server Status');
  log('blue', '→', `Checking server at ${OLLAMA_URL}...`);

  const isRunning = await client.isServerRunning();
  if (!isRunning) {
    log('red', '✗', 'Server is not running!');
    log('yellow', 'ℹ', 'Please start Ollama server or set OLLAMA_URL environment variable');
    log('blue', 'ℹ', 'Example: OLLAMA_URL=http://your-server:11434 npx tsx scripts/test-qwen3-coder.ts');
    process.exit(1);
  }
  log('green', '✓', 'Server is running');

  // Test 2: Get version
  logSection('2. Version Check');
  const { version } = await client.getVersion();
  log('green', '✓', `Ollama version: ${version}`);

  // Test 3: Check if model is available
  logSection('3. Model Availability');

  const isModelAvailable = await client.isModelAvailable(MODEL);
  if (!isModelAvailable) {
    log('yellow', '⚠', `Model "${MODEL}" is not pulled yet`);
    log('blue', 'ℹ', `Pull it with: ollama pull ${MODEL}`);

    // List available models
    const { models } = await client.listModels();
    if (models.length > 0) {
      log('blue', 'ℹ', 'Available models:');
      for (const model of models) {
        log('blue', '  •', model.name);
      }
    }
    process.exit(1);
  }
  log('green', '✓', `Model "${MODEL}" is available`);

  // Test 4: Show model info
  logSection('4. Model Information');
  const modelInfo = await client.showModel(MODEL);
  log('green', '✓', 'Model details:');
  console.log('  Family:', modelInfo.details?.family || 'N/A');
  console.log('  Parameter size:', modelInfo.details?.parameter_size || 'N/A');
  console.log('  Quantization:', modelInfo.details?.quantization_level || 'N/A');
  console.log('  Format:', modelInfo.details?.format || 'N/A');

  // Test 5: Code generation tests
  logSection('5. Code Generation Tests');

  for (const test of CODE_TESTS) {
    console.log(`\n${colors.blue}▶ Test: ${test.name}${colors.reset}`);
    log('blue', '→', `Prompt: "${test.prompt.slice(0, 80)}..."`);

    const startTime = Date.now();
    try {
      const result = await client.generate({
        model: MODEL,
        prompt: test.prompt,
        options: {
          temperature: 0.3,
          num_predict: test.maxTokens,
          top_p: 0.9,
        },
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const tokensPerSec = result.eval_count && result.total_duration
        ? (result.eval_count / (result.total_duration / 1e9)).toFixed(1)
        : '?';

      log('green', '✓', `Response (${duration}s, ${tokensPerSec} tok/s):`);
      logCode(result.response.trim());
      console.log(`  Eval tokens: ${result.eval_count || 'N/A'}`);

    } catch (error: any) {
      log('red', '✗', `Error: ${error.message}`);
    }
  }

  // Test 6: Chat with context
  logSection('6. Multi-turn Chat Test');

  const chatMessages = [
    { role: 'user' as const, content: 'Create a simple React component for a counter with increment and decrement buttons.' },
  ];

  log('blue', '→', 'Sending chat request...');

  const chatStartTime = Date.now();
  const chatResult = await client.chat({
    model: MODEL,
    messages: chatMessages,
    options: {
      temperature: 0.3,
      num_predict: 500,
    },
  });

  const chatDuration = ((Date.now() - chatStartTime) / 1000).toFixed(2);
  log('green', '✓', `Response (${chatDuration}s):`);
  logCode(chatResult.message.content.trim());

  // Summary
  logSection('Test Summary');
  log('green', '✓', `Model ${MODEL} tested successfully!`);
  console.log('\nTested capabilities:');
  console.log('  • Server connectivity');
  console.log('  • Model availability check');
  console.log('  • Model information retrieval');
  console.log('  • Code generation (multiple tasks)');
  console.log('  • Multi-turn chat');
}

main().catch((error) => {
  log('red', '✗', `Error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
