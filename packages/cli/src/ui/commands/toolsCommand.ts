/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type CommandContext,
  type SlashCommand,
  CommandKind,
} from './types.js';
import { MessageType, type HistoryItemToolsList } from '../types.js';
import { t } from '../../i18n/index.js';

/**
 * Extended tool definition with plugin information
 */
interface ToolInfo {
  name: string;
  displayName: string;
  description: string;
  pluginId?: string;
  pluginName?: string;
}

export const toolsCommand: SlashCommand = {
  name: 'tools',
  get description() {
    return t('List available tools from plugins. Usage: /tools [brief|short]');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string): Promise<void> => {
    const subCommand = args?.trim().toLowerCase();

    // Default to showing descriptions. User can hide with 'brief' or 'short'.
    let useShowDescriptions = true;
    if (subCommand === 'brief' || subCommand === 'short') {
      useShowDescriptions = false;
    }

    const toolRegistry = context.services.config?.getToolRegistry();
    const pluginRegistry = context.services.config?.getPluginRegistry?.();

    if (!toolRegistry) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t('Could not retrieve tool registry.'),
        },
        Date.now(),
      );
      return;
    }

    // Get all tools from registry (populated by plugins)
    const tools = toolRegistry.getAllTools();
    
    // Filter out MCP tools (they have serverName property)
    const pluginTools = tools.filter((tool) => !('serverName' in tool));

    // Build tool info with plugin data
    const toolInfos: ToolInfo[] = pluginTools.map((tool) => {
      // Try to determine plugin from tool name (format: "pluginId:toolName" or just "toolName")
      let pluginId: string | undefined;
      let pluginName: string | undefined;
      let toolName = tool.name;
      
      if (tool.name.includes(':')) {
        const parts = tool.name.split(':');
        pluginId = parts[0];
        toolName = parts[1] || tool.name;
      }

      // Get plugin name from plugin registry
      if (pluginId && pluginRegistry) {
        const plugins = pluginRegistry.getLoadedPlugins();
        const plugin = plugins.find(p => p.definition.metadata.id === pluginId);
        if (plugin) {
          pluginName = plugin.definition.metadata.name;
        }
      }

      return {
        name: toolName,
        displayName: tool.displayName || toolName,
        description: tool.description || '',
        pluginId,
        pluginName,
      };
    });

    // Sort by plugin name, then by tool name
    toolInfos.sort((a, b) => {
      const pluginA = a.pluginName || a.pluginId || 'core';
      const pluginB = b.pluginName || b.pluginId || 'core';
      if (pluginA !== pluginB) {
        return pluginA.localeCompare(pluginB);
      }
      return a.displayName.localeCompare(b.displayName);
    });

    const toolsListItem: HistoryItemToolsList = {
      type: MessageType.TOOLS_LIST,
      tools: toolInfos,
      showDescriptions: useShowDescriptions,
    };

    context.ui.addItem(toolsListItem, Date.now());
  },
};
