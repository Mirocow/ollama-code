# Storage Quick Reference

## Operations Overview

### CRUD Operations
```json
{"operation": "set", "namespace": "knowledge", "key": "my_key", "value": {"data": "value"}, "tags": ["tag1"]}
{"operation": "get", "namespace": "knowledge", "key": "my_key"}
{"operation": "delete", "namespace": "knowledge", "key": "my_key"}
{"operation": "list", "namespace": "knowledge"}
{"operation": "exists", "namespace": "knowledge", "key": "my_key"}
{"operation": "merge", "namespace": "knowledge", "key": "my_key", "value": {"new_field": "value"}}
{"operation": "append", "namespace": "knowledge", "key": "my_list", "value": "new_item"}
```

### Semantic Search (NEW)
```json
{"operation": "search", "query": "authentication patterns", "namespaces": ["knowledge"], "limit": 5}
{"operation": "search", "query": "error handling", "mode": "semantic", "threshold": 0.7}
{"operation": "findSimilar", "namespace": "knowledge", "key": "auth_pattern", "limit": 3}
{"operation": "addWithEmbedding", "namespace": "knowledge", "key": "pattern", "value": "...", "tags": ["important"]}
{"operation": "knowledgeStats"}
```

### Streaming (NEW)
```json
{"operation": "get", "namespace": "logs", "key": "large_file", "streamLines": true, "maxLines": 100}
{"operation": "get", "namespace": "logs", "key": "large_file", "streamLines": true, "startLine": 100, "maxLines": 100}
```

### Batch Operations
```json
{"operation": "batch", "namespace": "knowledge", "actions": [
  {"operation": "set", "key": "key1", "value": "val1"},
  {"operation": "set", "key": "key2", "value": "val2"},
  {"operation": "delete", "key": "old_key"}
]}
```

### Backup & Restore
```json
{"operation": "backup"}
{"operation": "restore"}
{"operation": "restore", "key": "backup-2025-01-15.json"}
```

---

## Namespaces

| Namespace | Purpose | Persistence |
|-----------|---------|-------------|
| `roadmap` | Project plans, milestones | Persistent |
| `knowledge` | Learned patterns, conventions | Persistent |
| `context` | Current task state | Session |
| `session` | Temporary session data | Session |
| `learning` | Error solutions, corrections | Persistent |
| `metrics` | Statistics, performance | Persistent |
| `plans` | Active plans (7-day TTL) | Persistent |
| `todos` | Todo items | Persistent |

---

## Common Patterns

### Start Session - Load Context Efficiently
```json
// 1. Search for recent context
{"operation": "search", "query": "current task progress status", "namespaces": ["context"], "limit": 3}

// 2. Load project knowledge
{"operation": "search", "query": "project conventions patterns important", "namespaces": ["knowledge"], "limit": 5}

// 3. Check active todos
{"operation": "get", "namespace": "todos", "key": "items"}
```

### Save Work Progress
```json
{"operation": "set", "namespace": "context", "key": "session_progress", "value": {
  "task": "Current task name",
  "completed": ["step1", "step2"],
  "inProgress": "step3",
  "files": ["file1.ts", "file2.ts"]
}}

// Save important findings with embedding
{"operation": "addWithEmbedding", "namespace": "knowledge", "key": "findings_2025_01_15", "value": "Important pattern learned...", "tags": ["important", "pattern"]}
```

### Store Pattern for Future Search
```json
{"operation": "addWithEmbedding", "namespace": "knowledge", "key": "auth_jwt_pattern", "value": {
  "pattern": "JWT Authentication",
  "implementation": "Use httpOnly cookies for refresh tokens",
  "security": "Always validate token signature"
}, "tags": ["auth", "security", "jwt"]}
```

### Find Related Knowledge
```json
{"operation": "search", "query": "authentication login JWT OAuth token", "namespaces": ["knowledge"], "limit": 5}

{"operation": "findSimilar", "namespace": "knowledge", "key": "auth_pattern", "limit": 3}
```

---

## Todo Verification

### Create Task with Verification
```json
{
  "todos": [{
    "id": "implement-auth",
    "content": "Implement authentication",
    "status": "pending",
    "priority": "high",
    "verification": {
      "steps": [
        {"id": "file_exists", "description": "Auth file exists", "type": "file_exists", "params": {"path": "src/auth.ts"}, "status": "pending"},
        {"id": "tests_pass", "description": "Tests pass", "type": "test_pass", "params": {"testPath": "auth.test.ts"}, "status": "pending"}
      ],
      "required": true
    }
  }]
}
```

### Verify on Completion
```json
{"todos": [{"id": "implement-auth", "content": "...", "status": "completed"}], "verify": true}
```

---

## Plan with Knowledge

```json
{
  "plan": "## Implementation Plan\n\n1. Setup\n2. Core features\n3. Testing",
  "verification": {
    "autoVerify": true,
    "requiredFiles": ["src/index.ts"],
    "testCommands": ["npm test"]
  },
  "tags": ["feature", "important"],
  "saveToKnowledge": true
}
```

---

## Verification Types

| Type | Description | Params |
|------|-------------|--------|
| `file_exists` | Check file exists | `path` |
| `file_contains` | Check file content | `path`, `content` or `regex` |
| `command_success` | Run command | `command`, `exitCode` (default: 0) |
| `test_pass` | Run tests | `testPath`, `framework` |
| `lint_pass` | Run linter | `files` |
| `type_check` | TypeScript check | `project` |
| `build_success` | Build project | `script` |

---

## Tips

1. **Use search instead of list** - Saves context by returning only relevant entries
2. **Add embeddings to important knowledge** - Makes it discoverable via semantic search
3. **Use TTL for temporary data** - Prevents storage bloat
4. **Verify critical tasks** - Ensures quality
5. **Stream large files** - Avoid memory issues
