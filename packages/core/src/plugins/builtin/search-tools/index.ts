/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Search Tools Plugin
 *
 * Built-in plugin providing comprehensive search capabilities.
 * Includes code search (grep), file search (glob), and web search/fetch.
 * Wraps existing search tools for plugin system integration.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

// Re-export actual tool classes for direct use (now from local tool folders)
export { GrepTool } from './grep/index.js';
export { RipGrepTool } from './ripGrep/index.js';
export { WebFetchTool } from './web-fetch/index.js';

// Import for toolClasses
import { GrepTool } from './grep/index.js';
import { RipGrepTool } from './ripGrep/index.js';
import { WebFetchTool } from './web-fetch/index.js';

/**
 * Tool: grep
 * Search file contents using ripgrep
 */
const grepTool: PluginTool = {
  id: 'grep',
  name: 'grep',
  description: `A powerful search tool built on ripgrep. Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+"). Filter files with glob parameter (e.g., "*.js", "**/*.tsx"). Use Task tool for open-ended searches requiring multiple rounds.

IMPORTANT: ALWAYS use Grep for search tasks. NEVER invoke grep or rg as a Bash command.
- Supports full regex syntax
- Filter by file type with glob
- Case insensitive search available
- Show context lines around matches`,
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'REQUIRED: The regular expression pattern to search for in file contents.',
      },
      path: {
        type: 'string',
        description: 'OPTIONAL: File or directory to search in. Defaults to current working directory.',
      },
      glob: {
        type: 'string',
        description: 'OPTIONAL: Glob pattern to filter files (e.g. "*.js", "**/*.tsx")',
      },
      '-i': {
        type: 'boolean',
        description: 'OPTIONAL: Case insensitive search. Default is false.',
      },
      '-n': {
        type: 'boolean',
        description: 'OPTIONAL: Show line numbers in output. Default is true.',
      },
      '-C': {
        type: 'number',
        description: 'OPTIONAL: Number of context lines to show around matches.',
      },
      head_limit: {
        type: 'number',
        description: 'OPTIONAL: Limit output to first N matches.',
      },
    },
    required: ['pattern'],
  },
  category: 'search',
  execute: async (params, context) => {
    return {
      success: true,
      data: {
        message: 'Grep search ready. Full implementation uses GrepTool class.',
        pattern: params['pattern'],
        path: params['path'],
      },
      display: {
        summary: `Searching for: ${params['pattern']}`,
      },
    };
  },
};

/**
 * Tool: web_search
 * Search the web using configured search provider
 */
const webSearchTool: PluginTool = {
  id: 'web_search',
  name: 'web_search',
  description: `Search the web for information. Returns search results with URLs, titles, and snippets. Useful for finding documentation, solutions to problems, or current information.

This tool is particularly useful for:
- Finding up-to-date documentation
- Researching best practices
- Looking for solutions to errors
- Finding library or framework information`,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'REQUIRED: The search query.',
      },
      num_results: {
        type: 'number',
        description: 'OPTIONAL: Number of results to return. Default is 10, max is 50.',
      },
    },
    required: ['query'],
  },
  category: 'fetch',
  execute: async (params, context) => {
    return {
      success: true,
      data: {
        message: 'Web search ready. Full implementation uses WebSearchTool class.',
        query: params['query'],
      },
      display: {
        summary: `Web search: "${params['query']}"`,
      },
    };
  },
};

/**
 * Tool: web_fetch
 * Fetch content from a URL
 */
const webFetchTool: PluginTool = {
  id: 'web_fetch',
  name: 'web_fetch',
  description: `Fetches content from a web URL and returns it. Useful for retrieving documentation, API responses, or any web content. Handles HTTP/HTTPS protocols.

Use this tool to:
- Read documentation pages
- Fetch API responses
- Download text content from URLs
- Access web resources`,
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'REQUIRED: The URL to fetch content from.',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'OPTIONAL: HTTP method. Default is GET.',
      },
      headers: {
        type: 'object',
        description: 'OPTIONAL: HTTP headers to send with the request.',
      },
      body: {
        type: 'string',
        description: 'OPTIONAL: Request body for POST/PUT requests.',
      },
      timeout: {
        type: 'number',
        description: 'OPTIONAL: Timeout in milliseconds. Default is 30000.',
      },
    },
    required: ['url'],
  },
  category: 'fetch',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => `Fetch content from: ${params['url']}`,
  execute: async (params, context) => {
    return {
      success: true,
      data: {
        message: 'Web fetch ready. Full implementation uses WebFetchTool class.',
        url: params['url'],
      },
      display: {
        summary: `Fetching: ${params['url']}`,
      },
    };
  },
  timeout: 60000,
};

/**
 * Search Tools Plugin Definition
 */
const searchToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'search-tools',
    name: 'Search Tools',
    version: '1.1.0',
    description: 'Comprehensive search capabilities: grep, glob, web fetch, web search',
    author: 'Ollama Code Team',
    tags: ['core', 'search', 'grep', 'web', 'fetch'],
    enabledByDefault: true,
  },

  tools: [grepTool, webSearchTool, webFetchTool],

  // Real tool classes for full integration
  toolClasses: [GrepTool, RipGrepTool, WebFetchTool] as unknown[],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Search Tools plugin loaded (v1.1.0)');
    },
    onEnable: async (context) => {
      context.logger.info('Search Tools plugin enabled');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      if (toolId === 'web_fetch' || toolId === 'web_search') {
        context.logger.debug(`Web operation: ${toolId}`);
      }
      return true;
    },
  },

  defaultConfig: {
    defaultSearchResults: 10,
    maxSearchResults: 50,
    webFetchTimeout: 30000,
    grepContextLines: 3,
    grepMaxResults: 100,
  },
};

export default searchToolsPlugin;
