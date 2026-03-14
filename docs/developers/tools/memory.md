# Memory Tool (`save_memory`)

The `save_memory` tool provides **user-facing long-term memory** for storing personal facts, preferences, and important information across sessions.

## Quick Reference

| Property | Value |
|----------|-------|
| **Tool Name** | `save_memory` |
| **Purpose** | Store user facts and preferences |
| **Format** | Markdown (human-readable) |
| **Confirmation** | ✅ Required |
| **Memory File** | `OLLAMA_MEMORY.md` |

## Unified Memory File

All context and user preferences are stored in a single unified file: **`OLLAMA_MEMORY.md`**

| Command | Purpose |
|---------|---------|
| `/init` | Creates `OLLAMA_MEMORY.md` with project context (analyzes codebase) |
| `/memory init` | Creates `OLLAMA_MEMORY.md` with user facts template |
| `save_memory` tool | Appends user facts to existing `OLLAMA_MEMORY.md` |

### When to Use Which Command

1. **New project with code** → Run `/init` to analyze and create `OLLAMA_MEMORY.md` with project context
2. **Non-code project or preferences only** → Run `/memory init` to create a template for user facts
3. **Add a fact/preference** → Use `/memory add` or ask AI to remember something

## How to Use `save_memory`

### Method 1: Direct Request to AI

Simply tell the AI to remember something in natural language:

**English:**
- "Remember that my favorite color is blue"
- "Please remember: I prefer TypeScript over JavaScript"
- "Don't forget that I work remotely on Fridays"
- "Save this: my API key prefix is 'sk-dev-'"

**Russian:**
- "Запомни, что мой любимый цвет — синий"
- "Пожалуйста, запомни: я предпочитаю TypeScript"
- "Не забудь, что я работаю удалённо по пятницам"
- "Сохрани это: префикс моего API ключа — 'sk-dev-'"

The AI will call `save_memory` tool and ask you to confirm where to save:
- **Global** (`~/.ollama-code/OLLAMA_MEMORY.md`) — shared across all projects
- **Project** (`./OLLAMA_MEMORY.md`) — current project only

### Method 2: `/memory` Commands

Use slash commands for direct control:

| Command | Description | Example |
|---------|-------------|---------|
| `/memory init` | Initialize memory file with template | `/memory init` |
| `/memory init --global` | Initialize global memory template | `/memory init --global` |
| `/memory init --project` | Initialize project memory template | `/memory init --project` |
| `/memory show` | Display current memory contents | `/memory show` |
| `/memory show --global` | Show global memory only | `/memory show --global` |
| `/memory show --project` | Show project memory only | `/memory show --project` |
| `/memory add <text>` | Add to memory (prompts for scope) | `/memory add I use VS Code` |
| `/memory add --global <text>` | Add to global memory | `/memory add --global My name is Alex` |
| `/memory add --project <text>` | Add to project memory | `/memory add --project Use pnpm here` |
| `/memory refresh` | Reload memory from files | `/memory refresh` |

### Method 3: Manual File Editing

You can directly edit the memory files:

**Global memory:**
```bash
# Create or edit global memory
nano ~/.ollama-code/OLLAMA_MEMORY.md
```

**Project memory:**
```bash
# Create or edit project memory
nano ./OLLAMA_MEMORY.md
```

## Storage Locations

| Scope | Path | Purpose |
|-------|------|---------|
| `global` | `~/.ollama-code/OLLAMA_MEMORY.md` | Shared across all projects |
| `project` | `./OLLAMA_MEMORY.md` | Current project only |

> **Note:** After creating or modifying these files, run `/memory refresh` to reload the context into the current session.

## Automatic Memory Refresh

The system automatically loads memory files when:
- A new session starts
- `/memory refresh` command is executed
- After `/init` completes (automatically runs refresh)

## Memory File Structure

### Created by `/init` (Project Context)

When you run `/init`, the `OLLAMA_MEMORY.md` file contains project analysis:

```markdown
# Project Overview

This is a Next.js 15 project using TypeScript and Tailwind CSS...

## Building and Running

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests

## Development Conventions

- Use 2-space indentation
- Follow ESLint rules...

## Ollama Added Memories

<!-- Memories added via /memory add will appear here -->
```

### Created by `/memory init` (User Facts Template)

When you run `/memory init`, the `OLLAMA_MEMORY.md` file contains a user facts template:

```markdown
# User Memory

This file stores user facts and preferences for Ollama Code.

## User Preferences

<!-- Add your preferences here -->

## Project-Specific Notes

<!-- Add project-specific notes here -->

## Ollama Added Memories

<!-- Memories added via /memory add will appear here -->
```

### After Using `save_memory`

When you ask AI to remember something, it appends to the `## Ollama Added Memories` section:

```markdown
## Ollama Added Memories

- I prefer TypeScript over JavaScript
- Use pnpm instead of npm for this project
- My preferred code editor is VS Code
- Always run tests before committing
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `fact` | string | ✅ | The fact to remember (clear, self-contained statement) |
| `scope` | string | ❌ | `"global"` or `"project"` (prompts user if not specified) |

## When to Use `save_memory`

### ✅ Use Cases

Use `save_memory` when:

1. **User explicitly asks to remember something**
   - "Remember that my cat's name is Whiskers"
   - "Please remember: I prefer tabs over spaces"
   - "Don't forget that I work remotely on Fridays"

2. **User states a personal preference**
   - "My preferred programming language is Python"
   - "I like dark mode in all my editors"
   - "I prefer concise responses"

3. **User shares important personal/project context**
   - "This project uses strict TypeScript"
   - "My team uses conventional commits"
   - "We follow the Airbnb style guide"

4. **User provides configuration hints**
   - "Always run tests before committing"
   - "Use pnpm instead of npm for this project"

### ❌ Do NOT Use `save_memory`

- For temporary session data (use `model_storage` with `session` namespace)
- For structured data like roadmaps, metrics (use `model_storage`)
- For large amounts of text or code (use files)
- For data that needs TTL/expiration (use `model_storage`)
- For AI's internal learning without user request (use `model_storage`)

## How It Works

1. Tool reads the memory file (creates if doesn't exist)
2. Adds the fact under `## Ollama Added Memories` section
3. File is loaded as context in all future sessions
4. AI can recall and use these facts automatically

## Examples

### Basic Usage

```json
{
  "fact": "My preferred programming language is TypeScript"
}
```

### With Scope

```json
{
  "fact": "This project uses pnpm - never use npm",
  "scope": "project"
}
```

## Comparison: `save_memory` vs `model_storage`

| Feature | `save_memory` | `model_storage` |
|---------|---------------|-----------------|
| **Purpose** | User facts & preferences | AI internal data |
| **Triggered by** | Explicit user request | AI decision |
| **Format** | Markdown (human-readable) | JSON (structured) |
| **File** | `OLLAMA_MEMORY.md` | `.ollama-code/storage.json` |
| **Confirmation** | ✅ Always required | ❌ Automatic |
| **Operations** | Add only | set/get/delete/list/merge/batch |
| **TTL support** | ❌ No | ✅ Yes |
| **Metadata** | ❌ No | ✅ createdAt, version, tags |
| **Namespaces** | ❌ No | ✅ Multiple (roadmap, knowledge, etc.) |
| **Visibility** | User edits directly | AI manages internally |

## Decision Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 Need to store something?                     │
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

## Best Practices

1. **Keep facts concise**: One clear statement per fact
2. **Be specific**: "I use 2-space indentation for YAML" vs "I have indentation preferences"
3. **Choose scope wisely**: Use `project` scope for project-specific preferences
4. **Review periodically**: The memory file is editable - clean up outdated facts
5. **Don't duplicate**: Check if the fact already exists before adding

## Related Tools

- **[Storage Tool](./storage.md)** (`model_storage`) - For AI internal data storage with structured operations
- **[/init Command](../../users/features/commands.md)** - Creates `OLLAMA_MEMORY.md` with project analysis
