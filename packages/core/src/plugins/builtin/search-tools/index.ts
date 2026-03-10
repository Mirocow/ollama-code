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
  
  // Unified tools array - tool classes that don't need Config
  tools: [
    GrepTool,
    RipGrepTool,
    WebFetchTool,
    webSearch.WebSearchTool,
  ],
  
  // Tool aliases - short names that resolve to canonical tool names
  // Includes common model hallucinations and variations
  aliases: [
    // ═══════════════════════════════════════════════════════════════════
    // grep_search aliases
    // ═══════════════════════════════════════════════════════════════════
    { alias: 'grep', canonicalName: 'grep_search', description: 'Search for text patterns' },
    { alias: 'Grep', canonicalName: 'grep_search', description: 'Search for text patterns' },
    { alias: 'GREP', canonicalName: 'grep_search', description: 'Search for text patterns' },
    { alias: 'search', canonicalName: 'grep_search', description: 'Search in files' },
    { alias: 'find', canonicalName: 'grep_search', description: 'Find text in files' },
    { alias: 'grep_search', canonicalName: 'grep_search', description: 'Search with grep' },
    { alias: 'search_content', canonicalName: 'grep_search', description: 'Search file contents' },
    { alias: 'search_text', canonicalName: 'grep_search', description: 'Search text in files' },
    { alias: 'rg', canonicalName: 'grep_search', description: 'Ripgrep search' },
    // ═══════════════════════════════════════════════════════════════════
    // web_search aliases
    // ═══════════════════════════════════════════════════════════════════
    { alias: 'websearch', canonicalName: 'web_search', description: 'Search the web' },
    { alias: 'web', canonicalName: 'web_search', description: 'Web search' },
    { alias: 'web_search', canonicalName: 'web_search', description: 'Search the web' },
    { alias: 'search_web', canonicalName: 'web_search', description: 'Search the internet' },
    { alias: 'google', canonicalName: 'web_search', description: 'Google search' },
    // ═══════════════════════════════════════════════════════════════════
    // web_fetch aliases (including common model hallucinations)
    // ═══════════════════════════════════════════════════════════════════
    { alias: 'webfetch', canonicalName: 'web_fetch', description: 'Fetch URL content' },
    { alias: 'WebFetch', canonicalName: 'web_fetch', description: 'Fetch URL content' },
    { alias: 'web-fetch', canonicalName: 'web_fetch', description: 'Fetch URL content' },
    { alias: 'Web-Fetch', canonicalName: 'web_fetch', description: 'Fetch URL content' },
    { alias: 'fetch', canonicalName: 'web_fetch', description: 'Fetch web content' },
    { alias: 'url', canonicalName: 'web_fetch', description: 'Fetch URL' },
    { alias: 'web_fetch', canonicalName: 'web_fetch', description: 'Fetch URL content' },
    { alias: 'curl', canonicalName: 'web_fetch', description: 'Fetch web content' },
    { alias: 'wget', canonicalName: 'web_fetch', description: 'Download web content' },
    { alias: 'http', canonicalName: 'web_fetch', description: 'HTTP request' },
  ],
  
  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content: 'Search tools for finding content: grep_search searches file contents with regex, web_search searches the internet, web_fetch retrieves web page content. Use grep for code searches, web_search for current information, web_fetch for specific URLs.',
    },
    {
      priority: 2,
      content: 'GREP: Supports regex patterns. Use -i for case-insensitive, -n for line numbers, -C for context. Searches recursively by default. For large codebases, use glob pattern to narrow search scope.',
    },
    {
      priority: 3,
      content: 'WEB_SEARCH: Use for current events, documentation, error messages, API references. Returns snippets with URLs. Follow up with web_fetch for full content if needed.',
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
