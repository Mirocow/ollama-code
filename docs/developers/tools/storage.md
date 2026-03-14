# Storage Tool (`model_storage`)

The `model_storage` tool provides **AI-internal structured storage** for managing roadmaps, knowledge bases, session data, and other structured information with full CRUD operations, TTL support, and metadata tracking.

## Quick Reference

| Property | Value |
|----------|-------|
| **Tool Name** | `model_storage` |
| **Purpose** | AI internal data management |
| **Format** | JSON (structured) |
| **Confirmation** | ❌ Not required |
| **Location** | `~/.ollama-code/storage/{namespace}.json` |

## When to Use `model_storage`

### ✅ Use Cases

Use `model_storage` for:

1. **Project Roadmaps & Plans**
   - Milestones and feature planning
   - Task breakdowns with status
   - Version planning

2. **Knowledge Base Management**
   - Learned patterns and conventions
   - API documentation snippets
   - Code templates and snippets

3. **Session Data**
   - Temporary working state
   - Context for current task
   - Progress tracking

4. **Learning & Improvements**
   - Tool usage corrections
   - Alias mappings
   - Error patterns and solutions

5. **Metrics & Statistics**
   - Performance data
   - Usage patterns
   - Time tracking

### ❌ Do NOT Use `model_storage`

- For user-requested memory saves (use `save_memory`)
- For facts user wants to edit manually (use `save_memory` - Markdown is user-friendly)
- For large binary data (use files)

## Namespaces

Predefined namespaces organize different data types:

| Namespace | Purpose | Default Mode | Example Keys |
|-----------|---------|--------------|--------------|
| `roadmap` | Project plans, milestones | persistent | `v1.0`, `v2.0`, `q1-goals` |
| `session` | Temporary session data | session | `current-task`, `temp-state` |
| `knowledge` | Learned facts, patterns | persistent | `api-pattern`, `auth-flow` |
| `context` | Current task context | session | `active-feature`, `decisions` |
| `learning` | Tool corrections, aliases | persistent | `tool-fix`, `command-alias` |
| `metrics` | Statistics, performance | persistent | `daily-stats`, `response-times` |

## Persistence Modes

| Mode | Storage | Lifecycle | Use For |
|------|---------|-----------|---------|
| `persistent` | JSON files | Survives restarts | roadmap, knowledge, learning |
| `session` | Memory only | Cleared on exit | temporary data, context |

**Auto-detection**: Namespaces `session` and `context` default to session mode. All others default to persistent.

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `operation` | string | ✅ | Operation to perform |
| `namespace` | string | ✅ | Storage namespace |
| `key` | string | ❌ | Key for the value |
| `value` | any | ❌ | Value to store |
| `persistent` | boolean | ❌ | Override auto-detection |
| `scope` | string | ❌ | `"global"` or `"project"` |
| `ttl` | number | ❌ | Time-to-live in seconds |
| `tags` | string[] | ❌ | Tags for categorization |
| `includeMetadata` | boolean | ❌ | Include metadata in results |
| `actions` | array | ❌ | Batch operations |

## Operations

### `set` - Store a Value

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

### `get` - Retrieve a Value

```json
{
  "operation": "get",
  "namespace": "roadmap",
  "key": "v1.0"
}
```

With metadata:

```json
{
  "operation": "get",
  "namespace": "roadmap",
  "key": "v1.0",
  "includeMetadata": true
}
```

### `delete` - Remove a Key

```json
{
  "operation": "delete",
  "namespace": "roadmap",
  "key": "old-feature"
}
```

### `list` - List All Keys

```json
{
  "operation": "list",
  "namespace": "roadmap"
}
```

### `exists` - Check if Key Exists

```json
{
  "operation": "exists",
  "namespace": "roadmap",
  "key": "v1.0"
}
```

### `append` - Add to Array

```json
{
  "operation": "append",
  "namespace": "knowledge",
  "key": "learned-patterns",
  "value": "Always check for null before accessing nested properties"
}
```

### `merge` - Merge into Object

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

### `clear` - Clear Namespace

```json
{
  "operation": "clear",
  "namespace": "session"
}
```

### `stats` - Get Statistics

```json
{
  "operation": "stats",
  "namespace": "roadmap"
}
```

### `batch` - Multiple Operations

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

## Advanced Features

### TTL (Time-To-Live)

Auto-expire data after specified seconds:

```json
{
  "operation": "set",
  "namespace": "session",
  "key": "temp-cache",
  "value": "temporary data",
  "ttl": 3600
}
```

The entry will be automatically removed after 1 hour.

### Tags

Categorize entries for filtering:

```json
{
  "operation": "set",
  "namespace": "knowledge",
  "key": "auth-pattern",
  "value": { "pattern": "JWT", "library": "jsonwebtoken" },
  "tags": ["auth", "security", "important"]
}
```

### Scope (Persistent Storage Only)

| Scope | Location | Use Case |
|-------|----------|----------|
| `global` | `~/.ollama-code/storage/` | Shared across all projects |
| `project` | `~/.ollama-code/projects/<project-hash>/storage/` | Current project only |

```json
{
  "operation": "set",
  "namespace": "roadmap",
  "key": "project-goals",
  "value": { "q1": "MVP release" },
  "scope": "project"
}
```

## Metadata

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

## Storage Locations

### Persistent Storage

```
~/.ollama-code/storage/                    # Global (shared across projects)
├── roadmap.json
├── knowledge.json
├── learning.json
└── metrics.json

~/.ollama-code/projects/<project-hash>/storage/  # Project-specific
├── roadmap.json
├── knowledge.json
└── session.json
```

**Project hash** is a SHA256 hash of the project's root directory path, ensuring unique storage per project.

### Session Storage

Held in memory, cleared when session ends.

## Comparison: `model_storage` vs `save_memory`

| Feature | `model_storage` | `save_memory` |
|---------|-----------------|---------------|
| **Purpose** | AI internal data | User facts & preferences |
| **Triggered by** | AI decision | Explicit user request |
| **Format** | JSON (structured) | Markdown (human-readable) |
| **File** | `~/.ollama-code/projects/<hash>/storage/*.json` | `OLLAMA_MEMORY.md` |
| **Confirmation** | ❌ Automatic | ✅ Always required |
| **Operations** | set/get/delete/list/merge/batch | Add only |
| **TTL support** | ✅ Yes | ❌ No |
| **Metadata** | ✅ createdAt, version, tags | ❌ No |
| **Namespaces** | ✅ Multiple | ❌ Single file |
| **Visibility** | AI manages internally | User edits directly |

### File Separation

| File | Purpose | Created By |
|------|---------|------------|
| `OLLAMA_MEMORY.md` | Project context & user facts (unified) | `/init` or `/memory init` |
| `~/.ollama-code/projects/<hash>/storage/*.json` | AI internal structured data | `model_storage` tool |

**Unified Memory File (`OLLAMA_MEMORY.md`):**
- Created by `/init` with project analysis (code projects)
- Created by `/memory init` with user facts template (non-code projects)
- Appended by `save_memory` when user asks to remember something

## Decision Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Need to store data?                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │ Is it user-requested   │
                 │ memory/fact?           │
                 └────────────────────────┘
                    │                │
                   YES               NO
                    │                │
                    ▼                ▼
         ┌──────────────┐  ┌────────────────────────┐
         │ save_memory  │  │ What type of data?     │
         └──────────────┘  └────────────────────────┘
                               │           │
                    ┌──────────┼───────────┼──────────┐
                    │          │           │          │
                    ▼          ▼           ▼          ▼
              ┌─────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐
              │roadmap  │ │session │ │knowledge │ │ metrics │
              │ plans   │ │ temp   │ │ learned  │ │ stats   │
              └─────────┘ └────────┘ └──────────┘ └─────────┘
                    │          │           │          │
                    └──────────┴───────────┴──────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    model_storage     │
                    │  (appropriate        │
                    │   namespace)         │
                    └──────────────────────┘
```

## Best Practices

1. **Use appropriate namespaces**: Keep data organized by purpose
2. **Set TTL for temporary data**: Prevent stale data accumulation
3. **Use tags for filtering**: Makes it easier to find related entries
4. **Batch operations**: More efficient for multiple changes
5. **Choose scope wisely**: Project-specific data goes in `project` scope
6. **Check before set**: Use `exists` to avoid overwriting unintentionally

## Common Patterns

### Project Roadmap Management

```json
// Set milestone
{
  "operation": "set",
  "namespace": "roadmap",
  "key": "v1.0-milestones",
  "value": {
    "milestones": [
      { "name": "Core features", "status": "done" },
      { "name": "Authentication", "status": "in-progress" },
      { "name": "Dashboard", "status": "planned" }
    ]
  },
  "scope": "project"
}

// Update progress
{
  "operation": "merge",
  "namespace": "roadmap",
  "key": "v1.0-milestones",
  "value": {
    "lastUpdated": "2025-01-15",
    "progress": 45
  },
  "scope": "project"
}
```

### Learning from Mistakes

```json
{
  "operation": "append",
  "namespace": "learning",
  "key": "tool-corrections",
  "value": {
    "mistake": "Used npm instead of pnpm",
    "correction": "Always use pnpm for this project",
    "context": "package installation"
  }
}
```

### Session State Tracking

```json
{
  "operation": "set",
  "namespace": "session",
  "key": "current-work",
  "value": {
    "task": "Implementing user authentication",
    "files": ["auth.ts", "middleware.ts"],
    "startedAt": "2025-01-15T09:00:00Z"
  },
  "ttl": 7200
}
```

## Related Tools

- **[Memory Tool](./memory.md)** (`save_memory`) - For user-facing facts and preferences
