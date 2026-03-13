/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SSH Tools Plugin
 *
 * Built-in plugin providing SSH connectivity for remote server management.
 * Includes tools for SSH connections and SSH host profile management.
 */

import type { PluginDefinition } from '../../types.js';
import type { Config } from '../../../config/config.js';
import { SSHTool } from './ssh.js';
import {
  SSHAddHostTool,
  SSHListHostsTool,
  SSHRemoveHostTool,
} from './ssh-hosts.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  SSH_CONNECT: 'ssh_connect',
  SSH_ADD_HOST: 'ssh_add_host',
  SSH_LIST_HOSTS: 'ssh_list_hosts',
  SSH_REMOVE_HOST: 'ssh_remove_host',
} as const;

/**
 * SSH Tools Plugin Definition
 */
const sshToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'ssh-tools',
    name: 'SSH Tools',
    version: '1.4.0',
    description:
      'SSH connectivity for remote server command execution with profile management',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'ssh', 'remote', 'network'],
    enabledByDefault: true,
  },

  // Unified tools array - factory functions for tools that need Config
  tools: [
    (config: unknown) => new SSHTool(config as Config),
    (config: unknown) => new SSHAddHostTool(config as Config),
    (config: unknown) => new SSHListHostsTool(config as Config),
    (config: unknown) => new SSHRemoveHostTool(config as Config),
  ],

  // Tool aliases - short names that resolve to canonical tool names
  // Includes common model hallucinations
  aliases: [
    // ═══════════════════════════════════════════════════════════════════
    // ssh_connect aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'ssh',
      canonicalName: 'ssh_connect',
      description: 'Connect to remote server via SSH',
    },
    {
      alias: 'ssh_connect',
      canonicalName: 'ssh_connect',
      description: 'SSH connection',
    },
    {
      alias: 'ssh_dev',
      canonicalName: 'ssh_connect',
      description: 'SSH development',
    },
    {
      alias: 'remote',
      canonicalName: 'ssh_connect',
      description: 'Remote server connection',
    },
    {
      alias: 'remote_shell',
      canonicalName: 'ssh_connect',
      description: 'Remote shell',
    },
    {
      alias: 'remote_exec',
      canonicalName: 'ssh_connect',
      description: 'Remote execution',
    },
    {
      alias: 'connect',
      canonicalName: 'ssh_connect',
      description: 'Connect to server',
    },
    {
      alias: 'telnet',
      canonicalName: 'ssh_connect',
      description: 'Telnet connection',
    },
    // ═══════════════════════════════════════════════════════════════════
    // ssh_add_host aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'ssh_add_host',
      canonicalName: 'ssh_add_host',
      description: 'Add SSH host profile',
    },
    {
      alias: 'add_host',
      canonicalName: 'ssh_add_host',
      description: 'Add host configuration',
    },
    {
      alias: 'add_ssh_host',
      canonicalName: 'ssh_add_host',
      description: 'Add SSH host',
    },
    {
      alias: 'save_ssh',
      canonicalName: 'ssh_add_host',
      description: 'Save SSH config',
    },
    {
      alias: 'ssh_save',
      canonicalName: 'ssh_add_host',
      description: 'Save SSH config',
    },
    {
      alias: 'ssh_profile_add',
      canonicalName: 'ssh_add_host',
      description: 'Add SSH profile',
    },
    {
      alias: 'ssh_config_add',
      canonicalName: 'ssh_add_host',
      description: 'Add SSH config',
    },
    // ═══════════════════════════════════════════════════════════════════
    // ssh_list_hosts aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'ssh_list_hosts',
      canonicalName: 'ssh_list_hosts',
      description: 'List SSH host profiles',
    },
    {
      alias: 'list_hosts',
      canonicalName: 'ssh_list_hosts',
      description: 'List configured hosts',
    },
    {
      alias: 'list_ssh',
      canonicalName: 'ssh_list_hosts',
      description: 'List SSH hosts',
    },
    {
      alias: 'ssh_hosts',
      canonicalName: 'ssh_list_hosts',
      description: 'SSH hosts list',
    },
    {
      alias: 'ssh_profiles',
      canonicalName: 'ssh_list_hosts',
      description: 'SSH profiles',
    },
    {
      alias: 'ssh_config_list',
      canonicalName: 'ssh_list_hosts',
      description: 'List SSH config',
    },
    // ═══════════════════════════════════════════════════════════════════
    // ssh_remove_host aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'ssh_remove_host',
      canonicalName: 'ssh_remove_host',
      description: 'Remove SSH host profile',
    },
    {
      alias: 'remove_host',
      canonicalName: 'ssh_remove_host',
      description: 'Remove host configuration',
    },
    {
      alias: 'remove_ssh',
      canonicalName: 'ssh_remove_host',
      description: 'Remove SSH config',
    },
    {
      alias: 'delete_ssh',
      canonicalName: 'ssh_remove_host',
      description: 'Delete SSH config',
    },
    {
      alias: 'ssh_delete',
      canonicalName: 'ssh_remove_host',
      description: 'Delete SSH host',
    },
    {
      alias: 'ssh_profile_remove',
      canonicalName: 'ssh_remove_host',
      description: 'Remove SSH profile',
    },
    {
      alias: 'ssh_config_remove',
      canonicalName: 'ssh_remove_host',
      description: 'Remove SSH config',
    },
  ],

  // Context-aware prompts for guidance
  prompts: [
    {
      priority: 1,
      content:
        'Use SSH tools for remote server access. Configure profiles with ssh_add_host for quick access. Use profiles instead of specifying host/user each time.',
    },
    {
      priority: 2,
      content:
        'SSH credentials are stored in ~/.ollama-code/ssh_credentials.json. Use tags to organize hosts by environment (dev, staging, prod).',
    },
  ],

  capabilities: {
    canExecuteCommands: true,
    canAccessNetwork: true,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('SSH Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('SSH Tools plugin enabled');
    },
  },
};

export default sshToolsPlugin;

// Also export tool classes for direct imports
export { SSHTool, SSHToolInvocation } from './ssh.js';
export {
  SSHAddHostTool,
  SSHAddHostInvocation,
  SSHListHostsTool,
  SSHListHostsInvocation,
  SSHRemoveHostTool,
  SSHRemoveHostInvocation,
  type SSHAddHostParams,
  type SSHListHostsParams,
  type SSHRemoveHostParams,
} from './ssh-hosts.js';
