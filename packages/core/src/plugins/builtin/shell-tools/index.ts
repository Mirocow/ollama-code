/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shell Tools Plugin
 * 
 * Built-in plugin providing shell command execution capabilities.
 * Includes safety features like command explanation and confirmation.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';
import { spawn } from 'node:child_process';

/**
 * Tool: run_shell_command
 * Execute shell commands with safety features
 */
const runShellCommandTool: PluginTool = {
  id: 'run_shell_command',
  name: 'run_shell_command',
  description: `Use this tool to execute shell commands. You can run any shell command including git, npm, node, python, etc. The command will be executed in the current working directory. Commands that modify the filesystem or system state will require confirmation from the user before execution. Use background processes (via \`&\`) for commands that are unlikely to stop on their own.`,
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
    const timeout = (params['timeout_ms'] as number) || 120000;
    const isBackground = params['is_background'] as boolean;
    
    const signal = context.signal;
    
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      
      // Parse command for shell execution
      const shell = process.platform === 'win32' ? true : '/bin/bash';
      const child = spawn(command, [], {
        shell,
        cwd: context.workingDirectory || process.cwd(),
        env: process.env,
      });
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, Math.min(timeout, 600000));
      
      // Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          child.kill('SIGTERM');
        });
      }
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (timedOut) {
          resolve({
            success: false,
            error: `Command timed out after ${timeout}ms`,
            data: { stdout, stderr, exitCode: code },
          });
          return;
        }
        
        if (signal?.aborted) {
          resolve({
            success: false,
            error: 'Command was cancelled',
            data: { stdout, stderr, exitCode: code },
          });
          return;
        }
        
        if (code === 0) {
          resolve({
            success: true,
            data: {
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: code,
            },
            display: {
              summary: stdout.length > 100 
                ? stdout.substring(0, 100) + '...' 
                : stdout || '(no output)',
            },
          });
        } else {
          resolve({
            success: false,
            error: `Command exited with code ${code}: ${stderr || 'Unknown error'}`,
            data: { stdout, stderr, exitCode: code },
          });
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: `Failed to execute command: ${error.message}`,
        });
      });
      
      // Handle background processes
      if (isBackground) {
        setTimeout(() => {
          resolve({
            success: true,
            data: {
              pid: child.pid,
              message: 'Background process started',
            },
            display: {
              summary: `Started background process (PID: ${child.pid})`,
            },
          });
        }, 100); // Give it a moment to start
      }
    });
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
    version: '1.0.0',
    description: 'Shell command execution with safety features',
    author: 'Ollama Code Team',
    tags: ['core', 'shell', 'execute'],
    enabledByDefault: true,
  },
  
  tools: [runShellCommandTool, bashTool],
  
  hooks: {
    onLoad: async (context) => {
      context.logger.info('Shell Tools plugin loaded');
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
  },
};

export default shellToolsPlugin;
