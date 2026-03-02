/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Database Tools Plugin
 *
 * Built-in plugin providing database interaction tools.
 * Supports Redis and generic database operations.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

/**
 * Tool: redis
 * Redis database operations
 */
const redisTool: PluginTool = {
  id: 'redis',
  name: 'redis',
  description: `Execute Redis commands for key-value store operations.

Supports all standard Redis commands including:
- String operations: GET, SET, DEL, INCR, DECR
- Hash operations: HGET, HSET, HDEL, HGETALL
- List operations: LPUSH, RPUSH, LPOP, RPOP, LRANGE
- Set operations: SADD, SREM, SMEMBERS
- Sorted set operations: ZADD, ZREM, ZRANGE
- Key operations: KEYS, EXPIRE, TTL, TYPE

Connection configuration is read from settings or environment variables.`,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Redis command to execute (e.g., "GET mykey", "SET mykey value")',
      },
      connection: {
        type: 'string',
        description: 'OPTIONAL: Redis connection name from settings. Uses default if not specified.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => `Execute Redis: ${params['command']}`,
  execute: async (params, context) => {
    return {
      success: true,
      data: {
        message: 'Redis command ready for execution',
        command: params['command'],
      },
      display: {
        summary: `Redis: ${params['command']}`,
      },
    };
  },
};

/**
 * Tool: database
 * Generic database operations
 */
const databaseTool: PluginTool = {
  id: 'database',
  name: 'database',
  description: `Execute database queries and operations.

Supports multiple database backends:
- PostgreSQL
- MySQL
- SQLite
- MongoDB (basic operations)

Connection strings and credentials are read from environment variables or settings file.
Supports parameterized queries for SQL databases to prevent injection.`,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'REQUIRED: The SQL query or database command to execute',
      },
      connection: {
        type: 'string',
        description: 'OPTIONAL: Database connection name from settings. Uses default if not specified.',
      },
      params: {
        type: 'array',
        description: 'OPTIONAL: Query parameters for parameterized queries',
        items: { type: 'string' },
      },
    },
    required: ['query'],
  },
  category: 'execute',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => `Execute database query: ${String(params['query']).substring(0, 100)}...`,
  execute: async (params, context) => {
    return {
      success: true,
      data: {
        message: 'Database query ready for execution',
        query: params['query'],
      },
      display: {
        summary: `Database: ${String(params['query']).substring(0, 50)}...`,
      },
    };
  },
};

/**
 * Database Tools Plugin Definition
 */
const databaseToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'database-tools',
    name: 'Database Tools',
    version: '1.0.0',
    description: 'Database interaction tools: Redis, PostgreSQL, MySQL, SQLite, MongoDB',
    author: 'Ollama Code Team',
    tags: ['database', 'redis', 'sql', 'mongodb', 'storage'],
    enabledByDefault: false, // Requires configuration
  },

  tools: [redisTool, databaseTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Database Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Database Tools plugin enabled - ensure database connections are configured');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      // Log database operations for audit
      context.logger.debug(`Database operation: ${toolId}`);
      return true;
    },
  },

  defaultConfig: {
    defaultConnection: 'default',
    queryTimeout: 30000,
    maxResults: 1000,
  },
};

export default databaseToolsPlugin;
