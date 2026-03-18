# Model Storage - Practical Usage Examples

## Overview

This guide shows how to instruct the AI model to effectively use the enhanced storage system with semantic search, verification, and streaming capabilities.

---

## 1. Semantic Search - Reducing Context Usage

### Basic Semantic Search
```
User: "Search for authentication patterns in the knowledge base"

AI should call:
model_storage operation=search query="authentication patterns login JWT OAuth" namespaces=["knowledge"] limit=5
```

### Multi-Namespace Search
```
User: "Find anything related to error handling"

AI should call:
model_storage operation=search query="error handling exceptions try catch" namespaces=["knowledge", "learning", "roadmap"] limit=10 mode="semantic"
```

### Keyword Search Fallback
```
User: "Search for exact text 'DatabaseConnection'"

AI should call:
model_storage operation=search query="DatabaseConnection" mode="keyword" limit=10
```

---

## 2. Storing Knowledge with Embeddings

### Save Important Pattern for Future Search
```
User: "Remember this authentication pattern for future reference"

AI should call:
model_storage operation=addWithEmbedding namespace=knowledge key="auth_pattern_v1" value='{
  "pattern": "JWT authentication flow",
  "steps": [
    "1. User submits credentials",
    "2. Server validates and issues JWT",
    "3. Client stores token in secure storage",
    "4. Token included in Authorization header"
  ],
  "security_notes": "Always use HTTPS, implement token refresh"
}' tags=["auth", "security", "jwt", "important"]
```

### Store Code Pattern
```
User: "Save this error handling pattern"

AI should call:
model_storage operation=addWithEmbedding namespace=knowledge key="error_handling_pattern" value='
## Error Handling Pattern

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error("Operation failed", { error, context });
  return { success: false, error: error.message };
}
```

Use this pattern for all async operations that may fail.
' tags=["pattern", "error-handling", "typescript"]
```

---

## 3. Finding Similar Entries

### Find Similar Implementations
```
User: "Find code similar to the auth module"

AI should call:
model_storage operation=findSimilar namespace=knowledge key="auth_module" limit=5 threshold=0.7
```

### Find Similar Within Same Namespace
```
User: "Find similar patterns in the knowledge base"

AI should call:
model_storage operation=findSimilar namespace=knowledge key="current_pattern" limit=3 sameNamespace=true
```

---

## 4. Task Verification System

### Create Task with Verification Steps
```
User: "Add a task to implement user registration with file and test verification"

AI should call:
todo_write todos=[
  {
    "id": "implement-registration",
    "content": "Implement user registration endpoint",
    "status": "pending",
    "priority": "high",
    "verification": {
      "steps": [
        {
          "id": "check_route_file",
          "description": "Registration route file exists",
          "type": "file_exists",
          "params": { "path": "src/routes/auth.ts" },
          "status": "pending"
        },
        {
          "id": "check_route_content",
          "description": "Route contains registration handler",
          "type": "file_contains",
          "params": { "path": "src/routes/auth.ts", "content": "register" },
          "status": "pending"
        },
        {
          "id": "run_tests",
          "description": "Registration tests pass",
          "type": "test_pass",
          "params": { "testPath": "tests/auth.test.ts" },
          "status": "pending"
        }
      ],
      "status": "pending",
      "required": true
    }
  }
]
```

### Verify Task Completion
```
User: "Mark the registration task as complete and verify"

AI should call:
todo_write todos=[
  {
    "id": "implement-registration",
    "content": "Implement user registration endpoint",
    "status": "completed"
  }
] verify=true
```

### Tasks with Dependencies
```
User: "Create a series of dependent tasks for the feature"

AI should call:
todo_write todos=[
  {
    "id": "design-api",
    "content": "Design API contract",
    "status": "pending",
    "priority": "high"
  },
  {
    "id": "implement-api",
    "content": "Implement API endpoints",
    "status": "pending",
    "priority": "high",
    "dependencies": ["design-api"]
  },
  {
    "id": "write-tests",
    "content": "Write integration tests",
    "status": "pending",
    "priority": "medium",
    "dependencies": ["implement-api"],
    "verification": {
      "steps": [
        {
          "id": "test_coverage",
          "description": "Test coverage above 80%",
          "type": "command_success",
          "params": { "command": "npm run test:coverage" },
          "status": "pending"
        }
      ],
      "status": "pending"
    }
  }
]
```

---

## 5. Planning with Verification

### Create Plan with Verification
```
User: "Create a plan for implementing the payment system with verification"

AI should call:
exit_plan_mode plan="## Payment System Implementation

### Phase 1: Setup
- [ ] Create payment module structure
- [ ] Configure Stripe integration
- [ ] Set up database schema

### Phase 2: Core Features
- [ ] Implement checkout flow
- [ ] Add webhook handlers
- [ ] Create subscription management

### Phase 3: Testing & Security
- [ ] Write unit tests
- [ ] Add integration tests
- [ ] Security audit" verification={
  "autoVerify": true,
  "checkCommands": ["npm run build", "npm run lint"],
  "requiredFiles": ["src/payment/index.ts", "src/payment/stripe.ts"],
  "testCommands": ["npm test -- payment"]
} tags=["payment", "stripe", "critical"] saveToKnowledge=true
```

---

## 6. Streaming Large Files

### Read Large File with Pagination
```
User: "Read the large log file from storage"

AI should call:
model_storage operation=get namespace=logs key="application.log" streamLines=true startLine=0 maxLines=100
```

### Continue Reading Large File
```
User: "Show me more lines from the log"

AI should call:
model_storage operation=get namespace=logs key="application.log" streamLines=true startLine=100 maxLines=100
```

### Auto-Truncated Response
```
User: "Get the full configuration"

AI receives truncated response with hint:
"... [truncated, use streamLines=true with startLine/maxLines to read more]"

AI should call:
model_storage operation=get namespace=config key="full_config" streamLines=true maxLines=500
```

---

## 7. Session Workflow Examples

### Start of Session - Load Context Efficiently
```
User: "Continue working on the project"

AI should:
1. Search for recent context:
   model_storage operation=search query="current task progress status" namespaces=["context"] limit=3

2. Load project knowledge:
   model_storage operation=search query="project conventions patterns important" namespaces=["knowledge"] limit=5

3. Check active todos:
   model_storage operation=get namespace=todos key="items"

4. Check active plans:
   model_storage operation=get namespace=plans key="current"
```

### Save Work Progress
```
User: "Save my progress for later"

AI should call:
model_storage operation=set namespace=context key="session_progress" value='{
  "task": "Implementing authentication",
  "completed": ["JWT setup", "Login endpoint"],
  "inProgress": "Password reset flow",
  "nextSteps": ["Email templates", "Rate limiting"],
  "files": ["src/auth/jwt.ts", "src/routes/auth.ts"],
  "timestamp": "2025-01-15T10:30:00Z"
}'

// Also save important findings:
model_storage operation=addWithEmbedding namespace=knowledge key="auth_session_findings" value='
Learned: JWT library supports refresh tokens out of box.
Pattern: Use httpOnly cookies for token storage.
Issue: CORS needs credentials: true for cookie auth.
' tags=["auth", "session", "findings"]
```

### End of Session - Summary
```
User: "I'm done for today, save everything"

AI should:
1. Save session summary:
   model_storage operation=addWithEmbedding namespace=knowledge key="session_2025_01_15" value='
## Session Summary - 2025-01-15

### Completed
- JWT authentication implementation
- Login/logout endpoints
- Token refresh mechanism

### Learned Patterns
- Store refresh tokens in httpOnly cookies
- Implement rate limiting on auth endpoints
- Use bcrypt with cost factor 12

### Issues Encountered
- CORS configuration needed for credentials
- Cookie secure flag required in production
' tags=["session", "summary", "auth"]

2. Update roadmap:
   model_storage operation=merge namespace=roadmap key="v1.0_milestones" value='{"auth": "completed"}'

3. Clear temporary context:
   model_storage operation=delete namespace=context key="temporary_data"
```

---

## 8. Knowledge Management

### Store Project Conventions
```
User: "Remember these project conventions"

AI should call:
model_storage operation=addWithEmbedding namespace=knowledge key="project_conventions" value='{
  "naming": {
    "files": "kebab-case",
    "components": "PascalCase",
    "functions": "camelCase",
    "constants": "SCREAMING_SNAKE_CASE"
  },
  "structure": {
    "components": "src/components/",
    "hooks": "src/hooks/",
    "utils": "src/utils/",
    "types": "src/types/"
  },
  "testing": {
    "framework": "vitest",
    "location": "same directory with .test.ts",
    "coverage": "aim for 80%+"
  }
}' tags=["conventions", "standards", "important"]
```

### Store API Patterns
```
User: "Save this API response pattern"

AI should call:
model_storage operation=addWithEmbedding namespace=knowledge key="api_response_pattern" value='
## Standard API Response Pattern

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

All endpoints should return this structure.
' tags=["api", "pattern", "typescript"]
```

### Retrieve Knowledge by Context
```
User: "What are our authentication conventions?"

AI should call:
model_storage operation=search query="authentication conventions auth patterns" namespaces=["knowledge"] limit=5
```

---

## 9. Error Tracking and Learning

### Store Error and Solution
```
User: "Remember this error and its fix"

AI should call:
model_storage operation=addWithEmbedding namespace=learning key="error_cors_credentials" value='
## Error: CORS Credentials

### Problem
Fetch requests failing with:
"CredencialFlag is true but Access-Control-Allow-Credentials is not true"

### Solution
Backend CORS config needs:
```javascript
app.use(cors({
  origin: "https://your-domain.com",
  credentials: true  // This is required!
}));
```

Frontend fetch needs:
```javascript
fetch(url, { credentials: "include" });
```

### Prevention
Always check CORS config before deploying auth features.
' tags=["error", "cors", "auth", "solution"]
```

### Search for Solutions
```
User: "I'm getting a CORS error"

AI should call:
model_storage operation=search query="CORS error solution fix" namespaces=["learning"] limit=3
```

---

## 10. Knowledge Base Statistics

### Check Storage Usage
```
User: "How much data is in the knowledge base?"

AI should call:
model_storage operation=knowledgeStats
```

### Check Namespace Stats
```
User: "Show me storage statistics for the knowledge namespace"

AI should call:
model_storage operation=stats namespace=knowledge
```

---

## Best Practices Summary

### 1. Use Semantic Search Instead of List
```
❌ BAD: model_storage operation=list namespace=knowledge
   (returns ALL entries, uses lots of context)

✅ GOOD: model_storage operation=search query="relevant topic" namespaces=["knowledge"] limit=5
   (returns only relevant entries, saves context)
```

### 2. Add Embeddings to Important Knowledge
```
❌ BAD: model_storage operation=set namespace=knowledge key="pattern" value="..."
   (not searchable by meaning)

✅ GOOD: model_storage operation=addWithEmbedding namespace=knowledge key="pattern" value="..." tags=["important"]
   (searchable by semantic meaning)
```

### 3. Use Verification for Critical Tasks
```
❌ BAD: Just marking tasks complete without checking

✅ GOOD: Add verification steps and use verify=true
```

### 4. Stream Large Files
```
❌ BAD: model_storage operation=get key="large_file"
   (may truncate or use too much context)

✅ GOOD: model_storage operation=get key="large_file" streamLines=true maxLines=100
   (controlled reading with pagination)
```

### 5. Link Plans to Knowledge
```
✅ GOOD: exit_plan_mode plan="..." saveToKnowledge=true
   (plan becomes searchable by semantic queries)
```
