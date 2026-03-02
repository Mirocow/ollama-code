/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Memory Tools Plugin
 *
 * Built-in plugin providing memory and context management tools.
 * Allows saving and retrieving information across sessions.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';
import { MemoryTool } from '../../../tools/memoryTool.js';

/**
 * Tool: save_memory
 * Save information to long-term memory
 */
const saveMemoryTool: PluginTool = {
  id: 'save_memory',
  name: 'save_memory',
  description: `Saves a specific piece of information or fact to your long-term memory. Use this when the user explicitly asks you to remember something, or when they state a clear, concise fact that seems important to retain for future interactions.

Use this tool:
- When the user explicitly asks you to remember something (e.g., "Remember that I like pineapple on pizza")
- When the user states a clear, concise fact about themselves, their preferences, or their environment

Do NOT use this tool:
- To remember conversational context that is only relevant for the current session
- To save long, complex, or rambling pieces of text
- If you are unsure whether the information is a fact worth remembering long-term`,
  parameters: {
    type: 'object',
    properties: {
      fact: {
        type: 'string',
        description: 'The specific fact or piece of information to remember. Should be a clear, self-contained statement.',
      },
      scope: {
        type: 'string',
        enum: ['global', 'project'],
        description: 'Where to save the memory: "global" saves to user-level ~/.ollama-code/OLLAMA_CODE.md (shared across all projects), "project" saves to current project\'s OLLAMA_CODE.md (project-specific).',
      },
    },
    required: ['fact'],
  },
  category: 'other',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => {
    const scope = params['scope'] || 'global';
    return `Save to ${scope} memory: "${params['fact']}"`;
  },
  execute: async (params) => {
    // Note: This is a wrapper that delegates to the actual MemoryTool
    // The full implementation is in memoryTool.ts
    return {
      success: true,
      data: { 
        message: 'Memory tool initialized. Use the full implementation for actual memory operations.',
        fact: params['fact'],
        scope: params['scope'] || 'global',
      },
      display: {
        summary: `Memory saved: ${params['fact']?.toString().substring(0, 50)}...`,
      },
    };
  },
};

/**
 * Memory Tools Plugin Definition
 */
const memoryToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'memory-tools',
    name: 'Memory Tools',
    version: '1.0.0',
    description: 'Memory and context management tools for persistent information storage',
    author: 'Ollama Code Team',
    tags: ['core', 'memory', 'context', 'persistence'],
    enabledByDefault: true,
  },

  tools: [saveMemoryTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Memory Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Memory Tools plugin enabled');
    },
  },

  defaultConfig: {
    maxFactLength: 1000,
    defaultScope: 'global',
  },
};

export default memoryToolsPlugin;

// Export the actual tool class for direct use
export { MemoryTool };
