/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Database Tools Plugin
 *
 * Built-in plugin providing database and container management tools.
 */

import type { PluginDefinition } from '../../types.js';
import { databaseTool } from './database/index.js';
import { redisTool } from './redis/index.js';
import { dockerTool } from './docker/index.js';
import { dockerProjectTool } from './docker-project/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  DATABASE: 'database',
  REDIS: 'redis',
  DOCKER: 'docker',
  DOCKER_PROJECT: 'docker_project',
} as const;

/**
 * Database Tools Plugin Definition
 */
const databaseToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'database-tools',
    name: 'Database Tools',
    version: '1.0.0',
    description: 'Database and container management tools',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'database', 'docker', 'redis'],
    enabledByDefault: true,
  },

  // Unified tools array - tool classes that don't need Config
  tools: [databaseTool, redisTool, dockerTool, dockerProjectTool],

  // Tool aliases - short names that resolve to canonical tool names
  aliases: [
    // docker aliases
    {
      alias: 'container',
      canonicalName: 'docker',
      description: 'Docker container management',
    },
    {
      alias: 'docker_cli',
      canonicalName: 'docker',
      description: 'Docker CLI operations',
    },
    // docker_project aliases
    {
      alias: 'dp',
      canonicalName: 'docker_project',
      description: 'Docker project management',
    },
    {
      alias: 'dockerize',
      canonicalName: 'docker_project',
      description: 'Create Docker configuration',
    },
    // redis aliases
    {
      alias: 'redis_cli',
      canonicalName: 'redis',
      description: 'Redis CLI operations',
    },
    {
      alias: 'cache_cli',
      canonicalName: 'redis',
      description: 'Redis cache operations',
    },
    // database aliases
    {
      alias: 'db',
      canonicalName: 'database',
      description: 'Database operations',
    },
    { alias: 'sql', canonicalName: 'database', description: 'SQL operations' },
    {
      alias: 'query',
      canonicalName: 'database',
      description: 'Database query',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Database tools for data management: docker for container operations, redis for cache/key-value, database for SQL databases. Execute queries and manage data infrastructure.',
    },
    {
      priority: 2,
      content:
        'DOCKER: Container management - run, stop, list, exec, logs. Use for application containers, databases in containers. Check container status before operations.',
    },
    {
      priority: 3,
      content:
        'REDIS: In-memory data store. Use for caching, sessions, queues. Commands: SET, GET, HSET, LPUSH, etc. Connection via redis://host:port.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: false,
    canWriteFiles: false,
    canExecuteCommands: true,
    canAccessNetwork: true,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Database Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Database Tools plugin enabled');
    },
  },
};

export default databaseToolsPlugin;

export { databaseTool } from './database/index.js';
export { redisTool } from './redis/index.js';
export { dockerTool } from './docker/index.js';
export { dockerProjectTool } from './docker-project/index.js';
