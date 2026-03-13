/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory Tools Plugin
 *
 * Built-in plugin providing memory/context management tools.
 */

import type { PluginDefinition } from '../../types.js';
import { MemoryTool } from './save-memory/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  SAVE_MEMORY: 'save_memory',
} as const;

/**
 * Memory Tools Plugin Definition
 */
const memoryToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'memory-tools',
    name: 'Memory Tools',
    version: '1.0.0',
    description: 'Memory and context management tools: save_memory',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'memory', 'context'],
    enabledByDefault: true,
  },

  // Unified tools array - tool classes that don't need Config
  tools: [MemoryTool],

  // Tool aliases - short names that resolve to canonical tool names
  // Includes common model hallucinations
  aliases: [
    {
      alias: 'memory',
      canonicalName: 'save_memory',
      description: 'Save to memory',
    },
    {
      alias: 'Memory',
      canonicalName: 'save_memory',
      description: 'Save to memory',
    },
    {
      alias: 'save',
      canonicalName: 'save_memory',
      description: 'Save memory/context',
    },
    {
      alias: 'save_memory',
      canonicalName: 'save_memory',
      description: 'Save to memory',
    },
    {
      alias: 'save-memory',
      canonicalName: 'save_memory',
      description: 'Save to memory',
    },
    {
      alias: 'SaveMemory',
      canonicalName: 'save_memory',
      description: 'Save to memory',
    },
    {
      alias: 'Save-Memory',
      canonicalName: 'save_memory',
      description: 'Save to memory',
    },
    {
      alias: 'remember',
      canonicalName: 'save_memory',
      description: 'Remember information',
    },
    {
      alias: 'memoryTool',
      canonicalName: 'save_memory',
      description: 'Memory tool',
    },
    {
      alias: 'MemoryTool',
      canonicalName: 'save_memory',
      description: 'Memory tool',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Memory tool (save_memory) for persistent context across sessions. Stores information in ~/.ollama-code/OLLAMA_MEMORY.md. Use to remember important facts, user preferences, project details.',
    },
    {
      priority: 2,
      content:
        'MEMORY USAGE: Save project-specific information (architecture, patterns, conventions), user preferences, important decisions, learned patterns. Memory persists across all sessions.',
    },
    {
      priority: 3,
      content:
        'Read memory at start of session to recall previous context. Update when learning new patterns or making important decisions. Keep entries concise and well-organized.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: false,
    canAccessNetwork: false,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Memory Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Memory Tools plugin enabled');
    },
  },
};

export default memoryToolsPlugin;

// Also export tool classes and utilities for direct imports
export {
  MemoryTool,
  setOllamaMdFilename,
  getCurrentOllamaMdFilename,
  getAllOllamaMdFilenames,
  OLLAMA_CONFIG_DIR,
  OLLAMA_CODE_CONFIG_DIR,
  DEFAULT_CONTEXT_FILENAME,
} from './save-memory/index.js';
