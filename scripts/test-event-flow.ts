/**
 * Simple standalone test for event flow
 * 
 * Tests the streaming event chain without complex dependencies
 */

import http from 'node:http';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

// Create a simple mock Ollama server
function createMockServer(port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/api/chat') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString());

        const responses = [
          { model: body.model, message: { role: 'assistant', content: 'Hello ' }, done: false },
          { model: body.model, message: { role: 'assistant', content: 'world' }, done: false },
          { model: body.model, message: { role: 'assistant', content: '!' }, done: true, done_reason: 'stop' },
        ];

        if (body.stream !== false) {
          res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
          for (const resp of responses) {
            res.write(JSON.stringify(resp) + '\n');
            await new Promise((r) => setTimeout(r, 10));
          }
          res.end();
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            model: body.model,
            message: { role: 'assistant', content: 'Hello world!' },
            done: true,
          }));
        }
      } else if (req.method === 'GET' && req.url === '/api/tags') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          models: [{ name: 'test-model:latest', modified_at: new Date().toISOString(), size: 1000000, digest: 'abc' }],
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

// Simple HTTP client for testing
async function streamChat(baseUrl: string, model: string, messages: Array<{ role: string; content: string }>) {
  const url = new URL('/api/chat', baseUrl);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events: Array<{ type: string; data: unknown }> = [];
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      console.log('Stream ended by server');
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);
          events.push({
            type: data.done ? 'finished' : 'chunk',
            data,
          });
          console.log(`Event #${events.length}:`, {
            done: data.done,
            content: data.message?.content?.substring(0, 20),
          });
        } catch (e) {
          console.error('Parse error:', line.substring(0, 100));
        }
      }
    }
  }

  return events;
}

// Main test
async function main() {
  console.log('=== Event Flow Test ===\n');

  const port = 11435;
  const server = await createMockServer(port);
  const baseUrl = `http://localhost:${port}`;

  console.log(`Mock server started at ${baseUrl}\n`);

  try {
    // Test streaming
    console.log('--- Testing Streaming Response ---\n');
    const events = await streamChat(baseUrl, 'test-model', [{ role: 'user', content: 'Hello' }]);

    console.log('\n--- Analysis ---');
    console.log(`Total events: ${events.length}`);
    
    const finishedEvents = events.filter((e) => e.type === 'finished');
    console.log(`Finished events: ${finishedEvents.length}`);

    if (finishedEvents.length === 0) {
      console.log('❌ ERROR: No Finished event received!');
    } else if (finishedEvents.length === 1) {
      console.log('✅ SUCCESS: Exactly one Finished event received');
    } else {
      console.log('⚠️  WARNING: Multiple Finished events received');
    }

    // Verify last event is finished
    const lastEvent = events[events.length - 1];
    if (lastEvent?.type === 'finished') {
      console.log('✅ SUCCESS: Last event is Finished');
    } else {
      console.log('❌ ERROR: Last event is not Finished!');
    }

  } finally {
    server.close();
    console.log('\nServer closed');
  }
}

// Run test
main().catch(console.error);
