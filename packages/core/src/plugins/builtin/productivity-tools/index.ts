/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Productivity Tools Plugin
 *
 * Built-in plugin providing productivity enhancement tools.
 */

import type { PluginDefinition } from '../../types.js';
import { TodoWriteTool } from './todo-write/index.js';
import { ExitPlanModeTool } from './exit-plan-mode/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  TODO_WRITE: 'todo_write',
  EXIT_PLAN_MODE: 'exit_plan_mode',
} as const;

/**
 * Productivity Tools Plugin Definition
 */
const productivityToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'productivity-tools',
    name: 'Productivity Tools',
    version: '1.0.0',
    description: 'Productivity enhancement tools: todo_write, exit_plan_mode',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'productivity'],
    enabledByDefault: true,
  },

  // Unified tools array - tool classes that don't need Config
  tools: [TodoWriteTool, ExitPlanModeTool],

  // Tool aliases - short names that resolve to canonical tool names
  aliases: [
    // ═══════════════════════════════════════════════════════════════════
    // todo_write aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'todo',
      canonicalName: 'todo_write',
      description: 'Write todo list',
    },
    {
      alias: 'todos',
      canonicalName: 'todo_write',
      description: 'Manage todo items',
    },
    {
      alias: 'task_list',
      canonicalName: 'todo_write',
      description: 'Task list management',
    },
    {
      alias: 'task',
      canonicalName: 'todo_write',
      description: 'Task list management',
    },
    // ═══════════════════════════════════════════════════════════════════
    // exit_plan_mode aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'exit_plan',
      canonicalName: 'exit_plan_mode',
      description: 'Exit plan mode',
    },
    {
      alias: 'plan_done',
      canonicalName: 'exit_plan_mode',
      description: 'Finish planning',
    },
    {
      alias: 'exit_plan_mode',
      canonicalName: 'exit_plan_mode',
      description: 'Exit plan mode',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Productivity tools: todo_write for task management, exit_plan_mode to signal planning completion. Use todo_write to track progress on complex tasks.',
    },
    {
      priority: 2,
      content:
        'TODO_WRITE: Create structured todo lists with status (pending/in_progress/completed) and priority (high/medium/low). Update status as work progresses. Great for complex multi-step tasks.',
    },
    {
      priority: 3,
      content:
        'EXIT_PLAN_MODE: Call when planning phase is complete and ready to execute. Signals transition from analysis to implementation.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: false,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: false,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Productivity Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Productivity Tools plugin enabled');
    },
  },
};

export default productivityToolsPlugin;

// Also export tool classes for direct imports
export { TodoWriteTool } from './todo-write/index.js';
export { ExitPlanModeTool } from './exit-plan-mode/index.js';
