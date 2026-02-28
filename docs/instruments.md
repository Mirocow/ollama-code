# Ollama Code - Supported Instruments

> **Languages**: [English](./instruments.md) | [Русский](./instruments.ru.md)

Complete list of all supported development instruments and tools.

---

## Development Tools

### Python Development (`python_dev`)

**Canonical Name**: `python_dev`  
**Aliases**: `py`, `python`, `pip`, `pytest`

| Action | Description |
|--------|-------------|
| `run` | Run Python script |
| `test` | Run pytest tests |
| `lint` | Run pylint analysis |
| `format` | Run black formatter |
| `venv_create` | Create virtual environment |
| `venv_activate` | Get activation command |
| `pip_install` | Install packages |
| `pip_list` | List installed packages |
| `pip_freeze` | Generate requirements.txt |
| `mypy` | Run mypy type checker |
| `custom` | Custom Python command |

**Example**:
```json
{
  "action": "run",
  "script": "main.py",
  "args": ["--verbose"]
}
```

---

### Node.js Development (`nodejs_dev`)

**Canonical Name**: `nodejs_dev`  
**Aliases**: `node`, `npm`, `yarn`, `pnpm`, `bun`

| Action | Description |
|--------|-------------|
| `run` | Run Node.js script |
| `install` | Install dependencies |
| `add` | Add packages |
| `remove` | Remove packages |
| `update` | Update packages |
| `run_script` | Run package.json script |
| `test` | Run tests |
| `build` | Run build |
| `dev` | Run dev server |
| `lint` | Run linter |
| `exec` | Run npx/yarn dlx |
| `clean` | Remove node_modules |
| `custom` | Custom npm/yarn command |

**Example**:
```json
{
  "action": "add",
  "packages": ["express", "lodash"],
  "package_manager": "yarn"
}
```

---

### Golang Development (`golang_dev`)

**Canonical Name**: `golang_dev`  
**Aliases**: `go`, `golang`

| Action | Description |
|--------|-------------|
| `run` | Run Go file |
| `build` | Build program |
| `test` | Run tests |
| `test_cover` | Tests with coverage |
| `test_bench` | Run benchmarks |
| `fmt` | Format code |
| `vet` | Static analysis |
| `lint` | Run golangci-lint |
| `mod_init` | Initialize module |
| `mod_tidy` | Tidy dependencies |
| `mod_download` | Download modules |
| `get` | Add dependency |
| `install` | Install tool |
| `custom` | Custom go command |

**Example**:
```json
{
  "action": "test",
  "race": true,
  "test_pattern": "TestUser"
}
```

---

### PHP Development (`php_dev`)

**Canonical Name**: `php_dev`  
**Aliases**: `php`, `composer`, `phpunit`, `artisan`

| Action | Description |
|--------|-------------|
| `run` | Run PHP script |
| `test` | Run PHPUnit |
| `lint` | Run phpcs |
| `format` | Run PHP-CS-Fixer |
| `composer_install` | Install dependencies |
| `composer_update` | Update dependencies |
| `composer_require` | Add package |
| `composer_remove` | Remove package |
| `composer_dump_autoload` | Regenerate autoload |
| `phpunit` | Run PHPUnit directly |
| `psalm` | Psalm analysis |
| `phpstan` | PHPStan analysis |
| `artisan` | Laravel Artisan |
| `custom` | Custom PHP command |

**Example**:
```json
{
  "action": "composer_require",
  "packages": ["laravel/framework"]
}
```

---

## Shell & Commands

### Shell Command (`run_shell_command`)

**Canonical Name**: `run_shell_command`  
**Aliases**: `run`, `shell`, `exec`, `cmd`

| Parameter | Description |
|-----------|-------------|
| `command` | Shell command to execute |
| `description` | Brief description |
| `directory` | Working directory |
| `timeout` | Timeout in ms |
| `is_background` | Run in background |

**Example**:
```json
{
  "command": "git status && git diff",
  "description": "Check git status"
}
```

---

## File Operations

### Read File (`read_file`)

**Canonical Name**: `read_file`  
**Aliases**: `read`

| Parameter | Description |
|-----------|-------------|
| `absolute_path` | File path (required) |
| `offset` | Line offset |
| `limit` | Max lines |

### Write File (`write_file`)

**Canonical Name**: `write_file`  
**Aliases**: `write`, `create`

| Parameter | Description |
|-----------|-------------|
| `file_path` | File path (required) |
| `content` | Content to write |

### Edit File (`edit`)

**Canonical Name**: `edit`  
**Aliases**: `edit`, `replace`

| Parameter | Description |
|-----------|-------------|
| `file_path` | File path (required) |
| `old_string` | Text to replace |
| `new_string` | Replacement text |
| `replace_all` | Replace all occurrences |

### Read Many Files (`read_many_files`)

**Canonical Name**: `read_many_files`  
**Aliases**: `readmany`, `read_all`, `cat`

---

## Search & Navigation

### Glob (`glob`)

**Canonical Name**: `glob`  
**Aliases**: `glob`, `files`

| Parameter | Description |
|-----------|-------------|
| `pattern` | Glob pattern (required) |
| `path` | Search directory |

### Grep (`grep_search`)

**Canonical Name**: `grep_search`  
**Aliases**: `grep`, `search`, `find`

| Parameter | Description |
|-----------|-------------|
| `pattern` | Regex pattern (required) |
| `glob` | File filter |
| `path` | Search directory |
| `limit` | Max results |

### List Directory (`list_directory`)

**Canonical Name**: `list_directory`  
**Aliases**: `ls`, `list`, `dir`

---

## Web & Network

### Web Search (`web_search`)

**Canonical Name**: `web_search`  
**Aliases**: `websearch`, `web`

| Parameter | Description |
|-----------|-------------|
| `query` | Search query (required) |
| `provider` | Provider (tavily/google) |

### Web Fetch (`web_fetch`)

**Canonical Name**: `web_fetch`  
**Aliases**: `webfetch`, `fetch`, `url`

| Parameter | Description |
|-----------|-------------|
| `url` | URL to fetch (required) |
| `prompt` | Processing prompt |

---

## Task Management

### Todo Write (`todo_write`)

**Canonical Name**: `todo_write`  
**Aliases**: `todo`, `todos`

| Parameter | Description |
|-----------|-------------|
| `todos` | Array of todo items |

**Todo Item**:
```json
{
  "id": "1",
  "content": "Task description",
  "status": "pending|in_progress|completed"
}
```

### Task Delegation (`task`)

**Canonical Name**: `task`  
**Aliases**: `agent`, `subagent`

| Parameter | Description |
|-----------|-------------|
| `subagent_type` | Agent type (required) |
| `description` | Short description |
| `prompt` | Task instructions |

---

## Memory & Knowledge

### Save Memory (`save_memory`)

**Canonical Name**: `save_memory`  
**Aliases**: `memory`, `save`

| Parameter | Description |
|-----------|-------------|
| `fact` | Fact to remember |
| `scope` | global/project |

### Skill (`skill`)

**Canonical Name**: `skill`  
**Aliases**: `skills`

| Parameter | Description |
|-----------|-------------|
| `command` | Skill command |

---

## Other Tools

### LSP (`lsp`)

**Canonical Name**: `lsp`

Language Server Protocol integration.

### Exit Plan Mode (`exit_plan_mode`)

**Canonical Name**: `exit_plan_mode`  
**Aliases**: `exit_plan`, `plan_done`

---

## Database & DevOps

### Database (`database`)

Database operations for SQLite, PostgreSQL, MySQL, MongoDB.

### Redis (`redis`)

Redis cache and pub/sub operations.

### Docker (`docker`)

Docker container management.

### Git Advanced (`git_advanced`)

Advanced git operations (stash, cherry-pick, rebase, bisect).

### API Tester (`api_tester`)

REST API testing.

### Code Analyzer (`code_analyzer`)

Code quality analysis.

### Diagram Generator (`diagram_generator`)

Mermaid and PlantUML diagram generation.

---

## Complete Aliases Table

| Alias | Canonical Tool |
|-------|---------------|
| `run`, `shell`, `exec`, `cmd` | `run_shell_command` |
| `read` | `read_file` |
| `write`, `create` | `write_file` |
| `edit`, `replace` | `edit` |
| `readmany`, `read_all`, `cat` | `read_many_files` |
| `grep`, `search`, `find` | `grep_search` |
| `glob`, `files` | `glob` |
| `ls`, `list`, `dir` | `list_directory` |
| `todo`, `todos` | `todo_write` |
| `memory`, `save` | `save_memory` |
| `websearch`, `web` | `web_search` |
| `webfetch`, `fetch`, `url` | `web_fetch` |
| `agent`, `subagent` | `task` |
| `py`, `python`, `pip`, `pytest` | `python_dev` |
| `node`, `npm`, `yarn`, `pnpm`, `bun` | `nodejs_dev` |
| `go`, `golang` | `golang_dev` |
| `php`, `composer`, `phpunit`, `artisan` | `php_dev` |

---

## Related Documentation

- [FEATURES.md](./FEATURES.md) - Complete feature reference
- [TOOLS.md](./TOOLS.md) - Detailed tools documentation
