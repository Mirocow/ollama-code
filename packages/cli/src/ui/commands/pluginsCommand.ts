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

// ═══════════════════════════════════════════════════════════════════════════
// Plugin Registry Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all plugins with their status
 */
async function listAction(context: CommandContext): Promise<void> {
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
async function healthAction(context: CommandContext): Promise<void> {
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
 * Show detailed plugin info
 */
async function infoAction(context: CommandContext, args: string): Promise<void> {
  const pluginId = args.trim();
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
 * Enable a plugin
 */
async function enableAction(context: CommandContext, args: string): Promise<void> {
  const pluginId = args.trim();
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
async function disableAction(context: CommandContext, args: string): Promise<void> {
  const pluginId = args.trim();
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
 * Reload plugins
 */
async function reloadAction(context: CommandContext, args: string): Promise<void> {
  const pluginId = args.trim();
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

  if (pluginId) {
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
  } else {
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
}

// ═══════════════════════════════════════════════════════════════════════════
// Marketplace Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search marketplace for plugins
 */
async function searchAction(context: CommandContext, args: string): Promise<void> {
  const query = args.trim();
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
async function installAction(context: CommandContext, args: string): Promise<void> {
  const pluginId = args.trim();

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
async function updateAction(context: CommandContext, args: string): Promise<void> {
  const pluginId = args.trim();
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
async function uninstallAction(context: CommandContext, args: string): Promise<void> {
  const pluginId = args.trim();

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

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

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
 * Complete plugin IDs for autocomplete
 */
async function completePlugins(
  context: CommandContext,
  partialArg: string,
): Promise<string[]> {
  const registry = context.services.config?.getPluginRegistry?.();
  if (!registry) return [];

  let plugins = registry.getLoadedPlugins();

  if (context.invocation?.name === 'enable') {
    plugins = plugins.filter((p) => !registry.getEnabledPlugins().includes(p));
  }
  if (context.invocation?.name === 'disable') {
    plugins = plugins.filter((p) => registry.getEnabledPlugins().includes(p));
  }

  const pluginIds = plugins.map((p) => p.definition.metadata.id);
  return pluginIds.filter((id) => id.startsWith(partialArg));
}

// ═══════════════════════════════════════════════════════════════════════════
// SubCommand Definitions
// ═══════════════════════════════════════════════════════════════════════════

const listCommand: SlashCommand = {
  name: 'list',
  get description() {
    return t('List all plugins with status (default action). Usage: /plugins list');
  },
  kind: CommandKind.BUILT_IN,
  action: listAction,
};

const healthCommand: SlashCommand = {
  name: 'health',
  get description() {
    return t('Show health metrics for all plugins. Usage: /plugins health');
  },
  kind: CommandKind.BUILT_IN,
  action: healthAction,
};

const infoCommand: SlashCommand = {
  name: 'info',
  get description() {
    return t('Show detailed plugin information. Usage: /plugins info <plugin-id>');
  },
  kind: CommandKind.BUILT_IN,
  action: infoAction,
  completion: completePlugins,
};

const enableCommand: SlashCommand = {
  name: 'enable',
  get description() {
    return t('Enable a disabled plugin. Usage: /plugins enable <plugin-id>');
  },
  kind: CommandKind.BUILT_IN,
  action: enableAction,
  completion: completePlugins,
};

const disableCommand: SlashCommand = {
  name: 'disable',
  get description() {
    return t('Disable an enabled plugin. Usage: /plugins disable <plugin-id>');
  },
  kind: CommandKind.BUILT_IN,
  action: disableAction,
  completion: completePlugins,
};

const reloadCommand: SlashCommand = {
  name: 'reload',
  get description() {
    return t('Reload all plugins or a specific one. Usage: /plugins reload [plugin-id]');
  },
  kind: CommandKind.BUILT_IN,
  action: reloadAction,
  completion: completePlugins,
};

const searchCommand: SlashCommand = {
  name: 'search',
  get description() {
    return t('Search marketplace for plugins. Usage: /plugins search [query]');
  },
  kind: CommandKind.BUILT_IN,
  action: searchAction,
};

const installCommand: SlashCommand = {
  name: 'install',
  get description() {
    return t('Install plugin from marketplace. Usage: /plugins install <plugin-id>');
  },
  kind: CommandKind.BUILT_IN,
  action: installAction,
};

const updateCommand: SlashCommand = {
  name: 'update',
  get description() {
    return t('Update plugin(s) from marketplace. Usage: /plugins update [plugin-id]');
  },
  kind: CommandKind.BUILT_IN,
  action: updateAction,
  completion: completePlugins,
};

const uninstallCommand: SlashCommand = {
  name: 'uninstall',
  get description() {
    return t('Uninstall a plugin. Usage: /plugins uninstall <plugin-id>');
  },
  kind: CommandKind.BUILT_IN,
  action: uninstallAction,
  completion: completePlugins,
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Command Export
// ═══════════════════════════════════════════════════════════════════════════

export const pluginsCommand: SlashCommand = {
  name: 'plugins',
  get description() {
    return t('Manage plugins. Subcommands: list, health, info, enable, disable, reload, search, install, update, uninstall');
  },
  kind: CommandKind.BUILT_IN,
  subCommands: [
    listCommand,
    healthCommand,
    infoCommand,
    enableCommand,
    disableCommand,
    reloadCommand,
    searchCommand,
    installCommand,
    updateCommand,
    uninstallCommand,
  ],
  action: (context, args) =>
    // Default to list if no subcommand is provided
    listCommand.action!(context, args),
};
