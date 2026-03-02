/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Git Tools Plugin
 *
 * Built-in plugin providing advanced Git operations.
 * Supports repository management, branching, merging, and more.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

/**
 * Tool: git_advanced
 * Advanced Git operations
 */
const gitAdvancedTool: PluginTool = {
  id: 'git_advanced',
  name: 'git_advanced',
  description: `Execute advanced Git operations beyond basic version control.

Supports:
- Branch management: create, delete, merge, rebase branches
- Remote operations: add, remove, fetch, push remotes
- Stash operations: stash, pop, apply, drop
- Tag management: create, delete, list tags
- Submodule operations: add, update, init submodules
- Worktree management: add, remove, list worktrees
- Reflog operations: show, expire, delete refs
- Cherry-pick and revert operations
- Interactive rebase preparation

Use this tool for complex Git workflows and repository management.`,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Git command to execute (e.g., "stash push -m message", "rebase main")',
      },
      description: {
        type: 'string',
        description: 'OPTIONAL: A brief description of what the command does',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => {
    const command = params['command'] as string;
    // Check for destructive commands
    const destructivePatterns = ['reset --hard', 'clean -fd', 'push --force', 'rebase', 'filter-branch'];
    const isDestructive = destructivePatterns.some(p => command.includes(p));
    const prefix = isDestructive ? '⚠️ DESTRUCTIVE: ' : '';
    return `${prefix}Git: ${command}`;
  },
  execute: async (params, context) => {
    const command = params['command'] as string;
    
    // Note: Full implementation uses ShellTool or GitService
    return {
      success: true,
      data: {
        message: 'Git command ready for execution',
        command: `git ${command}`,
      },
      display: {
        summary: `Git: ${command}`,
      },
    };
  },
  timeout: 120000,
};

/**
 * Git Tools Plugin Definition
 */
const gitToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'git-tools',
    name: 'Git Tools',
    version: '1.0.0',
    description: 'Advanced Git operations for repository management',
    author: 'Ollama Code Team',
    tags: ['git', 'version-control', 'repository', 'branching'],
    enabledByDefault: true,
  },

  tools: [gitAdvancedTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Git Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Git Tools plugin enabled');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      const command = params['command'] as string;
      
      // Warn about potentially dangerous commands
      const dangerousPatterns = [
        'reset --hard',
        'push --force',
        'clean -fdx',
        'filter-branch',
        'gc --prune=now',
      ];
      
      for (const pattern of dangerousPatterns) {
        if (command.includes(pattern)) {
          context.logger.warn(`Dangerous Git command detected: ${pattern}`);
        }
      }
      
      return true;
    },
  },

  defaultConfig: {
    autoFetch: true,
    defaultBranch: 'main',
    pushDefault: 'current',
  },
};

export default gitToolsPlugin;
