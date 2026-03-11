/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * /permissions command - Manage tool execution permissions
 *
 * Allows users to view and modify permission rules for tools
 */

import type {
  SlashCommand,
  CommandContext,
  SlashCommandActionReturn,
} from './types.js';
import { CommandKind } from './types.js';
import {
  getPermissionService,
  type PermissionLevel,
  type ToolCategory,
  type PermissionRule,
} from '@ollama-code/ollama-code-core';
import { t } from '../../i18n/index.js';

// Get the permission service instance
const permissionService = getPermissionService();

/**
 * Format permission level for display
 */
function formatLevel(level: PermissionLevel): string {
  const colors: Record<PermissionLevel, string> = {
    always_allow: '✓ Always Allow',
    ask_once: '? Ask Once',
    ask_always: '! Ask Always',
    never_allow: '✗ Never Allow',
  };
  return colors[level] || level;
}

/**
 * Format category for display
 */
function formatCategory(category: ToolCategory): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Show all permission rules
 */
function showRules(): string {
  const rules = permissionService.getRules();
  const summary = permissionService.getSummary();

  const lines: string[] = [
    t('Permission Rules'),
    '═'.repeat(50),
    '',
    t('Summary'),
    '─'.repeat(50),
    `  ${t('Total rules')}: ${summary.totalRules}`,
    `  ${t('Enabled rules')}: ${summary.enabledRules}`,
    `  ${t('Session allowlist')}: ${summary.sessionAllowlistSize} entries`,
    '',
    t('By Level'),
    '─'.repeat(50),
  ];

  for (const [level, count] of Object.entries(summary.byLevel)) {
    lines.push(
      `  ${formatLevel(level as PermissionLevel)}: ${count as number}`,
    );
  }

  lines.push('');
  lines.push(t('By Category'));
  lines.push('─'.repeat(50));

  for (const [category, count] of Object.entries(summary.byCategory)) {
    if ((count as number) > 0) {
      lines.push(`  ${formatCategory(category as ToolCategory)}: ${count}`);
    }
  }

  lines.push('');
  lines.push(t('Detailed Rules'));
  lines.push('─'.repeat(50));

  // Group rules by category
  const byCategory = new Map<ToolCategory, PermissionRule[]>();
  for (const rule of rules) {
    const cat = rule.category;
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat)!.push(rule);
  }

  for (const [category, categoryRules] of byCategory) {
    lines.push('');
    lines.push(`  ${formatCategory(category)}:`);
    for (const rule of categoryRules) {
      const status = rule.enabled ? '✓' : '✗';
      lines.push(
        `    ${status} ${rule.tool}: ${formatLevel(rule.level)}` +
          (rule.reason ? ` (${rule.reason})` : ''),
      );
    }
  }

  lines.push('');
  lines.push(t('Use /permissions help for available commands.'));

  return lines.join('\n');
}

/**
 * Show rules for a specific category
 */
function showCategory(category: string): string {
  const cat = category.toLowerCase().replace(/-/g, '_') as ToolCategory;
  const validCategories: ToolCategory[] = [
    'file_read',
    'file_write',
    'file_delete',
    'shell_execute',
    'network',
    'ssh',
    'database',
    'git',
    'mcp',
    'extension',
    'system',
    'other',
  ];

  if (!validCategories.includes(cat)) {
    return t('Invalid category: {{category}}. Valid categories: {{valid}}', {
      category,
      valid: validCategories.join(', '),
    });
  }

  const rules = permissionService.getRulesByCategory(cat);

  const lines: string[] = [
    t('Permission Rules - {{category}}', {
      category: formatCategory(cat),
    }),
    '─'.repeat(50),
    '',
  ];

  for (const rule of rules) {
    const status = rule.enabled ? '✓' : '✗';
    lines.push(`  ${status} ${rule.tool}`);
    lines.push(`    Level: ${formatLevel(rule.level)}`);
    if (rule.reason) {
      lines.push(`    Reason: ${rule.reason}`);
    }
    lines.push(`    Uses: ${rule.useCount}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Set permission level for a tool
 */
function setLevel(tool: string, level: string): string {
  const validLevels: PermissionLevel[] = [
    'always_allow',
    'ask_once',
    'ask_always',
    'never_allow',
  ];

  if (!validLevels.includes(level as PermissionLevel)) {
    return t('Invalid level: {{level}}. Valid levels: {{valid}}', {
      level,
      valid: validLevels.join(', '),
    });
  }

  const existingRule = permissionService.getRule(tool);

  permissionService.setRule({
    tool,
    level: level as PermissionLevel,
    category: existingRule?.category || 'other',
    enabled: true,
    reason: existingRule?.reason || 'User configured',
  });

  return t('Set {{tool}} to {{level}}', {
    tool,
    level: formatLevel(level as PermissionLevel),
  });
}

/**
 * Get help text
 */
function getHelp(): string {
  return t(`Permission Management Commands

Usage: /permissions <command>

View Commands:
  show              Show all permission rules (default)
  category <name>   Show rules for a specific category

Management Commands:
  set <tool> <level>  Set permission level for a tool
  enable <tool>       Enable a permission rule
  disable <tool>      Disable a permission rule
  remove <tool>       Remove a permission rule

Session Commands:
  clear               Clear session allowlist
  reset               Reset all rules to defaults

Import/Export:
  export              Export permissions to JSON
  import <json>       Import permissions from JSON

Permission Levels:
  always_allow  - Tool can execute without confirmation
  ask_once      - Ask once per session, then remember
  ask_always    - Always ask for confirmation
  never_allow   - Block tool from execution

Categories:
  file_read, file_write, file_delete, shell_execute,
  network, ssh, database, git, mcp, extension, system, other

Examples:
  /permissions set read_file always_allow
  /permissions set run_shell_command ask_always
  /permissions category shell_execute
  /permissions clear
  /permissions reset`);
}

/**
 * Permissions command definition
 */
export const permissionsCommand: SlashCommand = {
  name: 'permissions',
  altNames: ['perms', 'perm'],
  description: t('Manage tool execution permissions'),
  kind: CommandKind.BUILT_IN,

  subCommands: [
    {
      name: 'show',
      description: t('Show all permission rules'),
      kind: CommandKind.BUILT_IN,
      action: (): SlashCommandActionReturn => ({
        type: 'message',
        messageType: 'info',
        content: showRules(),
      }),
    },
    {
      name: 'clear',
      description: t('Clear session allowlist'),
      kind: CommandKind.BUILT_IN,
      action: (): SlashCommandActionReturn => {
        permissionService.clearSessionAllowlist();
        return {
          type: 'message',
          messageType: 'info',
          content: t('Session allowlist cleared.'),
        };
      },
    },
    {
      name: 'reset',
      description: t('Reset all rules to defaults'),
      kind: CommandKind.BUILT_IN,
      action: (): SlashCommandActionReturn => {
        permissionService.resetToDefaults();
        return {
          type: 'message',
          messageType: 'info',
          content: t('All permission rules reset to defaults.'),
        };
      },
    },
    {
      name: 'export',
      description: t('Export permissions to JSON'),
      kind: CommandKind.BUILT_IN,
      action: (): SlashCommandActionReturn => ({
        type: 'message',
        messageType: 'info',
        content: t('Permissions export:\n') + permissionService.export(),
      }),
    },
    {
      name: 'help',
      description: t('Show help for permissions commands'),
      kind: CommandKind.BUILT_IN,
      action: (): SlashCommandActionReturn => ({
        type: 'message',
        messageType: 'info',
        content: getHelp(),
      }),
    },
  ],

  action: (
    _context: CommandContext,
    args: string,
  ): SlashCommandActionReturn => {
    const parts = args.trim().split(/\s+/);
    const subcommand = parts[0]?.toLowerCase();

    switch (subcommand) {
      case '':
      case 'show':
        return {
          type: 'message',
          messageType: 'info',
          content: showRules(),
        };

      case 'category':
      case 'cat': {
        const category = parts[1];
        if (!category) {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Usage: /permissions category <name>'),
          };
        }
        return {
          type: 'message',
          messageType: 'info',
          content: showCategory(category),
        };
      }

      case 'set': {
        const tool = parts[1];
        const level = parts[2]?.toLowerCase();
        if (!tool || !level) {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Usage: /permissions set <tool> <level>'),
          };
        }
        return {
          type: 'message',
          messageType: 'info',
          content: setLevel(tool, level),
        };
      }

      case 'enable': {
        const tool = parts[1];
        if (!tool) {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Usage: /permissions enable <tool>'),
          };
        }
        const existingRule = permissionService.getRule(tool);
        if (!existingRule) {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Rule not found: {{tool}}', { tool }),
          };
        }
        permissionService.setRule({
          ...existingRule,
          enabled: true,
        });
        return {
          type: 'message',
          messageType: 'info',
          content: t('Enabled rule for {{tool}}', { tool }),
        };
      }

      case 'disable': {
        const tool = parts[1];
        if (!tool) {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Usage: /permissions disable <tool>'),
          };
        }
        const existingRule = permissionService.getRule(tool);
        if (!existingRule) {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Rule not found: {{tool}}', { tool }),
          };
        }
        permissionService.setRule({
          ...existingRule,
          enabled: false,
        });
        return {
          type: 'message',
          messageType: 'info',
          content: t('Disabled rule for {{tool}}', { tool }),
        };
      }

      case 'remove':
      case 'delete': {
        const tool = parts[1];
        if (!tool) {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Usage: /permissions remove <tool>'),
          };
        }
        if (permissionService.removeRule(tool)) {
          return {
            type: 'message',
            messageType: 'info',
            content: t('Removed rule for {{tool}}', { tool }),
          };
        }
        return {
          type: 'message',
          messageType: 'error',
          content: t('Rule not found: {{tool}}', { tool }),
        };
      }

      case 'clear':
        permissionService.clearSessionAllowlist();
        return {
          type: 'message',
          messageType: 'info',
          content: t('Session allowlist cleared.'),
        };

      case 'reset':
        permissionService.resetToDefaults();
        return {
          type: 'message',
          messageType: 'info',
          content: t('All permission rules reset to defaults.'),
        };

      case 'export':
        return {
          type: 'message',
          messageType: 'info',
          content: t('Permissions export:\n') + permissionService.export(),
        };

      case 'import': {
        const json = parts.slice(1).join(' ');
        if (!json) {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Usage: /permissions import <json>'),
          };
        }
        if (permissionService.import(json)) {
          return {
            type: 'message',
            messageType: 'info',
            content: t('Permissions imported successfully.'),
          };
        }
        return {
          type: 'message',
          messageType: 'error',
          content: t('Failed to import permissions. Invalid JSON format.'),
        };
      }

      case 'help':
        return {
          type: 'message',
          messageType: 'info',
          content: getHelp(),
        };

      default:
        return {
          type: 'message',
          messageType: 'error',
          content: t(
            'Unknown subcommand: {{subcommand}}. Use /permissions help for usage.',
            { subcommand },
          ),
        };
    }
  },
};

export default permissionsCommand;
