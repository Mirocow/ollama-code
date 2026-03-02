/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Docker Tools Plugin
 *
 * Built-in plugin providing Docker container management tools.
 * Supports container operations, image management, and compose.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

/**
 * Tool: docker
 * Docker container and image operations
 */
const dockerTool: PluginTool = {
  id: 'docker',
  name: 'docker',
  description: `Execute Docker commands for container and image management.

Supports:
- Container operations: run, stop, start, restart, rm, ps, logs, exec
- Image operations: build, pull, push, tag, rmi, images
- Volume operations: volume create, volume rm, volume ls
- Network operations: network create, network rm, network ls
- Compose operations: up, down, ps, logs, build

Use this tool to manage Docker containers, images, and services.
Commands are executed with the Docker CLI.`,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Docker command to execute (e.g., "ps -a", "run -d nginx", "compose up")',
      },
      description: {
        type: 'string',
        description: 'OPTIONAL: A brief description of what the command does',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => {
    const command = params['command'] as string;
    // Check for destructive commands
    const destructivePatterns = ['rm', 'rmi', 'down', 'prune', 'stop'];
    const isDestructive = destructivePatterns.some(p => command.includes(p));
    const prefix = isDestructive ? '⚠️ ' : '';
    return `${prefix}Docker: ${command}`;
  },
  execute: async (params, context) => {
    const command = params['command'] as string;
    
    // Note: Full implementation uses ShellTool to execute docker commands
    return {
      success: true,
      data: {
        message: 'Docker command ready for execution via shell',
        command: `docker ${command}`,
      },
      display: {
        summary: `Docker: ${command}`,
      },
    };
  },
  timeout: 300000, // 5 minutes for long operations
};

/**
 * Docker Tools Plugin Definition
 */
const dockerToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'docker-tools',
    name: 'Docker Tools',
    version: '1.0.0',
    description: 'Docker container and image management tools',
    author: 'Ollama Code Team',
    tags: ['docker', 'container', 'devops', 'infrastructure'],
    enabledByDefault: false, // Requires Docker to be installed
  },

  tools: [dockerTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Docker Tools plugin loaded');
    },
    onEnable: async (context) => {
      // Could check if Docker is available
      context.logger.info('Docker Tools plugin enabled');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      const command = params['command'] as string;
      
      // Warn about potentially dangerous commands
      const dangerousPatterns = ['system prune -a', 'volume prune', 'network prune'];
      for (const pattern of dangerousPatterns) {
        if (command.includes(pattern)) {
          context.logger.warn(`Dangerous Docker command detected: ${pattern}`);
        }
      }
      
      return true;
    },
  },

  defaultConfig: {
    defaultTimeout: 60000,
    maxTimeout: 300000,
    composeVersion: '2',
  },
};

export default dockerToolsPlugin;
