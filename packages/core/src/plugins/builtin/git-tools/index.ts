/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Git Tools Plugin
 *
 * Built-in plugin providing advanced Git operations and workflow management.
 */

import type { PluginDefinition } from '../../types.js';
import { GitAdvancedTool } from './git-advanced/index.js';
import { GitWorkflowTool } from './git-workflow/index.js';
import { GitSmartTool } from './git-smart/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  GIT_ADVANCED: 'git_advanced',
  GIT_SMART: 'git_smart',
  GIT_WORKFLOW: 'git_workflow',
} as const;

/**
 * Git Tools Plugin Definition
 */
const gitToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'git-tools',
    name: 'Git Tools',
    version: '1.1.0',
    description: 'Advanced Git operations and workflow management tools',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'git', 'version-control', 'workflow'],
    enabledByDefault: true,
  },

  // Unified tools array - tool classes that don't need Config
  tools: [GitAdvancedTool, GitWorkflowTool, GitSmartTool],

  // Tool aliases - short names that resolve to canonical tool names
  // Includes all git operation aliases and common model hallucinations
  aliases: [
    // ═══════════════════════════════════════════════════════════════════
    // git_workflow aliases (basic git operations)
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'git_commit',
      canonicalName: 'git_workflow',
      description: 'Git commit',
    },
    {
      alias: 'commit',
      canonicalName: 'git_workflow',
      description: 'Git commit',
    },
    {
      alias: 'git_push',
      canonicalName: 'git_workflow',
      description: 'Git push',
    },
    { alias: 'push', canonicalName: 'git_workflow', description: 'Git push' },
    {
      alias: 'git_pull',
      canonicalName: 'git_workflow',
      description: 'Git pull',
    },
    { alias: 'pull', canonicalName: 'git_workflow', description: 'Git pull' },
    {
      alias: 'git_status',
      canonicalName: 'git_workflow',
      description: 'Git status',
    },
    {
      alias: 'mr',
      canonicalName: 'git_workflow',
      description: 'Merge request',
    },
    { alias: 'pr', canonicalName: 'git_workflow', description: 'Pull request' },
    {
      alias: 'merge_request',
      canonicalName: 'git_workflow',
      description: 'Merge request',
    },
    {
      alias: 'pull_request',
      canonicalName: 'git_workflow',
      description: 'Pull request',
    },
    {
      alias: 'create_mr',
      canonicalName: 'git_workflow',
      description: 'Create merge request',
    },
    {
      alias: 'create_pr',
      canonicalName: 'git_workflow',
      description: 'Create pull request',
    },
    {
      alias: 'create_merge',
      canonicalName: 'git_workflow',
      description: 'Create merge',
    },
    {
      alias: 'git_mr',
      canonicalName: 'git_workflow',
      description: 'Git merge request',
    },
    {
      alias: 'git_pr',
      canonicalName: 'git_workflow',
      description: 'Git pull request',
    },
    {
      alias: 'git_clone',
      canonicalName: 'git_workflow',
      description: 'Git clone',
    },
    {
      alias: 'clone',
      canonicalName: 'git_workflow',
      description: 'Clone repository',
    },
    {
      alias: 'git_fetch',
      canonicalName: 'git_workflow',
      description: 'Git fetch',
    },
    { alias: 'git_log', canonicalName: 'git_workflow', description: 'Git log' },
    {
      alias: 'git_diff',
      canonicalName: 'git_workflow',
      description: 'Git diff',
    },
    {
      alias: 'git_switch',
      canonicalName: 'git_workflow',
      description: 'Git switch',
    },
    {
      alias: 'git_checkout',
      canonicalName: 'git_workflow',
      description: 'Git checkout',
    },
    // ═══════════════════════════════════════════════════════════════════
    // git_advanced aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'git_stash',
      canonicalName: 'git_advanced',
      description: 'Git stash',
    },
    {
      alias: 'stash',
      canonicalName: 'git_advanced',
      description: 'Stash changes',
    },
    {
      alias: 'git_cherry_pick',
      canonicalName: 'git_advanced',
      description: 'Cherry pick',
    },
    {
      alias: 'cherry_pick',
      canonicalName: 'git_advanced',
      description: 'Cherry pick commits',
    },
    {
      alias: 'git_rebase',
      canonicalName: 'git_advanced',
      description: 'Git rebase',
    },
    { alias: 'rebase', canonicalName: 'git_advanced', description: 'Rebase' },
    {
      alias: 'git_bisect',
      canonicalName: 'git_advanced',
      description: 'Git bisect',
    },
    { alias: 'bisect', canonicalName: 'git_advanced', description: 'Bisect' },
    {
      alias: 'git_blame',
      canonicalName: 'git_advanced',
      description: 'Git blame',
    },
    { alias: 'blame', canonicalName: 'git_advanced', description: 'Blame' },
    {
      alias: 'git_branch',
      canonicalName: 'git_advanced',
      description: 'Git branch',
    },
    {
      alias: 'git_remote',
      canonicalName: 'git_advanced',
      description: 'Git remote',
    },
    // ═══════════════════════════════════════════════════════════════════
    // git_smart aliases (intelligent analysis)
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'diff_smart',
      canonicalName: 'git_smart',
      description: 'Smart diff with context',
    },
    {
      alias: 'blame_analysis',
      canonicalName: 'git_smart',
      description: 'Code authorship analysis',
    },
    {
      alias: 'history_search',
      canonicalName: 'git_smart',
      description: 'Search commit history',
    },
    {
      alias: 'file_history',
      canonicalName: 'git_smart',
      description: 'File change history',
    },
    {
      alias: 'author_stats',
      canonicalName: 'git_smart',
      description: 'Contributor statistics',
    },
    {
      alias: 'hotspots',
      canonicalName: 'git_smart',
      description: 'Code hotspot analysis',
    },
    // ═══════════════════════════════════════════════════════════════════
    // Generic git aliases (redirect to git_workflow)
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'git',
      canonicalName: 'git_workflow',
      description: 'Git operations',
    },
    {
      alias: 'git_dev',
      canonicalName: 'git_workflow',
      description: 'Git development',
    },
    {
      alias: 'git_tool',
      canonicalName: 'git_workflow',
      description: 'Git tool',
    },
    {
      alias: 'git_cmd',
      canonicalName: 'git_workflow',
      description: 'Git command',
    },
    {
      alias: 'version_control',
      canonicalName: 'git_workflow',
      description: 'Version control',
    },
    {
      alias: 'vcs',
      canonicalName: 'git_workflow',
      description: 'Version control',
    },
    {
      alias: 'scm',
      canonicalName: 'git_workflow',
      description: 'Source control',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Git tools: git_workflow for common ops (commit, push, pull), git_advanced for complex ops (rebase, stash, cherry-pick), git_smart for analysis (diff, blame, history search).',
    },
    {
      priority: 2,
      content:
        'GIT WORKFLOW: Use for daily operations - status, add, commit, push, pull, branch, checkout, merge. Handles PR/MR creation. Always check git status before operations.',
    },
    {
      priority: 3,
      content:
        'GIT ADVANCED: Use for rebase (interactive), stash operations, cherry-pick commits, bisect bugs. Be careful with force push and rebase on shared branches.',
    },
    {
      priority: 4,
      content:
        'GIT SMART: Use for intelligent analysis - diff_smart for contextual diffs, blame_analysis for code authorship, history_search for finding commits, hotspots for finding refactoring candidates.',
    },
    {
      priority: 5,
      content:
        'Commit messages: Use conventional commits format (feat:, fix:, docs:, etc.). Write clear, concise messages. Reference issues/PRs when relevant.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: true,
    canWriteFiles: false,
    canExecuteCommands: true,
    canAccessNetwork: true,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Git Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Git Tools plugin enabled');
    },
  },
};

export default gitToolsPlugin;

export { GitAdvancedTool } from './git-advanced/index.js';
export { GitWorkflowTool } from './git-workflow/index.js';
export { GitSmartTool } from './git-smart/index.js';
