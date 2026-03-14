/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory Tools Plugin
 *
 * Built-in plugin providing memory/context management tools for USER-REQUESTED memory saves.
 * For AI-internal storage, use storage-tools plugin (model_storage).
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
    description: 'User-facing memory tool for saving facts and preferences. For AI internal data, use model_storage.',
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
        'save_memory: Use ONLY when user EXPLICITLY asks to remember something ("Remember...", "Save this...", "Don\'t forget..."). Stores facts/preferences in Markdown. Requires user confirmation. For AI internal data (roadmaps, knowledge, session state), use model_storage instead.',
    },
    {
      priority: 2,
      content:
        'MEMORY TOOL CHOICE: User says "Remember X" → save_memory. AI needs to store roadmap/knowledge/session data → model_storage. save_memory is user-facing (Markdown, confirmation required). model_storage is AI-internal (JSON, automatic, TTL support).',
    },
    {
      priority: 3,
      content:
        'save_memory stores in OLLAMA_MEMORY.md (Markdown format, separate from OLLAMA.md project context). User can edit manually. Use "global" scope for all projects (~/.ollama-code/OLLAMA_MEMORY.md), "project" scope for current project only (./OLLAMA_MEMORY.md). Keep facts concise and specific.',
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
  MEMORY_FILENAME,
} from './save-memory/index.js';
