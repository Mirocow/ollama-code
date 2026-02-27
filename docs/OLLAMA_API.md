# Ollama Native API Integration

This project provides a native Ollama API client for direct communication with the Ollama server.

## Supported API Endpoints

| Endpoint        | Method | Description               |
| --------------- | ------ | ------------------------- |
| `/api/version`  | GET    | Get Ollama version        |
| `/api/tags`     | GET    | List local models         |
| `/api/show`     | POST   | Show model information    |
| `/api/ps`       | GET    | List running models       |
| `/api/generate` | POST   | Generate text from prompt |
| `/api/chat`     | POST   | Chat with model           |
| `/api/embed`    | POST   | Generate embeddings       |
| `/api/pull`     | POST   | Pull a model              |
| `/api/push`     | POST   | Push a model              |
| `/api/copy`     | POST   | Copy a model              |
| `/api/delete`   | DELETE | Delete a model            |

## Quick Start

### Using the CLI

```bash
# Build the project
npm run build

# Run the CLI
node packages/cli/dist/index.js
```

### Testing the API

```bash
# Test with curl (from project root)
bash scripts/test-ollama-api.sh qwen3-coder:30b

# Or test with Node.js (from packages/core)
npm run test:ollama
```

### Using curl

```bash
# Get version
curl http://localhost:11434/api/version

# List models
curl http://localhost:11434/api/tags

# Show model info
curl http://localhost:11434/api/show -d '{"model": "qwen3-coder:30b"}'

# Generate text (non-streaming)
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3-coder:30b",
  "prompt": "Why is the sky blue?",
  "stream": false
}'

# Generate text (streaming)
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3-coder:30b",
  "prompt": "Why is the sky blue?",
  "stream": true
}'

# Chat (non-streaming)
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3-coder:30b",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": false
}'

# Chat (streaming)
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3-coder:30b",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true
}'
```

## Programmatic Usage

### Basic Usage

```typescript
import { createOllamaNativeClient } from '@ollama-code/ollama-code-core';

const client = createOllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  keepAlive: '5m', // Default keep_alive for all requests
  timeout: 300000, // Request timeout (5 minutes)
  retry: {
    // Retry configuration
    maxRetries: 3,
    retryDelayMs: 1000,
  },
});

// List models
const { models } = await client.listModels();
console.log(
  'Available models:',
  models.map((m) => m.name),
);

// Show model info
const info = await client.showModel('qwen3-coder:30b');
console.log('Model details:', info.details);

// Generate text (non-streaming)
const response = await client.generate({
  model: 'qwen3-coder:30b',
  prompt: 'Write a hello world in Python.',
});
console.log(response.response);

// Generate text (streaming)
await client.generate(
  {
    model: 'qwen3-coder:30b',
    prompt: 'Write a hello world in Python.',
  },
  (chunk) => {
    process.stdout.write(chunk.response);
  },
);

// Chat (non-streaming)
const chatResponse = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [
    { role: 'system', content: 'You are a helpful coding assistant.' },
    {
      role: 'user',
      content: 'Write a function to reverse a string in JavaScript.',
    },
  ],
});
console.log(chatResponse.message.content);

// Chat (streaming)
await client.chat(
  {
    model: 'qwen3-coder:30b',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  (chunk) => {
    if (chunk.message?.content) {
      process.stdout.write(chunk.message.content);
    }
  },
);
```

### With Tools (Function Calling)

```typescript
const response = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city name',
            },
          },
          required: ['location'],
        },
      },
    },
  ],
});

// Check for tool calls
if (response.message.tool_calls) {
  for (const toolCall of response.message.tool_calls) {
    console.log('Tool:', toolCall.function.name);
    console.log('Args:', toolCall.function.arguments);
  }
}
```

### Model Options

```typescript
const response = await client.generate({
  model: 'qwen3-coder:30b',
  prompt: 'Write code to sort an array.',
  options: {
    temperature: 0.7, // Randomness (0-1)
    top_p: 0.9, // Nucleus sampling
    top_k: 40, // Top-k sampling
    num_predict: 256, // Max tokens to generate
    num_ctx: 4096, // Context window size
    stop: ['\n\n'], // Stop sequences
    seed: 42, // For reproducibility
  },
});
```

### Keep Alive

Control how long models stay loaded in memory:

```typescript
// Client-level default (5 minutes)
const client = createOllamaNativeClient({
  keepAlive: '5m', // Default for all requests
});

// Per-request override
await client.chat(
  {
    model: 'llama3.2',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  undefined,
  { keepAlive: '10m' }, // Override for this request
);

// Keep model loaded indefinitely
await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'Hello!' }],
  keep_alive: -1,
});

// Unload model immediately after request
await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'Hello!' }],
  keep_alive: 0,
});

// Utility methods
await client.unloadModel('llama3.2'); // Unload immediately
await client.keepModelLoaded('llama3.2', '10m'); // Keep loaded for 10 minutes
```

### Retry Configuration

Automatic retry with exponential backoff:

```typescript
const client = createOllamaNativeClient({
  retry: {
    maxRetries: 3, // Maximum retry attempts
    retryDelayMs: 1000, // Initial delay (exponential backoff)
    retryOnErrors: [
      // Errors that trigger retry
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'network error',
    ],
  },
});

// Per-request override
await client.generate({ model: 'llama3.2', prompt: 'Hello' }, undefined, {
  retry: { maxRetries: 5 },
});
```

### Request Cancellation

Cancel long-running requests using AbortSignal:

```typescript
const controller = new AbortController();

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000);

try {
  const response = await client.generate(
    {
      model: 'llama3.2',
      prompt: 'Write a very long story...',
    },
    undefined,
    { signal: controller.signal },
  );
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

## Error Handling

### Error Types

```typescript
import {
  OllamaApiError,
  OllamaConnectionError,
  OllamaModelNotFoundError,
  OllamaTimeoutError,
  OllamaAbortError,
  OllamaContextLengthError,
  OllamaResourceError,
  detectOllamaError,
  getFriendlyOllamaErrorMessage,
} from '@ollama-code/ollama-code-core';

try {
  const response = await client.generate({
    model: 'unknown-model',
    prompt: 'Hello',
  });
} catch (error) {
  const ollamaError = detectOllamaError(error, { modelName: 'unknown-model' });

  if (ollamaError instanceof OllamaModelNotFoundError) {
    console.log('Model not found. Run: ollama pull unknown-model');
  } else if (ollamaError instanceof OllamaConnectionError) {
    console.log('Cannot connect to Ollama. Is it running?');
  } else if (ollamaError instanceof OllamaTimeoutError) {
    console.log('Request timed out');
  } else if (ollamaError instanceof OllamaContextLengthError) {
    console.log('Context too long. Start a new conversation.');
  } else if (ollamaError instanceof OllamaResourceError) {
    console.log('Not enough GPU memory');
  }

  // User-friendly message
  console.log(getFriendlyOllamaErrorMessage(error));
}
```

### Error Detection

```typescript
// Automatic error detection from Ollama responses
try {
  await client.chat({ model: 'missing-model', messages: [...] });
} catch (error) {
  const detected = detectOllamaError(error, {
    modelName: 'missing-model',
    timeoutMs: 30000,
  });

  console.log('Error code:', detected.code);
  console.log('Message:', detected.message);
  console.log('Details:', detected.details);
}
```

## Configuration

### Environment Variables

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=300000
OLLAMA_KEEP_ALIVE=5m
OLLAMA_API_KEY=your-api-key  # Optional for remote instances
```

### Settings File (~/.ollama-code/settings.json)

```json
{
  "model": "qwen3-coder:30b",
  "baseUrl": "http://localhost:11434",
  "timeout": 300000,
  "keepAlive": "5m"
}
```

## Testing

### Run All Tests

```bash
# Shell script test (requires Ollama running)
bash scripts/test-ollama-api.sh qwen3-coder:30b

# Node.js test
cd packages/core
npm run test:ollama
```

### Unit Tests

```bash
cd packages/core
npm test -- src/core/ollamaNativeClient.test.ts
```

## API Reference

### OllamaNativeClient

#### Constructor

```typescript
new OllamaNativeClient(options?: {
  baseUrl?: string;     // Default: http://localhost:11434
  timeout?: number;     // Default: 300000 (5 minutes)
  keepAlive?: string | number;  // Default: '5m'
  retry?: Partial<RetryConfig>; // Retry configuration
  config?: Config;      // Optional config for advanced settings
})
```

#### Methods

| Method                                   | Parameters                                                | Returns                           | Description                |
| ---------------------------------------- | --------------------------------------------------------- | --------------------------------- | -------------------------- |
| `getVersion()`                           | -                                                         | `Promise<OllamaVersionResponse>`  | Get Ollama version         |
| `listModels()`                           | -                                                         | `Promise<OllamaTagsResponse>`     | List local models          |
| `showModel(model)`                       | `string \| OllamaShowRequest`                             | `Promise<OllamaShowResponse>`     | Show model info            |
| `listRunningModels()`                    | -                                                         | `Promise<OllamaPsResponse>`       | List running models        |
| `generate(request, callback?, options?)` | `OllamaGenerateRequest, StreamCallback?, RequestOptions?` | `Promise<OllamaGenerateResponse>` | Generate text              |
| `chat(request, callback?, options?)`     | `OllamaChatRequest, StreamCallback?, RequestOptions?`     | `Promise<OllamaChatResponse>`     | Chat with model            |
| `embed(request)`                         | `OllamaEmbedRequest`                                      | `Promise<OllamaEmbedResponse>`    | Generate embeddings        |
| `pullModel(name, callback?)`             | `string, ProgressCallback?`                               | `Promise<void>`                   | Pull a model               |
| `pushModel(name, callback?)`             | `string, ProgressCallback?`                               | `Promise<void>`                   | Push a model               |
| `copyModel(source, dest)`                | `string, string`                                          | `Promise<void>`                   | Copy a model               |
| `deleteModel(model)`                     | `string`                                                  | `Promise<void>`                   | Delete a model             |
| `isServerRunning()`                      | -                                                         | `Promise<boolean>`                | Check if server is running |
| `isModelAvailable(name)`                 | `string`                                                  | `Promise<boolean>`                | Check if model exists      |
| `ensureModelAvailable(name, callback?)`  | `string, ProgressCallback?`                               | `Promise<void>`                   | Pull model if needed       |
| `unloadModel(name)`                      | `string`                                                  | `Promise<void>`                   | Unload model from memory   |
| `keepModelLoaded(name, duration?)`       | `string, string \| number?`                               | `Promise<void>`                   | Keep model loaded          |
| `getBaseUrl()`                           | -                                                         | `string`                          | Get configured base URL    |
| `getKeepAlive()`                         | -                                                         | `string \| number`                | Get default keep_alive     |

#### RequestOptions

```typescript
interface RequestOptions {
  signal?: AbortSignal; // For request cancellation
  keepAlive?: string | number; // Override keep_alive
  retry?: Partial<RetryConfig>; // Override retry config
}

interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  retryOnErrors: string[];
}
```

## Debugging

### VSCode Debug Configuration

The project includes ready-to-use VSCode debug configurations in `.vscode/launch.json`:

1. **Debug Ollama Code CLI** - Debug the CLI with default settings
2. **Debug Ollama Code CLI (with args)** - Debug with custom arguments
3. **Debug Current Test File** - Debug the current test file
4. **Debug Core Package** - Debug the core package tests

### Debug Logging

```typescript
import {
  createDebugLogger,
  setDebugLogSession,
} from '@ollama-code/ollama-code-core';

// Set session for logging
setDebugLogSession(session);

// Create logger with tag
const logger = createDebugLogger('OllamaClient');

logger.debug('Request started', { model: 'llama3.2' });
logger.info('Model loaded successfully');
logger.warn('Context length approaching limit');
logger.error('Request failed', error);
```

Debug logs are saved to `~/.ollama-code/debug/<session-id>.log`.

### Environment Variables for Debug

```bash
DEBUG=1                       # Enable debug mode
OLLAMA_CODE_DEBUG_LOG_FILE=1  # Enable file logging
```
