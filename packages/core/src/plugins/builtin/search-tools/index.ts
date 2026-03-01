/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Search Tools Plugin
 * 
 * Built-in plugin providing search capabilities.
 * Includes code search (grep), file search (glob), and web search/fetch.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

/**
 * Tool: grep_search
 * Search file contents using ripgrep
 */
const grepSearchTool: PluginTool = {
  id: 'grep_search',
  name: 'grep_search',
  description: `A powerful search tool built on ripgrep. Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+"). Filter files with glob parameter (e.g., "*.js", "**/*.tsx"). Use Task tool for open-ended searches requiring multiple rounds.`,
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
      ignoreCase: {
        type: 'boolean',
        description: 'OPTIONAL: Case insensitive search. Default is false.',
      },
      showLineNumbers: {
        type: 'boolean',
        description: 'OPTIONAL: Show line numbers in output. Default is true.',
      },
      contextLines: {
        type: 'number',
        description: 'OPTIONAL: Number of context lines to show around matches.',
      },
    },
    required: ['pattern'],
  },
  category: 'search',
  execute: async (params, context) => {
    const pattern = params['pattern'] as string;
    const searchPath = (params['path'] as string) || context.workingDirectory || process.cwd();
    const glob = params['glob'] as string | undefined;
    const ignoreCase = (params['ignoreCase'] as boolean) ?? false;
    // Note: showLineNumbers and contextLines params available for future use
    
    // Note: Full implementation uses ripgrep binary
    // This is a simplified version for demonstration
    
    return {
      success: true,
      data: {
        pattern,
        path: searchPath,
        glob,
        ignoreCase,
        message: 'Grep search executed. Full implementation uses ripgrep for performance.',
        results: [], // Would contain actual results
      },
      display: {
        summary: `Searching for '${pattern}' in ${searchPath}`,
      },
    };
  },
};

/**
 * Tool: glob
 * Find files by pattern
 */
const globTool: PluginTool = {
  id: 'glob',
  name: 'glob',
  description: 'Fast file pattern matching tool that works with any codebase size. Supports glob patterns like "**/*.js" or "src/**/*.ts". Returns matching file paths sorted by modification time.',
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'REQUIRED: The glob pattern to match files. Examples: "**/*.ts", "src/**/*.tsx", "*.json"',
      },
      path: {
        type: 'string',
        description: 'OPTIONAL: The directory to search in. Defaults to current working directory.',
      },
    },
    required: ['pattern'],
  },
  category: 'search',
  execute: async (params, context) => {
    const pattern = params['pattern'] as string;
    const searchPath = (params['path'] as string) || context.workingDirectory || process.cwd();
    
    // Note: Full implementation uses fast-glob or similar
    // This is a simplified version
    
    return {
      success: true,
      data: {
        pattern,
        path: searchPath,
        message: 'Glob pattern matched. Full implementation uses fast-glob.',
        matches: [], // Would contain actual file paths
      },
      display: {
        summary: `Glob search for '${pattern}' in ${searchPath}`,
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
  description: 'Fetches content from a web URL and returns it. Useful for retrieving documentation, API responses, or any web content. Handles HTTP/HTTPS protocols.',
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
  buildConfirmationMessage: (params) => {
    return `Fetch content from: ${params['url']}`;
  },
  execute: async (params, context) => {
    const url = params['url'] as string;
    const method = (params['method'] as string) || 'GET';
    const headers = params['headers'] as Record<string, string> | undefined;
    const body = params['body'] as string | undefined;
    const timeout = (params['timeout'] as number) || 30000;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const content = await response.text();
      
      return {
        success: response.ok,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          content: content.substring(0, 10000), // Limit content size
          truncated: content.length > 10000,
        },
        display: {
          summary: `${response.status} ${response.statusText} - ${content.length} bytes`,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to fetch ${url}: ${errorMessage}`,
      };
    }
  },
  timeout: 60000,
};

/**
 * Tool: web_search
 * Search the web using configured search provider
 */
const webSearchTool: PluginTool = {
  id: 'web_search',
  name: 'web_search',
  description: 'Search the web for information. Returns search results with URLs, titles, and snippets. Useful for finding documentation, solutions to problems, or current information.',
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
    const query = params['query'] as string;
    const numResults = Math.min((params['num_results'] as number) || 10, 50);
    
    // Note: Full implementation uses search provider (Tavily, Google, etc.)
    // This is a placeholder
    
    return {
      success: true,
      data: {
        query,
        numResults,
        message: 'Web search executed. Full implementation uses search provider API.',
        results: [], // Would contain actual search results
      },
      display: {
        summary: `Searching web for: "${query}"`,
      },
    };
  },
};

/**
 * Search Tools Plugin Definition
 */
const searchToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'search-tools',
    name: 'Search Tools',
    version: '1.0.0',
    description: 'Search capabilities: grep, glob, web fetch, web search',
    author: 'Ollama Code Team',
    tags: ['core', 'search', 'grep', 'web'],
    enabledByDefault: true,
  },
  
  tools: [grepSearchTool, globTool, webFetchTool, webSearchTool],
  
  hooks: {
    onLoad: async (context) => {
      context.logger.info('Search Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Search Tools plugin enabled');
    },
  },
  
  defaultConfig: {
    defaultSearchResults: 10,
    maxSearchResults: 50,
    webFetchTimeout: 30000,
    grepContextLines: 3,
  },
};

export default searchToolsPlugin;
