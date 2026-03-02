/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Plan Tools Plugin
 *
 * Built-in plugin providing planning and workflow management tools.
 * Supports plan mode, todo management, and workflow control.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

// Re-export actual tool classes for direct use
export { ExitPlanModeTool } from '../../../tools/exitPlanMode.js';
export { TodoWriteTool } from '../../../tools/todoWrite.js';

/**
 * Tool: exit_plan_mode
 * Exit planning mode and present plan to user
 */
const exitPlanModeTool: PluginTool = {
  id: 'exit_plan_mode',
  name: 'exit_plan_mode',
  description: `Exit planning mode and present the completed plan to the user.

This tool signals that the planning phase is complete and the assistant
has prepared a comprehensive plan for the user to review.

The plan should include:
- Clear objectives and goals
- Step-by-step implementation plan
- File changes required
- Potential risks and considerations
- Estimated time and complexity`,
  parameters: {
    type: 'object',
    properties: {
      plan: {
        type: 'string',
        description: 'REQUIRED: The complete plan to present to the user',
      },
      files_to_modify: {
        type: 'array',
        items: { type: 'string' },
        description: 'OPTIONAL: List of files that will be modified',
      },
      files_to_create: {
        type: 'array',
        items: { type: 'string' },
        description: 'OPTIONAL: List of files that will be created',
      },
      estimated_complexity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'OPTIONAL: Estimated complexity of the plan',
      },
    },
    required: ['plan'],
  },
  category: 'other',
  execute: async (params, context) => {
    const plan = params['plan'] as string;

    return {
      success: true,
      data: {
        message: 'Plan mode exited successfully',
        plan,
      },
      display: {
        summary: 'Plan presented for review',
      },
    };
  },
};

/**
 * Tool: todo_write
 * Write and manage todo items
 */
const todoWriteTool: PluginTool = {
  id: 'todo_write',
  name: 'todo_write',
  description: `Create, update, and manage todo items for tracking progress.

Use this tool to:
- Track tasks and subtasks
- Mark items as complete
- Update task status
- Organize work into priorities

Todo items help maintain context and progress across long conversations.`,
  parameters: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        description: 'REQUIRED: Array of todo items',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            content: { type: 'string', description: 'Task description' },
            status: { 
              type: 'string', 
              enum: ['pending', 'in_progress', 'completed'],
              description: 'Task status' 
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Task priority'
            },
          },
          required: ['id', 'content', 'status', 'priority'],
        },
      },
    },
    required: ['todos'],
  },
  category: 'other',
  execute: async (params, context) => {
    const todos = params['todos'] as Array<{
      id: string;
      content: string;
      status: string;
      priority: string;
    }>;

    return {
      success: true,
      data: {
        message: 'Todos updated',
        count: todos.length,
        completed: todos.filter(t => t.status === 'completed').length,
        pending: todos.filter(t => t.status === 'pending').length,
        inProgress: todos.filter(t => t.status === 'in_progress').length,
      },
      display: {
        summary: `Updated ${todos.length} todos`,
      },
    };
  },
};

/**
 * Tool: workflow_status
 * Get current workflow status
 */
const workflowStatusTool: PluginTool = {
  id: 'workflow_status',
  name: 'workflow_status',
  description: `Get the current workflow and progress status.

Returns:
- Current phase (planning, executing, reviewing)
- Active tasks
- Completed tasks
- Blocked items (if any)
- Overall progress percentage`,
  parameters: {
    type: 'object',
    properties: {
      detailed: {
        type: 'boolean',
        description: 'OPTIONAL: Include detailed breakdown (default: false)',
      },
    },
  },
  category: 'read',
  execute: async (params, context) => {
    const detailed = params['detailed'] as boolean || false;

    return {
      success: true,
      data: {
        message: 'Workflow status retrieved',
        detailed,
      },
      display: {
        summary: 'Current workflow status',
      },
    };
  },
};

/**
 * Plan Tools Plugin Definition
 */
const planToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'plan-tools',
    name: 'Plan Tools',
    version: '1.0.0',
    description: 'Planning and workflow management: exit_plan_mode, todo_write, workflow_status',
    author: 'Ollama Code Team',
    tags: ['plan', 'todo', 'workflow', 'management', 'organization'],
    enabledByDefault: true,
  },

  tools: [exitPlanModeTool, todoWriteTool, workflowStatusTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Plan Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Plan Tools plugin enabled');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      context.logger.debug(`Plan operation: ${toolId}`);
      return true;
    },
  },

  defaultConfig: {
    maxTodos: 50,
    autoArchiveCompleted: true,
    prioritySorting: true,
  },
};

export default planToolsPlugin;
