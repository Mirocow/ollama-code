# Ollama Code

```
 ██████╗ ██╗     ██╗      █████╗ ███╗   ███╗ █████╗       ██████╗ ██████╗ ██████╗ ███████╗
██╔═══██╗██║     ██║     ██╔══██╗████╗ ████║██╔══██╗     ██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║   ██║██║     ██║     ███████║██╔████╔██║███████║     ██║     ██║   ██║██║  ██║█████╗
██║   ██║██║     ██║     ██╔══██║██║╚██╔╝██║██╔══██║     ██║     ██║   ██║██║  ██║██╔══╝
╚██████╔╝███████╗███████╗██║  ██║██║ ╚═╝ ██║██║  ██║     ╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
```

**Ollama Code** is a CLI tool for AI-powered programming assistance using local Ollama models. The project provides full control over code and data, working completely offline.

[**Русская версия**](./README.ru.md)

## Features

- 🚀 **Fully Local** — all models run locally via Ollama
- 💻 **CLI Interface** — convenient terminal interface based on Ink (React for CLI)
- 🔧 **Code Tools** — read, edit, search files, execute commands
- 🔌 **MCP Support** — integration with Model Context Protocol servers
- 🌐 **Web Search** — integration with Tavily and Google Custom Search
- 📦 **Extensions** — extension system for adding new capabilities
- 🐛 **Debugging** — built-in VSCode debugging support
- 🧠 **Thinking Models** — support for reasoning models (DeepSeek R1)
- 📊 **Code Analysis** — code quality analysis with A-F grading
- 🎨 **Diagram Generator** — create Mermaid and PlantUML diagrams
- 🔀 **Git Advanced** — advanced git operations (stash, cherry-pick, rebase, bisect)
- 🌐 **API Tester** — REST API endpoint testing
- 🏷️ **Tool Aliases** — short names for tools (`run` → `run_shell_command`)

## Requirements

- **Node.js** >= 20.0.0
- **Ollama** installed and running (https://ollama.ai)

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ollama-code

# Install dependencies
npm install

# Build the project
npm run build
```

### Running

```bash
# Interactive mode
npm run start

# With specific model
npm run start -- --model llama3.2

# One-off query
npm run start -- "Explain how async/await works in JavaScript"

# Debug mode
npm run debug
```

## What's New in v0.10.5

### Tool Alias System

Models can now use short tool names:

| Alias | Tool Name |
|-------|-----------|
| `run`, `shell`, `exec`, `cmd` | `run_shell_command` |
| `read` | `read_file` |
| `write`, `create` | `write_file` |
| `grep`, `search`, `find` | `grep_search` |
| `ls`, `list`, `dir` | `list_directory` |

### Session ID Display

Session ID is now shown in the header for easier debugging and log correlation.

### UTF-8 Locale Check

Added startup warning if terminal encoding is not UTF-8.

---

## UI/UX Improvements

```typescript
// Progress bar for model downloads
<ProgressBar
  progress={45}
  label="Downloading model"
  speed="5.2 MB/s"
  eta="2m 30s"
/>

// Thinking indicator for reasoning models
<ThinkingIndicator
  message="Analyzing code..."
  elapsedTime={45}
  showContent
/>

// Token usage display
<TokenUsageDisplay
  totalTokens={1500}
  promptTokens={500}
  completionTokens={1000}
  tokensPerSecond={45}
/>
```

## Additional Tools

### Database Tool

```bash
> Execute SELECT * FROM users LIMIT 10 in SQLite database data.db
> Save database backup to /backup/db.sql
> Show schema of users table
```

### Docker Tool

```bash
> Run nginx container on port 8080
> Show logs of my-app container
> Stop all containers
> Build Docker image from current directory
```

### Redis Tool

```bash
> Get value of key session:user:123
> Set cache:data with 1 hour expiry
> Publish message to notifications channel
> Show all keys with user: prefix
```

## Project Structure

```
ollama-code/
├── packages/
│   ├── core/           # Core: Ollama client, tools, types
│   ├── cli/            # CLI interface based on Ink
│   ├── webui/          # Web components for UI
│   └── sdk-typescript/ # SDK for programmatic use
├── scripts/            # Build and run scripts
├── integration-tests/  # Integration tests
└── docs/               # Documentation
```

## Documentation

| Document | Description |
|----------|-------------|
| [USAGE_GUIDE.md](./docs/USAGE_GUIDE.md) | Usage guide |
| [EXAMPLES.md](./docs/EXAMPLES.md) | Usage examples |
| [TUTORIAL.md](./docs/TUTORIAL.md) | Beginner tutorial |
| [OLLAMA_API.md](./docs/OLLAMA_API.md) | API documentation |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Project structure |
| [ROADMAP.md](./ROADMAP.md) | Development roadmap |

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages |
| `npm run start` | Run CLI |
| `npm run dev` | Run in development mode |
| `npm run debug` | Run with debugger |
| `npm run test` | Run tests |
| `npm run lint` | Lint code |
| `npm run typecheck` | TypeScript type check |

## CLI Options

```
Options:
  -d, --debug                     Debug mode
  -m, --model                     Specify model
  -s, --sandbox                   Run in sandbox
  -y, --yolo                      Auto-confirm all actions
      --approval-mode             Approval mode: plan, default, auto-edit, yolo
      --experimental-lsp          Enable experimental LSP support
      --ollama-base-url           Ollama server URL (default: http://localhost:11434)
      --ollama-api-key            API key for remote instances
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OLLAMA_BASE_URL` | Ollama server URL |
| `OLLAMA_API_KEY` | API key (optional) |
| `OLLAMA_MODEL` | Default model |
| `OLLAMA_KEEP_ALIVE` | Model memory retention time (default: 5m) |
| `DEBUG` | Enable debug mode (1 or true) |
| `OLLAMA_CODE_DEBUG_LOG_FILE` | Log to file |

## VSCode Debugging

The project includes ready-to-use VSCode debug configurations:

1. Open project in VSCode
2. Press F5 or select "Run and Debug"
3. Choose configuration:
   - **Debug Ollama Code CLI** — basic debugging
   - **Debug Ollama Code CLI (with args)** — with arguments
   - **Debug Current Test File** — debug current test

## Ollama API

The project uses native Ollama APIs:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tags` | GET | List local models |
| `/api/show` | POST | Model info |
| `/api/generate` | POST | Text generation |
| `/api/chat` | POST | Chat with model |
| `/api/embed` | POST | Embeddings |
| `/api/create` | POST | Create model |
| `/api/pull` | POST | Download model |
| `/api/ps` | GET | Running models |
| `/api/version` | GET | Ollama version |

Full API docs: [OLLAMA_API.md](./docs/OLLAMA_API.md)

## Recommended Models

| Model | Purpose | Size |
|-------|---------|------|
| `llama3.2` | General purpose | 3B |
| `deepseek-r1:8b` | Reasoning (thinking) | 8B |
| `codellama` | Programming | 7B+ |
| `mistral` | General purpose | 7B |
| `nomic-embed-text` | Embeddings | 274M |

## Development

### Build Single Package

```bash
# Build core
npm run build --workspace=packages/core

# Build cli
npm run build --workspace=packages/cli
```

### Run Tests

```bash
# All tests
npm run test

# Core package tests
npm run test --workspace=packages/core

# Integration tests
npm run test:integration:sandbox:none
```

### Adding a New Tool

1. Create file in `packages/core/src/tools/`
2. Implement class extending `BaseDeclarativeTool`
3. Export from `index.ts`
4. Add alias in `tool-names.ts`

## License

Apache License 2.0

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
