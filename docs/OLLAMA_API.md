# Ollama Native API Integration

This project provides a native Ollama API client for direct communication with the Ollama server.

## Supported API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/version` | GET | Get Ollama version |
| `/api/tags` | GET | List local models |
| `/api/show` | POST | Show model information |
| `/api/ps` | GET | List running models |
| `/api/generate` | POST | Generate text from prompt |
| `/api/chat` | POST | Chat with model |
| `/api/embed` | POST | Generate embeddings |
| `/api/pull` | POST | Pull a model |
| `/api/push` | POST | Push a model |
| `/api/copy` | POST | Copy a model |
| `/api/delete` | DELETE | Delete a model |

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
});

// List models
const { models } = await client.listModels();
console.log('Available models:', models.map(m => m.name));

// Show model info
const info = await client.showModel('qwen3-coder:30b');
console.log('Model details:', info.details);

// Generate text (non-streaming)
const response = await client.generate({
  model: 'qwen3-coder:30b',
  prompt: 'Write a hello world in Python.',
  stream: false,
});
console.log(response.response);

// Generate text (streaming)
await client.generate(
  {
    model: 'qwen3-coder:30b',
    prompt: 'Write a hello world in Python.',
    stream: true,
  },
  (chunk) => {
    process.stdout.write(chunk.response);
  }
);

// Chat (non-streaming)
const chatResponse = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: 'Write a function to reverse a string in JavaScript.' },
  ],
  stream: false,
});
console.log(chatResponse.message.content);

// Chat (streaming)
await client.chat(
  {
    model: 'qwen3-coder:30b',
    messages: [
      { role: 'user', content: 'Hello!' },
    ],
    stream: true,
  },
  (chunk) => {
    if (chunk.message?.content) {
      process.stdout.write(chunk.message.content);
    }
  }
);
```

### With Tools (Function Calling)

```typescript
const response = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [
    { role: 'user', content: 'What is the weather in Tokyo?' },
  ],
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
  stream: false,
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
  stream: false,
  options: {
    temperature: 0.7,      // Randomness (0-1)
    top_p: 0.9,            // Nucleus sampling
    top_k: 40,             // Top-k sampling
    num_predict: 256,      // Max tokens to generate
    num_ctx: 4096,         // Context window size
    stop: ['\n\n'],        // Stop sequences
    seed: 42,              // For reproducibility
  },
});
```

## Configuration

### Environment Variables

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=300000
```

### Settings File (~/.ollama-code/settings.json)

```json
{
  "model": "qwen3-coder:30b",
  "baseUrl": "http://localhost:11434"
}
```

## Error Handling

```typescript
try {
  const response = await client.generate({
    model: 'qwen3-coder:30b',
    prompt: 'Hello',
  });
} catch (error) {
  if (error.message.includes('model')) {
    console.log('Model not found. Try pulling it first:');
    await client.pullModel('qwen3-coder:30b');
  } else {
    throw error;
  }
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
  config?: Config;      // Optional config for advanced settings
})
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getVersion()` | - | `Promise<OllamaVersionResponse>` | Get Ollama version |
| `listModels()` | - | `Promise<OllamaTagsResponse>` | List local models |
| `showModel(model)` | `string \| OllamaShowRequest` | `Promise<OllamaShowResponse>` | Show model info |
| `listRunningModels()` | - | `Promise<OllamaPsResponse>` | List running models |
| `generate(request, callback?)` | `OllamaGenerateRequest, StreamCallback?` | `Promise<OllamaGenerateResponse>` | Generate text |
| `chat(request, callback?)` | `OllamaChatRequest, StreamCallback?` | `Promise<OllamaChatResponse>` | Chat with model |
| `embed(request)` | `OllamaEmbedRequest` | `Promise<OllamaEmbedResponse>` | Generate embeddings |
| `pullModel(name, callback?)` | `string, ProgressCallback?` | `Promise<void>` | Pull a model |
| `pushModel(name, callback?)` | `string, ProgressCallback?` | `Promise<void>` | Push a model |
| `copyModel(source, dest)` | `string, string` | `Promise<void>` | Copy a model |
| `deleteModel(model)` | `string` | `Promise<void>` | Delete a model |
| `isServerRunning()` | - | `Promise<boolean>` | Check if server is running |
| `isModelAvailable(name)` | `string` | `Promise<boolean>` | Check if model exists |
| `ensureModelAvailable(name, callback?)` | `string, ProgressCallback?` | `Promise<void>` | Pull model if needed |
