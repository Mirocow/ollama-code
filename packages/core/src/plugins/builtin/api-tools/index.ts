/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * API Tools Plugin
 *
 * Built-in plugin providing API testing tools.
 */

import type { PluginDefinition } from '../../types.js';
import { ApiTesterTool } from './api-tester/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  API_TESTER: 'api_tester',
} as const;

/**
 * API Tools Plugin Definition
 */
const apiToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'api-tools',
    name: 'API Tools',
    version: '1.0.0',
    description: 'API testing and debugging tools',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'api', 'testing'],
    enabledByDefault: true,
  },

  // Unified tools array - tool classes that don't need Config
  tools: [ApiTesterTool],

  // Tool aliases - short names that resolve to canonical tool names
  aliases: [
    {
      alias: 'api',
      canonicalName: 'api_tester',
      description: 'Test API endpoints',
    },
    {
      alias: 'http',
      canonicalName: 'api_tester',
      description: 'Make HTTP requests',
    },
    {
      alias: 'request',
      canonicalName: 'api_tester',
      description: 'Send HTTP request',
    },
    {
      alias: 'rest',
      canonicalName: 'api_tester',
      description: 'REST API testing',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'API testing tool for HTTP requests. Supports GET, POST, PUT, DELETE, PATCH. Use for testing REST APIs, webhooks, external services.',
    },
    {
      priority: 2,
      content:
        'API_TESTER: Provide URL, method, headers, body. Returns response status, headers, body. Use for debugging APIs, testing endpoints, checking responses.',
    },
    {
      priority: 3,
      content:
        'Best practices: Check URL format, set appropriate Content-Type header, handle errors gracefully. For authentication, use headers or query params.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: false,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: true,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('API Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('API Tools plugin enabled');
    },
  },
};

export default apiToolsPlugin;

export { ApiTesterTool } from './api-tester/index.js';
