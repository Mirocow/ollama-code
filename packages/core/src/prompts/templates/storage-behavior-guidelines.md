# Storage Behavior Guidelines

## Model Reminders for Storage Usage

This document defines when and how the model should be reminded to use storage.

---

## Session Start Behavior

When a session starts (including resume), the model should check storage:

```
<!-- Auto-injected on session start -->
<storage-reminder>
Your persistent storage is available. Consider checking:
1. model_storage operation=search query="current work" namespaces=["context", "plans"] limit=3
2. model_storage operation=get namespace=todos key="items"
3. model_storage operation=list namespace=knowledge
</storage-reminder>
```

---

## Periodic Reminders

Every N messages (configurable, default: 10), inject a subtle reminder:

```
<storage-hint>
💡 Consider saving valuable discoveries to storage:
- Patterns found: `model_storage operation=addWithEmbedding namespace=knowledge`
- Progress: `model_storage operation=merge namespace=context key="progress"`
- Use search instead of context: `model_storage operation=search query="..."`
</storage-hint>
```

---

## Context Size Warnings

When context approaches limits:

```
<storage-warning priority="high">
⚠️ Context usage is high. Consider:
1. Store discovered patterns: model_storage operation=addWithEmbedding namespace=knowledge key="pattern_name" value="..." tags=["pattern"]
2. Save progress: model_storage operation=set namespace=context key="session_progress" value="{...}"
3. Clear completed items from context
4. Use semantic search instead of keeping reference material
</storage-warning>
```

---

## Task Completion Triggers

When a significant task is completed:

```
<storage-suggestion>
Task completed. Consider saving:
- What was done: model_storage operation=set namespace=context key="last_completed" value="{...}"
- Patterns discovered: model_storage operation=addWithEmbedding namespace=knowledge key="discovery" value="..."
- Update roadmap: model_storage operation=merge namespace=roadmap key="progress" value="{...}"
</storage-suggestion>
```

---

## Storage Operations Quick Reference

### For Context Reduction

| Instead of... | Use... |
|---------------|--------|
| Keeping all knowledge in context | `search query="topic"` |
| Remembering user preferences | `set namespace=knowledge key="user_prefs"` |
| Tracking todo state | `set namespace=todos key="items"` |
| Storing session progress | `set namespace=context key="progress"` |

### For Knowledge Management

| Scenario | Operation |
|----------|-----------|
| Learn a pattern | `addWithEmbedding namespace=knowledge key="pattern_name" value="..." tags=["pattern"]` |
| Find similar patterns | `findSimilar namespace=knowledge key="pattern_name"` |
| Search by meaning | `search query="authentication flow" namespaces=["knowledge"]` |
| Get statistics | `knowledgeStats` |

### For Task Management

| Scenario | Operation |
|----------|-----------|
| Start planning | `exit_plan_mode plan="..." saveToKnowledge=true` |
| Create todos | `todo_write todos=[{...}]` |
| Check progress | `get namespace=plans key="current"` |
| Link to plan | `todo_write` + `exit_plan_mode` automatically link |

---

## Best Practices to Emphasize

### 1. Store Early, Store Often
Don't wait until the end of a task. Store discoveries as they happen:

```
// After discovering a pattern:
model_storage operation=addWithEmbedding namespace=knowledge key="auth_jwt_flow" value="..." tags=["auth", "security"]
```

### 2. Use Semantic Search
Instead of keeping reference material in context:

```
// BAD: Keep entire documentation in context
// GOOD: Store and search when needed
model_storage operation=search query="how to configure database connection" namespaces=["knowledge"] limit=5
```

### 3. Tag Appropriately
Tags enable filtering and categorization:

```
model_storage operation=set namespace=knowledge key="eslint_config" value="..." tags=["config", "linting", "important"]
```

### 4. Set TTL for Temporary Data
Don't let storage grow indefinitely:

```
model_storage operation=set namespace=session key="temp_cache" value="..." ttl=3600 // 1 hour
```

---

## Integration with Tools

### todo_write
- Automatically saves to `todos` namespace
- Supports verification steps
- Links to active plans

### exit_plan_mode
- Saves to `plans` namespace with 7-day TTL
- Optional `saveToKnowledge` for semantic search
- Links with todos for progress tracking

### save_memory
- Use for user-facing memory (user can edit)
- Stored as Markdown files
- NOT for AI-internal data

---

## Error Handling

If storage operations fail:
1. Continue the task without storage
2. Note the failure in context
3. Retry on next opportunity
4. Don't block user work

---

## Semantic Search Fallback

If Ollama embeddings unavailable:
- `search` falls back to keyword matching
- Still useful but less precise
- Warn user if semantic search is unavailable
