# Ollama Code Web UI

> Full-featured Next.js web interface for Ollama Code

## Overview

The Web UI package (`@ollama-code/web-app`) provides a modern web interface for interacting with Ollama models. It includes three main components:

| Component | Description |
|-----------|-------------|
| **Chat** | Real-time streaming chat with model selection |
| **Files** | File browser with Monaco editor |
| **Terminal** | Full PTY terminal via WebSocket |

## Quick Start

### Development Mode

```bash
# Navigate to web-app package
cd packages/web-app

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### With Terminal Support

For full terminal functionality, use the custom server:

```bash
# Start with WebSocket server for terminal
npm run dev:server
```

## Features

### Chat Interface

- **Streaming Responses**: Real-time token-by-token output
- **Model Selection**: Switch between available Ollama models
- **Session Management**: Multiple chat sessions with history
- **Thinking Models**: Support for reasoning models (DeepSeek R1)

```typescript
// Chat messages are streamed in real-time
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama3.2',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  }),
});

// Stream the response
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Process chunk...
}
```

### File Explorer

- **Monaco Editor**: Full-featured code editor
- **Syntax Highlighting**: Support for 20+ languages
- **File Tree**: Browse project files
- **Auto-save**: Save with keyboard shortcut (Cmd/Ctrl+S)

**Supported Languages:**

| Category | Languages |
|----------|-----------|
| Web | TypeScript, JavaScript, CSS, HTML |
| Backend | Python, Go, Rust, Java, PHP |
| Systems | C, C++, Rust |
| Config | JSON, YAML, TOML, Markdown |

### Terminal Emulator

- **Full PTY Support**: Real shell processes via WebSocket
- **xterm.js**: Professional terminal emulation
- **Resize Support**: Dynamic terminal resizing
- **256 Colors**: Full color support

```typescript
// Connect to terminal WebSocket
const socket = new WebSocket('ws://localhost:3000/terminal');

// Send input
socket.send(JSON.stringify({ type: 'input', data: 'ls -la\n' }));

// Resize terminal
socket.send(JSON.stringify({ type: 'resize', cols: 120, rows: 40 }));

// Receive output
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'output') {
    console.log(message.data);
  }
};
```

## API Routes

### `/api/models`

List available Ollama models.

**Method:** `GET`

**Response:**
```json
{
  "models": [
    {
      "name": "llama3.2:latest",
      "modified_at": "2025-01-15T12:00:00Z",
      "size": 4869431328
    }
  ]
}
```

### `/api/chat`

Chat with Ollama model with streaming support.

**Method:** `POST`

**Request:**
```json
{
  "model": "llama3.2",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": true
}
```

**Response:** NDJSON stream

### `/api/generate`

Generate text with Ollama model.

**Method:** `POST`

**Request:**
```json
{
  "model": "llama3.2",
  "prompt": "Write a hello world program",
  "stream": true
}
```

### `/api/fs`

Filesystem operations.

| Method | Description |
|--------|-------------|
| `GET` | List directory or read file |
| `POST` | Create file or directory |
| `PUT` | Write file content |
| `DELETE` | Delete file or directory |

**Example - List directory:**
```
GET /api/fs?path=/
```

**Response:**
```json
{
  "path": "/",
  "type": "directory",
  "items": [
    { "name": "src", "type": "directory", "size": 0 },
    { "name": "package.json", "type": "file", "size": 1234 }
  ]
}
```

### `/api/ollama/[...path]`

Proxy for all Ollama API requests.

**Example:**
```
GET /api/ollama/tags      → Ollama /api/tags
POST /api/ollama/show     → Ollama /api/show
POST /api/ollama/embed    → Ollama /api/embed
```

## Terminal Server

The terminal server provides WebSocket-based PTY access.

### Configuration

```typescript
interface TerminalServerConfig {
  server: HttpServer;        // HTTP server to attach to
  path?: string;             // WebSocket path (default: '/terminal')
  shell?: string;            // Shell to use (default: $SHELL or 'bash')
  cols?: number;             // Initial columns (default: 80)
  rows?: number;             // Initial rows (default: 24)
  env?: Record<string, string>; // Environment variables
  cwd?: string;              // Working directory
  maxSessionsPerIp?: number; // Max sessions per IP (default: 5)
  sessionTimeout?: number;   // Timeout in ms (default: 30 minutes)
}
```

### Message Protocol

**Client → Server:**

```typescript
// Input
{ type: 'input', data: 'ls -la\n' }

// Resize
{ type: 'resize', cols: 120, rows: 40 }

// Ping
{ type: 'ping' }
```

**Server → Client:**

```typescript
// Output
{ type: 'output', data: 'file1.txt\nfile2.txt\n' }

// Process exited
{ type: 'exit', code: 0 }

// Error
{ type: 'error', data: 'Maximum sessions reached' }
```

### Session Management

- **IP Limits**: Maximum 5 concurrent sessions per IP
- **Timeout**: Inactive sessions closed after 30 minutes
- **Cleanup**: Automatic cleanup of dead sessions

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_URL` | Ollama server URL | `http://localhost:11434` |
| `PROJECT_DIR` | Base directory for file operations | Current directory |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `localhost` |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React)                           │
├─────────────────────────────────────────────────────────────┤
│  ChatInterface │ FileExplorer │ TerminalEmulator           │
│       │              │               │                      │
│       ▼              ▼               ▼                      │
│  /api/chat    /api/fs        WebSocket (/terminal)         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                            │
├─────────────────────────────────────────────────────────────┤
│  API Routes     │ TerminalServer (PTY)                      │
│       │              │                                       │
│       ▼              ▼                                       │
│  Ollama API     Shell Process                               │
└─────────────────────────────────────────────────────────────┘
```

## Development

### Running Tests

```bash
npm run test
npm run typecheck
```

### Building for Production

```bash
npm run build
npm run start:server
```

### Adding New Features

1. Create component in `src/components/`
2. Add API route in `src/app/api/`
3. Update store if needed in `src/stores/`
4. Add types in component file or `src/types/`

## Security

### Filesystem API

- **Path Traversal Protection**: All paths resolved relative to base directory
- **No Absolute Paths**: Cannot access files outside project directory

### Terminal Server

- **IP Rate Limiting**: Max 5 sessions per IP
- **Session Timeout**: Inactive sessions cleaned up
- **No Root Access**: Runs as current user

## Troubleshooting

### Terminal Not Connecting

1. Ensure you're using `npm run dev:server` (not just `npm run dev`)
2. Check WebSocket path is `/terminal`
3. Verify node-pty is installed correctly

### File Explorer Not Loading

1. Check `PROJECT_DIR` environment variable
2. Verify directory permissions
3. Check browser console for errors

### Chat Not Streaming

1. Verify Ollama is running at `OLLAMA_URL`
2. Check model is downloaded: `ollama list`
3. Verify API proxy is working

## License

Apache License 2.0
