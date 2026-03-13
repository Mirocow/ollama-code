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
import {
  createPluginMarketplace,
} from '@ollama-code/ollama-code-core';

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
 *   /plugins search <q>   - Search marketplace for plugins
 *   /plugins install <id> - Install plugin from marketplace
 *   /plugins update [id]  - Update plugin(s) from marketplace
 *   /plugins uninstall <id> - Uninstall a plugin
 */
export const pluginsCommand: SlashCommand = {
  name: 'plugins',
  get description() {
    return t(
      'Manage plugins. Usage: /plugins [list|health|reload|enable|disable|info|search|install|update|uninstall]',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string): Promise<void> => {
    const parts = args?.trim().split(/\s+/) || [];
    const subCommand = parts[0] || 'list';
    const pluginId = parts[1];
    const searchQuery = parts.slice(1).join(' ');

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

      case 'search':
        await searchMarketplace(context, searchQuery);
        break;

      case 'install':
        if (!pluginId) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /plugins install <plugin-id>'),
            },
            Date.now(),
          );
          return;
        }
        await installFromMarketplace(context, pluginId);
        break;

      case 'update':
        await updateFromMarketplace(context, pluginId);
        break;

      case 'uninstall':
        if (!pluginId) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /plugins uninstall <plugin-id>'),
            },
            Date.now(),
          );
          return;
        }
        await uninstallPlugin(context, pluginId);
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
  list                List all plugins with status (default)
  health              Show health metrics for all plugins
  reload [id]         Reload all plugins or a specific one
  enable <id>         Enable a disabled plugin
  disable <id>        Disable an enabled plugin
  info <id>           Show detailed plugin information

Marketplace:
  search <query>      Search marketplace for plugins
  install <id>        Install plugin from marketplace
  update [id]         Update plugin(s) from marketplace
  uninstall <id>      Uninstall a plugin

Examples:
  /plugins                    List all plugins
  /plugins health             Show health metrics
  /plugins search weather     Search for weather plugins
  /plugins install weather    Install weather plugin
  /plugins update             Update all plugins
  /plugins info search-tools  Show plugin details
`;
  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: helpText,
    },
    Date.now(),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Marketplace Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search marketplace for plugins
 */
async function searchMarketplace(
  context: CommandContext,
  query: string,
): Promise<void> {
  const marketplace = createPluginMarketplace(process.cwd());

  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: t(`🔍 Searching marketplace for: "${query || 'all plugins'}"...`),
    },
    Date.now(),
  );

  try {
    const plugins = await marketplace.search({
      query,
      limit: 20,
      sortBy: 'downloads',
    });

    if (plugins.length === 0) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(`No plugins found. Try a different search term.

💡 Tip: Plugin packages on npm are named:
   • ollama-code-plugin-<name>  (e.g., ollama-code-plugin-weather)
   • @ollama-code/<name>        (e.g., @ollama-code/weather)

To publish your plugin:
   1. Name your package: ollama-code-plugin-<name>
   2. Add keyword: "ollama-code-plugin"
   3. Publish to npm: npm publish

See examples/ folder for sample plugins.`),
        },
        Date.now(),
      );
      return;
    }

    const lines: string[] = [`🔍 Found ${plugins.length} plugins:\n`];

    for (const plugin of plugins) {
      const statusBadge = plugin.installed
        ? plugin.updateAvailable
          ? '📦⬆️'
          : '📦✓'
        : '📦';
      const trustBadge = plugin.verified ? '✓' : '○';

      lines.push(
        `  ${statusBadge} ${plugin.name} (${plugin.id}) v${plugin.version} [${trustBadge}]`,
      );

      if (plugin.description) {
        const desc =
          plugin.description.length > 60
            ? plugin.description.substring(0, 57) + '...'
            : plugin.description;
        lines.push(`      ${desc}`);
      }
    }

    lines.push('');
    lines.push('Legend:');
    lines.push('  📦 = Available  📦✓ = Installed  📦⬆️ = Update available');
    lines.push('  ✓ = Verified  ○ = Community');
    lines.push('\nUse /plugins info <id> for details.');
    lines.push('Use /plugins install <id> to install.');

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
        text: t(`Search failed: ${error}`),
      },
      Date.now(),
    );
  }
}

/**
 * Install plugin from marketplace
 */
async function installFromMarketplace(
  context: CommandContext,
  pluginId: string,
): Promise<void> {
  const marketplace = createPluginMarketplace(process.cwd());

  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: t(`📥 Installing plugin: ${pluginId}...`),
    },
    Date.now(),
  );

  try {
    const result = await marketplace.install(pluginId, { global: true });

    if (result.success) {
      const lines: string[] = [`✅ ${result.message}`];
      if (result.plugin) {
        lines.push(`   Installed to: ${result.plugin.installedPath}`);
        lines.push('\nTo use the plugin, restart Ollama Code or run:');
        lines.push(`  /plugins enable ${result.plugin.id}`);
      }

      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: lines.join('\n'),
        },
        Date.now(),
      );
    } else {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t(`❌ ${result.message}`),
        },
        Date.now(),
      );
    }
  } catch (error) {
    context.ui.addItem(
      {
        type: MessageType.ERROR,
        text: t(`Installation failed: ${error}`),
      },
      Date.now(),
    );
  }
}

/**
 * Update plugin(s) from marketplace
 */
async function updateFromMarketplace(
  context: CommandContext,
  pluginId?: string,
): Promise<void> {
  const marketplace = createPluginMarketplace(process.cwd());

  if (pluginId) {
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t(`🔄 Updating plugin: ${pluginId}...`),
      },
      Date.now(),
    );

    try {
      const result = await marketplace.update(pluginId);

      if (result.success) {
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t(`✅ ${result.message}`),
          },
          Date.now(),
        );
      } else {
        context.ui.addItem(
          {
            type: MessageType.ERROR,
            text: t(`❌ ${result.message}`),
          },
          Date.now(),
        );
      }
    } catch (error) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t(`Update failed: ${error}`),
        },
        Date.now(),
      );
    }
  } else {
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t('🔄 Checking for plugin updates...'),
      },
      Date.now(),
    );

    try {
      const results = await marketplace.updateAll({ checkOnly: true });

      if (results.length === 0) {
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('No plugins installed.'),
          },
          Date.now(),
        );
        return;
      }

      const lines: string[] = ['📋 Update Check Results:\n'];

      for (const result of results) {
        if (result.success) {
          lines.push(`  ✅ ${result.pluginId}: ${result.message}`);
        } else {
          lines.push(`  ❌ ${result.pluginId}: ${result.message}`);
        }
      }

      lines.push('\nUse /plugins update <id> to update a specific plugin.');

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
          text: t(`Update check failed: ${error}`),
        },
        Date.now(),
      );
    }
  }
}

/**
 * Uninstall a plugin
 */
async function uninstallPlugin(
  context: CommandContext,
  pluginId: string,
): Promise<void> {
  const marketplace = createPluginMarketplace(process.cwd());

  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: t(`🗑️ Uninstalling plugin: ${pluginId}...`),
    },
    Date.now(),
  );

  try {
    const result = await marketplace.uninstall(pluginId, { global: true });

    if (result.success) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(`✅ ${result.message}`),
        },
        Date.now(),
      );
    } else {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t(`❌ ${result.message}`),
        },
        Date.now(),
      );
    }
  } catch (error) {
    context.ui.addItem(
      {
        type: MessageType.ERROR,
        text: t(`Uninstall failed: ${error}`),
      },
      Date.now(),
    );
  }
}
