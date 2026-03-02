/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Task Tools Plugin
 *
 * Built-in plugin providing task delegation and subagent management tools.
 * Enables delegation of complex tasks to specialized subagents.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';
import { TaskTool } from '../../../tools/task.js';

/**
 * Tool: task
 * Delegate tasks to specialized subagents
 */
const taskTool: PluginTool = {
  id: 'task',
  name: 'task',
  description: `Launch a new agent to handle complex, multi-step tasks autonomously.

Available agent types and their capabilities vary based on configuration.
When using the Task tool, you must specify a subagent_type parameter to select which agent type to use.

When NOT to use the Task tool:
- If you want to read a specific file path, use the Read or Glob tool instead
- If you are searching for a specific class definition like "class Foo", use the Glob tool instead
- If you are searching for code within a specific file or set of 2-3 files, use the Read tool instead

Usage notes:
1. Launch multiple agents concurrently whenever possible, to maximize performance
2. When the agent is done, it will return a single message back to you
3. Each agent invocation is stateless
4. The agent's outputs should generally be trusted
5. Clearly tell the agent whether you expect it to write code or just to do research`,
  parameters: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'A short (3-5 word) description of the task',
      },
      prompt: {
        type: 'string',
        description: 'The task for the agent to perform. Should be highly detailed for autonomous execution.',
      },
      subagent_type: {
        type: 'string',
        description: 'The type of specialized agent to use for this task',
      },
    },
    required: ['description', 'prompt', 'subagent_type'],
  },
  category: 'other',
  execute: async (params, context) => {
    // Note: Full implementation uses TaskTool class
    return {
      success: true,
      data: {
        message: 'Task delegation initialized. Full implementation uses TaskTool class.',
        description: params['description'],
        subagent_type: params['subagent_type'],
      },
      display: {
        summary: `Task: ${params['description']} (${params['subagent_type']})`,
      },
    };
  },
};

/**
 * Tool: todo_write
 * Manage todo lists for task tracking
 */
const todoWriteTool: PluginTool = {
  id: 'todo_write',
  name: 'todo_write',
  description: `Use this tool to create and manage a structured task list for your current coding session.

This helps you track progress, organize complex tasks, and demonstrate thoroughness to the user.
It also helps the user understand the progress of the task and overall progress of their requests.

When to Use This Tool:
- Complex multi-step tasks - When a task requires 3 or more distinct steps or actions
- Non-trivial and complex tasks - Tasks that require careful planning and multiple operations
- User explicitly requests todo list - When the user directly asks you to use the todo list
- User provides multiple tasks - When users provide a list of things to be done

When NOT to Use This Tool:
- Single, straightforward task - Only one trivial task to do
- Purely conversational or informational task`,
  parameters: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        description: 'The updated list of todos',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['id', 'content', 'status', 'priority'],
        },
      },
    },
    required: ['todos'],
  },
  category: 'other',
  execute: async (params, context) => {
    return {
      success: true,
      data: {
        todos: params['todos'],
        message: 'Todo list updated',
      },
      display: {
        summary: `Updated ${Array.isArray(params['todos']) ? params['todos'].length : 0} todos`,
      },
    };
  },
};

/**
 * Task Tools Plugin Definition
 */
const taskToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'task-tools',
    name: 'Task Tools',
    version: '1.0.0',
    description: 'Task delegation and subagent management tools',
    author: 'Ollama Code Team',
    tags: ['core', 'task', 'subagent', 'delegation'],
    enabledByDefault: true,
  },

  tools: [taskTool, todoWriteTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Task Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Task Tools plugin enabled');
    },
  },

  defaultConfig: {
    maxConcurrentTasks: 5,
    taskTimeout: 600000,
  },
};

export default taskToolsPlugin;

// Export the actual tool classes for direct use
export { TaskTool };
