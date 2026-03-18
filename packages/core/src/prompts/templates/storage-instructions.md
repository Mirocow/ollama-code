# Model Storage - Usage Instructions

## Overview

You have a persistent storage `model_storage` for saving data between sessions. Use it for:

1. **Roadmap** - development plans, milestones, future tasks
2. **Knowledge** - learned patterns, user preferences, project conventions
3. **Context** - current task state for work continuation
4. **Learning** - behavior adjustments, aliases, error corrections

## Key Features

### Semantic Search (NEW)
Storage now supports **AI-powered semantic search** using embeddings:
- `search` - Find relevant content by meaning, not just keywords
- `findSimilar` - Find entries similar to a given entry
- `addWithEmbedding` - Store content with automatic embedding generation

This reduces context usage by enabling intelligent search queries instead of loading all data.

### When to use Semantic Search

```
# Instead of listing all knowledge and searching manually:
model_storage operation=list namespace=knowledge

# Use semantic search to find relevant entries:
model_storage operation=search query="authentication patterns" namespaces=["knowledge"] limit=5
```

## When to use storage

### MUST save:

1. **Plans and roadmap** - when discussing project development:
```
model_storage operation=set namespace=roadmap key="v1.0_milestones" value='[...]'
```

2. **Long task context** - when work might be continued later:
```
model_storage operation=set namespace=context key="refactor_auth_status" value='{"done":["types","interfaces"],"todo":["implementation","tests"]}'
```

3. **Learned project patterns** - after analyzing the codebase:
```
model_storage operation=merge namespace=knowledge key="project_conventions" value='{"naming":"camelCase","testing":"vitest"}'
```

4. **User decisions** - when user says "remember" or "always do this":
```
model_storage operation=set namespace=knowledge key="user_preferences" value='{"commit_style":"conventional","branch_prefix":"feature/"}'
```

5. **Knowledge for semantic search** - important patterns that should be searchable:
```
model_storage operation=addWithEmbedding namespace=knowledge key="auth_flow" value='Authentication flow: User logs in via OAuth2, receives JWT token...' tags=["auth", "security"]
```

### DO NOT use storage for:

- Temporary data of current request (use dialogue context)
- Project facts (read project files)
- Secrets and keys (security)

## Workflow with storage

### Start of session:
```
1. Check context of previous task:
   model_storage operation=get namespace=context key="last_task"

2. Search for relevant knowledge (semantic search):
   model_storage operation=search query="project conventions" namespaces=["knowledge"] limit=5

3. Check roadmap:
   model_storage operation=list namespace=roadmap
```

### During work:
```
1. Create plan in storage for complex tasks:
   model_storage operation=set namespace=context key="current_plan" value='{"steps":[...],"current":1}'

2. Update progress:
   model_storage operation=merge namespace=context key="current_plan" value='{"current":2}'

3. Record important findings with embedding for future search:
   model_storage operation=addWithEmbedding namespace=knowledge key="discovered_pattern" value="..." tags=["important"]
```

### Task completion:
```
1. Save final state:
   model_storage operation=set namespace=context key="last_completed" value='{"task":"...","result":"..."}'

2. Clear temporary context:
   model_storage operation=delete namespace=context key="current_plan"

3. Update roadmap if needed:
   model_storage operation=merge namespace=roadmap key="v1.0_progress" value='{"completed":["auth"]}'
```

## Semantic Search Operations

### search - Find content by meaning
```
model_storage operation=search query="how to handle errors" namespaces=["knowledge", "learning"] limit=10 mode="semantic"
```

Parameters:
- `query` (required): Search query text
- `namespaces` (optional): Namespaces to search in (all if not specified)
- `mode` (optional): "semantic" (default), "keyword", or "hybrid"
- `limit` (optional): Max results (default: 10)
- `threshold` (optional): Similarity threshold 0-1 (default: 0.7)

### findSimilar - Find entries similar to a given entry
```
model_storage operation=findSimilar namespace=knowledge key="auth_pattern" limit=5 threshold=0.8
```

Parameters:
- `namespace` (required): Namespace of the source entry
- `key` (required): Key of the source entry
- `limit` (optional): Max results (default: 5)
- `threshold` (optional): Similarity threshold (default: 0.8)
- `sameNamespace` (optional): Only search in same namespace (default: false)

### addWithEmbedding - Store with automatic embedding
```
model_storage operation=addWithEmbedding namespace=knowledge key="important_pattern" value="..." tags=["important"]
```

Parameters:
- `namespace` (required): Target namespace
- `key` (required): Entry key
- `value` (required): Content to store
- `tags` (optional): Tags for categorization
- `autoExtractEntities` (optional): Auto-extract entities (default: false)

### knowledgeStats - View knowledge base statistics
```
model_storage operation=knowledgeStats
```

## Usage Scenarios

### Scenario 1: Feature Planning
User: "Let's plan adding authentication"

```
1. Create plan structure:
model_storage operation=set namespace=roadmap key="auth_feature" value='{
  "status": "planning",
  "steps": [
    {"id": 1, "task": "Design auth flow", "status": "pending"},
    {"id": 2, "task": "Create user model", "status": "pending"},
    {"id": 3, "task": "Implement JWT", "status": "pending"},
    {"id": 4, "task": "Add tests", "status": "pending"}
  ],
  "created": "2025-01-15"
}'

2. Search for related patterns:
model_storage operation=search query="authentication JWT OAuth" namespaces=["knowledge"] limit=5

3. Return to plan in following sessions:
model_storage operation=get namespace=roadmap key="auth_feature"

4. Mark progress:
model_storage operation=merge namespace=roadmap key="auth_feature" value='{"steps[0].status":"done"}'
```

### Scenario 2: Project Learning
```
1. After analyzing structure:
model_storage operation=set namespace=knowledge key="project_structure" value='{
  "src_dir": "src/",
  "test_dir": "tests/",
  "config_files": ["tsconfig.json", "eslint.config.js"],
  "entry_point": "src/index.ts"
}'

2. After learning conventions (with embedding for semantic search):
model_storage operation=addWithEmbedding namespace=knowledge key="project_conventions" value='{
  "framework": "express",
  "language": "TypeScript",
  "testing": "jest",
  "style": "prettier"
}' tags=["conventions", "important"]

3. Search in following sessions:
model_storage operation=search query="testing framework" namespaces=["knowledge"]
```

### Scenario 3: Long Task
```
1. Task start:
model_storage operation=set namespace=context key="migration_task" value='{
  "type": "migration",
  "from": "webpack",
  "to": "vite",
  "progress": 0,
  "steps_total": 5,
  "steps_done": [],
  "files_modified": []
}'

2. After each step:
model_storage operation=merge namespace=context key="migration_task" value='{
  "progress": 40,
  "steps_done": ["config", "dependencies"]
}'

3. When continuing in new session:
model_storage operation=get namespace=context key="migration_task"
# Continue from last state
```

### Scenario 4: Reducing Context with Semantic Search
```
# BAD: Load all knowledge entries
model_storage operation=list namespace=knowledge
# This returns ALL entries, using lots of context

# GOOD: Search for relevant entries
model_storage operation=search query="error handling patterns" namespaces=["knowledge"] limit=5
# This returns only relevant entries, saving context

# Example: Find similar implementations
model_storage operation=findSimilar namespace=knowledge key="auth_module" limit=3
# Returns entries similar to the auth_module pattern
```

## Data Structure

### Roadmap entries:
```json
{
  "status": "planning|in_progress|completed",
  "priority": "high|medium|low",
  "due": "2025-03-01",
  "steps": [...],
  "dependencies": [...],
  "notes": "..."
}
```

### Knowledge entries:
```json
{
  "type": "convention|pattern|preference|decision",
  "source": "user|learned|derived",
  "confidence": 1.0,
  "value": "..."
}
```

### Context entries:
```json
{
  "task_type": "refactor|feature|bugfix|docs",
  "status": "in_progress|paused|completed",
  "progress": 50,
  "files_involved": [...],
  "next_steps": [...]
}
```

## Aliases

Use short names:
- `storage` → model_storage
- `store` → model_storage
- `roadmap` → model_storage (with namespace=roadmap)
- `kv` → model_storage

## Scope (storage scope)

- `global` (default) - common for all projects
- `project` - only for current project

```
# Global knowledge (common for all projects)
model_storage operation=set scope=global namespace=knowledge key="user_preferences" value='...'

# Project knowledge (only for this project)
model_storage operation=set scope=project namespace=roadmap key="release_plan" value='...'
```

## Requirements for Ollama

Semantic search requires Ollama with embedding model:
1. Install embedding model: `ollama pull nomic-embed-text`
2. Ollama must be running at http://localhost:11434

If Ollama is unavailable, search falls back to keyword matching automatically.

## Best Practices

1. **Use semantic search instead of listing all entries** - Reduces context usage
2. **Add embeddings to important knowledge** - Makes it discoverable via search
3. **Use tags consistently** - Helps with categorization and filtering
4. **Set TTL for temporary data** - Prevents storage bloat
5. **Link todos to plans** - Enables progress tracking
6. **Save learnings with context** - Makes them more searchable
