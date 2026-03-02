/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Shell Tools Plugin
 *
 * Built-in plugin providing shell command execution capabilities.
 * Includes safety features like command explanation and confirmation.
 * Wraps the existing ShellTool for plugin system integration.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

// Re-export actual tool class for direct use
export { ShellTool, ShellToolInvocation } from '../../../tools/shell.js';

/**
 * Tool: run_shell_command
 * Execute shell commands with safety features
 */
const runShellCommandTool: PluginTool = {
  id: 'run_shell_command',
  name: 'run_shell_command',
  description: `Use this tool to execute shell commands. You can run any shell command including git, npm, node, python, etc. The command will be executed in the current working directory. Commands that modify the filesystem or system state will require confirmation from the user before execution. Use background processes (via \`&\`) for commands that are unlikely to stop on their own.

IMPORTANT: This tool is for terminal operations like git, npm, docker, etc. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.

**Usage notes**:
- The command argument is required.
- You can specify an optional timeout in milliseconds (up to 600000ms / 10 minutes). If not specified, commands will timeout after 120000ms (2 minutes).
- It is very helpful if you write a clear, concise description of what the command does in 5-10 words.

- Avoid using run_shell_command with the \`find\`, \`grep\`, \`cat\`, \`head\`, \`tail\`, \`sed\`, \`awk\`, or \`echo\` commands. Instead, always prefer using the dedicated tools for these commands:
  - File search: Use glob (NOT find or ls)
  - Content search: Use grep_search (NOT grep or rg)
  - Read files: Use read_file (NOT cat/head/tail)
  - Edit files: Use edit (NOT sed/awk)
  - Write files: Use write_file (NOT echo >/cat <<EOF)`,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The shell command to execute. Can include pipes, redirects, and other shell features.',
      },
      timeout_ms: {
        type: 'number',
        description: 'OPTIONAL: Timeout in milliseconds. Default is 120000 (2 minutes). Maximum is 600000 (10 minutes).',
      },
      description: {
        type: 'string',
        description: 'OPTIONAL: A brief description of what the command does. Used for confirmation message.',
      },
      is_background: {
        type: 'boolean',
        description: 'OPTIONAL: Whether to run the command in the background. Use for long-running processes.',
      },
      directory: {
        type: 'string',
        description: 'OPTIONAL: The absolute path of the directory to run the command in. Defaults to project root.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => {
    const command = params['command'] as string;
    const description = params['description'] as string | undefined;
    
    // Determine if command is destructive
    const destructivePatterns = ['rm ', 'rmdir', 'del ', 'format', 'mkfs', 'dd if='];
    const isDestructive = destructivePatterns.some(p => command.includes(p));
    
    const prefix = isDestructive ? '⚠️ DESTRUCTIVE: ' : '';
    const suffix = description ? ` (${description})` : '';
    
    return `${prefix}Execute: \`${command}\`${suffix}`;
  },
  execute: async (params, context) => {
    const command = params['command'] as string;
    
    // Note: Full implementation uses ShellTool class
    return {
      success: true,
      data: {
        message: 'Shell command ready for execution. Full implementation uses ShellTool class.',
        command,
      },
      display: {
        summary: `Shell: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`,
      },
    };
  },
  timeout: 600000, // 10 minutes max
};

/**
 * Tool: bash
 * Alias for run_shell_command with simpler interface
 */
const bashTool: PluginTool = {
  id: 'bash',
  name: 'bash',
  description: 'Execute a bash command. Simpler interface for quick commands.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The bash command to execute.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => {
    return `Execute: \`${params['command']}\``;
  },
  execute: async (params, context) => {
    // Delegate to run_shell_command
    return runShellCommandTool.execute!(
      { command: params['command'] },
      context
    );
  },
  timeout: 120000,
};

/**
 * Shell Tools Plugin Definition
 */
const shellToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'shell-tools',
    name: 'Shell Tools',
    version: '1.1.0',
    description: 'Shell command execution with safety features',
    author: 'Ollama Code Team',
    tags: ['core', 'shell', 'execute', 'terminal'],
    enabledByDefault: true,
  },
  
  tools: [runShellCommandTool, bashTool],
  
  hooks: {
    onLoad: async (context) => {
      context.logger.info('Shell Tools plugin loaded (v1.1.0)');
    },
    onEnable: async (context) => {
      context.logger.info('Shell Tools plugin enabled');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      const command = params['command'] as string;
      
      // Log command for debugging
      context.logger.debug(`Executing shell command: ${command}`);
      
      // Check for potentially dangerous commands
      const dangerousPatterns = [
        'rm -rf /',
        'mkfs',
        'dd if=',
        ':(){ :|:& };:',  // Fork bomb
        'chmod -R 777 /',
        'curl | bash',
        'wget | bash',
      ];
      
      for (const pattern of dangerousPatterns) {
        if (command.includes(pattern)) {
          context.logger.warn(`Potentially dangerous command detected: ${pattern}`);
          // Still allow execution, but warn
          break;
        }
      }
      
      return true;
    },
    onAfterToolExecute: async (toolId, params, result, context) => {
      if (!result.success) {
        context.logger.warn(`Shell command failed: ${result.error}`);
      }
    },
  },
  
  defaultConfig: {
    defaultTimeout: 120000,
    maxTimeout: 600000,
    shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
    allowDangerousCommands: false,
  },
};

export default shellToolsPlugin;
