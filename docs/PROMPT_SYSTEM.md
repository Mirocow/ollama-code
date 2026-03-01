# Prompt System Documentation

This document provides a comprehensive guide to the prompt formation system in Ollama Code. The prompt system is responsible for constructing the system prompts that guide the AI model's behavior during conversations.

## Overview

The prompt system is located in `packages/core/src/core/prompts.ts` and provides several key functions for generating different types of system prompts. Each prompt serves a specific purpose in the conversation lifecycle.

## Core Functions

### `getCoreSystemPrompt(userMemory?: string, model?: string): string`

The primary system prompt function that constructs the main instruction set for the AI agent.

**Parameters:**
- `userMemory` (optional): User-specific memory content to append to the prompt
- `model` (optional): The model identifier to customize tool call instructions

**Returns:** A complete system prompt string

**Structure:**
The generated prompt includes:

1. **Core Mandates** - Fundamental behavioral rules:
   - Convention adherence
   - Library/framework verification
   - Style and structure mimicry
   - Idiomatic changes
   - Comment guidelines
   - Proactiveness
   - Ambiguity handling
   - Change explanation rules
   - Revert policies

2. **Primary Workflows** - Detailed workflows for:
   - Software engineering tasks (plan, implement, adapt, verify)
   - New application development (understand, propose, implement, verify)

3. **Operational Guidelines** - Rules for:
   - CLI interaction tone and style
   - Security and safety
   - Tool usage patterns
   - Task management
   - Subagent delegation

4. **Environment Information** - Runtime context:
   - Ollama configuration (base URL, model, keep-alive)
   - System information (Node.js version, platform, directories)
   - Debug settings

5. **Tool Call Examples** - Model-specific examples:
   - General examples for most models
   - Qwen Coder format with XML-style tags
   - Qwen VL format with JSON objects

6. **Tool Learning Context** - Past mistake prevention

7. **Tool Call Format Instructions** - For models without native tool support

**Environment Variables:**
- `OLLAMA_CODE_SYSTEM_MD`: Path to custom system prompt file
- `OLLAMA_CODE_WRITE_SYSTEM_MD`: Path to write the generated prompt

**Example Usage:**
```typescript
import { getCoreSystemPrompt } from './core/prompts.js';

// Basic usage
const prompt = getCoreSystemPrompt();

// With user memory
const promptWithMemory = getCoreSystemPrompt('User prefers TypeScript over JavaScript');

// With model-specific instructions
const promptForModel = getCoreSystemPrompt(undefined, 'qwen2.5-coder:7b');
```

---

### `getCompressionPrompt(): string`

Generates the system prompt for the history compression process. This prompt instructs a secondary model to summarize conversation history into a structured XML format.

**Returns:** A compression-focused system prompt

**Purpose:**
When conversation history grows too large, this prompt guides the model to create a dense, structured snapshot that preserves all essential information while reducing token count.

**Output Structure (XML):**
```xml
<state_snapshot>
    <overall_goal>
        <!-- Single sentence describing the high-level objective -->
    </overall_goal>
    
    <key_knowledge>
        <!-- Bullet points of crucial facts, conventions, constraints -->
        <!-- Example: Build commands, API endpoints, testing procedures -->
    </key_knowledge>
    
    <file_system_state>
        <!-- List of files: created, read, modified, deleted -->
        <!-- Include status and critical learnings -->
    </file_system_state>
    
    <recent_actions>
        <!-- Summary of significant actions and outcomes -->
    </recent_actions>
    
    <current_plan>
        <!-- Step-by-step plan with status markers -->
        <!-- [DONE], [IN PROGRESS], [TODO] -->
    </current_plan>
</state_snapshot>
```

**Example Usage:**
```typescript
import { getCompressionPrompt } from './core/prompts.js';

const compressionPrompt = getCompressionPrompt();
// Use this prompt with a secondary model call to compress history
```

---

### `getProjectSummaryPrompt(): string`

Generates the system prompt for creating markdown project summaries. Useful for saving conversation context to files.

**Returns:** A summary-generation system prompt

**Output Structure (Markdown):**
```markdown
# Project Summary

## Overall Goal
<!-- Single sentence describing the objective -->

## Key Knowledge
<!-- Technology choices, architecture decisions, user preferences -->

## Recent Actions
<!-- Accomplishments, discoveries, recent changes -->

## Current Plan
<!-- Development roadmap with status markers -->
```

**Example Usage:**
```typescript
import { getProjectSummaryPrompt } from './core/prompts.js';

const summaryPrompt = getProjectSummaryPrompt();
// Use with a model to generate a markdown summary from conversation history
```

---

### `getToolCallFormatInstructions(model?: string): string`

Provides tool call formatting instructions for models that don't have native tool calling support.

**Parameters:**
- `model` (optional): The model identifier to check for tool support

**Returns:** Tool call format instructions (empty string if model supports native tools)

**Behavior:**
- Returns empty string if no model is specified (assumes tool support)
- Returns empty string if the model supports native tool calling (checked via `supportsTools()`)
- Returns detailed instructions for models without native support

**Supported Formats:**
1. **Tool Call Tag (Preferred):**
   ```
   <tool_call={"name": "tool_name", "arguments": {"param": "value"}}>
   ```

2. **JSON in Code Block:**
   ```json
   {"name": "tool_name", "arguments": {"param": "value"}}
   ```

3. **Function Call Format:**
   ```json
   {"type": "function", "function": {"name": "tool_name", "arguments": {"param": "value"}}}
   ```

**Example Usage:**
```typescript
import { getToolCallFormatInstructions } from './core/prompts.js';

// Returns instructions for models without native support
const instructions = getToolCallFormatInstructions('llama3.2:latest');

// Returns empty string for models with native support
const noInstructions = getToolCallFormatInstructions('qwen2.5-coder:7b');
```

---

### `getToolLearningContext(): string`

Generates context from the Tool Learning Manager to help the model avoid repeating past mistakes.

**Returns:** Learning context string (empty if no learning data available)

**Content Includes:**
1. **Wrong → Correct mappings** - Recent tool call corrections
2. **Explanations** - Why corrections were needed
3. **Examples** - Concrete examples of correct usage
4. **Common Mistakes** - Frequently made errors to avoid

**Example Output:**
```
# Tool Learning Context

You have made the following tool call errors in recent sessions. Learn from these mistakes:

## Wrong: "git_dev" → Correct: "run_shell_command"
Tool name 'git_dev' does not exist. Use 'run_shell_command' for git operations.
**Example:** `run_shell_command(command: "git status")`

### Common Tool Name Mistakes to Avoid
- ❌ "shell_dev" → ✅ use "run_shell_command"
- ❌ "bash_dev" → ✅ use "run_shell_command"
- ❌ "javascript_dev" → ✅ use "nodejs_dev"

**IMPORTANT:** Always use EXACT tool names as listed in the Available Tools section.
```

**Example Usage:**
```typescript
import { getToolLearningContext } from './core/prompts.js';

const learningContext = getToolLearningContext();
// Append to system prompt for improved tool accuracy
```

---

### `getEnvironmentInfo(): string`

Gathers runtime environment information to provide context to the AI model.

**Returns:** Markdown-formatted environment information

**Information Collected:**

**Ollama Configuration:**
- `OLLAMA_BASE_URL` or `OLLAMA_HOST`
- `OLLAMA_MODEL`
- `OLLAMA_KEEP_ALIVE`
- `OLLAMA_API_KEY` (status only)

**System Information:**
- Node.js version
- Platform (win32, darwin, linux)
- Current working directory
- Home directory

**Debug Settings:**
- DEBUG mode status

**Example Output:**
```markdown
## Environment

You are running in the following environment:

### Ollama Configuration
- **OLLAMA_BASE_URL**: http://localhost:11434
- **OLLAMA_MODEL**: llama3.2
- **OLLAMA_API_KEY**: (not set)

### System Information
- **Node.js Version**: v20.10.0
- **Platform**: darwin
- **Current Working Directory**: /home/user/project
- **Home Directory**: /home/user

### Debug Settings
- **DEBUG Mode**: disabled
```

---

### `getCustomSystemPrompt(customInstruction, userMemory?): string`

Processes a custom system instruction by appending user memory if available.

**Parameters:**
- `customInstruction`: Custom system instruction (ContentUnion type)
- `userMemory` (optional): User memory to append

**Returns:** Processed custom system instruction

**Handles Multiple Input Formats:**
- String input
- PartUnion array
- Content object with parts
- Single PartUnion

**Example Usage:**
```typescript
import { getCustomSystemPrompt } from './core/prompts.js';

// String input
const prompt1 = getCustomSystemPrompt('You are a helpful coding assistant.');

// With user memory
const prompt2 = getCustomSystemPrompt(
  'You are a helpful coding assistant.',
  'User prefers functional programming style.'
);
```

---

## Helper Functions

### `resolvePathFromEnv(envVar?: string)`

Resolves environment variables that can be either switches (true/false) or file paths.

**Parameters:**
- `envVar` (optional): Environment variable value

**Returns:** Object with properties:
- `isSwitch`: Whether the value is a boolean switch
- `value`: The resolved value or null
- `isDisabled`: Whether the switch is disabled (0/false)

**Supported Values:**
- Boolean switches: `"0"`, `"false"`, `"1"`, `"true"`
- File paths: Supports tilde expansion (`~/`)

**Example Usage:**
```typescript
import { resolvePathFromEnv } from './core/prompts.js';

const result = resolvePathFromEnv('~/custom/path');
// { isSwitch: false, value: '/home/user/custom/path', isDisabled: false }

const switchResult = resolvePathFromEnv('false');
// { isSwitch: true, value: 'false', isDisabled: true }
```

---

## Model-Specific Behavior

The prompt system adapts based on the specified model:

### Tool Support Detection
Uses `supportsTools()` from `model-definitions` to determine if a model supports native tool calling.

### Tool Call Examples by Model

**General Models:**
```
[tool_call: run_shell_command for 'node server.js &' with is_background: true]
```

**Qwen Coder Models:**
```
<function=run_shell_command>
<parameter=command>
node server.js &
</parameter>
<parameter=is_background>
true
</parameter>
</function>
```

**Qwen VL Models:**
```
{"name": "run_shell_command", "arguments": {"command": "node server.js &", "is_background": true}}
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_CODE_SYSTEM_MD` | Path to custom system prompt file | `.ollama-code/system.md` |
| `OLLAMA_CODE_WRITE_SYSTEM_MD` | Write generated prompt to file | Disabled |
| `OLLAMA_BASE_URL` | Ollama API base URL | `http://localhost:11434` |
| `OLLAMA_HOST` | Alternative to OLLAMA_BASE_URL | - |
| `OLLAMA_MODEL` | Default model identifier | - |
| `OLLAMA_KEEP_ALIVE` | Model keep-alive duration | - |
| `OLLAMA_API_KEY` | API key for authentication | - |
| `DEBUG` | Enable debug mode | - |
| `SANDBOX` | Sandbox environment indicator | - |

### Custom System Prompt

To use a custom system prompt:

1. Set `OLLAMA_CODE_SYSTEM_MD` to the path of your custom prompt file:
   ```bash
   export OLLAMA_CODE_SYSTEM_MD=~/.ollama-code/custom-system.md
   ```

2. Create the file with your custom instructions

3. The system will use your custom prompt instead of the default

---

## Integration Points

### With Tool Registry
The prompt system integrates with the tool registry to:
- List available tools in the prompt
- Provide tool-specific instructions
- Learn from tool usage mistakes

### With Memory System
User memory is appended to the system prompt to:
- Maintain user preferences across sessions
- Remember project-specific conventions
- Preserve important context

### With Git System
When in a git repository, adds git-specific instructions for:
- Commit message formatting
- Change review workflows
- Branch management guidance

---

## Best Practices

1. **Keep prompts concise**: The prompt system balances completeness with token efficiency

2. **Use model-specific instructions**: Different models have different capabilities and formatting preferences

3. **Leverage user memory**: Store important user preferences in memory for consistent behavior

4. **Monitor learning feedback**: The tool learning system improves accuracy over time

5. **Test with different models**: Ensure your workflow works with models that have and don't have native tool support
