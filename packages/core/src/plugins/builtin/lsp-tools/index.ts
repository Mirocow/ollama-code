/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LSP Tools Plugin
 * 
 * Built-in plugin providing Language Server Protocol integration.
 */

import type { PluginDefinition } from '../../types.js';
import { LspTool } from './lsp/index.js';

/**
 * LSP Tools Plugin Definition
 */
const lspToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'lsp-tools',
    name: 'LSP Tools',
    version: '1.0.0',
    description: 'Language Server Protocol integration for code intelligence',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'lsp', 'language-server'],
    enabledByDefault: true,
  },
  
  // Unified tools array - tool classes that don't need Config
  tools: [
    LspTool,
  ],
  
  // Tool aliases - short names that resolve to canonical tool names
  aliases: [
    { alias: 'language_server', canonicalName: 'lsp', description: 'Language Server Protocol' },
    { alias: 'intellisense', canonicalName: 'lsp', description: 'Code intelligence' },
  ],
  
  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content: 'LSP (Language Server Protocol) tool for code intelligence. Provides go-to-definition, find-references, completion, hover info. Works with language servers for TypeScript, Python, Go, etc.',
    },
    {
      priority: 2,
      content: 'LSP USAGE: Requires language server installed. Supports common operations: definition, references, completion, hover. Check if LSP server is available for the language.',
    },
  ],
  
  // Plugin capabilities
  capabilities: {
    canReadFiles: true,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: false,
    canUseStorage: true,
    canUsePrompts: true,
  },
  
  hooks: {
    onLoad: async (context) => {
      context.logger.info('LSP Tools plugin loaded');
    },
    
    onEnable: async (context) => {
      context.logger.info('LSP Tools plugin enabled');
    },
  },
};

export default lspToolsPlugin;

export { LspTool } from './lsp/index.js';
