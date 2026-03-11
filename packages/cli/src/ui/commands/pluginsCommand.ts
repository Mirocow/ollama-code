/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type CommandContext,
  type SlashCommand,
  CommandKind,
} from './types.js';
import { MessageType } from '../types.js';
import { t } from '../../i18n/index.js';

/**
 * /plugins command - Manage and inspect plugins
 *
 * Subcommands:
 *   /plugins              - List all plugins with status
 *   /plugins list         - Same as above
 *   /plugins health       - Show health metrics for all plugins
 *   /plugins reload [id]  - Reload all plugins or a specific one
 *   /plugins enable <id>  - Enable a plugin
 *   /plugins disable <id> - Disable a plugin
 *   /plugins info <id>    - Show detailed plugin info
 */
export const pluginsCommand: SlashCommand = {
  name: 'plugins',
  get description() {
    return t(
      'Manage plugins. Usage: /plugins [list|health|reload|enable|disable|info] [id]',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string): Promise<void> => {
    const parts = args?.trim().split(/\s+/) || [];
    const subCommand = parts[0] || 'list';
    const pluginId = parts[1];

    // Get plugin registry
    const registry = context.services.config?.getPluginRegistry?.();

    if (!registry) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t('Plugin system not available.'),
        },
        Date.now(),
      );
      return;
    }

    switch (subCommand) {
      case 'list':
      case 'ls':
        listPlugins(context, registry);
        break;

      case 'health':
        await showHealth(context, registry);
        break;

      case 'reload':
        if (pluginId) {
          await reloadPlugin(context, registry, pluginId);
        } else {
          await reloadAllPlugins(context, registry);
        }
        break;

      case 'enable':
        if (!pluginId) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /plugins enable <plugin-id>'),
            },
            Date.now(),
          );
          return;
        }
        await enablePlugin(context, registry, pluginId);
        break;

      case 'disable':
        if (!pluginId) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /plugins disable <plugin-id>'),
            },
            Date.now(),
          );
          return;
        }
        await disablePlugin(context, registry, pluginId);
        break;

      case 'info':
        if (!pluginId) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /plugins info <plugin-id>'),
            },
            Date.now(),
          );
          return;
        }
        showPluginInfo(context, registry, pluginId);
        break;

      case 'help':
      case '?':
        showHelp(context);
        break;

      default:
        // If it looks like a plugin ID (no spaces, exists), show info
        if (parts.length === 1 && subCommand.length > 0) {
          const plugins = registry.getLoadedPlugins?.() || [];
          const exists = plugins.some(
            (p: { definition: { metadata: { id: string } } }) =>
              p.definition.metadata.id === subCommand,
          );
          if (exists) {
            showPluginInfo(context, registry, subCommand);
            return;
          }
        }
        showHelp(context);
    }
  },
};

/**
 * List all plugins with their status
 */
function listPlugins(
  context: CommandContext,
  registry: {
    getMetrics(): {
      loadedPlugins: number;
      enabledPlugins: number;
      toolCount: number;
      aliasCount: number;
      skillCount: number;
      disabledPlugins: string[];
    };
    getLoadedPlugins(): Array<{
      definition: { metadata: { id: string; name: string; version: string } };
      status: string;
    }>;
    getEnabledPlugins(): Array<{ definition: { metadata: { id: string } } }>;
  },
): void {
  const metrics = registry.getMetrics();
  const allPlugins = registry.getLoadedPlugins();
  const enabledIds = new Set(
    registry.getEnabledPlugins().map((p) => p.definition.metadata.id),
  );

  const lines: string[] = ['📦 Loaded Plugins:\n'];

  for (const plugin of allPlugins) {
    const { id, name, version } = plugin.definition.metadata;
    const status = enabledIds.has(id)
      ? '✅'
      : metrics.disabledPlugins.includes(id)
        ? '❌'
        : '⏸️';
    lines.push(`  ${status} ${name} (${id}) v${version}`);
  }

  lines.push('');
  lines.push('━'.repeat(40));
  lines.push(`  Total:     ${metrics.loadedPlugins} plugins`);
  lines.push(`  Enabled:   ${metrics.enabledPlugins}`);
  lines.push(`  Tools:     ${metrics.toolCount}`);
  lines.push(`  Aliases:   ${metrics.aliasCount}`);
  lines.push(`  Skills:    ${metrics.skillCount}`);

  lines.push('\nUse /plugins info <id> for details.');

  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: lines.join('\n'),
    },
    Date.now(),
  );
}

/**
 * Show health metrics for all plugins
 */
async function showHealth(
  context: CommandContext,
  registry: {
    checkAllPluginHealth(): Promise<
      Array<{
        pluginId: string;
        status: string;
        toolCallsTotal: number;
        toolCallsFailed: number;
        toolCallsSuccessful: number;
        avgExecutionTimeMs: number;
        uptimeMs: number;
        lastError?: string;
        lastErrorAt?: Date;
      }>
    >;
  },
): Promise<void> {
  const healthMetrics = await registry.checkAllPluginHealth();

  if (healthMetrics.length === 0) {
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t('No plugin health metrics available.'),
      },
      Date.now(),
    );
    return;
  }

  const lines: string[] = ['🏥 Plugin Health:\n'];

  for (const health of healthMetrics) {
    const statusIcon =
      health.status === 'healthy'
        ? '✅'
        : health.status === 'degraded'
          ? '⚠️'
          : health.status === 'error'
            ? '❌'
            : '❓';

    const successRate =
      health.toolCallsTotal > 0
        ? ((health.toolCallsSuccessful / health.toolCallsTotal) * 100).toFixed(
            1,
          )
        : 'N/A';

    lines.push(`  ${statusIcon} ${health.pluginId}`);
    lines.push(`     Status:   ${health.status}`);
    lines.push(
      `     Calls:    ${health.toolCallsTotal} (${successRate}% success)`,
    );
    lines.push(`     Avg time: ${health.avgExecutionTimeMs.toFixed(1)}ms`);
    lines.push(`     Uptime:   ${formatUptime(health.uptimeMs)}`);

    if (health.lastError) {
      lines.push(`     ⚠️ Error: ${health.lastError}`);
    }
    lines.push('');
  }

  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: lines.join('\n'),
    },
    Date.now(),
  );
}

/**
 * Reload all plugins
 */
async function reloadAllPlugins(
  context: CommandContext,
  registry: {
    reloadAllPlugins(): Promise<{ success: string[]; failed: string[] }>;
  },
): Promise<void> {
  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: t('🔄 Reloading all plugins...'),
    },
    Date.now(),
  );

  try {
    const result = await registry.reloadAllPlugins();

    const lines: string[] = ['🔄 Plugin Reload Results:\n'];

    if (result.success.length > 0) {
      lines.push(`  ✅ Reloaded: ${result.success.length}`);
      result.success.slice(0, 5).forEach((id) => lines.push(`     - ${id}`));
      if (result.success.length > 5) {
        lines.push(`     ... and ${result.success.length - 5} more`);
      }
    }

    if (result.failed.length > 0) {
      lines.push(`  ❌ Failed: ${result.failed.join(', ')}`);
    }

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: lines.join('\n'),
      },
      Date.now(),
    );
  } catch (error) {
    context.ui.addItem(
      {
        type: MessageType.ERROR,
        text: t(`Failed to reload plugins: ${error}`),
      },
      Date.now(),
    );
  }
}

/**
 * Reload a specific plugin
 */
async function reloadPlugin(
  context: CommandContext,
  registry: {
    reloadPlugin(id: string): Promise<void>;
  },
  pluginId: string,
): Promise<void> {
  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: t(`🔄 Reloading plugin: ${pluginId}...`),
    },
    Date.now(),
  );

  try {
    await registry.reloadPlugin(pluginId);
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t(`✅ Plugin "${pluginId}" reloaded successfully.`),
      },
      Date.now(),
    );
  } catch (error) {
    context.ui.addItem(
      {
        type: MessageType.ERROR,
        text: t(`Failed to reload plugin "${pluginId}": ${error}`),
      },
      Date.now(),
    );
  }
}

/**
 * Enable a plugin
 */
async function enablePlugin(
  context: CommandContext,
  registry: {
    enablePlugin(id: string): Promise<void>;
    setPluginEnabled(id: string, enabled: boolean): void;
    getLoadedPlugins(): Array<{ definition: { metadata: { id: string } } }>;
  },
  pluginId: string,
): Promise<void> {
  // Check if plugin exists
  const plugins = registry.getLoadedPlugins();
  const exists = plugins.some((p) => p.definition.metadata.id === pluginId);

  if (!exists) {
    context.ui.addItem(
      {
        type: MessageType.ERROR,
        text: t(`Plugin "${pluginId}" not found.`),
      },
      Date.now(),
    );
    return;
  }

  try {
    registry.setPluginEnabled(pluginId, true);
    await registry.enablePlugin(pluginId);
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t(`✅ Plugin "${pluginId}" enabled.`),
      },
      Date.now(),
    );
  } catch (error) {
    context.ui.addItem(
      {
        type: MessageType.ERROR,
        text: t(`Failed to enable plugin "${pluginId}": ${error}`),
      },
      Date.now(),
    );
  }
}

/**
 * Disable a plugin
 */
async function disablePlugin(
  context: CommandContext,
  registry: {
    disablePlugin(id: string): Promise<void>;
    setPluginEnabled(id: string, enabled: boolean): void;
    getEnabledPlugins(): Array<{ definition: { metadata: { id: string } } }>;
  },
  pluginId: string,
): Promise<void> {
  // Check if plugin is enabled
  const enabledPlugins = registry.getEnabledPlugins();
  const isEnabled = enabledPlugins.some(
    (p) => p.definition.metadata.id === pluginId,
  );

  if (!isEnabled) {
    context.ui.addItem(
      {
        type: MessageType.WARNING,
        text: t(`Plugin "${pluginId}" is not enabled.`),
      },
      Date.now(),
    );
    return;
  }

  try {
    registry.setPluginEnabled(pluginId, false);
    await registry.disablePlugin(pluginId);
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t(`❌ Plugin "${pluginId}" disabled.`),
      },
      Date.now(),
    );
  } catch (error) {
    context.ui.addItem(
      {
        type: MessageType.ERROR,
        text: t(`Failed to disable plugin "${pluginId}": ${error}`),
      },
      Date.now(),
    );
  }
}

/**
 * Show detailed plugin info
 */
function showPluginInfo(
  context: CommandContext,
  registry: {
    getLoadedPlugins(): Array<{
      definition: {
        metadata: {
          id: string;
          name: string;
          version: string;
          description?: string;
          author?: string;
          tags?: string[];
          dependencies?: Array<{ pluginId: string; optional?: boolean }>;
        };
        tools?: unknown[];
        aliases?: unknown[];
        capabilities?: {
          canReadFiles?: boolean;
          canWriteFiles?: boolean;
          canExecuteCommands?: boolean;
          canAccessNetwork?: boolean;
          canUseStorage?: boolean;
          canSpawnAgents?: boolean;
        };
      };
      status: string;
      loadedAt?: Date;
      enabledAt?: Date;
      error?: Error;
    }>;
    getPluginHealth(id: string):
      | {
          status: string;
          toolCallsTotal: number;
          toolCallsFailed: number;
          toolCallsSuccessful: number;
          avgExecutionTimeMs: number;
          uptimeMs: number;
          lastError?: string;
        }
      | undefined;
  },
  pluginId: string,
): void {
  const plugins = registry.getLoadedPlugins();
  const plugin = plugins.find((p) => p.definition.metadata.id === pluginId);

  if (!plugin) {
    context.ui.addItem(
      {
        type: MessageType.ERROR,
        text: t(
          `Plugin "${pluginId}" not found. Use /plugins list to see available plugins.`,
        ),
      },
      Date.now(),
    );
    return;
  }

  const { metadata, tools, aliases, capabilities } = plugin.definition;
  const health = registry.getPluginHealth(pluginId);

  const lines: string[] = [
    `📦 ${metadata.name} (${metadata.id})`,
    '━'.repeat(40),
    `Version:     ${metadata.version}`,
    `Status:      ${plugin.status}`,
  ];

  if (plugin.error) {
    lines.push(`Error:       ${plugin.error.message}`);
  }

  lines.push(`Description: ${metadata.description || '(none)'}`);
  lines.push(`Author:      ${metadata.author || '(unknown)'}`);

  if (metadata.tags && metadata.tags.length > 0) {
    lines.push(`Tags:        ${metadata.tags.join(', ')}`);
  }

  // Tools info
  if (tools && tools.length > 0) {
    lines.push(`\n🔧 Tools: ${(tools as unknown[]).length}`);
  }

  // Aliases info
  if (aliases && aliases.length > 0) {
    lines.push(`📌 Aliases: ${(aliases as unknown[]).length}`);
  }

  // Capabilities
  if (capabilities) {
    lines.push('\n🔐 Capabilities:');
    const caps = [
      ['Read files', capabilities.canReadFiles],
      ['Write files', capabilities.canWriteFiles],
      ['Execute', capabilities.canExecuteCommands],
      ['Network', capabilities.canAccessNetwork],
      ['Storage', capabilities.canUseStorage],
      ['Spawn agents', capabilities.canSpawnAgents],
    ];
    for (const [name, enabled] of caps) {
      lines.push(`   ${enabled ? '✅' : '❌'} ${name}`);
    }
  }

  // Dependencies
  if (metadata.dependencies && metadata.dependencies.length > 0) {
    lines.push('\n🔗 Dependencies:');
    for (const dep of metadata.dependencies) {
      lines.push(`   - ${dep.pluginId}${dep.optional ? ' (optional)' : ''}`);
    }
  }

  // Health metrics
  if (health) {
    const successRate =
      health.toolCallsTotal > 0
        ? ((health.toolCallsSuccessful / health.toolCallsTotal) * 100).toFixed(
            1,
          )
        : '0';

    lines.push('\n🏥 Health:');
    lines.push(`   Status:      ${health.status}`);
    lines.push(`   Total calls: ${health.toolCallsTotal}`);
    lines.push(
      `   Success:     ${health.toolCallsSuccessful} (${successRate}%)`,
    );
    lines.push(`   Failed:      ${health.toolCallsFailed}`);
    lines.push(`   Avg time:    ${health.avgExecutionTimeMs.toFixed(2)}ms`);
    lines.push(`   Uptime:      ${formatUptime(health.uptimeMs)}`);

    if (health.lastError) {
      lines.push(`   Last error:  ${health.lastError}`);
    }
  }

  // Timestamps
  lines.push('\n📅 Timeline:');
  if (plugin.loadedAt) {
    lines.push(`   Loaded:  ${plugin.loadedAt.toLocaleString()}`);
  }
  if (plugin.enabledAt) {
    lines.push(`   Enabled: ${plugin.enabledAt.toLocaleString()}`);
  }

  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: lines.join('\n'),
    },
    Date.now(),
  );
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(0)}m`;
  if (ms < 86400000) return `${(ms / 3600000).toFixed(1)}h`;
  return `${(ms / 86400000).toFixed(1)}d`;
}

/**
 * Show help for the plugins command
 */
function showHelp(context: CommandContext): void {
  const helpText = `
📦 /plugins - Manage Ollama Code Plugins

Usage: /plugins <command> [arguments]

Commands:
  list              List all plugins with status (default)
  health            Show health metrics for all plugins
  reload [id]       Reload all plugins or a specific one
  enable <id>       Enable a disabled plugin
  disable <id>      Disable an enabled plugin
  info <id>         Show detailed plugin information

Examples:
  /plugins                  List all plugins
  /plugins health           Show health metrics
  /plugins reload           Reload all plugins
  /plugins reload core-tools     Reload specific plugin
  /plugins info memory-tools     Show plugin details
  /plugins enable search-tools   Enable a plugin
`;

  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: helpText,
    },
    Date.now(),
  );
}
