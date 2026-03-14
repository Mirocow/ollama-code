# Ollama Code Tools Reference

Complete reference documentation for all available tools in Ollama Code.

## Table of Contents

- [File Operations](#file-operations)
  - [read_file](#read_file)
  - [read_many_files](#read_many_files)
  - [write_file](#write_file)
  - [edit](#edit)
- [Search & Navigation](#search--navigation)
  - [glob](#glob)
  - [grep_search](#grep_search)
  - [list_directory](#list_directory)
- [Development Tools](#development-tools)
  - [python_dev](#python_dev)
  - [nodejs_dev](#nodejs_dev)
  - [golang_dev](#golang_dev)
  - [run_shell_command](#run_shell_command)
- [Web & Network](#web--network)
  - [web_search](#web_search)
  - [web_fetch](#web_fetch)
- [Git Operations](#git-operations)
  - [git_workflow](#git_workflow)
  - [git_advanced](#git_advanced)
- [SSH Tools](#ssh-tools)
  - [ssh_connect](#ssh_connect)
  - [ssh_add_host](#ssh_add_host)
  - [ssh_list_hosts](#ssh_list_hosts)
  - [ssh_remove_host](#ssh_remove_host)
- [Task Management](#task-management)
  - [todo_write](#todo_write)
  - [task](#task)
- [Memory & Knowledge](#memory--knowledge)
  - [save_memory](#save_memory)
  - [model_storage](#model_storage)
  - [skill](#skill)
- [Other Tools](#other-tools)
  - [lsp](#lsp)
  - [exit_plan_mode](#exit_plan_mode)

---

## Tool Aliases

Ollama Code supports short aliases for common tools. You can use these instead of the full tool names:

| Alias                                | Canonical Tool      |
| ------------------------------------ | ------------------- |
| `run`, `shell`, `exec`, `cmd`        | `run_shell_command` |
| `read`                               | `read_file`         |
| `readmany`, `read_all`, `cat`        | `read_many_files`   |
| `write`, `create`                    | `write_file`        |
| `edit`, `replace`                    | `edit`              |
| `grep`, `search`, `find`             | `grep_search`       |
| `glob`, `files`                      | `glob`              |
| `ls`, `list`, `dir`                  | `list_directory`    |
| `todo`, `todos`                      | `todo_write`        |
| `memory`, `save`                     | `save_memory`       |
| `storage`, `store`, `kv`, `roadmap`  | `model_storage`     |
| `agent`, `subagent`                  | `task`              |
| `websearch`, `web`                   | `web_search`        |
| `webfetch`, `fetch`, `url`           | `web_fetch`         |
| `py`, `python`, `pip`, `pytest`      | `python_dev`        |
| `node`, `npm`, `yarn`, `pnpm`, `bun` | `nodejs_dev`        |
| `go`, `golang`                       | `golang_dev`        |
| `commit`, `push`, `pull`             | `git_workflow`      |
| `mr`, `pr`, `create_merge`           | `git_workflow`      |
| `clone`                              | `git_workflow`      |
| `stash`, `rebase`, `cherry_pick`     | `git_advanced`      |
| `ssh`, `ssh_connect`, `remote`       | `ssh_connect`       |
| `add_host`, `ssh_add_host`           | `ssh_add_host`      |
| `list_hosts`, `ssh_list_hosts`       | `ssh_list_hosts`    |
| `remove_host`, `ssh_remove_host`     | `ssh_remove_host`   |

---

## File Operations

### read_file

Reads and returns the content of a specified file. Supports text files, images (PNG, JPG, GIF, WEBP, SVG, BMP), and PDF files.

**Parameters:**

| Name            | Type   | Required | Description                                                |
| --------------- | ------ | -------- | ---------------------------------------------------------- |
| `absolute_path` | string | Yes      | The absolute path to the file to read                      |
| `offset`        | number | No       | 0-based line number to start reading from (for pagination) |
| `limit`         | number | No       | Maximum number of lines to read                            |

**Example:**

```json
{
  "absolute_path": "/home/user/project/src/index.ts"
}
```

**For large files:**

```json
{
  "absolute_path": "/home/user/project/large-file.log",
  "offset": 100,
  "limit": 50
}
```

---

### read_many_files

Reads multiple files in a single operation. More efficient than multiple `read_file` calls for batch operations.

**Parameters:**

| Name     | Type     | Required | Description                          |
| -------- | -------- | -------- | ------------------------------------ |
| `paths`  | string[] | Yes      | Array of absolute file paths to read |
| `offset` | number   | No       | Line offset to start from            |
| `limit`  | number   | No       | Maximum lines per file               |

---

### write_file

Writes content to a file, creating it if it doesn't exist or overwriting if it does. Automatically creates parent directories.

**Parameters:**

| Name        | Type   | Required | Description                        |
| ----------- | ------ | -------- | ---------------------------------- |
| `file_path` | string | Yes      | Absolute path to the file to write |
| `content`   | string | Yes      | Content to write to the file       |

**Example:**

```json
{
  "file_path": "/home/user/project/src/utils.ts",
  "content": "export function greet(name: string): string {\n  return `Hello, ${name}!`;\n}"
}
```

---

### edit

Performs find-and-replace edits on existing files. Requires exact string matching including whitespace and indentation.

**Parameters:**

| Name          | Type    | Required | Description                                |
| ------------- | ------- | -------- | ------------------------------------------ |
| `file_path`   | string  | Yes      | Absolute path to the file to edit          |
| `old_string`  | string  | Yes      | Exact text to replace (must match exactly) |
| `new_string`  | string  | Yes      | Text to replace with                       |
| `replace_all` | boolean | No       | Replace all occurrences (default: false)   |

**Important Notes:**

- Include at least 3 lines of context before and after the target text
- Match whitespace and indentation precisely
- Use `replace_all: true` when you want to replace every occurrence

**Example:**

```json
{
  "file_path": "/home/user/project/src/app.ts",
  "old_string": "function oldName() {\n  return 'old';\n}",
  "new_string": "function newName() {\n  return 'new';\n}"
}
```

---

## Search & Navigation

### glob

Fast file pattern matching tool that works with any codebase size. Returns matching file paths sorted by modification time.

**Parameters:**

| Name      | Type   | Required | Description                                            |
| --------- | ------ | -------- | ------------------------------------------------------ |
| `pattern` | string | Yes      | Glob pattern to match (e.g., `**/*.ts`, `src/**/*.js`) |
| `path`    | string | No       | Directory to search in (defaults to workspace root)    |

**Examples:**

```json
// Find all TypeScript files
{ "pattern": "**/*.ts" }

// Find JavaScript files in src directory
{ "pattern": "src/**/*.js" }

// Find all JSON files
{ "pattern": "*.json", "path": "/home/user/project/config" }
```

---

### grep_search

Searches for patterns in file contents using regular expressions. Case-insensitive by default.

**Parameters:**

| Name      | Type   | Required | Description                                               |
| --------- | ------ | -------- | --------------------------------------------------------- |
| `pattern` | string | Yes      | Regular expression pattern to search for                  |
| `path`    | string | No       | Directory or file to search in                            |
| `glob`    | string | No       | Glob pattern to filter files (e.g., `*.js`, `*.{ts,tsx}`) |
| `limit`   | number | No       | Maximum number of matching lines to return                |

**Examples:**

```json
// Find all function declarations
{ "pattern": "function\\s+\\w+" }

// Find TODOs in TypeScript files
{ "pattern": "TODO|FIXME", "glob": "*.ts" }

// Find imports in specific directory
{ "pattern": "import.*from", "path": "src/components" }
```

---

### list_directory

Lists files and subdirectories in a specified directory.

**Parameters:**

| Name                     | Type     | Required | Description                             |
| ------------------------ | -------- | -------- | --------------------------------------- |
| `path`                   | string   | Yes      | Absolute path to the directory to list  |
| `ignore`                 | string[] | No       | Glob patterns to ignore                 |
| `file_filtering_options` | object   | No       | Options for gitignore/ollama-codeignore |

**Example:**

```json
{
  "path": "/home/user/project/src",
  "ignore": ["node_modules", "*.test.ts"]
}
```

---

## Development Tools

### python_dev

Comprehensive Python development tool for managing Python projects, virtual environments, and running Python commands.

**Parameters:**

| Name                | Type     | Required | Description                          |
| ------------------- | -------- | -------- | ------------------------------------ |
| `action`            | string   | Yes      | Action to perform (see below)        |
| `script`            | string   | No       | Python script path for run action    |
| `args`              | string[] | No       | Additional arguments                 |
| `packages`          | string[] | No       | Packages for pip operations          |
| `directory`         | string   | No       | Working directory                    |
| `venv`              | string   | No       | Virtual environment path             |
| `python_path`       | string   | No       | Custom Python interpreter path       |
| `timeout`           | number   | No       | Timeout in milliseconds (max 600000) |
| `test_pattern`      | string   | No       | Test pattern for pytest              |
| `lint_config`       | string   | No       | Linter config file path              |
| `requirements_file` | string   | No       | Requirements file path               |
| `command`           | string   | No       | Custom command for custom action     |

**Available Actions:**

| Action          | Description                     |
| --------------- | ------------------------------- |
| `run`           | Execute a Python script         |
| `test`          | Run pytest tests                |
| `lint`          | Run pylint code analysis        |
| `format`        | Run black code formatter        |
| `venv_create`   | Create a virtual environment    |
| `venv_activate` | Get activation command for venv |
| `pip_install`   | Install packages with pip       |
| `pip_list`      | List installed packages         |
| `pip_freeze`    | Generate requirements.txt       |
| `mypy`          | Run mypy type checker           |
| `custom`        | Run custom Python command       |

**Examples:**

```json
// Run a Python script
{
  "action": "run",
  "script": "main.py",
  "args": ["--verbose", "input.txt"]
}

// Run pytest with pattern
{
  "action": "test",
  "test_pattern": "tests/unit/",
  "args": ["-k", "test_auth"]
}

// Create virtual environment
{
  "action": "venv_create",
  "venv": ".venv"
}

// Install packages
{
  "action": "pip_install",
  "packages": ["requests", "numpy"],
  "venv": ".venv"
}

// Run mypy type checker
{
  "action": "mypy",
  "script": "src/"
}
```

---

### nodejs_dev

Node.js/JavaScript development tool supporting npm, yarn, pnpm, and bun. Auto-detects package manager from lock files.

**Parameters:**

| Name              | Type     | Required | Description                                    |
| ----------------- | -------- | -------- | ---------------------------------------------- |
| `action`          | string   | Yes      | Action to perform (see below)                  |
| `package_manager` | string   | No       | Package manager (`npm`, `yarn`, `pnpm`, `bun`) |
| `script`          | string   | No       | Script path for run action                     |
| `args`            | string[] | No       | Additional arguments                           |
| `packages`        | string[] | No       | Packages for add/remove                        |
| `directory`       | string   | No       | Working directory                              |
| `dev`             | boolean  | No       | Add as dev dependency                          |
| `global`          | boolean  | No       | Install globally                               |
| `timeout`         | number   | No       | Timeout in milliseconds                        |
| `script_name`     | string   | No       | Package.json script name                       |
| `command`         | string   | No       | Custom command                                 |
| `background`      | boolean  | No       | Run in background (for dev servers)            |

**Available Actions:**

| Action       | Description                        |
| ------------ | ---------------------------------- |
| `run`        | Execute a Node.js script           |
| `install`    | Install dependencies               |
| `add`        | Add packages                       |
| `remove`     | Remove packages                    |
| `update`     | Update packages                    |
| `run_script` | Run package.json script            |
| `test`       | Run tests                          |
| `build`      | Run build                          |
| `dev`        | Run dev server                     |
| `lint`       | Run linter                         |
| `exec`       | Run npx/yarn dlx command           |
| `info`       | Show package info                  |
| `list`       | List installed packages            |
| `outdated`   | Check outdated packages            |
| `audit`      | Security audit                     |
| `clean`      | Remove node_modules and lock files |
| `init`       | Initialize new project             |
| `custom`     | Run custom command                 |

**Examples:**

```json
// Install dependencies
{ "action": "install" }

// Add packages
{
  "action": "add",
  "packages": ["express", "lodash"],
  "dev": false
}

// Run dev server in background
{
  "action": "dev",
  "background": true,
  "package_manager": "bun"
}

// Run custom npx command
{
  "action": "exec",
  "command": "create-next-app",
  "args": ["my-app", "--typescript"]
}

// Run tests
{
  "action": "test",
  "args": ["--coverage"]
}
```

---

### golang_dev

Golang development tool for managing Go projects, modules, and running Go commands.

**Parameters:**

| Name            | Type     | Required | Description                   |
| --------------- | -------- | -------- | ----------------------------- |
| `action`        | string   | Yes      | Action to perform (see below) |
| `file`          | string   | No       | Go file path                  |
| `args`          | string[] | No       | Additional arguments          |
| `package`       | string   | No       | Package path                  |
| `packages`      | string[] | No       | Packages for get/install      |
| `directory`     | string   | No       | Working directory             |
| `output`        | string   | No       | Output binary name for build  |
| `timeout`       | number   | No       | Timeout in milliseconds       |
| `test_pattern`  | string   | No       | Test name pattern             |
| `bench_pattern` | string   | No       | Benchmark pattern             |
| `cover_profile` | string   | No       | Coverage output file          |
| `race`          | boolean  | No       | Enable race detector          |
| `verbose`       | boolean  | No       | Enable verbose output         |
| `background`    | boolean  | No       | Run in background             |
| `module_name`   | string   | No       | Module name for go mod init   |
| `command`       | string   | No       | Custom command                |

**Available Actions:**

| Action         | Description              |
| -------------- | ------------------------ |
| `run`          | Run a Go file or package |
| `build`        | Build a Go program       |
| `test`         | Run tests                |
| `test_cover`   | Run tests with coverage  |
| `test_bench`   | Run benchmarks           |
| `fmt`          | Format Go code           |
| `vet`          | Run go vet               |
| `lint`         | Run golangci-lint        |
| `mod_init`     | Initialize go.mod        |
| `mod_tidy`     | Tidy dependencies        |
| `mod_download` | Download dependencies    |
| `mod_verify`   | Verify dependencies      |
| `mod_graph`    | Show dependency graph    |
| `get`          | Add a dependency         |
| `install`      | Install a Go tool        |
| `list`         | List packages            |
| `doc`          | Show documentation       |
| `env`          | Show Go environment      |
| `version`      | Show Go version          |
| `clean`        | Clean build cache        |
| `generate`     | Run go generate          |
| `custom`       | Run custom command       |

**Examples:**

```json
// Run a Go file
{
  "action": "run",
  "file": "main.go",
  "args": ["--config", "config.yaml"]
}

// Run tests with race detector
{
  "action": "test",
  "race": true,
  "verbose": true,
  "test_pattern": "TestUser"
}

// Build with output name
{
  "action": "build",
  "output": "myapp",
  "package": "./cmd/server"
}

// Initialize module
{
  "action": "mod_init",
  "module_name": "github.com/user/myproject"
}

// Add dependency
{
  "action": "get",
  "packages": ["github.com/gin-gonic/gin@latest"]
}

// Run golangci-lint
{
  "action": "lint",
  "args": ["--config", ".golangci.yml"]
}
```

---

### run_shell_command

Executes shell commands in the terminal. Supports both foreground and background execution.

**Parameters:**

| Name            | Type    | Required | Description                                          |
| --------------- | ------- | -------- | ---------------------------------------------------- |
| `command`       | string  | Yes      | The shell command to execute                         |
| `description`   | string  | No       | Brief description of the command                     |
| `directory`     | string  | No       | Working directory                                    |
| `timeout`       | number  | No       | Timeout in milliseconds (max 600000, default 120000) |
| `is_background` | boolean | No       | Run in background for long-running processes         |

**Examples:**

```json
// Run git commands
{
  "command": "git status && git diff",
  "description": "Check git status and changes"
}

// Run dev server in background
{
  "command": "npm run dev",
  "description": "Start development server",
  "is_background": true
}

// Run with custom timeout
{
  "command": "docker build -t myapp .",
  "description": "Build Docker image",
  "timeout": 300000
}
```

---

## Web & Network

### web_search

Searches the web for current information. Requires configuration of a search provider (Tavily or Google).

**Parameters:**

| Name       | Type   | Required | Description                          |
| ---------- | ------ | -------- | ------------------------------------ |
| `query`    | string | Yes      | Search query                         |
| `provider` | string | No       | Provider to use (`tavily`, `google`) |

**Example:**

```json
{
  "query": "Next.js 15 app router best practices 2024"
}
```

---

### web_fetch

Fetches content from a URL and processes it with AI to extract relevant information.

**Parameters:**

| Name     | Type   | Required | Description                                 |
| -------- | ------ | -------- | ------------------------------------------- |
| `url`    | string | Yes      | URL to fetch content from                   |
| `prompt` | string | Yes      | What to extract or process from the content |

**Example:**

```json
{
  "url": "https://react.dev/learn",
  "prompt": "Extract the main concepts and key takeaways from this React documentation page"
}
```

---

## Git Operations

### git_workflow

Complete git workflow integration with support for GitHub and GitLab (including self-hosted instances). Provides all basic git operations plus MR/PR creation.

**Parameters:**

| Name        | Type   | Required | Description                                  |
| ----------- | ------ | -------- | -------------------------------------------- |
| `operation` | string | Yes      | Git operation to perform (see below)         |
| `args`      | object | No       | Arguments specific to the operation          |
| `directory` | string | No       | Working directory (defaults to project root) |

**Available Operations:**

#### Basic Operations

| Operation | Description             | Key Arguments                              |
| --------- | ----------------------- | ------------------------------------------ |
| `status`  | Check repository status | `short`, `branch`                          |
| `add`     | Stage files             | `files` (array or string, defaults to all) |
| `commit`  | Commit staged changes   | `message`, `amend`, `noVerify`, `signoff`  |
| `push`    | Push to remote          | `remote`, `branch`, `setUpstream`, `force` |
| `pull`    | Pull from remote        | `remote`, `branch`, `rebase`               |
| `fetch`   | Fetch from remote       | `remote`, `branch`, `all`, `prune`         |

#### Branch Operations

| Operation       | Description       | Key Arguments                         |
| --------------- | ----------------- | ------------------------------------- |
| `create_branch` | Create new branch | `name`, `checkout`, `startPoint`      |
| `switch`        | Switch to branch  | `branch`, `create`                    |
| `merge`         | Merge branches    | `branch`, `noFf`, `ffOnly`, `message` |

#### Info Operations

| Operation     | Description         | Key Arguments                          |
| ------------- | ------------------- | -------------------------------------- |
| `log`         | Show commit history | `oneline`, `graph`, `count`, `branch`  |
| `diff`        | Show differences    | `staged`, `file`, `branch1`, `branch2` |
| `remote_info` | Get remote info     | —                                      |

#### MR/PR Operations

| Operation      | Description                           | Key Arguments                                                                                 |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `create_mr`    | Create GitLab Merge Request           | `title`, `description`, `targetBranch`, `sourceBranch`, `assignee`, `labels`, `draft`, `push` |
| `create_pr`    | Create GitHub Pull Request            | `title`, `description`, `base`, `head`, `assignee`, `labels`, `draft`, `push`                 |
| `create_merge` | Auto-detect platform and create MR/PR | `title`, `description`, `targetBranch`, `sourceBranch`, `assignee`, `labels`, `draft`, `push` |

#### Authentication Operations

| Operation     | Description                 | Key Arguments                             |
| ------------- | --------------------------- | ----------------------------------------- |
| `auth_status` | Check authentication status | `platform` (github/gitlab/auto)           |
| `auth_login`  | Get login instructions      | `platform`, `method`, `hostname`, `token` |
| `auth_logout` | Logout from platform        | `platform`, `hostname`                    |
| `auth_token`  | Set authentication token    | `platform`, `token`, `hostname`           |

#### Other Operations

| Operation | Description      | Key Arguments                                                      |
| --------- | ---------------- | ------------------------------------------------------------------ |
| `clone`   | Clone repository | `url`, `directory`, `branch`, `depth`, `singleBranch`, `recursive` |

**Examples:**

```json
// Check repository status
{
  "operation": "status",
  "args": { "short": true, "branch": true }
}

// Commit changes
{
  "operation": "commit",
  "args": { "message": "feat: add new feature" }
}

// Push with upstream
{
  "operation": "push",
  "args": { "setUpstream": true }
}

// Create GitHub Pull Request
{
  "operation": "create_pr",
  "args": {
    "title": "Add new feature",
    "description": "This PR adds a new feature...",
    "base": "main",
    "draft": false
  }
}

// Create GitLab Merge Request
{
  "operation": "create_mr",
  "args": {
    "title": "Add new feature",
    "description": "This MR adds a new feature...",
    "targetBranch": "main",
    "labels": "feature,enhancement"
  }
}

// Auto-detect platform and create MR/PR
{
  "operation": "create_merge",
  "args": {
    "title": "Add new feature",
    "description": "This adds a new feature..."
  }
}

// Clone repository
{
  "operation": "clone",
  "args": {
    "url": "https://github.com/user/repo.git",
    "directory": "./my-project",
    "branch": "develop",
    "depth": 1
  }
}

// Check authentication status
{
  "operation": "auth_status",
  "args": { "platform": "auto" }
}
```

**Platform Support:**

- **GitHub**: Full support via `gh` CLI
- **GitLab.com**: Full support via `glab` CLI
- **Self-hosted GitLab**: Auto-detection and support
- **Fallback**: Instructions provided when CLI tools not installed

---

### git_advanced

Advanced git operations for power users. Provides access to stash, cherry-pick, rebase, bisect, and blame operations.

**Parameters:**

| Name        | Type   | Required | Description                         |
| ----------- | ------ | -------- | ----------------------------------- |
| `operation` | string | Yes      | Git operation to perform            |
| `args`      | object | No       | Arguments specific to the operation |

**Available Operations:**

| Operation     | Description               |
| ------------- | ------------------------- |
| `stash`       | Stash changes             |
| `stash_pop`   | Apply and drop stash      |
| `stash_list`  | List stashes              |
| `cherry_pick` | Cherry-pick a commit      |
| `rebase`      | Rebase current branch     |
| `bisect`      | Binary search for bugs    |
| `blame`       | Show line-by-line history |

**Examples:**

```json
// Stash changes with message
{
  "operation": "stash",
  "args": { "message": "WIP: feature in progress" }
}

// Cherry-pick a commit
{
  "operation": "cherry_pick",
  "args": { "commit": "abc123" }
}

// Rebase onto main
{
  "operation": "rebase",
  "args": { "onto": "main" }
}
```

---

## SSH Tools

### ssh_connect

Connects to a remote machine via SSH and executes commands. Supports both direct connection and saved profiles.

**Parameters:**

| Name            | Type   | Required | Description                                          |
| --------------- | ------ | -------- | ---------------------------------------------------- |
| `profile`       | string | No\*     | Name of saved SSH profile (alternative to host/user) |
| `host`          | string | No\*     | Hostname or IP address (required if no profile)      |
| `user`          | string | No\*     | Username for SSH (required if no profile)            |
| `command`       | string | No       | Command to execute on remote server                  |
| `port`          | number | No       | SSH port number (default: 22)                        |
| `identity_file` | string | No       | Path to SSH private key file                         |
| `password`      | string | No       | Password for authentication (not recommended)        |
| `timeout`       | number | No       | Timeout in milliseconds (max 600000, default 60000)  |
| `description`   | string | No       | Brief description of the operation                   |

\*Either `profile` OR (`host` + `user`) must be specified.

**Examples:**

```json
// Using saved profile
{
  "profile": "production",
  "command": "docker ps"
}

// Direct connection with SSH key
{
  "host": "192.168.1.100",
  "user": "admin",
  "port": 2222,
  "identity_file": "~/.ssh/deploy_key",
  "command": "systemctl status nginx"
}

// Interactive shell (no command)
{
  "profile": "dev-server"
}
```

**Security Notes:**

- SSH connections always require user confirmation
- Use `identity_file` (SSH key) authentication instead of password when possible
- Passwords are masked in tool output

---

### ssh_add_host

Saves an SSH host configuration for later use. Creates a named profile that can be used with `ssh_connect`.

**Parameters:**

| Name            | Type     | Required | Description                            |
| --------------- | -------- | -------- | -------------------------------------- |
| `name`          | string   | Yes      | Unique name for this SSH profile       |
| `host`          | string   | Yes      | Hostname or IP address                 |
| `user`          | string   | Yes      | Username for SSH                       |
| `port`          | number   | No       | SSH port (default: 22)                 |
| `identity_file` | string   | No       | Path to SSH private key file           |
| `password`      | string   | No       | Password (not recommended)             |
| `description`   | string   | No       | Description of this host               |
| `tags`          | string[] | No       | Tags for organization (e.g., ["prod"]) |

**Examples:**

```json
// Basic profile with SSH key
{
  "name": "production",
  "host": "192.168.1.100",
  "user": "admin",
  "identity_file": "~/.ssh/id_rsa"
}

// With custom port and tags
{
  "name": "aws-dev",
  "host": "ec2-x-x-x-x.compute.amazonaws.com",
  "user": "ubuntu",
  "port": 22,
  "identity_file": "~/.ssh/aws_key.pem",
  "tags": ["aws", "dev"]
}
```

---

### ssh_list_hosts

Lists all saved SSH host profiles.

**Parameters:**

| Name  | Type   | Required | Description            |
| ----- | ------ | -------- | ---------------------- |
| `tag` | string | No       | Filter profiles by tag |

**Examples:**

```json
// List all profiles
{}

// List profiles with specific tag
{ "tag": "production" }
```

---

### ssh_remove_host

Removes a saved SSH host profile.

**Parameters:**

| Name   | Type   | Required | Description                   |
| ------ | ------ | -------- | ----------------------------- |
| `name` | string | Yes      | Name of the profile to remove |

**Example:**

```json
{
  "name": "old-server"
}
```

---

## Task Management

### todo_write

Creates and manages a structured task list for tracking progress on complex tasks.

**Parameters:**

| Name    | Type  | Required | Description         |
| ------- | ----- | -------- | ------------------- |
| `todos` | array | Yes      | Array of todo items |

**Todo Item Structure:**

| Field     | Type   | Description                                   |
| --------- | ------ | --------------------------------------------- |
| `id`      | string | Unique identifier                             |
| `content` | string | Task description                              |
| `status`  | string | One of: `pending`, `in_progress`, `completed` |

**Example:**

```json
{
  "todos": [
    { "id": "1", "content": "Create API endpoints", "status": "completed" },
    { "id": "2", "content": "Add authentication", "status": "in_progress" },
    { "id": "3", "content": "Write tests", "status": "pending" }
  ]
}
```

---

### task

Delegates complex, multi-step tasks to specialized subagents.

**Parameters:**

| Name            | Type   | Required | Description                   |
| --------------- | ------ | -------- | ----------------------------- |
| `subagent_type` | string | Yes      | Type of subagent to use       |
| `description`   | string | Yes      | Short description (3-5 words) |
| `prompt`        | string | Yes      | Detailed task instructions    |

**Example:**

```json
{
  "subagent_type": "general-purpose",
  "description": "Research API design",
  "prompt": "Research best practices for REST API design and provide a summary of key principles"
}
```

---

## Memory & Knowledge

Ollama Code provides two tools for storing information with different purposes:

### Tool Comparison

| Feature | `save_memory` | `model_storage` |
|---------|---------------|-----------------|
| **Purpose** | User facts & preferences | AI internal data |
| **Triggered by** | Explicit user request | AI decision |
| **Format** | Markdown (human-readable) | JSON (structured) |
| **Confirmation** | ✅ Always required | ❌ Automatic |
| **Operations** | Add only | set/get/delete/list/merge/batch |
| **TTL** | ❌ No | ✅ Yes (auto-expire) |
| **Metadata** | ❌ No | ✅ createdAt, version, tags |

---

### save_memory

Tool for saving user facts and preferences to long-term memory. Use it when the user explicitly asks to remember something important.

#### When to Use ✅

1. **User explicitly asks to remember**
   - "Remember that my cat's name is Whiskers"
   - "Please remember: I prefer tabs over spaces"
   - "Don't forget that I work remotely on Fridays"

2. **User shares personal preference**
   - "My preferred programming language is Python"
   - "I like dark mode in all my editors"
   - "I prefer concise responses"

3. **User shares important context**
   - "This project uses strict TypeScript"
   - "My team uses conventional commits"
   - "We follow the Airbnb style guide"

#### When NOT to Use ❌

- For temporary session data (use `model_storage` with `session` namespace)
- For structured data like roadmaps, metrics (use `model_storage`)
- For large amounts of text or code (use files)
- For data that needs TTL/expiration (use `model_storage`)
- For AI's internal learning without user request (use `model_storage`)

#### Parameters

| Name    | Type   | Required | Description                                                      |
| ------- | ------ | -------- | ---------------------------------------------------------------- |
| `fact`  | string | Yes      | The fact to remember (clear, self-contained statement)           |
| `scope` | string | No       | `global` (all projects) or `project` (current project). Prompts user if not specified |

#### Storage Locations

| Scope | Path | Purpose |
|-------|------|---------|
| `global` | `~/.ollama-code/OLLAMA_MEMORY.md` | Shared across all projects |
| `project` | `./OLLAMA_MEMORY.md` | Current project only |

#### Examples

**Basic usage:**
```json
{
  "fact": "My preferred programming language is TypeScript"
}
```

**With scope:**
```json
{
  "fact": "In this project always use pnpm, never npm",
  "scope": "project"
}
```

**What the memory file looks like:**
```markdown
# Project Context

Some existing content...

## Ollama Added Memories

- My preferred programming language is TypeScript
- In this project always use pnpm, never npm
- I prefer concise responses without excessive explanations
- The API base URL for development is http://localhost:3000
```

---

### model_storage

Universal key-value storage for AI model with full CRUD operations, TTL support, and metadata tracking. Used by AI for internal needs without user involvement.

#### When to Use ✅

1. **Project Roadmaps & Plans**
   - Milestones and feature planning
   - Task breakdowns with status
   - Version planning

2. **Knowledge Base Management**
   - Learned patterns and conventions
   - API documentation snippets
   - Code templates

3. **Session Data**
   - Temporary working state
   - Current task context
   - Progress tracking

4. **Learning & Improvements**
   - Tool usage corrections
   - Alias mappings
   - Error patterns and solutions

5. **Metrics & Statistics**
   - Performance data
   - Usage patterns
   - Time tracking

#### When NOT to Use ❌

- For user-requested memory saves (use `save_memory`)
- For facts user wants to edit manually (Markdown is user-friendly)

#### Namespaces

| Namespace | Purpose | Default Mode | Example Keys |
|-----------|---------|--------------|--------------|
| `roadmap` | Project plans, milestones | persistent | `v1.0`, `v2.0`, `q1-goals` |
| `session` | Temporary session data | session | `current-task`, `temp-state` |
| `knowledge` | Learned facts, patterns | persistent | `api-pattern`, `auth-flow` |
| `context` | Current task context | session | `active-feature`, `decisions` |
| `learning` | Tool corrections, aliases | persistent | `tool-fix`, `command-alias` |
| `metrics` | Statistics, performance | persistent | `daily-stats`, `response-times` |

#### Storage Modes

| Mode | Storage | Lifecycle | Use For |
|------|---------|-----------|---------|
| `persistent` | JSON files | Survives restarts | roadmap, knowledge, learning |
| `session` | Memory only | Cleared on exit | temporary data, context |

**Auto-detection:** Namespaces `session` and `context` default to session mode. Others default to persistent.

#### Parameters

| Name              | Type     | Required | Description                                             |
| ----------------- | -------- | -------- | ------------------------------------------------------- |
| `operation`       | string   | Yes      | Operation to perform                                     |
| `namespace`       | string   | Yes      | Storage namespace                                        |
| `key`             | string   | No\*     | Key to store/retrieve                                    |
| `value`           | any      | No\*     | Value (any JSON-serializable type)                       |
| `persistent`      | boolean  | No       | Override auto-detection of mode                          |
| `scope`           | string   | No       | `global` or `project`                                    |
| `ttl`             | number   | No       | Time-to-live in seconds (auto-expire)                    |
| `tags`            | string[] | No       | Tags for categorization                                  |
| `includeMetadata` | boolean  | No       | Include metadata in get/list results                     |
| `actions`         | array    | No       | Array of operations for batch                            |

\*Required for `set`, `get`, `delete`, `append`, `merge` operations.

#### Operations

| Operation | Description |
|-----------|-------------|
| `set` | Store a value (overwrites existing) |
| `get` | Retrieve a value by key |
| `delete` | Remove a key |
| `list` | List all keys in namespace |
| `append` | Add item to array |
| `merge` | Merge object with existing data |
| `clear` | Clear all data in namespace |
| `exists` | Check if key exists |
| `stats` | Get storage statistics |
| `batch` | Execute multiple operations atomically |

#### Examples

**set - Store a value:**
```json
{
  "operation": "set",
  "namespace": "roadmap",
  "key": "v1.0",
  "value": {
    "features": ["auth", "dashboard"],
    "status": "in-progress",
    "targetDate": "2025-03-01"
  }
}
```

**set with TTL (expires in 1 hour):**
```json
{
  "operation": "set",
  "namespace": "session",
  "key": "temp-cache",
  "value": "temporary data",
  "ttl": 3600
}
```

**set with tags:**
```json
{
  "operation": "set",
  "namespace": "knowledge",
  "key": "auth-pattern",
  "value": { "pattern": "JWT", "library": "jsonwebtoken" },
  "tags": ["auth", "security", "important"]
}
```

**get - Retrieve a value:**
```json
{
  "operation": "get",
  "namespace": "roadmap",
  "key": "v1.0"
}
```

**get with metadata:**
```json
{
  "operation": "get",
  "namespace": "roadmap",
  "key": "v1.0",
  "includeMetadata": true
}
```

**list - List all keys:**
```json
{
  "operation": "list",
  "namespace": "roadmap"
}
```

**exists - Check existence:**
```json
{
  "operation": "exists",
  "namespace": "roadmap",
  "key": "v1.0"
}
```

**append - Add to array:**
```json
{
  "operation": "append",
  "namespace": "knowledge",
  "key": "learned-patterns",
  "value": "Always check for null before accessing nested properties"
}
```

**merge - Merge objects:**
```json
{
  "operation": "merge",
  "namespace": "knowledge",
  "key": "api-conventions",
  "value": {
    "errorFormat": "RFC7807",
    "authHeader": "Bearer token"
  }
}
```

**batch - Multiple operations:**
```json
{
  "operation": "batch",
  "namespace": "roadmap",
  "actions": [
    { "operation": "set", "key": "v1.0", "value": {"status": "done"} },
    { "operation": "set", "key": "v2.0", "value": {"status": "planning"} },
    { "operation": "delete", "key": "deprecated-feature" }
  ]
}
```

**stats - Namespace statistics:**
```json
{
  "operation": "stats",
  "namespace": "roadmap"
}
```

#### Scope (persistent storage only)

| Scope | Location | Use |
|-------|----------|-----|
| `global` | `~/.ollama-code/storage/` | Shared across all projects |
| `project` | `<project>/.ollama-code/storage/` | Current project only |

```json
{
  "operation": "set",
  "namespace": "roadmap",
  "key": "project-goals",
  "value": { "q1": "MVP release" },
  "scope": "project"
}
```

#### Metadata

Every entry automatically tracks:

```json
{
  "value": { ... },
  "metadata": {
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-16T14:20:00Z",
    "version": 3,
    "ttl": 3600,
    "expiresAt": "2025-01-15T11:30:00Z",
    "tags": ["auth", "security"],
    "source": "session"
  }
}
```

#### Storage Location

**Persistent:**
```
~/.ollama-code/storage/
├── roadmap.json
├── knowledge.json
├── learning.json
└── metrics.json

<project>/.ollama-code/storage/
├── roadmap.json
└── knowledge.json
```

**Session:** Held in memory, cleared when session ends.

---

### Decision Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Need to store data?                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │ Did user explicitly    │
                 │ ask to remember?       │
                 └────────────────────────┘
                    │                │
                   YES               NO
                    │                │
                    ▼                ▼
         ┌──────────────┐  ┌────────────────────────┐
         │ save_memory  │  │ Is it temporary/       │
         │              │  │ session data?          │
         └──────────────┘  └────────────────────────┘
                               │           │
                              YES          NO
                               │           │
                               ▼           ▼
                    ┌──────────────┐  ┌──────────────────┐
                    │ model_storage│  │ model_storage    │
                    │ (session)    │  │ (appropriate     │
                    │              │  │  namespace)      │
                    └──────────────┘  └──────────────────┘
```

---

### Best Practices

**For save_memory:**
1. Keep facts concise — one clear statement
2. Be specific — "I use 2 spaces for YAML" not "I have indentation preferences"
3. Choose scope wisely — use `project` for project-specific settings
4. Review periodically — memory file is editable by hand
5. Don't duplicate — check if fact already saved

**For model_storage:**
1. Use appropriate namespaces — organize data by purpose
2. Set TTL for temporary data — prevents stale data accumulation
3. Use tags for filtering — makes it easier to find related entries
4. Batch operations are more efficient — for multiple changes
5. Check before set — use `exists` to avoid accidental overwrites

---

### skill

Executes specialized skills for specific tasks.

**Parameters:**

| Name      | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `command` | string | Yes      | Skill command to execute |

**Example:**

```json
{
  "command": "pdf"
}
```

---

## Other Tools

### lsp

Language Server Protocol integration for code intelligence features like go-to-definition, find references, and completions.

**Parameters:**

| Name        | Type   | Required | Description           |
| ----------- | ------ | -------- | --------------------- |
| `action`    | string | Yes      | LSP action to perform |
| `file_path` | string | Yes      | File path             |
| `line`      | number | No       | Line number           |
| `character` | number | No       | Character position    |

---

### exit_plan_mode

Exits planning mode and presents the plan to the user for approval.

**Parameters:**

| Name   | Type   | Required | Description                      |
| ------ | ------ | -------- | -------------------------------- |
| `plan` | string | Yes      | The plan to present for approval |

**Example:**

```json
{
  "plan": "1. Create database schema\n2. Implement API endpoints\n3. Add frontend components\n4. Write tests"
}
```

---

## Error Handling

All tools return a consistent error structure when something goes wrong:

```typescript
{
  "llmContent": "Detailed error message for the LLM",
  "returnDisplay": "User-friendly error message",
  "error": {
    "message": "Error details",
    "type": "error_type_code"
  }
}
```

**Common Error Types:**

| Error Type            | Description                   |
| --------------------- | ----------------------------- |
| `file_not_found`      | Requested file does not exist |
| `permission_denied`   | Insufficient permissions      |
| `invalid_tool_params` | Invalid or missing parameters |
| `execution_failed`    | Tool execution failed         |
| `timeout`             | Operation timed out           |

---

## Best Practices

### File Operations

1. Always use absolute paths
2. Read files before editing to understand context
3. Include sufficient context in `old_string` for edits
4. Use `glob` or `grep_search` before reading to locate files

### Search & Navigation

1. Use `glob` for finding files by name pattern
2. Use `grep_search` for searching file contents
3. Combine tools for efficient exploration
4. Use glob filters to narrow search scope

### Development Tools

1. Use specialized dev tools (`python_dev`, `nodejs_dev`, `golang_dev`) instead of raw shell commands
2. Set `background: true` for long-running processes
3. Configure appropriate timeouts for build operations

### Task Management

1. Create todo lists for multi-step tasks
2. Update status in real-time
3. Mark tasks complete immediately after finishing
4. Only have one task `in_progress` at a time

---

## Configuration

Tools can be enabled/disabled in `settings.json`:

```json
{
  "coreTools": ["read_file", "edit", "run_shell_command"],
  "excludeTools": ["web_search"]
}
```
