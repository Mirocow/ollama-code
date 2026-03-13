/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Agent Tools Plugin
 *
 * Built-in plugin providing agent-related tools.
 */

import type { PluginDefinition } from '../../types.js';
import { SkillTool } from './skill/index.js';
import { TaskTool } from './task/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  TASK: 'task',
  SKILL: 'skill',
} as const;

/**
 * Agent Tools Plugin Definition
 */
const agentToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'agent-tools',
    name: 'Agent Tools',
    version: '1.0.0',
    description: 'Agent-related tools: skill, task',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'agent'],
    enabledByDefault: true,
  },

  // Unified tools array - tool classes that need Config
  // PluginRegistry will instantiate them with Config
  tools: [SkillTool, TaskTool],

  // Tool aliases - short names that resolve to canonical tool names
  aliases: [
    // ═══════════════════════════════════════════════════════════════════
    // task aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'agent',
      canonicalName: 'task',
      description: 'Spawn subagent task',
    },
    {
      alias: 'subagent',
      canonicalName: 'task',
      description: 'Create subagent',
    },
    { alias: 'task', canonicalName: 'task', description: 'Task execution' },
    {
      alias: 'delegate',
      canonicalName: 'task',
      description: 'Delegate to subagent',
    },
    // ═══════════════════════════════════════════════════════════════════
    // skill aliases
    // ═══════════════════════════════════════════════════════════════════
    { alias: 'skills', canonicalName: 'skill', description: 'Use skill' },
    { alias: 'skill', canonicalName: 'skill', description: 'Invoke skill' },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Agent tools for task delegation: task spawns subagents for parallel/autonomous work, skill invokes specialized skills. Use task for complex multi-step work, skill for domain-specific operations.',
    },
    {
      priority: 2,
      content:
        'TASK tool: Spawns subagents with specific goals. Provide clear instructions, context, and timeout. Subagent works autonomously and reports results. Great for parallel tasks.',
    },
    {
      priority: 3,
      content:
        'SKILL tool: Invokes predefined skills (code review, testing, deployment, etc.). Skills are specialized workflows with domain knowledge. Check available skills with skill list.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: true,
    canAccessNetwork: true,
    canUseStorage: true,
    canUsePrompts: true,
    canSpawnAgents: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Agent Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Agent Tools plugin enabled');
    },
  },
};

export default agentToolsPlugin;

// Also export tool classes for direct imports
export { SkillTool } from './skill/index.js';
export { TaskTool } from './task/index.js';
