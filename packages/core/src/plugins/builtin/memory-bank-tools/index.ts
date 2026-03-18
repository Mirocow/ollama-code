/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory Bank Tools Plugin
 *
 * Simple commands for Memory Bank management:
 * - "создай memory bank" / "create memory bank" → init
 * - "обнови memory bank" / "update memory bank" → update
 * - "создай план работ" / "create work plan" → createTodo
 */

import type { ToolResult, ToolResultDisplay } from '../../../tools/tools.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
} from '../../../tools/tools.js';
import type { FunctionDeclaration } from '../../../types/content.js';
import type { ShellExecutionConfig } from '../../../services/shellExecutionService.js';
import { createDebugLogger } from '../../../utils/debugLogger.js';
import {
  getMemoryBank,
  MemoryBankFileType,
} from '../../../memory-bank/index.js';

const debugLogger = createDebugLogger('MEMORY_BANK_TOOL');

// ============================================================================
// Tool Names
// ============================================================================

export const TOOL_NAMES = {
  MEMORY_BANK: 'memory_bank',
} as const;

// ============================================================================
// JSON Schema
// ============================================================================

const memoryBankToolSchemaData: FunctionDeclaration = {
  name: 'memory_bank',
  description: `Memory Bank management tool for creating and updating AI's long-term memory.

USAGE EXAMPLES:
- "создай memory bank" / "create memory bank" → Creates memory bank files
- "обнови memory bank" / "update memory bank" → Updates memory bank with current context
- "создай план работ" / "create work plan" → Creates todo.md with tasks

OPERATIONS:
- init: Create memory bank with all files (projectbrief, systemPatterns, techContext, activeContext, progress, todo, tasks, context)
- update: Update memory bank files with current session info
- createTodo: Create/update todo.md with work plan
- read: Read specific memory bank file
- updateFile: Update specific memory bank file
- status: Get memory bank status

MEMORY BANK FILES:
| File | Purpose | Update Frequency |
|------|---------|------------------|
| projectbrief.md | What are we building? | Rarely |
| systemPatterns.md | How is it built? | Sometimes |
| techContext.md | Tech stack, dependencies | Sometimes |
| activeContext.md | What's happening now? | Constantly |
| progress.md | What's done, issues? | Frequently |
| todo.md | Tasks to do | Constantly |
| tasks.md | Task queue | Constantly |
| context.md | Project context | Constantly |`,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['init', 'update', 'createTodo', 'read', 'updateFile', 'status'],
        description: 'Operation to perform',
      },
      file: {
        type: 'string',
        enum: [
          'projectbrief',
          'systemPatterns',
          'techContext',
          'activeContext',
          'progress',
          'todo',
          'tasks',
          'context',
        ],
        description: 'File to read or update (for read/updateFile operations)',
      },
      content: {
        type: 'string',
        description: 'Content to write (for updateFile operation)',
      },
      tasks: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of tasks (for createTodo operation)',
      },
      projectInfo: {
        type: 'object',
        properties: {
          what: { type: 'string', description: 'What are we building?' },
          who: { type: 'string', description: 'Who is it for?' },
          value: { type: 'string', description: 'Core value proposition' },
        },
        description: 'Project information (for init operation)',
      },
      sessionInfo: {
        type: 'object',
        properties: {
          focus: { type: 'string', description: 'Current focus' },
          nextSteps: {
            type: 'array',
            items: { type: 'string' },
            description: 'Next steps',
          },
          completed: {
            type: 'array',
            items: { type: 'string' },
            description: 'Completed items',
          },
        },
        description: 'Session information (for update operation)',
      },
    },
    required: ['operation'],
  },
};

// ============================================================================
// Types
// ============================================================================

interface MemoryBankParams {
  operation:
    | 'init'
    | 'update'
    | 'createTodo'
    | 'read'
    | 'updateFile'
    | 'status';
  file?: MemoryBankFileType;
  content?: string;
  tasks?: string[];
  projectInfo?: {
    what?: string;
    who?: string;
    value?: string;
  };
  sessionInfo?: {
    focus?: string;
    nextSteps?: string[];
    completed?: string[];
  };
}

// ============================================================================
// Tool Implementation
// ============================================================================

async function performOperation(params: MemoryBankParams): Promise<ToolResult> {
  const mb = getMemoryBank();

  switch (params.operation) {
    case 'init':
      return performInit(mb, params);

    case 'update':
      return performUpdate(mb, params);

    case 'createTodo':
      return performCreateTodo(mb, params);

    case 'read':
      return performRead(mb, params);

    case 'updateFile':
      return performUpdateFile(mb, params);

    case 'status':
      return performStatus(mb);

    default:
      return {
        llmContent: `Unknown operation: ${params.operation}`,
        returnDisplay: `Error: Unknown operation`,
      };
  }
}

async function performInit(
  mb: ReturnType<typeof getMemoryBank>,
  params: MemoryBankParams,
): Promise<ToolResult> {
  debugLogger.info('[MemoryBankTool] Initializing memory bank...');

  try {
    await mb.initialize({
      force: false,
      projectBrief: params.projectInfo,
    });

    const existingFiles = await mb.getExistingFiles();

    return {
      llmContent: `✅ Memory Bank initialized successfully!

📁 Created files in storage/md/memory-bank/:
${existingFiles.map((f) => `  - ${f}.md`).join('\n')}

📝 Next steps:
1. Fill in projectbrief.md with your project details
2. Update activeContext.md with current focus
3. Use "создай план работ" to create a todo list

💡 Tip: Use "обнови memory bank" to update context during work sessions.`,
      returnDisplay: `Memory Bank initialized (${existingFiles.length} files)`,
    };
  } catch (error) {
    debugLogger.error('[MemoryBankTool] Init failed:', error);
    return {
      llmContent: `❌ Failed to initialize Memory Bank: ${(error as Error).message}`,
      returnDisplay: `Error: Init failed`,
    };
  }
}

async function performUpdate(
  mb: ReturnType<typeof getMemoryBank>,
  params: MemoryBankParams,
): Promise<ToolResult> {
  debugLogger.info('[MemoryBankTool] Updating memory bank...');

  try {
    const { sessionInfo } = params;

    // Update active context if info provided
    if (sessionInfo?.focus || sessionInfo?.nextSteps) {
      await mb.updateActiveContext({
        currentFocus: sessionInfo.focus,
        nextSteps: sessionInfo.nextSteps,
      });
    }

    // Add completed items to progress
    if (sessionInfo?.completed && sessionInfo.completed.length > 0) {
      for (const item of sessionInfo.completed) {
        await mb.addCompletedItem(item);
      }
    }

    return {
      llmContent: `✅ Memory Bank updated!

📝 Updated files:
  - activeContext.md (current focus & next steps)
  - progress.md (completed items)

💡 Session info saved. Use "read memory bank" to see current state.`,
      returnDisplay: `Memory Bank updated`,
    };
  } catch (error) {
    debugLogger.error('[MemoryBankTool] Update failed:', error);
    return {
      llmContent: `❌ Failed to update Memory Bank: ${(error as Error).message}`,
      returnDisplay: `Error: Update failed`,
    };
  }
}

async function performCreateTodo(
  mb: ReturnType<typeof getMemoryBank>,
  params: MemoryBankParams,
): Promise<ToolResult> {
  debugLogger.info('[MemoryBankTool] Creating todo list...');

  try {
    const { tasks = [] } = params;

    // Generate todo content
    const now = new Date().toISOString();
    const lines: string[] = [
      `# TODO List`,
      '',
      `> Created: ${now}`,
      '',
      '## 🔴 High Priority',
      '',
    ];

    // Split tasks by priority (first 3 high, next 3 medium, rest low)
    const highPriority = tasks.slice(0, 3);
    const mediumPriority = tasks.slice(3, 6);
    const lowPriority = tasks.slice(6);

    if (highPriority.length > 0) {
      lines.push(...highPriority.map((t) => `- [ ] ${t}`));
    } else {
      lines.push('<!-- Add high priority tasks -->');
    }

    lines.push('', '## 🟡 Medium Priority', '');

    if (mediumPriority.length > 0) {
      lines.push(...mediumPriority.map((t) => `- [ ] ${t}`));
    } else {
      lines.push('<!-- Add medium priority tasks -->');
    }

    lines.push('', '## 🟢 Low Priority', '');

    if (lowPriority.length > 0) {
      lines.push(...lowPriority.map((t) => `- [ ] ${t}`));
    } else {
      lines.push('<!-- Add low priority tasks -->');
    }

    lines.push('', '---', `*Last Updated: ${now}*`);

    const content = lines.join('\n');

    // Write to todo.md
    await mb.writeFile(MemoryBankFileType.TODO, content, { timestamp: true });

    return {
      llmContent: `✅ Todo list created!

📋 Tasks added: ${tasks.length}

📁 File: storage/md/memory-bank/todo.md

📝 Tasks:
${tasks.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}

💡 Use "обнови memory bank" with completed items to track progress.`,
      returnDisplay: `Todo list created (${tasks.length} tasks)`,
    };
  } catch (error) {
    debugLogger.error('[MemoryBankTool] CreateTodo failed:', error);
    return {
      llmContent: `❌ Failed to create todo list: ${(error as Error).message}`,
      returnDisplay: `Error: CreateTodo failed`,
    };
  }
}

async function performRead(
  mb: ReturnType<typeof getMemoryBank>,
  params: MemoryBankParams,
): Promise<ToolResult> {
  const { file } = params;

  if (!file) {
    // Read all files
    const files = await mb.readAll();
    const context = await mb.getContextForModel();

    return {
      llmContent: context,
      returnDisplay: `Memory Bank loaded (${files.size} files)`,
    };
  }

  // Read specific file
  const content = await mb.readFile(file);

  if (!content) {
    return {
      llmContent: `File "${file}" not found in Memory Bank.`,
      returnDisplay: `File not found: ${file}`,
    };
  }

  return {
    llmContent: content,
    returnDisplay: `Read: ${file}.md`,
  };
}

async function performUpdateFile(
  mb: ReturnType<typeof getMemoryBank>,
  params: MemoryBankParams,
): Promise<ToolResult> {
  const { file, content } = params;

  if (!file || !content) {
    return {
      llmContent:
        'Error: Both "file" and "content" parameters are required for updateFile operation.',
      returnDisplay: 'Error: Missing parameters',
    };
  }

  try {
    await mb.writeFile(file, content, { timestamp: true });

    return {
      llmContent: `✅ File "${file}.md" updated successfully!`,
      returnDisplay: `Updated: ${file}.md`,
    };
  } catch (error) {
    return {
      llmContent: `❌ Failed to update file: ${(error as Error).message}`,
      returnDisplay: `Error: Update failed`,
    };
  }
}

async function performStatus(
  mb: ReturnType<typeof getMemoryBank>,
): Promise<ToolResult> {
  const state = mb.getState();
  const existingFiles = await mb.getExistingFiles();

  const statusIcon = state.initialized ? '✅' : '❌';
  const statusText = state.initialized ? 'Initialized' : 'Not initialized';

  return {
    llmContent: `# Memory Bank Status

**Status:** ${statusIcon} ${statusText}

**Files:** ${existingFiles.length}/8

| File | Status |
|------|--------|
${Object.values(MemoryBankFileType)
  .map((f) => {
    const exists = existingFiles.includes(f);
    return `| ${f}.md | ${exists ? '✅' : '❌'} |`;
  })
  .join('\n')}

**Last Read:** ${state.lastRead || 'Never'}
**Last Write:** ${state.lastWrite || 'Never'}
**Pending Changes:** ${state.hasPendingChanges ? 'Yes' : 'No'}

💡 Use "создай memory bank" to initialize missing files.`,
    returnDisplay: `Status: ${statusText} (${existingFiles.length}/8 files)`,
  };
}

// ============================================================================
// Tool Class
// ============================================================================

export class MemoryBankTool extends BaseDeclarativeTool<
  MemoryBankParams,
  ToolResult
> {
  static readonly Name = 'memory_bank';

  constructor() {
    super(
      MemoryBankTool.Name,
      'MemoryBank',
      memoryBankToolSchemaData.description || 'Memory Bank management tool',
      Kind.Think,
      memoryBankToolSchemaData.parametersJsonSchema as Record<string, unknown>,
    );
  }

  protected createInvocation(params: MemoryBankParams) {
    return new MemoryBankToolInvocation(params);
  }
}

// ============================================================================
// Tool Invocation Class
// ============================================================================

export class MemoryBankToolInvocation extends BaseToolInvocation<
  MemoryBankParams,
  ToolResult
> {
  constructor(params: MemoryBankParams) {
    super(params);
  }

  override getDescription(): string {
    return `Memory Bank: ${this.params.operation}`;
  }

  override async execute(
    _signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
    _shellExecutionConfig?: ShellExecutionConfig,
  ): Promise<ToolResult> {
    return performOperation(this.params);
  }
}

// ============================================================================
// Exports
// ============================================================================

export default MemoryBankTool;
