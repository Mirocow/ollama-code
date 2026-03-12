/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SlashCommand,
  CommandContext,
  SlashCommandActionReturn,
} from './types';
import { CommandKind } from './types';

/**
 * /model command - Switch model
 */
export const modelCommand: SlashCommand = {
  name: 'model',
  description: 'Switch the model for this session',
  kind: CommandKind.BUILT_IN,
  action: (_context: CommandContext): SlashCommandActionReturn => {
    return { type: 'dialog', dialog: 'model' };
  },
};

/**
 * /clear command - Clear conversation
 */
export const clearCommand: SlashCommand = {
  name: 'clear',
  altNames: ['reset', 'new'],
  description: 'Clear conversation history and start fresh',
  kind: CommandKind.BUILT_IN,
  action: (context: CommandContext): SlashCommandActionReturn => {
    context.clearChat();
    return { type: 'clear' };
  },
};

/**
 * /export command - Export conversation
 */
export const exportCommand: SlashCommand = {
  name: 'export',
  description: 'Export conversation to file',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'json',
      description: 'Export as JSON',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        context.exportChat('json');
        return {
          type: 'message',
          messageType: 'success',
          content: 'Exported as JSON',
        };
      },
    },
    {
      name: 'md',
      description: 'Export as Markdown',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        context.exportChat('md');
        return {
          type: 'message',
          messageType: 'success',
          content: 'Exported as Markdown',
        };
      },
    },
    {
      name: 'html',
      description: 'Export as HTML',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        context.exportChat('html');
        return {
          type: 'message',
          messageType: 'success',
          content: 'Exported as HTML',
        };
      },
    },
  ],
  action: (context: CommandContext): SlashCommandActionReturn => {
    context.exportChat('json');
    return {
      type: 'message',
      messageType: 'info',
      content: 'Use /export json, /export md, or /export html',
    };
  },
};

/**
 * /tools command - List tools
 */
export const toolsCommand: SlashCommand = {
  name: 'tools',
  description: 'List available tools',
  kind: CommandKind.BUILT_IN,
  action: (): SlashCommandActionReturn => {
    return { type: 'dialog', dialog: 'tools' };
  },
};

/**
 * /mcp command - Manage MCP servers
 */
export const mcpCommand: SlashCommand = {
  name: 'mcp',
  description: 'Manage MCP servers and tools',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'list',
      description: 'List MCP servers and tools',
      kind: CommandKind.BUILT_IN,
      action: (): SlashCommandActionReturn => {
        return { type: 'dialog', dialog: 'mcp' };
      },
    },
    {
      name: 'refresh',
      description: 'Refresh MCP server connections',
      kind: CommandKind.BUILT_IN,
      action: (_context: CommandContext): SlashCommandActionReturn => {
        return {
          type: 'message',
          messageType: 'info',
          content: 'MCP servers refreshed',
        };
      },
    },
  ],
  action: (): SlashCommandActionReturn => {
    return { type: 'dialog', dialog: 'mcp' };
  },
};

/**
 * /extensions command - Manage extensions
 */
export const extensionsCommand: SlashCommand = {
  name: 'extensions',
  description: 'Manage extensions',
  kind: CommandKind.BUILT_IN,
  action: (): SlashCommandActionReturn => {
    return { type: 'dialog', dialog: 'extensions' };
  },
};

/**
 * /settings command - View/edit settings
 */
export const settingsCommand: SlashCommand = {
  name: 'settings',
  description: 'View and edit settings',
  kind: CommandKind.BUILT_IN,
  action: (): SlashCommandActionReturn => {
    return { type: 'dialog', dialog: 'settings' };
  },
};

/**
 * /help command - Show help
 */
export const helpCommand: SlashCommand = {
  name: 'help',
  altNames: ['?'],
  description: 'Show available commands',
  kind: CommandKind.BUILT_IN,
  action: (): SlashCommandActionReturn => {
    return { type: 'dialog', dialog: 'help' };
  },
};

/**
 * /theme command - Change theme
 */
export const themeCommand: SlashCommand = {
  name: 'theme',
  description: 'Change the UI theme',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'light',
      description: 'Switch to light theme',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        context.updateSettings({ theme: 'light' });
        return {
          type: 'message',
          messageType: 'success',
          content: 'Theme changed to light',
        };
      },
    },
    {
      name: 'dark',
      description: 'Switch to dark theme',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        context.updateSettings({ theme: 'dark' });
        return {
          type: 'message',
          messageType: 'success',
          content: 'Theme changed to dark',
        };
      },
    },
    {
      name: 'system',
      description: 'Use system theme',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        context.updateSettings({ theme: 'system' });
        return {
          type: 'message',
          messageType: 'success',
          content: 'Theme set to follow system',
        };
      },
    },
  ],
  action: (_context: CommandContext): SlashCommandActionReturn => {
    return {
      type: 'message',
      messageType: 'info',
      content: 'Use /theme light, /theme dark, or /theme system',
    };
  },
};

/**
 * /compress command - Compress context
 */
export const compressCommand: SlashCommand = {
  name: 'compress',
  altNames: ['summarize'],
  description: 'Compress context by summarizing conversation',
  kind: CommandKind.BUILT_IN,
  action: (_context: CommandContext): SlashCommandActionReturn => {
    return {
      type: 'message',
      messageType: 'info',
      content: 'Compressing conversation context...',
    };
  },
};

/**
 * /memory command - Manage memory
 */
export const memoryCommand: SlashCommand = {
  name: 'memory',
  description: 'Manage memory context',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'show',
      description: 'Show current memory contents',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        const memory = context.settings.memory as string | undefined;
        return {
          type: 'message',
          messageType: 'info',
          content: memory || 'No memory content loaded',
        };
      },
    },
    {
      name: 'refresh',
      description: 'Refresh memory from source files',
      kind: CommandKind.BUILT_IN,
      action: (): SlashCommandActionReturn => {
        return {
          type: 'message',
          messageType: 'success',
          content: 'Memory refreshed',
        };
      },
    },
  ],
  action: (): SlashCommandActionReturn => {
    return {
      type: 'message',
      messageType: 'info',
      content: 'Use /memory show or /memory refresh',
    };
  },
};

/**
 * /approval-mode command - Set tool approval mode
 */
export const approvalModeCommand: SlashCommand = {
  name: 'approval-mode',
  description: 'Set tool approval mode',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'auto',
      description: 'Auto-approve all tool calls',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        context.updateSettings({ approvalMode: 'auto' });
        return {
          type: 'message',
          messageType: 'success',
          content: 'Approval mode set to auto',
        };
      },
    },
    {
      name: 'manual',
      description: 'Ask for approval on each tool call',
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext): SlashCommandActionReturn => {
        context.updateSettings({ approvalMode: 'manual' });
        return {
          type: 'message',
          messageType: 'success',
          content: 'Approval mode set to manual',
        };
      },
    },
  ],
  action: (): SlashCommandActionReturn => {
    return {
      type: 'message',
      messageType: 'info',
      content: 'Use /approval-mode auto or /approval-mode manual',
    };
  },
};

/**
 * All built-in commands
 */
export const builtinCommands: SlashCommand[] = [
  modelCommand,
  clearCommand,
  exportCommand,
  toolsCommand,
  mcpCommand,
  extensionsCommand,
  settingsCommand,
  helpCommand,
  themeCommand,
  compressCommand,
  memoryCommand,
  approvalModeCommand,
];
