# Ollama Code CLI - Complete Usage Guide

> Powerful terminal-based AI coding assistant with interactive and non-interactive modes, plugin system, and multi-language support.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Interactive Mode](#interactive-mode)
5. [Non-Interactive Mode](#non-interactive-mode)
6. [Commands Reference](#commands-reference)
7. [Configuration](#configuration)
8. [Themes](#themes)
9. [Plugins and Extensions](#plugins-and-extensions)
10. [Subagents](#subagents)
11. [MCP Integration](#mcp-integration)
12. [Keyboard Shortcuts](#keyboard-shortcuts)
13. [Troubleshooting](#troubleshooting)

---

## Overview

Ollama Code CLI (`@ollama-code/ollama-code`) is a terminal-based AI coding assistant that provides intelligent code generation, file manipulation, and shell command execution capabilities through local LLM models via Ollama.

### Key Features

| Feature | Description |
|---------|-------------|
| **Interactive Chat** | Real-time conversation with AI in terminal |
| **Non-Interactive Mode** | Scriptable, pipe-friendly execution |
| **Tool System** | 30+ built-in tools for file, code, and shell operations |
| **Plugin System** | Extensible via custom plugins and MCP servers |
| **Subagents** | Spawn specialized AI agents for complex tasks |
| **Multi-Language** | Supports English, Russian, Chinese UI |
| **Themes** | 15+ built-in color themes |
| **Vim Mode** | Vim-style navigation and editing |
| **Session Management** | Resume previous conversations |
| **Sandbox Mode** | Secure execution environment |

### Technology Stack

- **Framework**: Ink (React for CLI)
- **State Management**: Zustand
- **UI**: Terminal UI with React components
- **LLM**: Ollama (local models)
- **Language**: TypeScript

---

## Installation

### Prerequisites

- **Node.js**: Version 20 or higher
- **Ollama**: Running instance with at least one model

### Install via npm

```bash
# Install globally
npm install -g @ollama-code/ollama-code

# Or run directly
npx @ollama-code/ollama-code
```

### Install from Source

```bash
# Clone repository
git clone https://github.com/ollama-code/ollama-code.git
cd ollama-code

# Install dependencies
pnpm install

# Build CLI package
cd packages/cli
pnpm build

# Link globally
npm link
```

### First Run Setup

On first run, Ollama Code will guide you through setup:

```bash
ollama
```

The setup wizard will:
1. Ask for Ollama server URL (default: http://localhost:11434)
2. Let you select a default model
3. Save configuration to `~/.ollama-code/config.json`

---

## Quick Start

### Interactive Mode

Start an interactive session:

```bash
# Start with default model
ollama

# Start with specific model
ollama --model llama3.2

# Start in specific directory
cd /path/to/project && ollama
```

### Non-Interactive Mode

Process a single prompt and exit:

```bash
# Single prompt
ollama --prompt "Explain this code" < myfile.ts

# Pipe input
echo "What is the capital of France?" | ollama

# With specific model
ollama --model deepseek-r1 --prompt "Solve this puzzle"
```

### Resume Session

Continue a previous conversation:

```bash
# Show session picker
ollama --resume

# Resume specific session
ollama --resume session-abc123
```

---

## Interactive Mode

Interactive mode provides a full-featured terminal UI for conversing with AI.

### Main Interface

```
┌──────────────────────────────────────────────────────────────────┐
│ Ollama Code v0.11.0 │ model: llama3.2 │ /path/to/project         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ User: Write a function to sort an array                          │
│                                                                  │
│ Assistant: I'll help you write a function to sort an array...    │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ function sortArray(arr: number[]): number[] {               │  │
│ │   return [...arr].sort((a, b) => a - b);                    │  │
│ │ }                                                            │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ > Type your message... (Enter to send)                           │
└──────────────────────────────────────────────────────────────────┘
```

### Input Area Features

| Feature | Description |
|---------|-------------|
| **Multi-line Input** | Use Shift+Enter for new lines |
| **History Navigation** | Up/Down arrows for message history |
| **Auto-completion** | Tab for command completion |
| **Reverse Search** | Ctrl+R for history search |

### Slash Commands

Access commands by typing `/` in the input:

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/model` | Switch model |
| `/theme` | Change color theme |
| `/clear` | Clear conversation |
| `/compress` | Compress context |
| `/export` | Export conversation |
| `/memory` | Manage memory |
| `/mcp` | MCP server management |
| `/agents` | Manage subagents |
| `/settings` | Open settings |
| `/quit` | Exit application |

### At Commands

Use `@` for quick actions:

| Command | Description |
|---------|-------------|
| `@file path/to/file` | Include file in context |
| `@folder path/to/dir` | Include directory contents |
| `@git` | Include git context |
| `@url https://...` | Include URL content |

---

## Non-Interactive Mode

Non-interactive mode is designed for scripting and automation.

### Input Methods

```bash
# Command-line prompt
ollama --prompt "Your question here"

# Stdin pipe
cat code.ts | ollama --prompt "Review this code"

# File redirect
ollama --prompt "Analyze" < data.txt

# Here document
ollama --prompt "$(cat <<EOF
Analyze this code:
$(cat myfile.ts)
EOF
)"
```

### Output Formats

```bash
# Text output (default)
ollama --prompt "Hello"

# JSON output
ollama --prompt "Hello" --output json

# JSONL streaming
ollama --prompt "Hello" --input-format stream-json
```

### JSON Streaming Protocol

For advanced automation, use stream-json format:

```bash
# Input via stdin
ollama --input-format stream-json

# Send control messages
echo '{"type":"initialize","config":{}}' | ollama --input-format stream-json

# Receive streaming output
{"type":"content","text":"Hello"}
{"type":"tool_call","name":"read_file","args":{}}
{"type":"tool_result","result":"file contents"}
{"type":"done"}
```

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error |
| 2 | User cancelled |
| 3 | Timeout |

---

## Commands Reference

### Model Management

```bash
# Switch model
/model llama3.2

# List available models
/model list

# Show current model info
/model info
```

### File Operations

```bash
# Read file
@file path/to/file.ts

# Write file (via prompt)
"Create a new file at src/utils.ts with helper functions"

# Edit file (via prompt)
"Add TypeScript types to src/api.ts"

# Search files (via prompt)
"Find all TypeScript files that import axios"
```

### Shell Execution

Tools can execute shell commands:

```bash
# Via prompt
"Run npm test and show results"

"Execute git status"

"Start the dev server"
```

### Git Operations

```bash
# Via prompt
"Commit these changes with message 'Add feature'"

"Create a new branch feature/auth"

"Show git log for last 5 commits"
```

### Memory Management

```bash
# Show memory
/memory show

# Refresh memory
/memory refresh

# Clear memory
/memory clear
```

### Session Management

```bash
# Export session
/export --format json

# Export to markdown
/export --format markdown

# Export to HTML
/export --format html
```

---

## Configuration

### Configuration Files

Configuration is stored in `~/.ollama-code/`:

```
~/.ollama-code/
├── config.json          # Main configuration
├── settings.json        # User settings
├── memory/              # Memory storage
├── sessions/            # Session history
└── plugins/             # User plugins
```

### Main Configuration (config.json)

```json
{
  "baseUrl": "http://localhost:11434",
  "model": "llama3.2",
  "embeddingModel": "nomic-embed-text",
  "sessionId": "session-abc123"
}
```

### User Settings (settings.json)

```json
{
  "general": {
    "outputLanguage": "en",
    "debugMode": false,
    "autoUpdate": true
  },
  "ui": {
    "theme": "ollama-dark",
    "hideWindowTitle": false
  },
  "tools": {
    "useRipgrep": true,
    "useBuiltinRipgrep": true
  },
  "security": {
    "auth": {
      "useExternal": false
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_HOST` | Ollama server URL | `localhost:11434` |
| `OLLAMA_BASE_URL` | Full Ollama URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Default model | `llama3.2` |
| `OLLAMA_CODE_DEBUG` | Enable debug mode | `false` |
| `OLLAMA_CODE_NO_RELAUNCH` | Disable auto-relaunch | `false` |

### Command-Line Options

```bash
ollama [options]

Options:
  --model <name>           Use specific model
  --prompt <text>          Non-interactive prompt
  --resume [session]       Resume session
  --output <format>        Output format (text|json)
  --input-format <format>  Input format (text|stream-json)
  --debug                  Enable debug mode
  --no-sandbox             Disable sandbox
  --extensions <paths>     Load extensions
  --help                   Show help
  --version                Show version
```

---

## Themes

Ollama Code includes 15+ built-in themes for personalized appearance.

### Built-in Themes

| Theme | Description |
|-------|-------------|
| `default` | Default dark theme |
| `ollama-dark` | Ollama branded dark |
| `ollama-light` | Ollama branded light |
| `dracula` | Dracula color scheme |
| `nord` | Nord color scheme |
| `tokyo-night` | Tokyo Night theme |
| `catppuccin` | Catppuccin Mocha |
| `github-dark` | GitHub Dark |
| `github-light` | GitHub Light |
| `atom-one-dark` | Atom One Dark |
| `ayu` | Ayu Mirage |
| `ayu-light` | Ayu Light |
| `xcode` | Xcode theme |
| `googlecode` | Google Code theme |
| `shades-of-purple` | Purple-based theme |
| `no-color` | No colors (monochrome) |

### Changing Theme

```bash
# Interactive
/theme

# Direct
/theme dracula
```

### Custom Themes

Add custom themes in settings:

```json
{
  "ui": {
    "customThemes": {
      "my-theme": {
        "colors": {
          "primary": "#ff6b6b",
          "background": "#1a1a2e",
          "text": "#eaeaea"
        }
      }
    }
  }
}
```

---

## Plugins and Extensions

### Plugin System

Ollama Code supports a plugin system for extending functionality.

### Plugin Locations

| Location | Description |
|----------|-------------|
| `~/.ollama-code/plugins/` | User plugins |
| `.ollama-code/plugins/` | Project plugins |
| Built-in | Core, Dev, File, Search, Shell tools |

### Installing Plugins

```bash
# Install from npm
/extensions install @ollama-code/plugin-example

# Install from local path
/extensions link /path/to/plugin

# Install from URL
/extensions install https://github.com/user/plugin
```

### Managing Extensions

```bash
# List installed
/extensions list

# Enable extension
/extensions enable my-extension

# Disable extension
/extensions disable my-extension

# Update extension
/extensions update my-extension

# Uninstall extension
/extensions uninstall my-extension
```

### Creating Plugins

Plugin structure:

```
my-plugin/
├── ollama-extension.json    # Plugin manifest
├── index.ts                 # Main entry
├── commands/                # Custom commands
│   └── myCommand.ts
├── tools/                   # Custom tools
│   └── myTool.ts
└── skills/                  # AI skills
    └── mySkill.md
```

Manifest (`ollama-extension.json`):

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin",
  "main": "dist/index.js",
  "commands": ["commands/*.js"],
  "tools": ["tools/*.js"],
  "skills": ["skills/*.md"]
}
```

---

## Subagents

Subagents are specialized AI agents that can handle complex, multi-step tasks.

### Managing Subagents

```bash
# Open subagent manager
/agents

# Create new subagent
/agents create

# View subagent details
/agents view <name>

# Delete subagent
/agents delete <name>
```

### Built-in Subagents

| Agent | Description |
|-------|-------------|
| `architect` | System design and architecture |
| `debugger` | Debugging and error analysis |
| `tester` | Test generation and execution |
| `reviewer` | Code review and quality |

### Using Subagents

```bash
# Via prompt
"Use the architect agent to design an authentication system"

"Spawn a debugger agent to fix this error"

"Have the reviewer agent check this PR"
```

### Subagent Creation

Create custom subagents:

```markdown
# .ollama-code/agents/myAgent.md

# My Custom Agent

You are a specialized agent for [purpose].

## Capabilities
- Capability 1
- Capability 2

## Instructions
1. Step 1
2. Step 2
```

---

## MCP Integration

Model Context Protocol (MCP) allows integration with external tools and services.

### MCP Server Management

```bash
# List MCP servers
/mcp list

# Add MCP server
/mcp add <name> <command>

# Remove MCP server
/mcp remove <name>

# Show MCP status
/mcp status
```

### Adding MCP Servers

```bash
# Add filesystem MCP server
/mcp add filesystem npx -y @modelcontextprotocol/server-filesystem /path/to/dir

# Add GitHub MCP server
/mcp add github npx -y @modelcontextprotocol/server-github

# Add PostgreSQL MCP server
/mcp add postgres npx -y @modelcontextprotocol/server-postgres
```

### MCP Configuration

MCP servers are configured in settings:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": {}
    }
  }
}
```

### OAuth Authentication

For MCP servers requiring OAuth:

```bash
# Authenticate with MCP server
/mcp auth <server-name>

# Check auth status
/mcp auth-status <server-name>
```

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Cancel current operation |
| `Ctrl+D` | Exit application |
| `Ctrl+L` | Clear screen |
| `Ctrl+R` | Reverse search history |
| `Escape` | Cancel/close dialog |

### Input Area Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Up` | Previous history item |
| `Down` | Next history item |
| `Tab` | Auto-complete |
| `Ctrl+V` | Paste from clipboard |

### Vim Mode Shortcuts

When Vim mode is enabled:

| Shortcut | Action |
|----------|--------|
| `Esc` | Normal mode |
| `i` | Insert mode |
| `:w` | Save |
| `:q` | Quit |
| `j/k` | Navigate history |
| `/` | Search |

### Dialog Navigation

| Shortcut | Action |
|----------|--------|
| `Tab` | Next element |
| `Shift+Tab` | Previous element |
| `Enter` | Confirm |
| `Escape` | Cancel |
| `Arrow keys` | Navigate list |

---

## Troubleshooting

### Common Issues

#### Ollama Connection Failed

**Symptoms**: "Cannot connect to Ollama server"

**Solutions**:
1. Verify Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. Check `OLLAMA_HOST` environment variable
3. Ensure correct URL in config

#### Model Not Found

**Symptoms**: "Model not found: llama3.2"

**Solutions**:
1. List available models:
   ```bash
   ollama list
   ```
2. Pull the model:
   ```bash
   ollama pull llama3.2
   ```
3. Switch to available model:
   ```bash
   /model <available-model>
   ```

#### Memory Issues

**Symptoms**: Slow performance, crashes

**Solutions**:
1. Compress context:
   ```bash
   /compress
   ```
2. Clear session:
   ```bash
   /clear
   ```
3. Increase Node memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" ollama
   ```

#### Terminal Display Issues

**Symptoms**: Garbled output, missing characters

**Solutions**:
1. Reset terminal:
   ```bash
   reset
   ```
2. Check terminal compatibility
3. Use simpler theme:
   ```bash
   /theme default
   ```

### Debug Mode

Enable debug logging:

```bash
# Via flag
ollama --debug

# Via environment
OLLAMA_CODE_DEBUG=1 ollama
```

Debug logs are saved to:
```
~/.ollama-code/logs/session-<id>.log
```

### Getting Help

1. **Built-in help**: `/help`
2. **Documentation**: https://github.com/ollama-code/ollama-code/docs
3. **Issues**: https://github.com/ollama-code/ollama-code/issues

---

## License

Apache License 2.0
