# Ollama Code - Complete Feature Reference

> **Language**: [English](./FEATURES.md) | [Русский](./FEATURES.ru.md)

Complete documentation of all implemented features in Ollama Code.

---

## Table of Contents

- [Development Tools](#development-tools)
  - [Python Development](#python-development)
  - [Node.js Development](#nodejs-development)
  - [Golang Development](#golang-development)
  - [PHP Development](#php-development)
- [File Operations](#file-operations)
- [Search & Navigation](#search--navigation)
- [Database & Cache](#database--cache)
- [Container & DevOps](#container--devops)
- [Web & Network](#web--network)
- [Code Quality](#code-quality)
- [Git Operations](#git-operations)
- [Task Management](#task-management)
- [Memory & Knowledge](#memory--knowledge)
- [UI Components](#ui-components)
- [Tool Aliases](#tool-aliases)
- [Environment Configuration](#environment-configuration)

---

## Development Tools

### Python Development

**Tool Name**: `python_dev`  
**Aliases**: `py`, `python`, `pip`, `pytest`

Comprehensive Python development tool for managing projects, virtual environments, and executing Python commands.

#### Supported Actions

| Action | Description | Example |
|--------|-------------|---------|
| `run` | Execute Python script | Run `main.py` with arguments |
| `test` | Run pytest | Execute tests with pattern |
| `lint` | Run pylint | Analyze code quality |
| `format` | Run black | Format code |
| `venv_create` | Create virtual environment | Create `.venv` directory |
| `venv_activate` | Get activation command | Return source command |
| `pip_install` | Install packages | Install `requests`, `numpy` |
| `pip_list` | List packages | Show installed packages |
| `pip_freeze` | Generate requirements | Output to `requirements.txt` |
| `mypy` | Type checking | Run mypy on source |
| `custom` | Custom command | Any Python command |

#### Example Usage

```json
{
  "action": "test",
  "test_pattern": "tests/unit/",
  "args": ["-v", "--cov=src"]
}
```

#### Popular Libraries Support

- **Testing**: pytest, unittest, nose2
- **Linting**: pylint, flake8, ruff
- **Formatting**: black, autopep8, yapf
- **Type Checking**: mypy, pyright
- **Package Management**: pip, poetry, pipenv

---

### Node.js Development

**Tool Name**: `nodejs_dev`  
**Aliases**: `node`, `npm`, `yarn`, `pnpm`, `bun`

Full Node.js/JavaScript development support with auto-detection of package managers.

#### Supported Actions

| Action | Description | Example |
|--------|-------------|---------|
| `run` | Execute Node.js script | Run `server.js` |
| `install` | Install dependencies | Run `npm install` |
| `add` | Add packages | Install `express` |
| `remove` | Remove packages | Uninstall package |
| `update` | Update packages | Update dependencies |
| `run_script` | Run package.json script | Execute `npm run build` |
| `test` | Run tests | Execute test suite |
| `build` | Run build | Compile project |
| `dev` | Run dev server | Start with hot reload |
| `lint` | Run linter | ESLint, TSLint |
| `exec` | Run npx command | Execute `npx create-app` |
| `info` | Show package info | Display package details |
| `list` | List packages | Show installed deps |
| `outdated` | Check outdated | Find updates |
| `audit` | Security audit | Check vulnerabilities |
| `clean` | Clean project | Remove `node_modules` |
| `init` | Initialize project | Create `package.json` |
| `custom` | Custom command | Any npm/yarn command |

#### Package Manager Auto-Detection

The tool automatically detects the package manager based on lock files:

| Lock File | Package Manager |
|-----------|-----------------|
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `bun.lock` / `bun.lockb` | bun |
| `package-lock.json` | npm |

#### Popular Frameworks Support

- **Frontend**: React, Vue, Angular, Svelte, Next.js, Nuxt
- **Backend**: Express, Fastify, NestJS, Koa, Hono
- **Testing**: Jest, Vitest, Mocha, Playwright
- **Build**: Webpack, Vite, esbuild, Rollup
- **ORM**: Prisma, TypeORM, Sequelize, Drizzle

---

### Golang Development

**Tool Name**: `golang_dev`  
**Aliases**: `go`, `golang`

Complete Go development support including module management and testing.

#### Supported Actions

| Action | Description | Example |
|--------|-------------|---------|
| `run` | Run Go file | Execute `main.go` |
| `build` | Build program | Compile binary |
| `test` | Run tests | Execute test suite |
| `test_cover` | Tests with coverage | Generate coverage report |
| `test_bench` | Run benchmarks | Performance testing |
| `fmt` | Format code | Run `go fmt` |
| `vet` | Static analysis | Run `go vet` |
| `lint` | Run golangci-lint | Comprehensive linting |
| `mod_init` | Initialize module | Create `go.mod` |
| `mod_tidy` | Tidy dependencies | Clean up imports |
| `mod_download` | Download deps | Fetch modules |
| `mod_verify` | Verify deps | Check integrity |
| `mod_graph` | Dependency graph | Show dep tree |
| `get` | Add dependency | Install package |
| `install` | Install tool | Install CLI tool |
| `list` | List packages | Show all packages |
| `doc` | Show documentation | Display docs |
| `env` | Go environment | Show config |
| `version` | Go version | Display version |
| `clean` | Clean cache | Clear build cache |
| `generate` | Run go generate | Code generation |
| `custom` | Custom command | Any go command |

#### Popular Libraries Support

- **Web Frameworks**: Gin, Echo, Fiber, Chi
- **ORM**: GORM, sqlx, ent
- **Testing**: testify, mock, ginkgo
- **CLI**: cobra, urfave/cli
- **Config**: viper, envconfig

---

### PHP Development

**Tool Name**: `php_dev`  
**Aliases**: `php`, `composer`, `phpunit`, `artisan`

Complete PHP development support including Composer and Laravel integration.

#### Supported Actions

| Action | Description | Example |
|--------|-------------|---------|
| `run` | Run PHP script | Execute `index.php` |
| `test` | Run PHPUnit | Execute tests |
| `lint` | Run phpcs | Code style check |
| `format` | Run PHP-CS-Fixer | Format code |
| `composer_install` | Install deps | Run `composer install` |
| `composer_update` | Update deps | Run `composer update` |
| `composer_require` | Add package | Install package |
| `composer_remove` | Remove package | Uninstall package |
| `composer_dump_autoload` | Regenerate autoload | Update autoloader |
| `composer_outdated` | Check outdated | Find updates |
| `phpunit` | Run PHPUnit directly | Execute tests |
| `psalm` | Psalm analysis | Static analysis |
| `phpstan` | PHPStan analysis | Type analysis |
| `artisan` | Laravel commands | Run Artisan |
| `custom` | Custom command | Any PHP command |

#### Popular Frameworks Support

- **Full Stack**: Laravel, Symfony, CodeIgniter
- **Micro**: Lumen, Slim, Flight
- **CMS**: WordPress, Drupal, Joomla
- **E-commerce**: Magento, WooCommerce, PrestaShop
- **Testing**: PHPUnit, Pest, Codeception

---

## File Operations

### read_file

Read single file content with pagination support.

- **Supports**: Text, Images (PNG, JPG, GIF, WEBP, SVG, BMP), PDF
- **Pagination**: `offset` and `limit` parameters

### read_many_files

Read multiple files efficiently in one operation.

- **Batch processing**: Multiple files at once
- **Shared limits**: Configurable total lines

### write_file

Write content to file, creating parent directories if needed.

- **Auto-create**: Parent directories
- **Overwrite**: Existing files

### edit

Find and replace text in files with exact matching.

- **Context-aware**: Include surrounding lines
- **Replace all**: Multiple occurrences option

---

## Search & Navigation

### glob_search

Fast file pattern matching.

```json
{ "pattern": "**/*.ts" }
```

### grep_search

Search file contents with regex.

```json
{ "pattern": "function\\s+\\w+", "glob": "*.ts" }
```

### list_directory

List directory contents with filtering.

```json
{ "path": "/project/src", "ignore": ["node_modules"] }
```

---

## Database & Cache

### Database Tool

**Tool Name**: `database`

Execute database operations across multiple engines.

#### Supported Engines

| Engine | Operations |
|--------|------------|
| SQLite | Query, schema, backup |
| PostgreSQL | Query, migrations |
| MySQL | Query, procedures |
| MongoDB | Find, aggregate |

#### Example Operations

```bash
# Execute query
> Run SELECT * FROM users LIMIT 10

# Show schema
> Show schema of users table

# Create backup
> Backup database to /backup/db.sql
```

### Redis Tool

**Tool Name**: `redis`

Redis cache and message broker operations.

#### Supported Operations

| Category | Commands |
|----------|----------|
| Strings | GET, SET, DEL, INCR |
| Lists | LPUSH, RPUSH, LRANGE |
| Sets | SADD, SMEMBERS, SREM |
| Hashes | HSET, HGET, HGETALL |
| Pub/Sub | PUBLISH, SUBSCRIBE |
| Keys | KEYS, SCAN, TTL |

---

## Container & DevOps

### Docker Tool

**Tool Name**: `docker`

Complete Docker container management.

#### Supported Actions

| Action | Description |
|--------|-------------|
| `run` | Run container |
| `build` | Build image |
| `ps` | List containers |
| `images` | List images |
| `logs` | View logs |
| `exec` | Execute command |
| `stop` | Stop container |
| `rm` | Remove container |
| `rmi` | Remove image |
| `compose_up` | Start compose |
| `compose_down` | Stop compose |
| `network` | Network operations |
| `volume` | Volume operations |

---

## Web & Network

### web_search

Search the web using configured providers.

- **Providers**: Tavily, Google Custom Search
- **Returns**: Summarized results with sources

### web_fetch

Fetch and process web content.

- **HTML to Markdown**: Automatic conversion
- **Content extraction**: AI-powered processing

### api_tester

Test REST API endpoints.

```json
{
  "method": "POST",
  "url": "https://api.example.com/users",
  "headers": {"Content-Type": "application/json"},
  "body": {"name": "Test"}
}
```

---

## Code Quality

### Code Analyzer

**Tool Name**: `code_analyzer`

Analyze code quality with A-F grading.

#### Metrics

- **Complexity**: Cyclomatic complexity
- **Maintainability**: Code maintainability index
- **Documentation**: Comment coverage
- **Best Practices**: Pattern violations

### LSP Integration

**Tool Name**: `lsp`

Language Server Protocol integration.

- **Go to Definition**: Navigate to symbol
- **Find References**: Find all usages
- **Completions**: Auto-complete suggestions
- **Hover**: Type information

### Diagram Generator

**Tool Name**: `diagram_generator`

Generate diagrams from descriptions.

- **Mermaid**: Flowcharts, sequence, class diagrams
- **PlantUML**: UML diagrams
- **D2**: Modern diagram syntax

---

## Git Operations

### Git Advanced Tool

**Tool Name**: `git_advanced`

Advanced git operations beyond basic commands.

#### Supported Operations

| Category | Operations |
|----------|------------|
| Stash | save, pop, apply, list, drop |
| Cherry-pick | pick, abort, continue |
| Rebase | interactive, abort, continue |
| Bisect | start, good, bad, reset |
| Worktree | add, remove, list |
| Submodule | add, update, init |

---

## Task Management

### todo_write

Create and manage task lists for tracking progress.

**Statuses**: `pending`, `in_progress`, `completed`

### task

Delegate tasks to specialized subagents.

- **Subagent Types**: Configurable agents
- **Isolation**: Separate execution context
- **Progress**: Real-time updates

---

## Memory & Knowledge

### save_memory

Save facts to long-term memory.

**Scopes**:
- `global`: User-level memory (~/.ollama-code/)
- `project`: Project-specific memory (./OLLAMA_CODE.md)

### skill

Execute specialized skills.

- **PDF Processing**: Read and manipulate PDFs
- **Excel Processing**: Spreadsheet operations
- **Image Generation**: AI image creation

---

## UI Components

### Progress Components

```tsx
<ProgressBar
  progress={45}
  label="Downloading"
  speed="5.2 MB/s"
  eta="2m 30s"
/>
```

### Thinking Indicator

```tsx
<ThinkingIndicator
  message="Analyzing..."
  elapsedTime={45}
  showContent
/>
```

### Token Usage Display

```tsx
<TokenUsageDisplay
  totalTokens={1500}
  promptTokens={500}
  completionTokens={1000}
  tokensPerSecond={45}
/>
```

### GPU/Memory Indicator

```tsx
<GPUUsage
  name="NVIDIA RTX 4090"
  utilization={85}
  memoryUsed={20 * 1024 * 1024 * 1024}
  memoryTotal={24 * 1024 * 1024 * 1024}
/>
```

---

## Tool Aliases

Short names for common tools:

| Alias | Tool | Alias | Tool |
|-------|------|-------|------|
| `run` | run_shell_command | `read` | read_file |
| `write` | write_file | `edit` | edit |
| `grep` | grep_search | `glob` | glob |
| `ls` | list_directory | `todo` | todo_write |
| `memory` | save_memory | `web` | web_search |
| `agent` | task | `py` | python_dev |
| `npm` | nodejs_dev | `go` | golang_dev |
| `php` | php_dev | `fetch` | web_fetch |

---

## Environment Configuration

The model receives environment information at session start:

```markdown
## Environment

### Ollama Configuration
- **OLLAMA_BASE_URL**: http://localhost:11434
- **OLLAMA_MODEL**: llama3.2
- **OLLAMA_KEEP_ALIVE**: 5m
- **OLLAMA_API_KEY**: (set/not set)

### System Information
- **Node.js Version**: v24.13.1
- **Platform**: linux
- **Current Working Directory**: /home/user/project
- **Home Directory**: /home/user

### Debug Settings
- **DEBUG Mode**: disabled
```

---

## Related Documentation

- [Tools Reference](./TOOLS.md) - Detailed tool parameters
- [Usage Guide](./USAGE_GUIDE.md) - How to use Ollama Code
- [API Reference](./OLLAMA_API.md) - API documentation

---

*Last updated: v0.10.6*
