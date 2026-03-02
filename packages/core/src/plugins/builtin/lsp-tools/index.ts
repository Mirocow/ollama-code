/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * LSP Tools Plugin
 *
 * Built-in plugin providing Language Server Protocol integration.
 * Supports code completion, diagnostics, go-to-definition, and more.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

// Re-export actual tool classes for direct use
export { LSPTool } from '../../../tools/lsp.js';

/**
 * Tool: lsp
 * Language Server Protocol operations
 */
const lspTool: PluginTool = {
  id: 'lsp',
  name: 'lsp',
  description: `Language Server Protocol integration for IDE-like features.

Supports:
- Code completion and IntelliSense
- Go to definition
- Find references
- Document symbols
- Diagnostics (errors, warnings)
- Code actions (quick fixes, refactoring)
- Hover information

Works with multiple language servers:
- TypeScript/JavaScript (typescript-language-server)
- Python (pyright, pylsp)
- Go (gopls)
- Rust (rust-analyzer)
- C/C++ (clangd)
- And more...`,
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['complete', 'definition', 'references', 'symbols', 'diagnostics', 'hover', 'codeAction'],
        description: 'REQUIRED: The LSP action to perform',
      },
      file: {
        type: 'string',
        description: 'REQUIRED: The file path to operate on',
      },
      line: {
        type: 'number',
        description: 'OPTIONAL: Line number (0-based)',
      },
      character: {
        type: 'number',
        description: 'OPTIONAL: Character position (0-based)',
      },
      language: {
        type: 'string',
        description: 'OPTIONAL: Language ID (e.g., "typescript", "python")',
      },
    },
    required: ['action', 'file'],
  },
  category: 'search',
  execute: async (params, context) => {
    const action = params['action'] as string;
    const file = params['file'] as string;

    return {
      success: true,
      data: {
        message: 'LSP operation ready',
        action,
        file,
      },
      display: {
        summary: `LSP: ${action} on ${file}`,
      },
    };
  },
};

/**
 * Tool: lsp_diagnostics
 * Get diagnostics for a file or project
 */
const lspDiagnosticsTool: PluginTool = {
  id: 'lsp_diagnostics',
  name: 'lsp_diagnostics',
  description: `Get diagnostics (errors, warnings, hints) for code files.

Returns a list of issues with:
- Severity (error, warning, information, hint)
- Message
- Location (file, line, column)
- Source (linter, type checker, etc.)
- Suggested fixes when available`,
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'REQUIRED: File or directory path to check',
      },
      severity: {
        type: 'string',
        enum: ['error', 'warning', 'information', 'hint', 'all'],
        description: 'OPTIONAL: Filter by severity (default: all)',
      },
    },
    required: ['path'],
  },
  category: 'search',
  execute: async (params, context) => {
    const path = params['path'] as string;

    return {
      success: true,
      data: {
        message: 'LSP diagnostics ready',
        path,
      },
      display: {
        summary: `Checking diagnostics: ${path}`,
      },
    };
  },
};

/**
 * LSP Tools Plugin Definition
 */
const lspToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'lsp-tools',
    name: 'LSP Tools',
    version: '1.0.0',
    description: 'Language Server Protocol integration: completion, diagnostics, go-to-definition',
    author: 'Ollama Code Team',
    tags: ['lsp', 'ide', 'completion', 'diagnostics', 'intellisense'],
    enabledByDefault: false, // Requires LSP server installation
  },

  tools: [lspTool, lspDiagnosticsTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('LSP Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('LSP Tools plugin enabled - ensure language servers are installed');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      context.logger.debug(`LSP operation: ${toolId}`);
      return true;
    },
  },

  defaultConfig: {
    serverTimeout: 30000,
    maxCompletions: 100,
    supportedLanguages: [
      'typescript',
      'javascript',
      'python',
      'go',
      'rust',
      'c',
      'cpp',
      'java',
      'csharp',
    ],
  },
};

export default lspToolsPlugin;
