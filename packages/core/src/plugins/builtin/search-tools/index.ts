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
        'WEB_SEARCH IS MANDATORY! When user asks about: prices, rates, costs, news, weather, sports, current events, stock markets, exchange rates, product prices, or says "почем", "сколько", "каков", "what is", "how much" → YOU MUST call web_search IMMEDIATELY. NEVER say "I don\'t know" or "I don\'t have access to real-time data". ALWAYS search first!',
    },
    {
      priority: 2,
      content:
        'web_search examples: "почем яйца" → web_search. "курс доллара" → web_search. "what is the weather" → web_search. "how much does X cost" → web_search. "кто выиграл" → web_search. User asking about ANY current data → web_search FIRST, then answer with results!',
    },
    {
      priority: 3,
      content:
        'Search tools: grep_search searches FILE CONTENTS for text patterns - use when you need to find code/text INSIDE files. Use list_directory or glob to LIST or FIND files by name - NOT grep_search. grep_search with pattern ".*" is WRONG for listing files.',
    },
    {
      priority: 4,
      content:
        'GREP_SEARCH: Searches inside files for regex patterns. Use for: finding function definitions, searching for imports, locating error messages, finding TODOs. Does NOT list files - use list_directory or glob for that. Supports -i for case-insensitive, -n for line numbers.',
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
