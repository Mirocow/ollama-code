# CLI Examples

This directory contains example CLI commands for testing Ollama Code behavior.

## Prerequisites

1. Ollama server running (set `OLLAMA_HOST` and `OLLAMA_BASE_URL` environment variables)
2. Required model pulled (e.g., `krith/qwen2.5-coder-14b-instruct:IQ4_XS`)

## Environment Setup

```bash
export OLLAMA_HOST=192.168.1.100
export OLLAMA_BASE_URL=http://192.168.1.100:11434
```

## Examples

### 01-simple-count.sh

Basic test: count from 1 to 5.
Expected behavior: Model calls `python_dev` tool and outputs numbers.

### 02-sum-calculation.sh

Calculate sum from 1 to 100.
Expected behavior:

1. Create TODO list with `todo_write`
2. Write Python program
3. Execute and show result (5050)

### 03-table-generation.sh

Generate table of squares from 1 to 10.
Expected behavior:

1. Create TODO list with `todo_write`
2. Write Python program
3. Execute and output formatted table

### 04-complex-calculation.sh

Complex calculation with filtering and sorting.
Expected behavior:

1. Create TODO list with `todo_write`
2. Write Python program
3. Execute and output top-10 results in table format

## Running Examples

```bash
# Make scripts executable
chmod +x examples/cli/*.sh

# Run example
./examples/cli/01-simple-count.sh
```

## Key Flags

- `--yolo` - Enable tools in non-interactive mode (required for tool execution)
- `--model` - Specify model to use
- `--non-interactive` - Run without UI (automatic when prompt is provided)

## Expected Tool Call Format

Model should use this exact format for tool calls:

```
<tool_call={"name": "tool_name", "arguments": {"arg1": "value1"}}>
```

Note the `=` sign after `tool_call`.
