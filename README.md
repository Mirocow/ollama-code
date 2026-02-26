<div align="center">

[![License](https://img.shields.io/github/license/ollama-code/ollama-code.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

**An open-source AI agent that runs locally with Ollama.**

</div>

Ollama Code is an open-source AI agent for the terminal that works entirely with local LLM models through [Ollama](https://ollama.ai). No API keys required, no internet connection needed - your code stays private.

![](https://gw.alicdn.com/imgextra/i1/O1CN01D2DviS1wwtEtMwIzJ_!!6000000006373-2-tps-1600-900.png)

## Why Ollama Code?

- **100% Local**: Run AI models on your machine - no cloud, no API keys, complete privacy
- **Free Forever**: No per-request costs, no rate limits, no subscriptions
- **Open-source**: Both the framework and the models are open-source
- **Agentic workflow**: Rich built-in tools for a full agentic workflow
- **Terminal-first**: Built for developers who live in the command line

## Installation

### Prerequisites

1. **Node.js 20+**: Download from [nodejs.org](https://nodejs.org/en/download)
2. **Ollama**: Install from [ollama.ai](https://ollama.ai)

### Install Ollama

```bash
# Linux / macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Or download from https://ollama.ai
```

### Install Ollama Code

```bash
# Clone the repository
git clone <repository-url>
cd ollama-code

# Install dependencies
npm install

# Build the project
npm run build

# Run
node dist/cli.js
```

## Quick Start

### 1. Download a Model

```bash
# Recommended: Qwen 2.5 Coder (excellent for coding)
ollama pull qwen2.5-coder

# Alternatives
ollama pull llama3.2
ollama pull codellama
ollama pull deepseek-coder-v2
ollama pull mistral
ollama pull codestral
```

### 2. Run Ollama Code

```bash
# Set the model (optional, defaults to qwen2.5-coder)
export OLLAMA_MODEL=qwen2.5-coder

# Run
node dist/cli.js
```

### 3. Start Coding

```
What does this project do?
Explain the codebase structure.
Help me refactor this function.
Generate unit tests for this module.
```

## Available Models

| Model | Description | Best For |
|-------|-------------|----------|
| `qwen2.5-coder` | Qwen 2.5 Coder | Coding tasks (default) |
| `llama3.2` | Meta Llama 3.2 | General purpose |
| `llama3.1` | Meta Llama 3.1 | Powerful general model |
| `codellama` | Code Llama | Code generation |
| `deepseek-coder-v2` | DeepSeek Coder V2 | Coding tasks |
| `mistral` | Mistral | Fast inference |
| `codestral` | Codestral | Mistral AI code model |
| `phi3` | Microsoft Phi-3 | Lightweight model |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://localhost:11434/v1` |
| `OLLAMA_MODEL` | Default model name | `qwen2.5-coder` |
| `OLLAMA_API_KEY` | API key (for remote Ollama) | `ollama` |

### Settings File

Create `~/.ollama-code/settings.json`:

```json
{
  "modelProviders": {
    "ollama": [
      {
        "id": "qwen2.5-coder",
        "name": "Qwen 2.5 Coder",
        "baseUrl": "http://localhost:11434/v1",
        "description": "Qwen 2.5 Coder - excellent for coding tasks"
      },
      {
        "id": "llama3.2",
        "name": "Llama 3.2",
        "baseUrl": "http://localhost:11434/v1",
        "description": "Meta Llama 3.2 - versatile model"
      }
    ]
  },
  "model": {
    "name": "qwen2.5-coder"
  }
}
```

## Remote Ollama

Connect to a remote Ollama instance:

```bash
export OLLAMA_BASE_URL=http://your-server:11434/v1
export OLLAMA_API_KEY=your-key  # if authentication is required
node dist/cli.js
```

## Usage

### Interactive Mode

```bash
cd your-project/
node dist/cli.js
```

Use `@` to reference local files (e.g., `@src/main.ts`).

### Headless Mode

```bash
node dist/cli.js -p "Explain the architecture of this project"
```

## Commands & Shortcuts

### Session Commands

- `/help` - Display available commands
- `/clear` - Clear conversation history
- `/compress` - Compress history to save tokens
- `/stats` - Show current session information
- `/model` - Switch between available models
- `/exit` or `/quit` - Exit Ollama Code

### Keyboard Shortcuts

- `Ctrl+C` - Cancel current operation
- `Ctrl+D` - Exit (on empty line)
- `Up/Down` - Navigate command history

## Development

```bash
# Install dependencies
npm install

# Run TypeScript check
npm run typecheck

# Build
npm run build

# Run tests
npm run test
```

## Troubleshooting

### Ollama not found

Make sure Ollama is installed and running:

```bash
ollama serve
```

### Model not found

Download the model first:

```bash
ollama pull qwen2.5-coder
```

### Connection refused

Check if Ollama is running on the correct port:

```bash
# Default: http://localhost:11434
curl http://localhost:11434/api/tags
```

## License

Apache-2.0

## Acknowledgments

This project is based on [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) and [Qwen Code](https://github.com/QwenLM/qwen-code), adapted to work exclusively with Ollama for local LLM inference.
