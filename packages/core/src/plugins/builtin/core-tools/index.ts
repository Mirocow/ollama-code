/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Core Tools Plugin
 * 
 * Built-in plugin providing essential tools for Ollama Code.
 * This plugin demonstrates the plugin system architecture and provides
 * a template for creating custom plugins.
 */

import type { PluginDefinition, PluginTool, PluginContext } from '../../types.js';

/**
 * Tool: echo
 * Simple echo tool for testing the plugin system
 */
const echoTool: PluginTool = {
  id: 'echo',
  name: 'echo',
  description: 'Echo back the input message. Useful for testing the plugin system.',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to echo back',
      },
    },
    required: ['message'],
  },
  category: 'other',
  execute: async (params) => {
    const message = params['message'] as string;
    return {
      success: true,
      data: message,
      display: {
        summary: `Echo: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      },
    };
  },
};

/**
 * Tool: timestamp
 * Returns the current timestamp in various formats
 */
const timestampTool: PluginTool = {
  id: 'timestamp',
  name: 'timestamp',
  description: 'Get the current timestamp in various formats (ISO, Unix, locale)',
  parameters: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['iso', 'unix', 'locale', 'all'],
        description: 'The format for the timestamp',
        default: 'all',
      },
    },
  },
  category: 'other',
  execute: async (params) => {
    const format = (params['format'] as string) || 'all';
    const now = new Date();
    
    const result: Record<string, string | number> = {};
    
    if (format === 'iso' || format === 'all') {
      result['iso'] = now.toISOString();
    }
    if (format === 'unix' || format === 'all') {
      result['unix'] = Math.floor(now.getTime() / 1000);
    }
    if (format === 'locale' || format === 'all') {
      result['locale'] = now.toLocaleString();
    }
    
    return {
      success: true,
      data: result,
      display: {
        summary: `Current time: ${result['iso'] || result['locale']}`,
      },
    };
  },
};

/**
 * Tool: env
 * Get environment variable value
 */
const envTool: PluginTool = {
  id: 'env',
  name: 'get_env',
  description: 'Get the value of an environment variable. Use with caution for sensitive data.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the environment variable',
      },
      defaultValue: {
        type: 'string',
        description: 'Default value if the variable is not set',
      },
    },
    required: ['name'],
  },
  category: 'read',
  execute: async (params) => {
    const name = params['name'] as string;
    const defaultValue = params['defaultValue'] as string | undefined;
    
    const value = process.env[name] ?? defaultValue;
    
    if (value === undefined) {
      return {
        success: false,
        error: `Environment variable '${name}' is not set and no default was provided`,
      };
    }
    
    // Mask sensitive variables
    const sensitivePatterns = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'CREDENTIAL'];
    const isSensitive = sensitivePatterns.some(pattern => 
      name.toUpperCase().includes(pattern)
    );
    
    return {
      success: true,
      data: isSensitive ? '*** (value hidden for security)' : value,
      display: {
        summary: isSensitive 
          ? `${name} = *** (hidden)`
          : `${name} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`,
      },
    };
  },
};

/**
 * Plugin definition
 */
const coreToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'core-tools',
    name: 'Core Tools',
    version: '1.0.0',
    description: 'Built-in core tools for file operations, shell execution, and more',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'tools'],
    enabledByDefault: true,
  },
  
  tools: [echoTool, timestampTool, envTool],
  
  hooks: {
    onLoad: async (context: PluginContext) => {
      context.logger.info('Core Tools plugin loaded');
    },
    
    onEnable: async (context: PluginContext) => {
      context.logger.info('Core Tools plugin enabled');
    },
    
    onDisable: async (context: PluginContext) => {
      context.logger.info('Core Tools plugin disabled');
    },
    
    onBeforeToolExecute: async (toolId, params, context) => {
      context.logger.debug(`Executing tool: ${toolId}`);
      return true; // Allow execution
    },
    
    onAfterToolExecute: async (toolId, params, result, context) => {
      context.logger.debug(`Tool ${toolId} completed: ${result.success ? 'success' : 'failed'}`);
    },
  },
  
  defaultConfig: {
    maxEchoLength: 10000,
    envWhitelist: ['PATH', 'HOME', 'USER', 'SHELL', 'NODE_VERSION'],
  },
};

export default coreToolsPlugin;
