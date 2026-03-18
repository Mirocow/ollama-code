# Storage-Centric AI Behavior Guidelines

## Core Principle

**Storage is your memory. Context is your workspace.**

Keep workspace clean. Store everything valuable in persistent storage.

---

## The Storage-First Mindset

### Every piece of information should go through this decision tree:

```
Is it needed RIGHT NOW for the current operation?
├─ YES → Keep in context (temporarily)
└─ NO → Is it valuable for future?
    ├─ YES → STORE IT NOW in model_storage
    └─ NO → Discard (don't clutter context)
```

### What Goes Where

| Type | Storage? | Context? | Why |
|------|----------|----------|-----|
| Project conventions | ✅ knowledge | ❌ | Reused every session |
| Current error message | ❌ | ✅ | Needed now for debugging |
| User preferences | ✅ knowledge | ❌ | Persistent across sessions |
| Active file contents | ❌ | ✅ | Currently being edited |
| Discovered patterns | ✅ knowledge | ❌ | Valuable for future |
| Last 3 messages | ❌ | ✅ | Immediate context |
| Solution to error | ✅ learning | ❌ | Valuable for future |
| Current task description | ✅ context | ✅ | Both (for resume) |

---

## Storage Operations Cheat Sheet

### Start of Session
```json
// 1. Check previous context
model_storage operation=search query="current task progress" namespaces=["context"] limit=3

// 2. Load active work
model_storage operation=get namespace=plans key="current"
model_storage operation=get namespace=todos key="items"

// 3. Get relevant knowledge
model_storage operation=search query="project conventions patterns" namespaces=["knowledge"] limit=5
```

### During Work
```json
// When you learn something:
model_storage operation=addWithEmbedding namespace=knowledge key="discovered_pattern" value="..." tags=["pattern"]

// When user makes a decision:
model_storage operation=set namespace=knowledge key="user_decision_X" value='{"decision":"...","reason":"..."}'

// When solving an error:
model_storage operation=addWithEmbedding namespace=learning key="error_solution_X" value="..." tags=["error","solution"]
```

### End of Session
```json
// 1. Save progress
model_storage operation=set namespace=context key="session_progress" value='{
  "completed": ["task1", "task2"],
  "inProgress": "task3",
  "nextSteps": ["task4"],
  "findings": ["pattern X is useful"]
}'

// 2. Update roadmap
model_storage operation=merge namespace=roadmap key="v1_progress" value='{"completed":["feature1"]}'

// 3. Store important findings
model_storage operation=addWithEmbedding namespace=knowledge key="session_YYYY_MM_DD" value="..." tags=["session"]
```

---

## Context Management Rules

### Rule 1: Immediate Storage
When you discover something valuable, store it IMMEDIATELY.

❌ BAD: "I'll remember this pattern for later"
✅ GOOD: Store in `knowledge` namespace now

### Rule 2: Search Before Asking
Before asking user for information, check storage first.

❌ BAD: "What are the project conventions?"
✅ GOOD: `model_storage operation=search query="project conventions"`

### Rule 3: Summarize and Store
Periodically summarize old context and store the summary.

```
After every 10+ exchanges:
1. Summarize what was discussed
2. Extract valuable patterns
3. Store in appropriate namespace
4. Clear summarized content from context
```

### Rule 4: Clean Completed Items
Remove completed tasks from context but keep in storage.

```json
// Mark todo as complete
todo_write todos=[{"id": "X", "status": "completed"}]

// Context can now forget this task
// It's safely stored in todos namespace
```

---

## User-Editable Knowledge Files

### Location
Users can edit knowledge directly in:
```
~/.ollama-code/storage/md/
├── knowledge/
│   ├── project_conventions.md
│   ├── api_patterns.md
│   └── user_preferences.md
├── roadmap/
│   └── v1_milestones.md
├── plans/
│   └── current.md
└── learning/
    └── error_solutions.md
```

### When User Updates Files
The system will notify you:
```
📝 Storage Updated by User
- knowledge/project_conventions.md - modified
```

**Action**: Check the changes and update your understanding accordingly.

---

## Anti-Patterns to Avoid

### ❌ Hoarding in Context
```
BAD: Keeping 50KB of reference documentation in context
GOOD: Store in knowledge, search when needed
```

### ❌ Not Saving Discoveries
```
BAD: Discovering a pattern, using it once, forgetting it
GOOD: Store with embedding for future semantic search
```

### ❌ Repeating Information
```
BAD: Asking "How should I format the API response?" every session
GOOD: Store convention once, reference from storage
```

### ❌ Losing Session Context
```
BAD: Ending session without saving progress
GOOD: Always save session_progress before ending
```

---

## Storage Notifications

The system can notify you about:

1. **Context Overflow**: When context gets too large
2. **Storage Updates**: When user edits MD files
3. **Periodic Reminders**: Every N minutes to check storage usage
4. **Knowledge Opportunities**: When you discover something store-worthy

Pay attention to these notifications!

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                 STORAGE-FIRST WORKFLOW                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  START ──► Load context from storage                    │
│    │                                                    │
│    ▼                                                    │
│  WORK ──► Store discoveries immediately                 │
│    │      Use semantic search instead of context        │
│    │                                                    │
│    ▼                                                    │
│  PERIODIC ──► Summarize old context                     │
│    │          Store patterns found                      │
│    │                                                    │
│    ▼                                                    │
│  END ──► Save session progress                          │
│          Store final findings                           │
│          Update roadmap                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Remember

> **Storage is persistent. Context is temporary.**

Every valuable piece of information should find its way to storage.
Context should only contain what's needed for the CURRENT operation.

When in doubt: STORE IT!
