# CLI Examples

This folder contains examples of using Ollama Code CLI in non-interactive mode.

## Basic Usage

```bash
# Set environment variables
export OLLAMA_HOST="your-host:port"
export OLLAMA_BASE_URL="http://your-host:port"

# Run CLI with prompt
pnpm run cli -- --model "model-name" --yolo --prompt "Your prompt here"
```

## Examples

### 1. Simple Counting (`01-simple-count.md`)

Count from 1 to 5.

### 2. Table Generation (`02-table-generation.md`)

Generate a table of calculations.

### 3. File Creation (`03-file-creation.md`)

Create and run a Python file.

## Important Flags

- `--yolo` - Auto-approve all tool calls (required for non-interactive mode)
- `--model` - Specify the model to use
- `--prompt` - Provide the prompt directly
- `--debug` - Enable debug logging

## Model Selection

The model will automatically choose the best programming language for the task:

- **Python**: Data processing, calculations, ML, scripts
- **Node.js**: JSON manipulation, async operations, npm ecosystem
- **Go**: Performance-critical, concurrent tasks
- **Shell**: Simple file operations, system commands
