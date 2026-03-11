/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tool alias management for Ollama Code.
 *
 * IMPORTANT: Tools are NOT defined here!
 * The actual tool list comes from plugins via ToolRegistry.
 * - Tools are registered by plugins via registerPluginTools()
 * - Use ToolRegistry.getAllToolNames() / getAllTools() for the real tool list
 *
 * This file only manages:
 * - Dynamic aliases (learned from model mistakes)
 *
 * Legacy name migrations have been moved to plugin aliases.
 * See: packages/core/src/plugins/builtin/file-tools/index.ts
 * See: packages/core/src/plugins/builtin/search-tools/index.ts
 *
 * @see packages/core/src/plugins/pluginRegistry.ts - Plugin tool registration
 * @see packages/core/src/tools/tool-registry.ts - Dynamic tool registry
 */
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('PLUGIN_ALIASES');

/**
 * ToolName is now a dynamic string type.
 * Tools come from plugins, so we can't have a fixed list.
 * Use ToolRegistry.getAllToolNames() for the actual available tools.
 */
export type ToolName = string;

/**
 * Static tool aliases (empty - all aliases come from plugins).
 * Kept for backward compatibility.
 *
 * @deprecated Use DynamicAliases or plugin-defined aliases instead.
 */
export const ToolAliases: Record<string, string> = {
  // All aliases have been moved to plugins
  // See: packages/core/src/plugins/builtin/file-tools/index.ts
  // See: packages/core/src/plugins/builtin/search-tools/index.ts
  // Aliases are registered dynamically via registerPluginAliases()
};

/**
 * Dynamic aliases learned from model mistakes or added at runtime.
 */
export const DynamicAliases: Record<string, string> = {};

/**
 * Register aliases from a plugin.
 * These are added to DynamicAliases and take priority over ToolAliases.
 *
 * @param pluginId - The plugin ID (for logging)
 * @param aliases - Array of ToolAlias objects from the plugin
 * @returns Number of aliases registered
 */
export function registerPluginAliases(
  pluginId: string,
  aliases: Array<{
    alias: string;
    canonicalName: string;
    description?: string;
  }>,
): number {
  let registered = 0;
  let skipped = 0;

  for (const { alias, canonicalName } of aliases) {
    const normalizedAlias = alias.trim().toLowerCase();

    // Check if alias already exists
    if (normalizedAlias in DynamicAliases) {
      const existingCanonical = DynamicAliases[normalizedAlias];

      // If it maps to the same canonical name, it's just a duplicate - skip silently
      if (existingCanonical === canonicalName) {
        skipped++;
        continue;
      }

      // If it maps to a different canonical name, it's a conflict - warn
      debugLogger.warn(
        `Alias "${alias}" conflict: already maps to "${existingCanonical}", ` +
          `cannot remap to "${canonicalName}" (plugin: ${pluginId})`,
      );
      skipped++;
      continue;
    }

    DynamicAliases[normalizedAlias] = canonicalName;
    registered++;
  }

  if (registered > 0 || skipped > 0) {
    debugLogger.info(
      `Registered ${registered} aliases from plugin "${pluginId}"` +
        (skipped > 0 ? ` (skipped ${skipped} duplicates)` : ''),
    );
  }
  return registered;
}

/**
 * Unregister all aliases from a plugin.
 * Note: This removes all aliases that map to tools from this plugin.
 *
 * @param canonicalNames - Set of canonical tool names from the plugin
 * @returns Number of aliases removed
 */
export function unregisterPluginAliases(canonicalNames: Set<string>): number {
  let removed = 0;

  for (const [alias, canonicalName] of Object.entries(DynamicAliases)) {
    if (canonicalNames.has(canonicalName)) {
      delete DynamicAliases[alias];
      removed++;
    }
  }

  return removed;
}

/**
 * Get count of registered dynamic aliases
 */
export function getDynamicAliasCount(): number {
  return Object.keys(DynamicAliases).length;
}

/**
 * Resolves a tool name or alias to its canonical tool name.
 * If the name is not found in aliases, returns the original name.
 *
 * @param name - The tool name or alias to resolve
 * @returns The canonical tool name
 */
export function resolveToolAlias(name: string): string {
  const normalizedName = name.trim().toLowerCase();

  // Check dynamic aliases first (higher priority - from plugins)
  if (normalizedName in DynamicAliases) {
    return DynamicAliases[normalizedName];
  }

  // Check if it's a direct alias (static - from tool-names.ts)
  if (normalizedName in ToolAliases) {
    return ToolAliases[normalizedName];
  }

  // Return original name if no alias found
  return name;
}
