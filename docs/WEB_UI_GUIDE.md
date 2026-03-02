# Ollama Code Web UI - Complete Usage Guide

> Full-featured Next.js 15 web interface for Ollama Code with real-time chat, file management, and terminal emulation.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [Components](#components)
   - [Chat Interface](#chat-interface)
   - [File Explorer](#file-explorer)
   - [Terminal Emulator](#terminal-emulator)
6. [API Routes](#api-routes)
7. [Terminal Server](#terminal-server)
8. [State Management](#state-management)
9. [Configuration](#configuration)
10. [Usage Examples](#usage-examples)
11. [Security](#security)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Web UI package (`@ollama-code/web-app`) provides a modern, responsive web interface for interacting with Ollama models. Built with Next.js 15 and React 19, it offers three integrated components that work seamlessly together to provide a complete development environment powered by AI.

### Key Features

| Feature | Description |
|---------|-------------|
| **Real-time Chat** | Streaming responses with token-by-token output from Ollama models |
| **Model Selection** | Dynamic switching between available Ollama models |
| **Session Management** | Multiple chat sessions with persistent history |
| **File Management** | Browse, view, and edit project files with Monaco Editor |
| **Terminal Access** | Full PTY terminal emulation via WebSocket |
| **Dark Theme** | Modern dark theme optimized for long coding sessions |
| **Responsive Design** | Works on desktop and tablet devices |

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **State Management**: Zustand with persistence
- **Editor**: Monaco Editor (VS Code's editor)
- **Terminal**: xterm.js with PTY support
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

---

## Installation

### Prerequisites

Before installing the Web UI, ensure you have the following dependencies installed on your system:

- **Node.js**: Version 18.17 or higher (LTS recommended)
- **pnpm**: Version 8.0 or higher (package manager)
- **Ollama**: Running instance with at least one model pulled

### Installing Ollama

If you haven't installed Ollama yet, follow these steps:

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Verify Ollama is running
ollama list
```

### Installing Web UI

The Web UI is part of the Ollama Code monorepo. Install it as follows:

```bash
# Clone the repository
git clone https://github.com/ollama-code/ollama-code.git
cd ollama-code

# Install dependencies
pnpm install

# Navigate to web-app package
cd packages/web-app
```

### Development Dependencies

The Web UI requires several dependencies that are automatically installed:

| Package | Purpose |
|---------|---------|
| `next` | Next.js framework |
| `react` / `react-dom` | UI library |
| `xterm` | Terminal emulation |
| `@monaco-editor/react` | Code editor |
| `zustand` | State management |
| `node-pty` | PTY support for terminal |
| `ws` | WebSocket server |

---

## Quick Start

### Development Mode

Start the development server with hot reload:

```bash
# From packages/web-app directory
pnpm dev
```

This starts the Next.js development server on [http://localhost:3000](http://localhost:3000).

### With Terminal Support

For full terminal functionality, use the custom server that includes WebSocket support:

```bash
# Start with WebSocket server for terminal
pnpm dev:server
```

The custom server provides:
- Full PTY terminal access via WebSocket
- Real-time bidirectional communication
- Session management for multiple terminal instances

### Production Build

Build and run for production:

```bash
# Build the application
pnpm build

# Start production server with terminal support
pnpm start:server
```

### Verifying Installation

After starting the server, verify everything is working:

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Check the status indicator shows "Connected" (green)
3. Select a model from the dropdown in the sidebar
4. Send a test message to verify chat functionality
5. Switch to the Files tab to browse your project directory
6. Switch to the Terminal tab and click "Connect" to start a shell session

---

## Architecture

The Web UI follows a modern client-server architecture with real-time capabilities:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ ChatInterface│  │ FileExplorer │  │   TerminalEmulator       │  │
│  │              │  │              │  │                          │  │
│  │ - Messages   │  │ - File Tree  │  │ - xterm.js Terminal      │  │
│  │ - Model Sel. │  │ - Monaco Ed. │  │ - WebSocket Client       │  │
│  │ - Streaming  │  │ - Auto-save  │  │ - PTY Communication      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                 │
│         ▼                 ▼                        ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  /api/chat   │  │   /api/fs    │  │   WebSocket /terminal    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Server                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  API Routes  │  │  Terminal    │  │    Ollama Proxy          │  │
│  │              │  │  Server      │  │                          │  │
│  │ - /api/chat  │  │ (PTY/WS)     │  │ - /api/ollama/[...path]  │  │
│  │ - /api/fs    │  │              │  │                          │  │
│  │ - /api/models│  │              │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                 │
│         ▼                 ▼                        ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Ollama API   │  │ Shell Process│  │    Ollama Server         │  │
│  │(localhost:   │  │ (bash/zsh)   │  │ (localhost:11434)        │  │
│  │  11434)      │  │              │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Chat Flow**:
   - User types message → React state update
   - Submit → POST to `/api/chat`
   - Server proxies to Ollama → Streaming response
   - NDJSON chunks parsed → Real-time UI update

2. **File Flow**:
   - User navigates → GET `/api/fs?path=...`
   - Server reads filesystem → JSON response
   - User edits → Monaco onChange
   - User saves → PUT `/api/fs?path=...`

3. **Terminal Flow**:
   - User connects → WebSocket upgrade
   - Server spawns PTY → Shell process
   - User types → WebSocket message → PTY write
   - Shell output → PTY onData → WebSocket → Terminal write

---

## Components

### Chat Interface

The `ChatInterface` component is the primary interface for interacting with Ollama models. It provides a complete chat experience with streaming support, session management, and model selection.

#### Features

| Feature | Description |
|---------|-------------|
| **Streaming Responses** | Real-time token-by-token output from the model |
| **Model Selection** | Dropdown to switch between available Ollama models |
| **Session Management** | Create, switch between, and manage multiple chat sessions |
| **Connection Status** | Visual indicator showing connection to Ollama |
| **Stop Generation** | Abort button to stop streaming responses |
| **Thinking Models** | Support for reasoning models like DeepSeek R1 |
| **Persistent History** | Chat sessions saved to localStorage |

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Escape` | Focus input (when in chat area) |

#### Component Structure

```tsx
// Main component hierarchy
<ChatInterface>
  <aside> {/* Sidebar */}
    <ModelSelector />
    <SessionList />
    <NewChatButton />
  </aside>
  
  <main>
    <header> {/* Header with status */}
      <ConnectionStatus />
    </header>
    
    <Messages> {/* Message list */}
      {messages.map(msg => <Message key={msg.id} />)}
      <StreamingMessage />
    </Messages>
    
    <Input> {/* Message input */}
      <TextArea />
      <SendButton / StopButton />
    </Input>
  </main>
</ChatInterface>
```

#### Session State

Each chat session maintains the following state:

```typescript
interface Session {
  id: string;              // Unique session identifier
  title: string;           // Session title (from first message)
  messages: ChatMessage[]; // Message history
  model: string;           // Selected model
  createdAt: number;       // Creation timestamp
  updatedAt: number;       // Last update timestamp
  context?: number[];      // KV-cache context for optimization
}
```

#### Streaming Implementation

The chat interface handles streaming responses using the Fetch API with ReadableStream:

```typescript
// Streaming response handling
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: selectedModel,
    messages: [...messages, { role: 'user', content: userMessage }],
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n').filter(Boolean);
  
  for (const line of lines) {
    const parsed = JSON.parse(line);
    if (parsed.message?.content) {
      appendStreamContent(parsed.message.content);
    }
  }
}
```

---

### File Explorer

The `FileExplorer` component provides a file browser with an integrated Monaco Editor for viewing and editing files. It supports syntax highlighting for 25+ programming languages and includes features like auto-save and keyboard shortcuts.

#### Features

| Feature | Description |
|---------|-------------|
| **File Tree** | Browse project directory structure |
| **Monaco Editor** | Full-featured code editor with IntelliSense |
| **Syntax Highlighting** | Support for 25+ programming languages |
| **Auto-save** | Save with Cmd/Ctrl+S keyboard shortcut |
| **Unsaved Indicator** | Visual indicator for modified files |
| **File Size Display** | Shows file size in the header |
| **Path Navigation** | Navigate up and refresh directory |

#### Supported Languages

| Category | Languages |
|----------|-----------|
| **Web Frontend** | TypeScript, JavaScript, JSX, TSX, HTML, CSS, SCSS |
| **Backend** | Python, Go, Rust, Java, Kotlin, PHP, Ruby, C#, Swift |
| **Systems** | C, C++, Rust |
| **Data/Config** | JSON, YAML, TOML, XML, Markdown |
| **Database** | SQL |
| **Shell** | Bash, Shell |
| **Container** | Dockerfile, Makefile |

#### Component Structure

```tsx
<FileExplorer>
  <aside> {/* File tree sidebar */}
    <Toolbar>
      <NavigateUpButton />
      <CurrentPath />
      <RefreshButton />
    </Toolbar>
    
    <FileList>
      {items.map(item => (
        <FileItem 
          key={item.path}
          icon={item.type === 'directory' ? '📁' : '📄'}
          onClick={() => handleItemClick(item)}
        />
      ))}
    </FileList>
  </aside>
  
  <main> {/* Editor area */}
    {selectedFile ? (
      <>
        <EditorHeader>
          <FileName />
          <UnsavedIndicator />
          <FileSize />
          <SaveButton />
        </EditorHeader>
        <MonacoEditor
          language={getLanguageFromExtension(file.extension)}
          value={file.content}
          onChange={handleEditorChange}
          theme="vs-dark"
        />
      </>
    ) : (
      <EmptyState>Select a file to view or edit</EmptyState>
    )}
  </main>
</FileExplorer>
```

#### File Operations

The File Explorer supports the following operations through the `/api/fs` endpoint:

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Directory | GET | `/api/fs?path=/` | List contents of a directory |
| Read File | GET | `/api/fs?path=/file.ts` | Read file content |
| Write File | PUT | `/api/fs?path=/file.ts` | Update file content |
| Create File/Dir | POST | `/api/fs?path=/new` | Create new file or directory |
| Delete | DELETE | `/api/fs?path=/file` | Delete file or directory |

#### Editor Configuration

The Monaco Editor is configured with the following options:

```typescript
const editorOptions = {
  minimap: { enabled: true },      // Show minimap
  fontSize: 14,                    // Font size
  wordWrap: 'on',                  // Enable word wrap
  automaticLayout: true,           // Auto-resize
  scrollBeyondLastLine: false,     // No scrolling past end
  theme: 'vs-dark',                // Dark theme
};
```

---

### Terminal Emulator

The `TerminalEmulator` component provides a full PTY terminal experience through xterm.js and WebSocket. It supports 256 colors, Unicode characters, and dynamic resizing.

#### Features

| Feature | Description |
|---------|-------------|
| **Full PTY Support** | Real shell processes (bash, zsh, fish) |
| **xterm.js** | Professional terminal emulation |
| **256 Colors** | Full ANSI color support |
| **Dynamic Resizing** | Terminal resizes with window |
| **Connection Status** | Visual indicator for WebSocket state |
| **Clear Terminal** | Button to clear terminal buffer |
| **Web Links** | Clickable links in terminal output |

#### Terminal Configuration

```typescript
const terminalOptions = {
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    // ... full color palette
  },
  fontFamily: '"Cascadia Code", "Fira Code", monospace',
  fontSize: 14,
  lineHeight: 1.2,
  cursorBlink: true,
  cursorStyle: 'block',
  scrollback: 10000,          // Lines of history
  allowTransparency: true,
};
```

#### WebSocket Protocol

The terminal communicates with the server using JSON messages:

**Client → Server:**

```typescript
// Keyboard input
{ type: 'input', data: 'ls -la\n' }

// Terminal resize
{ type: 'resize', cols: 120, rows: 40 }

// Keep-alive ping
{ type: 'ping' }
```

**Server → Client:**

```typescript
// Shell output
{ type: 'output', data: 'file1.txt\nfile2.txt\n' }

// Process exit
{ type: 'exit', code: 0 }

// Error message
{ type: 'error', data: 'Maximum sessions reached' }
```

#### Connection Flow

```
1. User clicks "Connect"
   └─> WebSocket connection to ws://localhost:3000/terminal

2. Server creates PTY session
   └─> Spawns shell process (bash/zsh)

3. User types in terminal
   └─> xterm.js onData → WebSocket send

4. Shell produces output
   └─> PTY onData → WebSocket send → xterm.js write

5. User clicks "Disconnect"
   └─> WebSocket close → PTY kill
```

---

## API Routes

### `/api/models`

List all available Ollama models.

**Request:**
```http
GET /api/models
```

**Response:**
```json
{
  "models": [
    {
      "name": "llama3.2:latest",
      "modified_at": "2025-01-15T12:00:00Z",
      "size": 4869431328,
      "digest": "abc123..."
    },
    {
      "name": "deepseek-r1:latest",
      "modified_at": "2025-01-14T08:30:00Z",
      "size": 7234567890,
      "digest": "def456..."
    }
  ]
}
```

### `/api/chat`

Send chat messages and receive streaming responses.

**Request:**
```http
POST /api/chat
Content-Type: application/json

{
  "model": "llama3.2",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": true
}
```

**Response (Streaming):**
```
Content-Type: application/x-ndjson
Transfer-Encoding: chunked

{"model":"llama3.2","created_at":"2025-01-15T12:00:00Z","message":{"role":"assistant","content":"Hello"},"done":false}
{"model":"llama3.2","created_at":"2025-01-15T12:00:01Z","message":{"role":"assistant","content":"!"},"done":false}
{"model":"llama3.2","created_at":"2025-01-15T12:00:02Z","message":{"role":"assistant","content":" How"},"done":false}
{"model":"llama3.2","created_at":"2025-01-15T12:00:03Z","message":{"role":"assistant","content":" can"},"done":false}
{"model":"llama3.2","created_at":"2025-01-15T12:00:04Z","done":true,"total_duration":4000000000}
```

### `/api/generate`

Generate text completion with a prompt.

**Request:**
```http
POST /api/generate
Content-Type: application/json

{
  "model": "llama3.2",
  "prompt": "Write a hello world program in Python",
  "stream": true
}
```

### `/api/fs`

Filesystem operations for file browsing and editing.

**List Directory:**
```http
GET /api/fs?path=/src
```

**Response:**
```json
{
  "path": "/src",
  "type": "directory",
  "items": [
    { "name": "components", "type": "directory", "size": 0 },
    { "name": "app.ts", "type": "file", "size": 1234 }
  ]
}
```

**Read File:**
```http
GET /api/fs?path=/src/app.ts
```

**Response:**
```json
{
  "path": "/src/app.ts",
  "type": "file",
  "name": "app.ts",
  "content": "console.log('Hello, World!');",
  "size": 27,
  "extension": ".ts"
}
```

**Write File:**
```http
PUT /api/fs?path=/src/app.ts
Content-Type: application/json

{
  "content": "console.log('Updated!');"
}
```

**Create Directory:**
```http
POST /api/fs?path=/src/new-folder
Content-Type: application/json

{
  "type": "directory"
}
```

**Delete:**
```http
DELETE /api/fs?path=/src/old-file.ts
```

### `/api/ollama/[...path]`

Proxy for direct Ollama API access.

```http
GET /api/ollama/tags      → Ollama /api/tags
POST /api/ollama/show     → Ollama /api/show
POST /api/ollama/embed    → Ollama /api/embed
POST /api/ollama/pull     → Ollama /api/pull
```

---

## Terminal Server

The Terminal Server provides WebSocket-based PTY access for terminal emulation.

### Server Configuration

```typescript
interface TerminalServerConfig {
  server: HttpServer;           // HTTP server to attach to
  path?: string;                // WebSocket path (default: '/terminal')
  shell?: string;               // Shell to use (default: $SHELL or 'bash')
  cols?: number;                // Initial columns (default: 80)
  rows?: number;                // Initial rows (default: 24)
  env?: Record<string, string>; // Environment variables
  cwd?: string;                 // Working directory
  maxSessionsPerIp?: number;    // Max sessions per IP (default: 5)
  sessionTimeout?: number;      // Timeout in ms (default: 30 minutes)
}
```

### Creating a Terminal Server

```typescript
import { createTerminalServer } from './src/server/terminalServer';
import { createServer } from 'http';

const server = createServer();

const terminalServer = createTerminalServer({
  server,
  path: '/terminal',
  shell: process.env.SHELL || 'bash',
  cwd: process.env.PROJECT_DIR || process.cwd(),
  maxSessionsPerIp: 5,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
});

server.listen(3000);
```

### Session Management

The terminal server automatically manages sessions:

- **IP Rate Limiting**: Maximum 5 concurrent sessions per IP address
- **Session Timeout**: Inactive sessions closed after 30 minutes
- **Automatic Cleanup**: Dead sessions removed every minute

### Getting Statistics

```typescript
const stats = terminalServer.getStats();
// {
//   activeSessions: 2,
//   sessions: [
//     { id: '1735123456789-abc123', createdAt: Date, lastActivity: Date },
//     { id: '1735123456790-def456', createdAt: Date, lastActivity: Date }
//   ]
// }
```

### Graceful Shutdown

```typescript
// Close all sessions and stop server
terminalServer.close();
```

---

## State Management

The Web UI uses Zustand for state management with localStorage persistence.

### Store Structure

```typescript
interface WebSessionState {
  // Sessions
  sessions: Map<string, Session>;
  activeSessionId: string | null;

  // Streaming
  streaming: StreamingState;

  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  selectedModel: string;

  // Actions
  createSession: (model: string) => string;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  // ... more actions
}
```

### Using the Store

```typescript
import { useWebSessionStore } from '@/stores/webSessionStore';

function MyComponent() {
  const {
    sessions,
    activeSessionId,
    createSession,
    addMessage,
  } = useWebSessionStore();

  // Create new session
  const handleNewChat = () => {
    const id = createSession('llama3.2');
    setActiveSession(id);
  };

  // Add message
  const handleSendMessage = (content: string) => {
    if (activeSessionId) {
      addMessage(activeSessionId, {
        role: 'user',
        content,
      });
    }
  };

  return (
    // ... component JSX
  );
}
```

### Persistence

Sessions are automatically persisted to localStorage:

```typescript
// Data persisted to localStorage
{
  sessions: Array.from(sessions.entries()),
  activeSessionId: string | null,
  theme: 'light' | 'dark' | 'system',
  selectedModel: string,
}
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_URL` | Ollama server URL | `http://localhost:11434` |
| `PROJECT_DIR` | Base directory for file operations | Current directory |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `localhost` |
| `SHELL` | Shell for terminal | System default |
| `NODE_ENV` | Environment mode | `development` |

### Configuration File

Create a `.env.local` file in the `packages/web-app` directory:

```env
# .env.local
OLLAMA_URL=http://localhost:11434
PROJECT_DIR=/home/user/projects/my-project
PORT=3000
HOST=localhost
```

### Next.js Configuration

The `next.config.mjs` file configures the Next.js application:

```javascript
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable Turbopack for faster development
    turbo: {},
  },
  // Proxy configuration if needed
  async rewrites() {
    return [];
  },
};

export default nextConfig;
```

---

## Usage Examples

### Basic Chat Interaction

```typescript
// Send a message and handle streaming response
const sendMessage = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      messages: [{ role: 'user', content: message }],
      stream: true,
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      const data = JSON.parse(line);
      if (data.message?.content) {
        console.log('Received:', data.message.content);
      }
    }
  }
};
```

### File Operations

```typescript
// List directory
const listDir = async (path: string) => {
  const response = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
  const data = await response.json();
  return data.items;
};

// Read file
const readFile = async (path: string) => {
  const response = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
  const data = await response.json();
  return data.content;
};

// Write file
const writeFile = async (path: string, content: string) => {
  await fetch(`/api/fs?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
};
```

### Terminal WebSocket

```typescript
// Connect to terminal
const socket = new WebSocket('ws://localhost:3000/terminal');

socket.onopen = () => {
  // Send initial resize
  socket.send(JSON.stringify({
    type: 'resize',
    cols: 120,
    rows: 40,
  }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'output':
      console.log('Output:', message.data);
      break;
    case 'exit':
      console.log('Process exited with code:', message.code);
      break;
    case 'error':
      console.error('Error:', message.data);
      break;
  }
};

// Send command
const sendCommand = (cmd: string) => {
  socket.send(JSON.stringify({
    type: 'input',
    data: cmd + '\n',
  }));
};
```

---

## Security

### Filesystem API Security

The `/api/fs` endpoint implements several security measures:

1. **Path Traversal Protection**
   ```typescript
   function resolveSecurePath(requestPath: string): string | null {
     const resolved = path.resolve(BASE_DIR, requestPath);
     if (!resolved.startsWith(BASE_DIR)) {
       return null; // Path traversal attempt blocked
     }
     return resolved;
   }
   ```

2. **No Absolute Paths**: Users cannot access files outside the project directory.

3. **No Symlink Following**: Symlinks pointing outside the base directory are not resolved.

### Terminal Server Security

1. **IP Rate Limiting**: Maximum 5 concurrent sessions per IP address.

2. **Session Timeout**: Inactive sessions closed after 30 minutes.

3. **No Root Access**: Terminal runs as the current user.

4. **Environment Isolation**: Custom environment variables can be set per session.

### Best Practices

1. **Run Behind Reverse Proxy**: Use nginx/Caddy for HTTPS and additional security.

2. **Network Isolation**: Don't expose the Web UI directly to the internet.

3. **Regular Updates**: Keep dependencies updated for security patches.

4. **Environment Variables**: Never commit sensitive configuration to version control.

---

## Troubleshooting

### Terminal Not Connecting

**Symptoms**: Terminal shows "Disconnected" and "Connect" button doesn't work.

**Solutions**:
1. Ensure you're using `pnpm dev:server` (not just `pnpm dev`)
2. Check WebSocket path is `/terminal`
3. Verify `node-pty` is installed correctly:
   ```bash
   pnpm add node-pty
   ```
4. Check browser console for WebSocket errors
5. Verify no firewall is blocking WebSocket connections

### File Explorer Not Loading

**Symptoms**: File tree shows "Loading..." indefinitely or shows errors.

**Solutions**:
1. Check `PROJECT_DIR` environment variable
2. Verify directory permissions:
   ```bash
   ls -la $PROJECT_DIR
   ```
3. Check browser console for API errors
4. Verify the directory exists and is readable
5. Check for symlinks that may point to inaccessible locations

### Chat Not Streaming

**Symptoms**: Messages send but no response appears, or response appears all at once.

**Solutions**:
1. Verify Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. Check model is downloaded:
   ```bash
   ollama list
   ```
3. Verify `OLLAMA_URL` environment variable
4. Check API proxy is working:
   ```bash
   curl http://localhost:3000/api/models
   ```
5. Check browser network tab for failed requests

### Models Not Loading

**Symptoms**: Model dropdown is empty or shows "Loading models..." indefinitely.

**Solutions**:
1. Verify Ollama is running and accessible
2. Check `/api/models` endpoint directly
3. Ensure at least one model is pulled:
   ```bash
   ollama pull llama3.2
   ```
4. Check for CORS issues in browser console

### Build Errors

**Symptoms**: `pnpm build` fails with errors.

**Solutions**:
1. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm build
   ```
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
3. Check TypeScript errors:
   ```bash
   pnpm typecheck
   ```
4. Verify all workspace dependencies are built

### Memory Issues

**Symptoms**: Server crashes or becomes unresponsive.

**Solutions**:
1. Increase Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm dev:server
   ```
2. Reduce terminal scrollback:
   ```typescript
   scrollback: 1000 // instead of 10000
   ```
3. Implement message pagination for long chats

---

## License

Apache License 2.0
