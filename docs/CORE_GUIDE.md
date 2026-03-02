# Ollama Code Core - Complete Developer Guide

> Core library for building AI-powered coding assistants with local LLM support through Ollama.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Components](#core-components)
5. [Ollama Client](#ollama-client)
6. [Tool System](#tool-system)
7. [Plugin System](#plugin-system)
8. [Streaming](#streaming)
9. [Caching](#caching)
10. [LSP Integration](#lsp-integration)
11. [MCP Support](#mcp-support)
12. [Subagents](#subagents)
13. [API Reference](#api-reference)
14. [Best Practices](#best-practices)

---

## Overview

Ollama Code Core (`@ollama-code/ollama-code-core`) is the foundational library that powers Ollama Code CLI and Web UI. It provides a comprehensive set of tools and utilities for building AI-powered coding assistants with local LLM support.

### Key Features

| Feature | Description |
|---------|-------------|
| **Native Ollama Client** | Direct REST API communication with Ollama |
| **Streaming Support** | Real-time token-by-token output |
| **Context Caching** | KV-cache reuse for faster responses |
| **Tool System** | 30+ built-in tools for code operations |
| **Plugin System** | Extensible architecture with sandboxing |
| **LSP Integration** | Language Server Protocol support |
| **MCP Support** | Model Context Protocol integration |
| **Subagents** | Multi-agent orchestration |
| **Observability** | Metrics, tracing, and logging |

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Application Layer (CLI/Web UI)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Config     │  │   Models     │  │     Content Generator    │  │
│  │   System     │  │   Registry   │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Tool System │  │   Plugin     │  │     Subagent Manager     │  │
│  │              │  │   Manager    │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                        Core Services                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Cache      │  │   Stream     │  │     Observability        │  │
│  │   Manager    │  │   Control    │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                        Ollama Native Client                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   HTTP       │  │   Context    │  │     Embedding            │  │
│  │   Client     │  │   Client     │  │     Client               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Ollama Server  │
                    │ (localhost:11434)│
                    └─────────────────┘
```

---

## Installation

### Package Installation

```bash
# npm
npm install @ollama-code/ollama-code-core

# pnpm
pnpm add @ollama-code/ollama-code-core

# yarn
yarn add @ollama-code/ollama-code-core
```

### Peer Dependencies

The core package requires the following peer dependencies:

```json
{
  "peerDependencies": {
    "node": ">=20"
  },
  "optionalDependencies": {
    "@lydell/node-pty": "1.1.0"
  }
}
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

---

## Quick Start

### Basic Usage

```typescript
import {
  OllamaNativeClient,
  createOllamaNativeClient
} from '@ollama-code/ollama-code-core';

// Create client
const client = createOllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  timeout: 300000, // 5 minutes
});

// List available models
const { models } = await client.listModels();
console.log('Available models:', models.map(m => m.name));

// Generate text with streaming
await client.generate({
  model: 'llama3.2',
  prompt: 'Write a hello world program in TypeScript',
  stream: true,
}, (chunk) => {
  process.stdout.write(chunk.response ?? '');
});
```

### Chat with History

```typescript
import { OllamaChat } from '@ollama-code/ollama-code-core';

const chat = new OllamaChat({
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2',
});

// Add system message
chat.addSystemMessage('You are a helpful coding assistant.');

// Send user message with streaming
const response = await chat.sendMessage('Write a function to sort an array', {
  stream: true,
  onChunk: (chunk) => {
    process.stdout.write(chunk.message?.content ?? '');
  },
});

console.log('\nResponse:', response.message.content);
```

### Using Tools

```typescript
import {
  ToolRegistry,
  ReadFileTool,
  WriteFileTool,
  ShellTool,
} from '@ollama-code/ollama-code-core';

// Create tool registry
const registry = new ToolRegistry();

// Register tools
registry.registerTool(new ReadFileTool(config));
registry.registerTool(new WriteFileTool(config));
registry.registerTool(new ShellTool(config));

// Execute tool
const result = await registry.executeTool('read_file', {
  path: '/src/index.ts',
});

console.log(result.llmContent);
```

---

## Core Components

### Configuration System

The configuration system manages all settings and provides a unified interface for accessing configuration values.

```typescript
import { Config, createConfig } from '@ollama-code/ollama-code-core';

const config = await createConfig({
  model: 'llama3.2',
  ollamaUrl: 'http://localhost:11434',
  projectId: 'my-project',
});

// Access configuration
const model = config.getModel();
const url = config.getOllamaUrl();
const sessionId = config.getSessionId();
```

### Model Registry

The model registry manages model definitions and capabilities.

```typescript
import {
  ModelRegistry,
  getModelCapabilities,
  supportsTools,
  supportsVision,
} from '@ollama-code/ollama-code-core';

// Get model capabilities
const caps = getModelCapabilities('llama3.2');
console.log('Supports tools:', caps.supportsTools);
console.log('Supports vision:', caps.supportsVision);
console.log('Context window:', caps.contextWindow);

// Check specific capabilities
if (supportsTools('llama3.2')) {
  // Enable tool calling
}

if (supportsVision('llava')) {
  // Enable image processing
}
```

### Content Generator

The content generator provides a high-level interface for generating content.

```typescript
import {
  HybridContentGenerator,
  createHybridContentGenerator,
} from '@ollama-code/ollama-code-core';

const generator = createHybridContentGenerator({
  model: 'llama3.2',
  baseUrl: 'http://localhost:11434',
});

// Generate content
for await (const chunk of generator.generateStream({
  prompt: 'Explain TypeScript generics',
})) {
  process.stdout.write(chunk.text);
}
```

---

## Ollama Client

### Native Client

The `OllamaNativeClient` provides direct access to Ollama's REST API.

```typescript
import { OllamaNativeClient } from '@ollama-code/ollama-code-core';

const client = new OllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  timeout: 300000,
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### API Methods

#### List Models

```typescript
const { models } = await client.listModels();

models.forEach(model => {
  console.log(`- ${model.name}`);
  console.log(`  Size: ${model.size} bytes`);
  console.log(`  Modified: ${model.modified_at}`);
});
```

#### Show Model Info

```typescript
const info = await client.showModel({ name: 'llama3.2' });

console.log('License:', info.license);
console.log('Template:', info.template);
console.log('Parameters:', info.parameters);
```

#### Generate (Streaming)

```typescript
await client.generate({
  model: 'llama3.2',
  prompt: 'Write a poem about coding',
  stream: true,
  options: {
    temperature: 0.7,
    top_p: 0.9,
    num_predict: 500,
  },
}, (chunk) => {
  process.stdout.write(chunk.response ?? '');
});
```

#### Chat (Streaming)

```typescript
await client.chat({
  model: 'llama3.2',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is TypeScript?' },
  ],
  stream: true,
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' },
          },
          required: ['location'],
        },
      },
    },
  ],
}, (chunk) => {
  if (chunk.message?.content) {
    process.stdout.write(chunk.message.content);
  }
  if (chunk.message?.tool_calls) {
    console.log('Tool calls:', chunk.message.tool_calls);
  }
});
```

#### Embeddings

```typescript
const { embedding } = await client.embed({
  model: 'nomic-embed-text',
  input: 'Hello, world!',
});

console.log('Embedding dimension:', embedding.length);
```

#### Pull Model

```typescript
await client.pull({
  name: 'llama3.2',
  stream: true,
}, (progress) => {
  console.log(`Status: ${progress.status}`);
  if (progress.completed && progress.total) {
    const percent = (progress.completed / progress.total * 100).toFixed(1);
    console.log(`Progress: ${percent}%`);
  }
});
```

### Context Client

The context client provides KV-cache reuse for faster responses.

```typescript
import { OllamaContextClient } from '@ollama-code/ollama-code-core';

const contextClient = new OllamaContextClient({
  baseUrl: 'http://localhost:11434',
});

// First request - creates context
const result1 = await contextClient.generate({
  model: 'llama3.2',
  sessionId: 'chat-1',
  prompt: 'Hello!',
});

console.log('Context created:', result1.context);

// Second request - reuses context (faster!)
const result2 = await contextClient.generate({
  model: 'llama3.2',
  sessionId: 'chat-1',
  prompt: 'How are you?',
  context: result1.context, // Pass previous context
});
```

---

## Tool System

### Overview

The tool system provides a comprehensive set of tools for code operations.

### Built-in Tools

| Tool | Category | Description |
|------|----------|-------------|
| `read_file` | File | Read file contents |
| `write_file` | File | Write file contents |
| `edit_file` | File | Edit files with diff/patch |
| `list_directory` | File | List directory contents |
| `glob` | File | Find files by pattern |
| `grep` | Search | Search file contents |
| `ripGrep` | Search | Fast search with ripgrep |
| `shell` | Execute | Execute shell commands |
| `task` | Agent | Create subagents |
| `web_fetch` | Network | Fetch web content |
| `web_search` | Network | Search the web |
| `memory` | State | Manage memory |
| `skill` | AI | Execute AI skills |
| `lsp` | Code | Language Server Protocol |
| `mcp` | Integration | MCP tools |

### Creating Custom Tools

```typescript
import {
  BaseDeclarativeTool,
  ToolInvocation,
  ToolResult,
  Kind,
} from '@ollama-code/ollama-code-core';

// Define parameters interface
interface MyToolParams {
  input: string;
  options?: {
    verbose?: boolean;
  };
}

// Define invocation
class MyToolInvocation implements ToolInvocation<MyToolParams, ToolResult> {
  constructor(readonly params: MyToolParams) {}

  getDescription(): string {
    return `Processing: ${this.params.input}`;
  }

  toolLocations() {
    return [];
  }

  async shouldConfirmExecute(): Promise<false> {
    return false; // No confirmation needed
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    // Implement tool logic
    const result = await processData(this.params.input);

    return {
      llmContent: result,
      returnDisplay: `Processed: ${this.params.input}`,
    };
  }
}

// Define tool
class MyTool extends BaseDeclarativeTool<MyToolParams, ToolResult> {
  constructor() {
    super(
      'my_tool',           // name
      'My Tool',           // displayName
      'Process data',      // description
      Kind.Other,          // kind
      {                    // JSON schema
        type: 'object',
        properties: {
          input: { type: 'string' },
          options: {
            type: 'object',
            properties: {
              verbose: { type: 'boolean' },
            },
          },
        },
        required: ['input'],
      },
      true,                // isOutputMarkdown
      false,               // canUpdateOutput
    );
  }

  protected createInvocation(params: MyToolParams): ToolInvocation<MyToolParams, ToolResult> {
    return new MyToolInvocation(params);
  }
}
```

### Tool Registry

```typescript
import { ToolRegistry } from '@ollama-code/ollama-code-core';

const registry = new ToolRegistry();

// Register tool
registry.registerTool(new MyTool());

// List tools
const tools = registry.listTools();
console.log('Available tools:', tools.map(t => t.name));

// Execute tool
const result = await registry.executeTool('my_tool', {
  input: 'test data',
  options: { verbose: true },
});
```

---

## Plugin System

### Overview

The plugin system enables extensibility through custom plugins.

### Plugin Structure

```
my-plugin/
├── plugin.json           # Plugin manifest
├── src/
│   ├── index.ts         # Entry point
│   ├── tools/           # Custom tools
│   │   └── myTool.ts
│   ├── commands/        # Custom commands
│   │   └── myCommand.ts
│   └── skills/          # AI skills
│       └── mySkill.md
└── package.json
```

### Plugin Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin",
  "main": "dist/index.js",
  "tools": ["tools/*.js"],
  "commands": ["commands/*.js"],
  "skills": ["skills/*.md"],
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": { "type": "string" }
    }
  }
}
```

### Plugin Loader

```typescript
import { PluginLoader, PluginManager } from '@ollama-code/ollama-code-core';

const loader = new PluginLoader(config);
const manager = new PluginManager(config);

// Discover plugins
const plugins = await loader.discoverAll();

// Register plugins
for (const plugin of plugins) {
  await manager.registerPlugin(plugin);
}

// Enable plugin
await manager.enablePlugin('my-plugin');

// Disable plugin
await manager.disablePlugin('my-plugin');
```

### Plugin Sandbox

Plugins can be sandboxed for security:

```typescript
import { PluginSandbox } from '@ollama-code/ollama-code-core';

const sandbox = new PluginSandbox({
  allowedPaths: ['/project/src'],
  deniedPaths: ['/project/.env'],
  allowedCommands: ['npm', 'git'],
  networkAccess: false,
});

await sandbox.execute(plugin, 'method', args);
```

---

## Streaming

### Overview

The streaming module provides robust streaming capabilities with backpressure control and cancellation.

### Streaming Controller

```typescript
import { StreamingController } from '@ollama-code/ollama-code-core';

const controller = new StreamingController({
  highWaterMark: 1024 * 1024, // 1MB buffer
  pauseThreshold: 0.8,        // Pause at 80% capacity
});

// Write chunks
controller.write(chunk1);
controller.write(chunk2);

// Read chunks
for await (const chunk of controller) {
  process.stdout.write(chunk);
}

// End stream
controller.end();
```

### Cancellation

```typescript
import { CancellationTokenSource } from '@ollama-code/ollama-code-core';

const source = new CancellationTokenSource({
  timeout: 30000, // 30 second timeout
});

const token = source.token;

// Check cancellation
if (token.isCancellationRequested) {
  throw new Error('Cancelled');
}

// Pass to async operation
await fetchData({
  signal: token.toAbortSignal(),
});

// Cancel on demand
source.cancel('User requested cancellation');
```

### Backpressure Control

```typescript
import { BackpressureController } from '@ollama-code/ollama-code-core';

const backpressure = new BackpressureController({
  maxSize: 10 * 1024 * 1024, // 10MB max buffer
  strategy: 'drop-oldest',    // When buffer is full
});

// Check before writing
if (backpressure.shouldPause()) {
  await backpressure.waitForDrain();
}

backpressure.write(data);
```

---

## Caching

### Context Caching

Context caching enables KV-cache reuse through Ollama's context API.

```typescript
import { ContextCacheManager } from '@ollama-code/ollama-code-core';

const cacheManager = new ContextCacheManager({
  maxSize: 100,        // Max 100 cached contexts
  ttl: 30 * 60 * 1000, // 30 minute TTL
});

// Store context
await cacheManager.store('session-1', {
  model: 'llama3.2',
  context: [1, 2, 3, 4, 5],
  prompt: 'Hello!',
});

// Retrieve context
const cached = await cacheManager.retrieve('session-1');
if (cached) {
  console.log('Using cached context:', cached.context);
}
```

### Tool Result Caching

```typescript
import { ToolResultCache } from '@ollama-code/ollama-code-core';

const toolCache = new ToolResultCache({
  maxSize: 1000,
  ttl: 60 * 60 * 1000, // 1 hour
});

// Cache tool result
const cacheKey = toolCache.generateKey('read_file', { path: '/src/index.ts' });
await toolCache.set(cacheKey, result);

// Get cached result
const cached = await toolCache.get(cacheKey);
```

### Embedding Cache

```typescript
import { EmbeddingCache } from '@ollama-code/ollama-code-core';

const embeddingCache = new EmbeddingCache({
  maxSize: 10000,
});

// Cache embedding
await embeddingCache.set('Hello, world!', embedding);

// Get cached embedding
const cached = await embeddingCache.get('Hello, world!');
```

---

## LSP Integration

### Overview

The LSP module provides Language Server Protocol integration for code intelligence.

### LSP Client

```typescript
import { NativeLspClient, LspConnectionFactory } from '@ollama-code/ollama-code-core';

// Create LSP client
const lspClient = new NativeLspClient({
  serverCommand: ['typescript-language-server', '--stdio'],
  initializationOptions: {
    preferences: {
      includeInlayParameterNameHints: 'all',
    },
  },
});

// Start server
await lspClient.start();

// Get completions
const completions = await lspClient.getCompletions({
  file: '/src/index.ts',
  line: 10,
  character: 5,
});

// Get definitions
const definitions = await lspClient.getDefinition({
  file: '/src/index.ts',
  line: 10,
  character: 5,
});

// Get hover info
const hover = await lspClient.getHover({
  file: '/src/index.ts',
  line: 10,
  character: 5,
});

// Shutdown
await lspClient.shutdown();
```

### LSP Service

```typescript
import { NativeLspService } from '@ollama-code/ollama-code-core';

const lspService = new NativeLspService({
  servers: {
    typescript: {
      command: ['typescript-language-server', '--stdio'],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    python: {
      command: ['pylsp'],
      extensions: ['.py'],
    },
  },
});

// Auto-detect and use appropriate server
const result = await lspService.getCompletions({
  file: '/src/app.ts',
  line: 10,
  character: 5,
});
```

---

## MCP Support

### Overview

Model Context Protocol (MCP) enables integration with external tools and services.

### MCP Client

```typescript
import { MCPClient } from '@ollama-code/ollama-code-core';

const mcpClient = new MCPClient({
  server: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/project'],
  },
  name: 'filesystem',
});

// Connect to server
await mcpClient.connect();

// List available tools
const tools = await mcpClient.listTools();

// Call tool
const result = await mcpClient.callTool('read_file', {
  path: '/src/index.ts',
});

// List resources
const resources = await mcpClient.listResources();

// Read resource
const content = await mcpClient.readResource('file:///src/index.ts');

// Disconnect
await mcpClient.disconnect();
```

### OAuth Authentication

```typescript
import { MCPOAuthProvider, KeychainTokenStorage } from '@ollama-code/ollama-code-core';

const auth = new MCPOAuthProvider({
  clientId: 'my-client-id',
  authorizationEndpoint: 'https://example.com/oauth/authorize',
  tokenEndpoint: 'https://example.com/oauth/token',
  scopes: ['read', 'write'],
  storage: new KeychainTokenStorage('my-app'),
});

// Start OAuth flow
await auth.authenticate();

// Check if authenticated
if (await auth.isAuthenticated()) {
  const tokens = await auth.getTokens();
  console.log('Access token:', tokens.accessToken);
}

// Sign out
await auth.signOut();
```

---

## Subagents

### Overview

Subagents are specialized AI agents that can handle complex tasks.

### Subagent Manager

```typescript
import { SubagentManager, Subagent } from '@ollama-code/ollama-code-core';

const manager = new SubagentManager(config);

// Create subagent
const agent = await manager.createAgent({
  name: 'code-reviewer',
  description: 'Reviews code for quality and bugs',
  systemPrompt: 'You are a code reviewer...',
  tools: ['read_file', 'grep', 'lsp'],
  model: 'llama3.2',
});

// Execute task
const result = await agent.execute({
  task: 'Review the authentication module',
  context: 'Review /src/auth for security issues',
});

console.log(result.output);
console.log(result.stats);
```

### Built-in Agents

```typescript
import { BuiltinAgents } from '@ollama-code/ollama-code-core';

// List built-in agents
const agents = BuiltinAgents.list();
// [
//   { name: 'architect', description: '...' },
//   { name: 'debugger', description: '...' },
//   { name: 'tester', description: '...' },
// ]

// Get agent definition
const architectDef = BuiltinAgents.get('architect');
```

### Custom Agents

```typescript
import { Subagent, SubagentHooks } from '@ollama-code/ollama-code-core';

class MyCustomAgent extends Subagent {
  constructor(config) {
    super({
      name: 'my-custom-agent',
      description: 'Custom agent for specific tasks',
      systemPrompt: '...',
      tools: ['read_file', 'write_file', 'shell'],
    });
  }

  // Custom hooks
  hooks: SubagentHooks = {
    onToolCall: async (toolName, args) => {
      console.log(`Tool called: ${toolName}`);
    },
    onMessage: async (message) => {
      console.log(`Message: ${message}`);
    },
    onComplete: async (result) => {
      console.log(`Completed with status: ${result.status}`);
    },
  };
}
```

---

## API Reference

### OllamaNativeClient

```typescript
class OllamaNativeClient {
  constructor(config: {
    baseUrl?: string;      // default: 'http://localhost:11434'
    timeout?: number;      // default: 300000 (5 min)
    headers?: Record<string, string>;
  });

  // Model management
  listModels(): Promise<OllamaTagsResponse>;
  showModel(req: OllamaShowRequest): Promise<OllamaShowResponse>;
  pullModel(req: OllamaPullRequest, onProgress?: ProgressCallback): Promise<void>;
  pushModel(req: OllamaPushRequest, onProgress?: ProgressCallback): Promise<void>;
  copyModel(req: OllamaCopyRequest): Promise<void>;
  deleteModel(req: OllamaDeleteRequest): Promise<void>;

  // Generation
  generate(req: OllamaGenerateRequest, onChunk?: StreamCallback): Promise<OllamaGenerateResponse>;
  chat(req: OllamaChatRequest, onChunk?: StreamCallback): Promise<OllamaChatResponse>;
  embed(req: OllamaEmbedRequest): Promise<OllamaEmbedResponse>;
  embeddings(req: OllamaEmbeddingsRequest): Promise<OllamaEmbeddingsResponse>;

  // Running models
  listRunning(): Promise<OllamaPsResponse>;

  // Version
  version(): Promise<OllamaVersionResponse>;
}
```

### ToolRegistry

```typescript
class ToolRegistry {
  registerTool(tool: AnyDeclarativeTool): void;
  unregisterTool(name: string): void;
  getTool(name: string): AnyDeclarativeTool | undefined;
  listTools(): AnyDeclarativeTool[];
  executeTool(name: string, params: object): Promise<ToolResult>;
}
```

### SubagentManager

```typescript
class SubagentManager {
  createAgent(config: SubagentConfig): Promise<Subagent>;
  getAgent(name: string): Subagent | undefined;
  listAgents(): Subagent[];
  deleteAgent(name: string): void;
}
```

---

## Best Practices

### Error Handling

```typescript
import { ToolErrorType } from '@ollama-code/ollama-code-core';

try {
  const result = await tool.execute(signal);
} catch (error) {
  if (error.type === ToolErrorType.FILE_NOT_FOUND) {
    console.log('File not found');
  } else if (error.type === ToolErrorType.PERMISSION_DENIED) {
    console.log('Permission denied');
  } else {
    throw error;
  }
}
```

### Resource Cleanup

```typescript
// Use AbortController for cleanup
const controller = new AbortController();

try {
  await client.chat({
    model: 'llama3.2',
    messages: [...],
    signal: controller.signal,
  });
} finally {
  controller.abort();
}
```

### Memory Management

```typescript
// Compress context when it grows large
if (context.length > 10000) {
  context = await compressContext(context);
}

// Clear caches periodically
cacheManager.clear();
```

### Concurrent Operations

```typescript
// Use mutex for shared state
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

async function safeOperation() {
  const release = await mutex.acquire();
  try {
    // Critical section
  } finally {
    release();
  }
}
```

---

## License

Apache License 2.0
