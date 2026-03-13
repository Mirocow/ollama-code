/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Search Tools Plugin
 *
 * Built-in plugin providing search operations.
 */

import type { PluginDefinition } from '../../types.js';
import { GrepTool } from './grep/index.js';
import { RipGrepTool } from './ripGrep/index.js';
import { WebFetchTool } from './web-fetch/index.js';
import * as webSearch from './web-search/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  GREP_SEARCH: 'grep_search',
  WEB_SEARCH: 'web_search',
  WEB_FETCH: 'web_fetch',
} as const;

/**
 * Search Tools Plugin Definition
 */
const searchToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'search-tools',
    name: 'Search Tools',
    version: '1.0.0',
    description: 'Search operations: grep, ripgrep, web fetch, web search',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'search', 'grep', 'web'],
    enabledByDefault: true,
  },

  // Unified tools array - tool classes (some need Config, some don't)
  // The plugin registry will try to instantiate without config first,
  // then with config if the tool requires it
  tools: [GrepTool, RipGrepTool, WebFetchTool, webSearch.WebSearchTool],

  // Tool aliases - short names that resolve to canonical tool names
  // Includes common model hallucinations and variations
  aliases: [
    // ═══════════════════════════════════════════════════════════════════
    // grep_search aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'grep',
      canonicalName: 'grep_search',
      description: 'Search for text patterns',
    },
    {
      alias: 'Grep',
      canonicalName: 'grep_search',
      description: 'Search for text patterns',
    },
    {
      alias: 'GREP',
      canonicalName: 'grep_search',
      description: 'Search for text patterns',
    },
    {
      alias: 'search',
      canonicalName: 'grep_search',
      description: 'Search in files',
    },
    {
      alias: 'find',
      canonicalName: 'grep_search',
      description: 'Find text in files',
    },
    {
      alias: 'grep_search',
      canonicalName: 'grep_search',
      description: 'Search with grep',
    },
    {
      alias: 'search_content',
      canonicalName: 'grep_search',
      description: 'Search file contents',
    },
    {
      alias: 'search_text',
      canonicalName: 'grep_search',
      description: 'Search text in files',
    },
    {
      alias: 'rg',
      canonicalName: 'grep_search',
      description: 'Ripgrep search',
    },
    // Legacy tool name (was ToolNamesMigration)
    {
      alias: 'search_file_content',
      canonicalName: 'grep_search',
      description: 'Search file contents (legacy name)',
    },
    // Legacy display name (was ToolDisplayNamesMigration)
    {
      alias: 'SearchFiles',
      canonicalName: 'grep_search',
      description: 'Search files (legacy display name)',
    },
    // ═══════════════════════════════════════════════════════════════════
    // web_search aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'websearch',
      canonicalName: 'web_search',
      description: 'Search the web',
    },
    { alias: 'web', canonicalName: 'web_search', description: 'Web search' },
    {
      alias: 'web_search',
      canonicalName: 'web_search',
      description: 'Search the web',
    },
    {
      alias: 'search_web',
      canonicalName: 'web_search',
      description: 'Search the internet',
    },
    {
      alias: 'google',
      canonicalName: 'web_search',
      description: 'Google search',
    },
    // ═══════════════════════════════════════════════════════════════════
    // web_fetch aliases (including common model hallucinations)
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'webfetch',
      canonicalName: 'web_fetch',
      description: 'Fetch URL content',
    },
    {
      alias: 'WebFetch',
      canonicalName: 'web_fetch',
      description: 'Fetch URL content',
    },
    {
      alias: 'web-fetch',
      canonicalName: 'web_fetch',
      description: 'Fetch URL content',
    },
    {
      alias: 'Web-Fetch',
      canonicalName: 'web_fetch',
      description: 'Fetch URL content',
    },
    {
      alias: 'fetch',
      canonicalName: 'web_fetch',
      description: 'Fetch web content',
    },
    { alias: 'url', canonicalName: 'web_fetch', description: 'Fetch URL' },
    {
      alias: 'web_fetch',
      canonicalName: 'web_fetch',
      description: 'Fetch URL content',
    },
    {
      alias: 'curl',
      canonicalName: 'web_fetch',
      description: 'Fetch web content',
    },
    {
      alias: 'wget',
      canonicalName: 'web_fetch',
      description: 'Download web content',
    },
    { alias: 'http', canonicalName: 'web_fetch', description: 'HTTP request' },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Search tools: grep_search searches FILE CONTENTS for text patterns - use when you need to find code/text INSIDE files. Use list_directory or glob to LIST or FIND files by name - NOT grep_search. grep_search with pattern ".*" is WRONG for listing files.',
    },
    {
      priority: 2,
      content:
        'GREP_SEARCH: Searches inside files for regex patterns. Use for: finding function definitions, searching for imports, locating error messages, finding TODOs. Does NOT list files - use list_directory or glob for that. Supports -i for case-insensitive, -n for line numbers.',
    },
    {
      priority: 3,
      content:
        'WEB_SEARCH: Your primary tool for finding information! Use AUTOMATICALLY when: (1) user asks about facts, prices, rates, news, weather, (2) you don\'t know the answer, (3) information may have changed, (4) user asks "what is", "how to", "where", "when", "who", (5) you need current documentation. NEVER say "I don\'t know" or "I don\'t have real-time data" - USE web_search instead!',
    },
    {
      priority: 4,
      content:
        'WEB_SEARCH examples: "курс юаня" → web_search. "what is React 19" → web_search. "how to fix npm error" → web_search. "who won World Cup" → web_search. "кто президент Франции" → web_search. Any question about facts or current state → web_search FIRST, then answer.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: true,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: true,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Search Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Search Tools plugin enabled');
    },
  },
};

export default searchToolsPlugin;

// Also export tool classes for direct imports
export { GrepTool } from './grep/index.js';
export { RipGrepTool } from './ripGrep/index.js';
export { WebFetchTool } from './web-fetch/index.js';
export * from './web-search/index.js';
