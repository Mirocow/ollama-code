/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Todo Write Tool
 *
 * Uses model_storage for persistence via the 'todos' namespace.
 * Data is stored in: ~/.ollama-code/projects/<hash>/storage/<session-id>.json
 * Under the 'todos' namespace with key 'items'.
 *
 * Enhanced with verification support for task completion validation.
 */

import type { ToolResult } from '../../../../tools/tools.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
} from '../../../../tools/tools.js';
import type { FunctionDeclaration } from '../../../../types/content.js';
import type { Config } from '../../../../config/config.js';
import { createDebugLogger } from '../../../../utils/debugLogger.js';
import {
  storageGet,
  storageSet,
  StorageNamespaces,
} from '../../storage-tools/index.js';
import {
  VerificationExecutor,
} from '../../../../knowledge/verification.js';
import type { VerificationResult } from '../../../../knowledge/types.js';

const debugLogger = createDebugLogger('TODO_WRITE');

// Namespace for todos in storage
const TODOS_NAMESPACE = 'todos';
const TODOS_KEY = 'items';

/**
 * Verification step for todo completion
 */
export interface TodoVerificationStep {
  id: string;
  description: string;
  type: 'file_exists' | 'file_contains' | 'command_success' | 'test_pass' | 'lint_pass' | 'type_check' | 'build_success' | 'custom';
  params: Record<string, unknown>;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  autoVerify?: boolean; // Auto-run on status change to 'completed'
}

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority?: 'high' | 'medium' | 'low';
  verification?: {
    steps: TodoVerificationStep[];
    status: 'pending' | 'passed' | 'failed' | 'skipped';
    result?: VerificationResult;
    required?: boolean; // Require verification to mark completed
  };
  dependencies?: string[]; // IDs of todos this depends on
  estimatedEffort?: 'small' | 'medium' | 'large';
  notes?: string;
}

export interface TodoWriteParams {
  todos: TodoItem[];
  modified_by_user?: boolean;
  modified_content?: string;
  verify?: boolean; // Trigger verification for completed items
  verifyTodoId?: string; // Specific todo to verify
}

export interface TodosData {
  items: TodoItem[];
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  planId?: string; // Link to active plan if any
  status: 'active' | 'completed' | 'abandoned';
}

const todoWriteToolSchemaData: FunctionDeclaration = {
  name: 'todo_write',
  description:
    'Creates and manages a structured task list with optional verification. Use this for complex tasks where completion criteria can be verified automatically.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              minLength: 1,
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed', 'blocked'],
            },
            id: {
              type: 'string',
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            verification: {
              type: 'object',
              properties: {
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      description: { type: 'string' },
                      type: {
                        type: 'string',
                        enum: ['file_exists', 'file_contains', 'command_success', 'test_pass', 'lint_pass', 'type_check', 'build_success', 'custom'],
                      },
                      params: { type: 'object' },
                      status: {
                        type: 'string',
                        enum: ['pending', 'running', 'passed', 'failed', 'skipped'],
                      },
                    },
                  },
                },
                required: { type: 'boolean' },
              },
            },
            dependencies: {
              type: 'array',
              items: { type: 'string' },
            },
            estimatedEffort: {
              type: 'string',
              enum: ['small', 'medium', 'large'],
            },
            notes: { type: 'string' },
          },
          required: ['content', 'status'],
          additionalProperties: false,
        },
        description: 'The updated todo list',
      },
      verify: {
        type: 'boolean',
        description: 'Trigger verification for todos marked as completed',
      },
      verifyTodoId: {
        type: 'string',
        description: 'Specific todo ID to verify',
      },
    },
    required: ['todos'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
};

const todoWriteToolDescription = `
# Task Management Guidelines

Use this tool to create and manage a structured task list for your current coding session. This helps you track progress, organize complex workflows, and demonstrate thoroughness. It also provides the user with clear visibility into the status of their requests.

## When to Use This Tool

**IMPORTANT: You MUST use this tool proactively for ANY task consisting of 2 or more steps.**

Use this tool in the following scenarios:
1. **Multi-step tasks** – When a task requires 2 or more distinct actions.
2. **Explicit requests** – When the user specifically asks for a todo list or plan.
3. **Multiple requirements** – When the user provides a list of items (numbered, bulleted, or comma-separated).
4. **New instructions** – Immediately capture new user requirements as todos.
5. **Work initiation** – Mark a task as \`in_progress\` BEFORE beginning work.
   * *Note: Ideally, only one task should be \`in_progress\` at a time.*
6. **Task completion** – Mark tasks as \`completed\` immediately and add any follow-up tasks discovered during implementation.

## When NOT to Use This Tool

Skip this tool ONLY if:
1. The interaction is purely conversational or informational (no implementation needed).
2. The task is a single, trivial action taking less than 10 seconds (e.g., "print hello world").

**DO NOT skip \`todo_write\` just because a task seems "simple" — most coding tasks have hidden complexity.**

## Task States and Management

### 1. Task States
* \`pending\`: Task not yet started.
* \`in_progress\`: Task currently being worked on (limit to **ONE** at a time).
* \`completed\`: Task finished successfully.
* \`blocked\`: Task blocked by dependencies (auto-set).

### 2. Management Rules
* **Real-time updates**: Update task status as you work.
* **Immediate completion**: Mark tasks as \`completed\` IMMEDIATELY after finishing (do not batch completions).
* **Sequential flow**: Complete the current \`in_progress\` task before starting a new one.
* **Cleanup**: Remove tasks from the list entirely if they become irrelevant.

### 3. Completion Requirements
**NEVER** mark a task as completed if:
* Tests are failing.
* Implementation is partial.
* There are unresolved errors.
* Necessary files or dependencies are missing.

*If you encounter blockers, keep the task as \`in_progress\` and create a new task describing the resolution steps needed.*

### 4. Task Breakdown
* Define specific, actionable items.
* Break complex tasks into small, manageable steps.
* Use clear, descriptive names for each task.

## Verification System

Tasks can have automatic verification steps:

\`\`\`json
{
  "id": "task-1",
  "content": "Create authentication",
  "verification": {
    "steps": [
      {"type": "file_exists", "params": {"path": "src/auth.ts"}},
      {"type": "test_pass", "params": {"testPath": "auth.test.ts"}}
    ],
    "required": true
  }
}
\`\`\`

Verification types: \`file_exists\`, \`file_contains\`, \`command_success\`, \`test_pass\`, \`lint_pass\`, \`type_check\`, \`build_success\`

Use \`verify=true\` when marking completed to run verification.

## Dependencies

Tasks can depend on other tasks:

\`\`\`json
{
  "id": "task-2",
  "content": "Write tests",
  "dependencies": ["task-1"]
}
\`\`\`

If dependencies not satisfied, status becomes \`blocked\`.

## Storage Integration

Todos are automatically saved to \`model_storage\` namespace \`todos\` and persist across sessions.
Use \`exit_plan_mode\` to link todos to an active plan.

---
When in doubt, use this tool. Proactive task management ensures all requirements are met and demonstrates a systematic approach.
`;

/**
 * Read todos from storage
 */
async function readTodosFromStorage(
  _sessionId: string,
): Promise<TodosData | null> {
  try {
    const data = await storageGet<TodosData>(TODOS_NAMESPACE, TODOS_KEY, {
      scope: 'project',
    });
    return data || null;
  } catch (err) {
    debugLogger.error('[TodoWrite] Error reading todos from storage:', err);
    return null;
  }
}

/**
 * Write todos to storage
 */
async function writeTodosToStorage(
  todos: TodoItem[],
  sessionId: string,
  existingData?: TodosData | null,
): Promise<void> {
  const now = new Date().toISOString();

  const data: TodosData = {
    items: todos,
    sessionId,
    createdAt: existingData?.createdAt || now,
    updatedAt: now,
    planId: existingData?.planId,
    status:
      todos.length === 0
        ? 'completed'
        : todos.every((t) => t.status === 'completed')
          ? 'completed'
          : 'active',
  };

  await storageSet(TODOS_NAMESPACE, TODOS_KEY, data, { scope: 'project' });

  // Also update plan status if linked
  if (data.planId) {
    try {
      const plan = await storageGet<{
        status: string;
        todos: TodoItem[];
        progress: number;
      }>(StorageNamespaces.PLANS, data.planId, { scope: 'project' });

      if (plan && plan.status === 'active') {
        const completed = todos.filter((t) => t.status === 'completed').length;
        const total = todos.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        await storageSet(
          StorageNamespaces.PLANS,
          data.planId,
          {
            ...plan,
            todos,
            progress,
            status: progress === 100 ? 'completed' : 'active',
            completedAt: progress === 100 ? now : undefined,
          },
          { scope: 'project' },
        );
      }
    } catch {
      // Ignore errors updating plan
    }
  }
}

/**
 * Calculate progress percentage
 */
function calculateProgress(todos: TodoItem[]): number {
  if (todos.length === 0) return 0;
  const completed = todos.filter((t) => t.status === 'completed').length;
  return Math.round((completed / todos.length) * 100);
}

/**
 * Check if todo dependencies are satisfied
 */
function checkDependencies(todo: TodoItem, allTodos: TodoItem[]): {
  satisfied: boolean;
  blockedBy: string[];
} {
  if (!todo.dependencies || todo.dependencies.length === 0) {
    return { satisfied: true, blockedBy: [] };
  }

  const blockedBy: string[] = [];
  
  for (const depId of todo.dependencies) {
    const dep = allTodos.find(t => t.id === depId);
    if (!dep || dep.status !== 'completed') {
      blockedBy.push(depId);
    }
  }

  return {
    satisfied: blockedBy.length === 0,
    blockedBy,
  };
}

/**
 * Run verification for a todo item
 */
async function runVerification(
  todo: TodoItem,
  workingDirectory: string,
): Promise<{ passed: boolean; result?: VerificationResult }> {
  if (!todo.verification?.steps || todo.verification.steps.length === 0) {
    return { passed: true };
  }

  const executor = new VerificationExecutor({ workingDirectory });
  const result = await executor.executeSteps(todo.verification.steps);

  return {
    passed: result.status === 'passed',
    result,
  };
}

/**
 * Process todos with verification and dependency checks
 */
async function processTodos(
  todos: TodoItem[],
  existingTodos: TodoItem[],
  options: {
    verify?: boolean;
    verifyTodoId?: string;
    workingDirectory: string;
  },
): Promise<TodoItem[]> {
  const processedTodos: TodoItem[] = [];

  for (const todo of todos) {
    const existing = existingTodos.find(t => t.id === todo.id);
    const statusChanged = existing && existing.status !== todo.status;
    const nowCompleted = todo.status === 'completed';
    const nowInProgress = todo.status === 'in_progress';

    // Check dependencies
    const { satisfied, blockedBy } = checkDependencies(todo, todos);
    
    if (!satisfied && nowInProgress) {
      // Block if dependencies not satisfied
      todo.status = 'blocked';
      todo.notes = `Blocked by: ${blockedBy.join(', ')}`;
      debugLogger.info(`[TodoWrite] Todo ${todo.id} blocked by dependencies: ${blockedBy.join(', ')}`);
    }

    // Run verification if:
    // 1. Todo is being marked as completed AND
    // 2. Has verification steps AND
    // 3. Either verify=true OR verification.required=true
    const shouldVerify = 
      nowCompleted && 
      todo.verification?.steps?.length &&
      (options.verify || todo.verification.required) &&
      statusChanged;

    if (shouldVerify) {
      debugLogger.info(`[TodoWrite] Running verification for todo ${todo.id}`);
      
      const { passed, result } = await runVerification(todo, options.workingDirectory);
      
      todo.verification = {
        steps: todo.verification!.steps,
        status: passed ? 'passed' : 'failed',
        result,
        required: todo.verification!.required,
      };

      if (!passed && todo.verification.required) {
        // Verification failed and required - keep as in_progress
        todo.status = 'in_progress';
        todo.notes = `Verification failed: ${result?.summary || 'Unknown error'}`;
        debugLogger.warn(`[TodoWrite] Todo ${todo.id} verification failed, keeping in_progress`);
      }
    }

    // Auto-blocked status based on verification
    if (todo.verification?.status === 'failed' && todo.verification.required) {
      if (todo.status === 'completed') {
        todo.status = 'in_progress';
      }
    }

    processedTodos.push(todo);
  }

  return processedTodos;
}

class TodoWriteToolInvocation extends BaseToolInvocation<
  TodoWriteParams,
  ToolResult
> {
  private operationType: 'create' | 'update';

  constructor(
    private readonly config: Config,
    params: TodoWriteParams,
    operationType: 'create' | 'update' = 'update',
  ) {
    super(params);
    this.operationType = operationType;
  }

  getDescription(): string {
    const { verify, verifyTodoId } = this.params;
    let desc = this.operationType === 'create' ? 'Create todos' : 'Update todos';
    if (verify) desc += ' (with verification)';
    if (verifyTodoId) desc += ` - verify ${verifyTodoId}`;
    return desc;
  }

  override async shouldConfirmExecute(
    _abortSignal: AbortSignal,
  ): Promise<false> {
    // Todo operations should execute automatically without user confirmation
    return false;
  }

  async execute(_signal: AbortSignal): Promise<ToolResult> {
    const { todos, modified_by_user, modified_content, verify, verifyTodoId } = this.params;
    const sessionId = this.config.getSessionId() || 'default';
    const workingDirectory = this.config.getTargetDir();

    try {
      // Read existing data to preserve plan linkage
      const existingData = await readTodosFromStorage(sessionId);
      const existingTodos = existingData?.items || [];

      let finalTodos: TodoItem[];

      if (modified_by_user && modified_content !== undefined) {
        // User modified the content in external editor, parse it directly
        const data = JSON.parse(modified_content);
        finalTodos = Array.isArray(data.todos)
          ? data.todos
          : Array.isArray(data.items)
            ? data.items
            : [];
      } else {
        // Use the normal todo logic
        finalTodos = todos;
      }

      // Process todos with verification and dependency checks
      if (verify || finalTodos.some(t => t.verification?.required)) {
        finalTodos = await processTodos(finalTodos, existingTodos, {
          verify,
          verifyTodoId,
          workingDirectory,
        });
      }

      // Write to storage
      await writeTodosToStorage(finalTodos, sessionId, existingData);

      // Create structured display object for rich UI rendering
      const todoResultDisplay = {
        type: 'todo_list' as const,
        todos: finalTodos,
      };

      // Create plain string format with system reminder
      const todosJson = JSON.stringify(finalTodos);
      const progress = calculateProgress(finalTodos);
      let llmContent: string;

      if (finalTodos.length === 0) {
        // Special message for empty todos
        llmContent = `Todo list has been cleared.

<system-reminder>
Your todo list is now empty. DO NOT mention this explicitly to the user. You have no pending tasks in your todo list.
</system-reminder>`;
      } else {
        // Normal message for todos with items
        const inProgress = finalTodos.find((t) => t.status === 'in_progress');
        const pending = finalTodos.filter((t) => t.status === 'pending');
        const completed = finalTodos.filter((t) => t.status === 'completed');

        llmContent = `Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable

<system-reminder>
Your todo list has changed. DO NOT mention this explicitly to the user. Here are the latest contents of your todo list:

Progress: ${progress}% (${completed.length}/${finalTodos.length} completed)
${inProgress ? `Current task: ${inProgress.content}` : 'No task in progress'}
${pending.length > 0 ? `Pending: ${pending.length} tasks` : ''}

${todosJson}. Continue on with the tasks at hand if applicable.
</system-reminder>`;
      }

      return {
        llmContent,
        returnDisplay: todoResultDisplay,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debugLogger.error(
        `[TodoWriteTool] Error executing todo_write: ${errorMessage}`,
      );

      // Create plain string format for error with system reminder
      const errorLlmContent = `Failed to modify todos. An error occurred during the operation.

<system-reminder>
Todo list modification failed with error: ${errorMessage}. You may need to retry or handle this error appropriately.
</system-reminder>`;

      return {
        llmContent: errorLlmContent,
        returnDisplay: `Error writing todos: ${errorMessage}`,
      };
    }
  }
}

/**
 * Utility function to read todos for a specific session (useful for session recovery)
 */
export async function readTodosForSession(
  _sessionId: string,
): Promise<TodoItem[]> {
  try {
    const data = await storageGet<TodosData>(TODOS_NAMESPACE, TODOS_KEY, {
      scope: 'project',
    });
    return data?.items || [];
  } catch {
    return [];
  }
}

/**
 * Get active todos with metadata (for reminders)
 */
export async function getActiveTodos(): Promise<TodosData | null> {
  try {
    const result = await storageGet<TodosData>(TODOS_NAMESPACE, TODOS_KEY, {
      scope: 'project',
    });
    return result ?? null;
  } catch {
    return null;
  }
}

/**
 * Link todos to a plan (called by exit_plan_mode)
 */
export async function linkTodosToPlan(planId: string): Promise<void> {
  try {
    const data = await storageGet<TodosData>(TODOS_NAMESPACE, TODOS_KEY, {
      scope: 'project',
    });

    if (data) {
      data.planId = planId;
      await storageSet(TODOS_NAMESPACE, TODOS_KEY, data, { scope: 'project' });
    }
  } catch {
    // Ignore errors
  }
}

export class TodoWriteTool extends BaseDeclarativeTool<
  TodoWriteParams,
  ToolResult
> {
  static readonly Name: string = 'todo_write';

  constructor(private readonly config: Config) {
    super(
      TodoWriteTool.Name,
      'TodoWrite',
      todoWriteToolDescription,
      Kind.Think,
      todoWriteToolSchemaData.parametersJsonSchema as Record<string, unknown>,
    );
  }

  override validateToolParams(params: TodoWriteParams): string | null {
    // Validate todos array
    if (!Array.isArray(params.todos)) {
      return 'Parameter "todos" must be an array.';
    }

    // Validate individual todos and auto-generate IDs if missing
    for (let i = 0; i < params.todos.length; i++) {
      const todo = params.todos[i];

      // Auto-generate ID if missing
      if (!todo.id || typeof todo.id !== 'string' || todo.id.trim() === '') {
        todo.id = `todo-${Date.now()}-${i}`;
      }

      if (
        !todo.content ||
        typeof todo.content !== 'string' ||
        todo.content.trim() === ''
      ) {
        return 'Each todo must have a non-empty "content" string.';
      }
      if (!['pending', 'in_progress', 'completed'].includes(todo.status)) {
        return 'Each todo must have a valid "status" (pending, in_progress, completed).';
      }
    }

    // Check for duplicate IDs and regenerate if needed
    const ids = params.todos.map((todo) => todo.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      // Regenerate duplicate IDs
      const seenIds = new Set<string>();
      for (let i = 0; i < params.todos.length; i++) {
        const todo = params.todos[i];
        if (seenIds.has(todo.id)) {
          todo.id = `todo-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        }
        seenIds.add(todo.id);
      }
    }

    return null;
  }

  protected createInvocation(params: TodoWriteParams) {
    // Determine if this is a create or update operation
    const operationType = 'update'; // Always update since storage handles both

    return new TodoWriteToolInvocation(this.config, params, operationType);
  }
}
