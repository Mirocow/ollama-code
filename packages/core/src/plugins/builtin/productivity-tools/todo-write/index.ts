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

const debugLogger = createDebugLogger('TODO_WRITE');

// Namespace for todos in storage
const TODOS_NAMESPACE = 'todos';
const TODOS_KEY = 'items';

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
}

export interface TodoWriteParams {
  todos: TodoItem[];
  modified_by_user?: boolean;
  modified_content?: string;
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
    'Creates and manages a structured task list for your current coding session. This helps track progress, organize complex tasks, and demonstrate thoroughness.',
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
              enum: ['pending', 'in_progress', 'completed'],
            },
            id: {
              type: 'string',
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
          },
          required: ['content', 'status', 'id'],
          additionalProperties: false,
        },
        description: 'The updated todo list',
      },
    },
    required: ['todos'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
};

const todoWriteToolDescription = `
Use this tool to create and manage a structured task list for your current coding session. This helps you track progress, organize complex tasks, and demonstrate thoroughness to the user.
It also helps the user understand the progress of the task and overall progress of their requests.

## When to Use This Tool

**IMPORTANT: You SHOULD use this tool proactively for ANY task with 2 or more steps.**

Use this tool proactively in these scenarios:

1. **Multi-step tasks** - When a task requires 2 or more distinct steps or actions
2. **User explicitly requests todo list** - When the user directly asks you to use the todo list
3. **User provides multiple tasks** - When users provide a list of things to be done (numbered or comma-separated)
4. **After receiving new instructions** - Immediately capture user requirements as todos
5. **When you start working on a task** - Mark it as in_progress BEFORE beginning work. Ideally you should only have one todo as in_progress at a time
6. **After completing a task** - Mark it as completed and add any new follow-up tasks discovered during implementation

## When NOT to Use This Tool

Skip using this tool ONLY when:
1. The task is purely conversational or informational (no code changes needed)
2. The task is a single trivial action that takes less than 10 seconds (e.g., "print hello world")

**DO NOT skip todo_write just because a task seems "simple" - most coding tasks have hidden complexity.**

## Task States and Management

1. **Task States**: Use these states to track progress:
   - pending: Task not yet started
   - in_progress: Currently working on (limit to ONE task at a time)
   - completed: Task finished successfully

2. **Task Management**:
   - Update task status in real-time as you work
   - Mark tasks complete IMMEDIATELY after finishing (don't batch completions)
   - Only have ONE task in_progress at any time
   - Complete current tasks before starting new ones
   - Remove tasks that are no longer relevant from the list entirely

3. **Task Completion Requirements**:
   - ONLY mark a task as completed when you have FULLY accomplished it
   - If you encounter errors, blockers, or cannot finish, keep the task as in_progress
   - When blocked, create a new task describing what needs to be resolved
   - Never mark a task as completed if:
     - Tests are failing
     - Implementation is partial
     - You encountered unresolved errors
     - You couldn't find necessary files or dependencies

4. **Task Breakdown**:
   - Create specific, actionable items
   - Break complex tasks into smaller, manageable steps
   - Use clear, descriptive task names

When in doubt, use this tool. Being proactive with task management demonstrates attentiveness and ensures you complete all requirements successfully.
`;

/**
 * Read todos from storage
 */
async function readTodosFromStorage(
  sessionId: string,
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
    status: todos.length === 0
      ? 'completed'
      : todos.every(t => t.status === 'completed')
        ? 'completed'
        : 'active',
  };

  await storageSet(TODOS_NAMESPACE, TODOS_KEY, data, { scope: 'project' });

  // Also update plan status if linked
  if (data.planId) {
    try {
      const plan = await storageGet<{ status: string; todos: TodoItem[]; progress: number }>(
        StorageNamespaces.PLANS,
        data.planId,
        { scope: 'project' },
      );

      if (plan && plan.status === 'active') {
        const completed = todos.filter(t => t.status === 'completed').length;
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
  const completed = todos.filter(t => t.status === 'completed').length;
  return Math.round((completed / todos.length) * 100);
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
    return this.operationType === 'create' ? 'Create todos' : 'Update todos';
  }

  override async shouldConfirmExecute(
    _abortSignal: AbortSignal,
  ): Promise<false> {
    // Todo operations should execute automatically without user confirmation
    return false;
  }

  async execute(_signal: AbortSignal): Promise<ToolResult> {
    const { todos, modified_by_user, modified_content } = this.params;
    const sessionId = this.config.getSessionId() || 'default';

    try {
      // Read existing data to preserve plan linkage
      const existingData = await readTodosFromStorage(sessionId);

      let finalTodos: TodoItem[];

      if (modified_by_user && modified_content !== undefined) {
        // User modified the content in external editor, parse it directly
        const data = JSON.parse(modified_content);
        finalTodos = Array.isArray(data.todos) ? data.todos : Array.isArray(data.items) ? data.items : [];
      } else {
        // Use the normal todo logic - simply replace with new todos
        finalTodos = todos;
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
        const inProgress = finalTodos.find(t => t.status === 'in_progress');
        const pending = finalTodos.filter(t => t.status === 'pending');
        const completed = finalTodos.filter(t => t.status === 'completed');

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
  sessionId: string,
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

    // Validate individual todos
    for (const todo of params.todos) {
      if (!todo.id || typeof todo.id !== 'string' || todo.id.trim() === '') {
        return 'Each todo must have a non-empty "id" string.';
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

    // Check for duplicate IDs
    const ids = params.todos.map((todo) => todo.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      return 'Todo IDs must be unique within the array.';
    }

    return null;
  }

  protected createInvocation(params: TodoWriteParams) {
    // Determine if this is a create or update operation
    const operationType = 'update'; // Always update since storage handles both

    return new TodoWriteToolInvocation(this.config, params, operationType);
  }
}
