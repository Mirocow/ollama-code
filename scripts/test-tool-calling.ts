#!/usr/bin/env node
/**
 * Test script for debugging tool calling with different models
 * Usage: npx tsx scripts/test-tool-calling.ts [model-name]
 */

import {
  createOllamaNativeClient,
  DEFAULT_OLLAMA_NATIVE_URL,
} from '../packages/core/src/core/ollamaNativeClient.js';
import { OllamaContentConverter } from '../packages/core/src/core/ollamaNativeContentGenerator/converter.js';

const MODEL = process.argv[2] || 'qwen2.5-coder:14b';
const client = createOllamaNativeClient({ baseUrl: process.env.OLLAMA_URL || DEFAULT_OLLAMA_NATIVE_URL });

async function main() {
  console.log('='.repeat(70));
  console.log('Tool Calling Test');
  console.log('='.repeat(70));
  console.log(`Model: ${MODEL}`);
  console.log(`URL: ${process.env.OLLAMA_URL || DEFAULT_OLLAMA_NATIVE_URL}`);
  console.log('');

  try {
    // Check if model supports tools
    console.log('1. Checking tool support...');
    const supportsTools = await client.supportsTools(MODEL);
    console.log(`   Supports tools: ${supportsTools}`);
    console.log('');

    // Test chat with tools
    console.log('2. Testing chat with tools...');
    console.log('-'.repeat(70));

    const converter = new OllamaContentConverter(MODEL);

    const tools = [
      {
        type: 'function',
        function: {
          name: 'list_directory',
          description: 'List files in a directory',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path to list',
              },
            },
            required: ['path'],
          },
        },
      },
    ];

    const request = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'List files in my home directory' }],
        },
      ],
      config: {
        tools: [{ functionDeclarations: tools.map(t => t.function) }],
      },
    };

    const ollamaRequest = converter.convertGenAIRequestToOllama(request);
    ollamaRequest.tools = tools;

    console.log('Request:');
    console.log(JSON.stringify(ollamaRequest, null, 2));
    console.log('');

    console.log('Sending request...');
    const startTime = Date.now();
    const response = await client.chat(ollamaRequest);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log(`Response received in ${duration}s:`);
    console.log('-'.repeat(70));
    console.log('Raw response:');
    console.log(JSON.stringify(response, null, 2));
    console.log('');

    // Check for tool calls
    console.log('Analysis:');
    console.log('-'.repeat(70));

    if (response.message?.tool_calls) {
      console.log('✓ Structured tool_calls found:');
      response.message.tool_calls.forEach((tc, i) => {
        console.log(`   [${i}] ${tc.function.name}(${JSON.stringify(tc.function.arguments)})`);
      });
    } else {
      console.log('✗ No structured tool_calls in response');
    }

    if (response.message?.content) {
      console.log('');
      console.log('Content:');
      console.log(response.message.content);

      // Try to parse tool calls from content
      const parsedResult = converter['parseToolCallsFromText'](response.message.content);

      if (parsedResult.toolCalls.length > 0) {
        console.log('');
        console.log('✓ Parsed tool calls from text:');
        parsedResult.toolCalls.forEach((tc, i) => {
          console.log(`   [${i}] ${tc.name}(${JSON.stringify(tc.args)})`);
        });
      } else {
        console.log('');
        console.log('✗ No tool calls found in text content');
      }
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('Test completed');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
