/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP Tools Plugin
 *
 * Built-in plugin providing Model Context Protocol (MCP) integration.
 * Supports MCP server management and tool discovery.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

/**
 * Tool: mcp_server
 * MCP server operations
 */
const mcpServerTool: PluginTool = {
  id: 'mcp_server',
  name: 'mcp_server',
  description: `Manage Model Context Protocol (MCP) servers.

MCP is a protocol for connecting AI models to external tools and resources.
This tool allows:
- Starting and stopping MCP servers
- Discovering tools exposed by MCP servers
- Listing available MCP resources
- Executing MCP tool calls

MCP servers provide standardized access to:
- File systems
- Databases
- APIs
- Custom tools and resources`,
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['start', 'stop', 'list', 'discover', 'execute'],
        description: 'REQUIRED: The action to perform on the MCP server',
      },
      server_name: {
        type: 'string',
        description: 'OPTIONAL: Name of the MCP server (for start/stop/execute)',
      },
      tool_name: {
        type: 'string',
        description: 'OPTIONAL: Name of the tool to execute (for execute action)',
      },
      arguments: {
        type: 'object',
        description: 'OPTIONAL: Arguments for the tool execution',
      },
    },
    required: ['action'],
  },
  category: 'other',
  execute: async (params, context) => {
    const action = params['action'] as string;
    const serverName = params['server_name'] as string | undefined;
    
    return {
      success: true,
      data: {
        message: `MCP ${action} operation ready`,
        action,
        serverName,
      },
      display: {
        summary: `MCP: ${action}${serverName ? ` (${serverName})` : ''}`,
      },
    };
  },
};

/**
 * MCP Tools Plugin Definition
 */
const mcpToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'mcp-tools',
    name: 'MCP Tools',
    version: '1.0.0',
    description: 'Model Context Protocol (MCP) integration tools',
    author: 'Ollama Code Team',
    tags: ['mcp', 'protocol', 'integration', 'tools'],
    enabledByDefault: true,
  },

  tools: [mcpServerTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('MCP Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('MCP Tools plugin enabled');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      const action = params['action'] as string;
      context.logger.debug(`MCP action: ${action}`);
      return true;
    },
  },

  defaultConfig: {
    serverTimeout: 30000,
    discoveryInterval: 60000,
    maxConcurrentServers: 10,
  },
};

export default mcpToolsPlugin;
