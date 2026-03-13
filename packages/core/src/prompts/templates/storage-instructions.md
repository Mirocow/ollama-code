# Model Storage - Usage Instructions

## Overview

You have a persistent storage `model_storage` for saving data between sessions. Use it for:

1. **Roadmap** - development plans, milestones, future tasks
2. **Knowledge** - learned patterns, user preferences, project conventions
3. **Context** - current task state for work continuation
4. **Learning** - behavior adjustments, aliases, error corrections

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

### DO NOT use storage for:

- Temporary data of current request (use dialogue context)
- Project facts (read project files)
- Secrets and keys (security)

## Workflow with storage

### Start of session:
```
1. Check context of previous task:
   model_storage operation=get namespace=context key="last_task"

2. Load project knowledge:
   model_storage operation=list namespace=knowledge

3. Check roadmap:
   model_storage operation=list namespace=roadmap
```

### During work:
```
1. Create plan in storage for complex tasks:
   model_storage operation=set namespace=context key="current_plan" value='{"steps":[...],"current":1}'

2. Update progress:
   model_storage operation=merge namespace=context key="current_plan" value='{"current":2}'

3. Record important findings:
   model_storage operation=append namespace=knowledge key="learned_patterns" value="..."
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

2. Return to plan in following sessions:
model_storage operation=get namespace=roadmap key="auth_feature"

3. Mark progress:
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

2. After learning conventions:
model_storage operation=merge namespace=knowledge key="project_conventions" value='{
  "framework": "express",
  "language": "TypeScript",
  "testing": "jest",
  "style": "prettier"
}'

3. Use in following sessions:
model_storage operation=get namespace=knowledge key="project_conventions"
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