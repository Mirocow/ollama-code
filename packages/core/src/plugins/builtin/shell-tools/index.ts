/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shell Tools Plugin
 *
 * Built-in plugin providing shell command execution.
 */

import type { PluginDefinition } from '../../types.js';
import { ShellTool } from './shell.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  RUN_SHELL_COMMAND: 'run_shell_command',
} as const;

/**
 * Shell Tools Plugin Definition
 */
const shellToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'shell-tools',
    name: 'Shell Tools',
    version: '1.0.0',
    description: 'Shell command execution with timeout and background support',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'shell', 'execute'],
    enabledByDefault: true,
  },

  // Unified tools array - factory functions that receive Config
  tools: [
    (config: unknown) => new ShellTool(config as import('../../../config/config.js').Config),
  ],

  // Tool aliases - short names that resolve to canonical tool names
  // Includes common model hallucinations and infrastructure tool redirects
  aliases: [
    // Basic shell aliases
    {
      alias: 'run',
      canonicalName: 'run_shell_command',
      description: 'Run shell command',
    },
    {
      alias: 'shell',
      canonicalName: 'run_shell_command',
      description: 'Execute shell command',
    },
    {
      alias: 'Shell',
      canonicalName: 'run_shell_command',
      description: 'Execute shell command',
    },
    {
      alias: 'SHELL',
      canonicalName: 'run_shell_command',
      description: 'Execute shell command',
    },
    {
      alias: 'exec',
      canonicalName: 'run_shell_command',
      description: 'Execute command',
    },
    {
      alias: 'cmd',
      canonicalName: 'run_shell_command',
      description: 'Run command',
    },
    {
      alias: 'shell_dev',
      canonicalName: 'run_shell_command',
      description: 'Shell development',
    },
    {
      alias: 'bash',
      canonicalName: 'run_shell_command',
      description: 'Run bash command',
    },
    {
      alias: 'zsh',
      canonicalName: 'run_shell_command',
      description: 'Run zsh command',
    },
    {
      alias: 'terminal',
      canonicalName: 'run_shell_command',
      description: 'Run terminal command',
    },
    {
      alias: 'command',
      canonicalName: 'run_shell_command',
      description: 'Execute command',
    },
    {
      alias: 'bash_dev',
      canonicalName: 'run_shell_command',
      description: 'Bash development',
    },
    {
      alias: 'zsh_dev',
      canonicalName: 'run_shell_command',
      description: 'Zsh development',
    },
    {
      alias: 'cli',
      canonicalName: 'run_shell_command',
      description: 'CLI command',
    },
    {
      alias: 'run-shell',
      canonicalName: 'run_shell_command',
      description: 'Run shell command',
    },
    {
      alias: 'run_shell',
      canonicalName: 'run_shell_command',
      description: 'Run shell command',
    },
    // Docker/Container aliases (models often hallucinate docker_dev, etc.)
    {
      alias: 'docker',
      canonicalName: 'run_shell_command',
      description: 'Docker commands',
    },
    {
      alias: 'docker_dev',
      canonicalName: 'run_shell_command',
      description: 'Docker development',
    },
    {
      alias: 'container',
      canonicalName: 'run_shell_command',
      description: 'Container commands',
    },
    {
      alias: 'container_dev',
      canonicalName: 'run_shell_command',
      description: 'Container development',
    },
    {
      alias: 'docker_compose',
      canonicalName: 'run_shell_command',
      description: 'Docker compose',
    },
    {
      alias: 'compose',
      canonicalName: 'run_shell_command',
      description: 'Docker compose',
    },
    {
      alias: 'podman',
      canonicalName: 'run_shell_command',
      description: 'Podman commands',
    },
    // Kubernetes/Cloud aliases
    {
      alias: 'kubernetes',
      canonicalName: 'run_shell_command',
      description: 'Kubernetes commands',
    },
    {
      alias: 'k8s',
      canonicalName: 'run_shell_command',
      description: 'Kubernetes commands',
    },
    {
      alias: 'kubectl',
      canonicalName: 'run_shell_command',
      description: 'Kubectl commands',
    },
    {
      alias: 'helm',
      canonicalName: 'run_shell_command',
      description: 'Helm commands',
    },
    {
      alias: 'k8s_dev',
      canonicalName: 'run_shell_command',
      description: 'Kubernetes development',
    },
    // CI/CD aliases
    {
      alias: 'ci',
      canonicalName: 'run_shell_command',
      description: 'CI commands',
    },
    {
      alias: 'cd',
      canonicalName: 'run_shell_command',
      description: 'CD commands',
    },
    {
      alias: 'github_actions',
      canonicalName: 'run_shell_command',
      description: 'GitHub Actions',
    },
    {
      alias: 'gitlab_ci',
      canonicalName: 'run_shell_command',
      description: 'GitLab CI',
    },
    {
      alias: 'jenkins',
      canonicalName: 'run_shell_command',
      description: 'Jenkins commands',
    },
    {
      alias: 'circleci',
      canonicalName: 'run_shell_command',
      description: 'CircleCI commands',
    },
    // Infrastructure aliases
    {
      alias: 'terraform',
      canonicalName: 'run_shell_command',
      description: 'Terraform commands',
    },
    {
      alias: 'tf',
      canonicalName: 'run_shell_command',
      description: 'Terraform commands',
    },
    {
      alias: 'ansible',
      canonicalName: 'run_shell_command',
      description: 'Ansible commands',
    },
    {
      alias: 'aws',
      canonicalName: 'run_shell_command',
      description: 'AWS CLI commands',
    },
    {
      alias: 'azure',
      canonicalName: 'run_shell_command',
      description: 'Azure CLI commands',
    },
    {
      alias: 'gcp',
      canonicalName: 'run_shell_command',
      description: 'GCP CLI commands',
    },
    // Database aliases (redirect to shell for db CLIs)
    {
      alias: 'database',
      canonicalName: 'run_shell_command',
      description: 'Database commands',
    },
    {
      alias: 'db',
      canonicalName: 'run_shell_command',
      description: 'Database commands',
    },
    {
      alias: 'database_dev',
      canonicalName: 'run_shell_command',
      description: 'Database development',
    },
    {
      alias: 'db_dev',
      canonicalName: 'run_shell_command',
      description: 'Database development',
    },
    {
      alias: 'sql',
      canonicalName: 'run_shell_command',
      description: 'SQL commands',
    },
    {
      alias: 'sql_dev',
      canonicalName: 'run_shell_command',
      description: 'SQL development',
    },
    {
      alias: 'mysql',
      canonicalName: 'run_shell_command',
      description: 'MySQL commands',
    },
    {
      alias: 'postgresql',
      canonicalName: 'run_shell_command',
      description: 'PostgreSQL commands',
    },
    {
      alias: 'postgres',
      canonicalName: 'run_shell_command',
      description: 'Postgres commands',
    },
    {
      alias: 'psql',
      canonicalName: 'run_shell_command',
      description: 'psql commands',
    },
    {
      alias: 'sqlite',
      canonicalName: 'run_shell_command',
      description: 'SQLite commands',
    },
    {
      alias: 'mongodb',
      canonicalName: 'run_shell_command',
      description: 'MongoDB commands',
    },
    {
      alias: 'mongo',
      canonicalName: 'run_shell_command',
      description: 'Mongo commands',
    },
    {
      alias: 'redis',
      canonicalName: 'run_shell_command',
      description: 'Redis commands',
    },
    {
      alias: 'redis_dev',
      canonicalName: 'run_shell_command',
      description: 'Redis development',
    },
    {
      alias: 'redis_cli',
      canonicalName: 'run_shell_command',
      description: 'Redis CLI',
    },
    // File transfer aliases
    {
      alias: 'scp',
      canonicalName: 'run_shell_command',
      description: 'SCP file transfer',
    },
    {
      alias: 'rsync',
      canonicalName: 'run_shell_command',
      description: 'Rsync file sync',
    },
    {
      alias: 'tar',
      canonicalName: 'run_shell_command',
      description: 'Tar archive',
    },
    {
      alias: 'zip',
      canonicalName: 'run_shell_command',
      description: 'Zip archive',
    },
    {
      alias: 'unzip',
      canonicalName: 'run_shell_command',
      description: 'Unzip archive',
    },
    {
      alias: 'curl_dev',
      canonicalName: 'run_shell_command',
      description: 'Curl development',
    },
    {
      alias: 'wget_dev',
      canonicalName: 'run_shell_command',
      description: 'Wget development',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Shell tool executes commands in the system terminal. Use for: building projects, running tests, git operations, package management, file operations, docker, kubectl, and any CLI tools. Always check working directory. Use timeout for long-running commands.',
    },
    {
      priority: 2,
      content:
        'For dangerous operations (rm -rf, format, drop database), consider asking user confirmation. Use background execution for long tasks. Chain commands with && for dependent operations, ; for independent ones.',
    },
    {
      priority: 3,
      content:
        'Docker: use for container management. Kubernetes: kubectl for cluster operations. Package managers: npm/yarn/pnpm for Node.js, pip for Python, cargo for Rust. Build tools: make, cmake, gradle, maven.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canExecuteCommands: true,
    canAccessNetwork: true,
    canReadFiles: true,
    canWriteFiles: true,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Shell Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Shell Tools plugin enabled');
    },
  },
};

export default shellToolsPlugin;

// Also export tool classes for direct imports
export { ShellTool, ShellToolInvocation } from './shell.js';
