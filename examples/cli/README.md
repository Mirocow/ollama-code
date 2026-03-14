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

## Test Scripts Overview

### Basic Tests (01-04)

| Script                      | Description         | Expected Tools             |
| --------------------------- | ------------------- | -------------------------- |
| `01-simple-count.sh`        | Count from 1 to 5   | `python_dev` (exec)        |
| `02-sum-calculation.sh`     | Sum 1 to 100        | `todo_write`, `python_dev` |
| `03-table-generation.sh`    | Table of squares    | `todo_write`, `python_dev` |
| `04-complex-calculation.sh` | Complex calculation | `todo_write`, `python_dev` |

### File Tools Tests (10-14)

| Script                            | Description           | Expected Tools   |
| --------------------------------- | --------------------- | ---------------- |
| `10-file-tools-read-file.sh`      | Read file contents    | `read_file`      |
| `11-file-tools-write-file.sh`     | Create new file       | `write_file`     |
| `12-file-tools-list-directory.sh` | List directory        | `list_directory` |
| `13-file-tools-glob.sh`           | Find files by pattern | `glob`           |
| `14-file-tools-edit.sh`           | Edit file             | `edit`           |

### Dev Tools Tests (15-18)

| Script                            | Description           | Expected Tools      |
| --------------------------------- | --------------------- | ------------------- |
| `15-python-dev-exec.sh`           | Execute Python code   | `python_dev` (exec) |
| `16-nodejs-dev-eval.sh`           | Execute JavaScript    | `nodejs_dev` (eval) |
| `17-run-shell-command.sh`         | Run shell command     | `run_shell_command` |
| `18-run-shell-command-complex.sh` | Complex shell command | `run_shell_command` |

### Search Tools Tests (19-21)

| Script              | Description       | Expected Tools |
| ------------------- | ----------------- | -------------- |
| `19-grep-search.sh` | Search in files   | `grep_search`  |
| `20-web-search.sh`  | Search the web    | `web_search`   |
| `21-web-fetch.sh`   | Fetch URL content | `web_fetch`    |

### Memory & Storage Tests (22-25)

| Script                  | Description         | Expected Tools    |
| ----------------------- | ------------------- | ----------------- |
| `22-todo-write.sh`      | Create todo list    | `todo_write`      |
| `23-model-storage.sh`   | Store/retrieve data | `model_storage`   |
| `24-save-memory.sh`     | Save to memory      | `save_memory`     |
| `25-read-many-files.sh` | Read multiple files | `read_many_files` |

### Language-Specific Tests (26-28)

| Script                 | Description        | Expected Tools   |
| ---------------------- | ------------------ | ---------------- |
| `26-golang-dev.sh`     | Execute Go code    | `golang_dev`     |
| `27-rust-dev.sh`       | Execute Rust code  | `rust_dev`       |
| `28-typescript-dev.sh` | Execute TypeScript | `typescript_dev` |

### Core Tools Tests (29)

| Script                     | Description    | Expected Tools                 |
| -------------------------- | -------------- | ------------------------------ |
| `29-echo-timestamp-env.sh` | Core utilities | `echo`, `timestamp`, `get_env` |

### Complex Workflow Tests (30-33)

| Script                   | Description         | Expected Tools                          |
| ------------------------ | ------------------- | --------------------------------------- |
| `30-complex-workflow.sh` | Multi-tool workflow | `write_file`, `read_file`, `python_dev` |
| `31-table-squares.sh`    | Table with cubes    | `todo_write`, `python_dev`              |
| `32-fibonacci.sh`        | Fibonacci sequence  | `todo_write`, `python_dev`              |
| `33-prime-numbers.sh`    | Prime numbers       | `todo_write`, `python_dev`              |

## Running Tests

```bash
# Run single test
./examples/cli/01-simple-count.sh

# Run all tests
for script in examples/cli/*.sh; do
    echo "Running $script..."
    bash "$script"
    echo "---"
done
```

## Key Flags

- `--yolo` - Enable tools in non-interactive mode (required for tool execution)
- `--model` - Specify model to use
- `--non-interactive` - Run without UI (automatic when prompt is provided)

## Expected Tool Call Format

Model should use this EXACT format for tool calls:

```
<tool_call={"name": "tool_name", "arguments": {"arg1": "value1"}}>
```

Note the `=` sign after `tool_call`.

## All Available Tools

### File Operations

- `read_file` - Read single file
- `read_many_files` - Read multiple files at once
- `write_file` - Create/overwrite file
- `edit` - Find and replace in file
- `list_directory` - List directory contents
- `glob` - Find files by pattern

### Development Tools

- `python_dev` - Python: exec (inline), run, test
- `nodejs_dev` - Node.js: eval (inline), run, test
- `typescript_dev` - TypeScript: eval (inline), compile, run
- `golang_dev` - Go: eval (inline), run, build
- `rust_dev` - Rust: eval (inline), build, test
- `java_dev` - Java: eval (jshell), run, build
- `cpp_dev` - C/C++: eval (inline), compile
- `swift_dev` - Swift: eval (inline), build, test
- `php_dev` - PHP: eval (inline), run, test

### Search Tools

- `grep_search` - Search in file contents
- `web_search` - Search the web
- `web_fetch` - Fetch URL content

### Shell & SSH

- `run_shell_command` - Execute local shell commands
- `ssh_connect` - Connect to remote servers
- `ssh_add_host` - Add SSH host profile
- `ssh_list_hosts` - List SSH profiles

### Productivity

- `todo_write` - Task list management
- `save_memory` - Save facts to memory
- `model_storage` - AI-internal data storage

### Agent Tools

- `task` - Launch subagent
- `skill` - Execute skill

### Core Tools

- `echo` - Echo back message
- `timestamp` - Get current timestamp
- `get_env` - Get environment variable

## Troubleshooting

### Tools not executing

Make sure `--yolo` flag is set for non-interactive mode.

### Connection errors

Check Ollama server is running and accessible:

```bash
curl http://192.168.1.100:11434/api/version
```

### Model not found

Pull the model first:

```bash
ollama pull krith/qwen2.5-coder-14b-instruct:IQ4_XS
```
