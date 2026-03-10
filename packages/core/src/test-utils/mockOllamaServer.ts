/**
 * Mock Ollama API Server for testing
 * 
 * Simulates Ollama's /api/chat endpoint with streaming responses
 */

import http from 'node:http';

export interface MockServerConfig {
  port?: number;
  responseDelay?: number;
  chunkDelay?: number;
  responseChunks?: string[];
  simulateError?: boolean;
  errorAfterChunks?: number;
}

export interface MockServer {
  url: string;
  port: number;
  close: () => Promise<void>;
  getRequestCount: () => number;
  getLastRequest: () => unknown;
  reset: () => void;
}

/**
 * Creates a mock Ollama API server for testing
 */
export async function createMockOllamaServer(
  config: MockServerConfig = {},
): Promise<MockServer> {
  const {
    port = 0, // 0 = random available port
    responseDelay = 0,
    chunkDelay = 10,
    responseChunks,
    simulateError = false,
    errorAfterChunks,
  } = config;

  let requestCount = 0;
  let lastRequest: unknown = null;

  const defaultChunks = [
    'Hello! ',
    'I am ',
    'a mock ',
    'AI assistant. ',
    'How can I help you today?',
  ];

  const chunks = responseChunks || defaultChunks;

  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/chat') {
      requestCount++;

      // Read request body
      const bodyChunks: Buffer[] = [];
      for await (const chunk of req) {
        bodyChunks.push(chunk);
      }
      const body = Buffer.concat(bodyChunks).toString('utf-8');
      try {
        lastRequest = JSON.parse(body);
      } catch {
        lastRequest = body;
      }

      const parsedBody = JSON.parse(body);
      const stream = parsedBody.stream !== false;

      // Initial delay
      if (responseDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, responseDelay));
      }

      // Simulate error before any response
      if (simulateError && !errorAfterChunks) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Simulated server error' }));
        return;
      }

      if (stream) {
        // Streaming response
        res.writeHead(200, {
          'Content-Type': 'application/x-ndjson',
        });

        for (let i = 0; i < chunks.length; i++) {
          // Simulate mid-stream error
          if (simulateError && errorAfterChunks && i >= errorAfterChunks) {
            res.write(
              JSON.stringify({
                error: 'Simulated mid-stream error',
              }) + '\n',
            );
            res.end();
            return;
          }

          const isDone = i === chunks.length - 1;
          const chunk = {
            model: parsedBody.model || 'mock-model',
            created_at: new Date().toISOString(),
            message: {
              role: 'assistant',
              content: chunks[i],
            },
            done: isDone,
            ...(isDone && {
              done_reason: 'stop',
              total_duration: 1000000000,
              load_duration: 100000000,
              prompt_eval_count: 10,
              prompt_eval_duration: 500000000,
              eval_count: 20,
              eval_duration: 400000000,
            }),
          };

          res.write(JSON.stringify(chunk) + '\n');

          // Delay between chunks
          if (chunkDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, chunkDelay));
          }
        }

        res.end();
      } else {
        // Non-streaming response
        const fullContent = chunks.join('');
        res.writeHead(200, {
          'Content-Type': 'application/json',
        });
        res.end(
          JSON.stringify({
            model: parsedBody.model || 'mock-model',
            created_at: new Date().toISOString(),
            message: {
              role: 'assistant',
              content: fullContent,
            },
            done: true,
            done_reason: 'stop',
            total_duration: 1000000000,
            prompt_eval_count: 10,
            eval_count: 20,
          }),
        );
      }
    } else if (req.method === 'GET' && req.url === '/api/tags') {
      // List models
      res.writeHead(200, {
        'Content-Type': 'application/json',
      });
      res.end(
        JSON.stringify({
          models: [
            {
              name: 'mock-model:latest',
              modified_at: new Date().toISOString(),
              size: 1000000000,
              digest: 'abc123',
              details: {
                format: 'gguf',
                family: 'llama',
                parameter_size: '7B',
                quantization_level: 'Q4_0',
              },
            },
          ],
        }),
      );
    } else if (req.method === 'POST' && req.url === '/api/show') {
      // Show model info
      res.writeHead(200, {
        'Content-Type': 'application/json',
      });
      res.end(
        JSON.stringify({
          modelfile: 'FROM mock',
          parameters: '',
          template: '{{ .Prompt }}',
          details: {
            format: 'gguf',
            family: 'llama',
            parameter_size: '7B',
            quantization_level: 'Q4_0',
          },
          capabilities: ['completion', 'tools'],
        }),
      );
    } else {
      res.writeHead(404, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      const address = server.address();
      if (typeof address === 'string' || address === null) {
        reject(new Error('Failed to get server port'));
        return;
      }

      const serverPort = address.port;
      const serverUrl = `http://localhost:${serverPort}`;

      resolve({
        url: serverUrl,
        port: serverPort,
        close: () =>
          new Promise((resolveClose) => {
            server.close(() => resolveClose());
          }),
        getRequestCount: () => requestCount,
        getLastRequest: () => lastRequest,
        reset: () => {
          requestCount = 0;
          lastRequest = null;
        },
      });
    });

    server.on('error', reject);
  });
}

export default createMockOllamaServer;
