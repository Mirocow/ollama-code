/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Plugin Registry - Created with GLM-5 from Z.AI
 */

/**
 * Plugin Registry Integration
 *
 * Integrates the plugin system with ToolRegistry.
 * Handles loading builtin plugins and registering their tools.
 */

import { pluginManager } from './pluginManager.js';
import { createPluginLoader, registerPluginTools } from './index.js';
import { createPluginConfig } from './pluginConfig.js';
import type { PluginConfig } from './pluginConfig.js';
import type { ToolRegistry } from '../tools/tool-registry.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import type {
  PluginDefinition,
  PluginTool,
  UnifiedToolItem,
  PluginHealth,
  DependencyValidationResult,
  PluginLoadOrder,
} from './types.js';
import type { Config } from '../config/config.js';
import { uiTelemetryService } from '../services/uiTelemetryService.js';
import { BuiltinAgentRegistry } from '../subagents/builtin-agents.js';
import {
  registerPluginAliases,
  unregisterPluginAliases,
  getDynamicAliasCount,
} from '../tools/tool-names.js';
import {
  setPluginToolContextProvider,
  type PluginToolContextProvider,
} from './pluginToolAdapter.js';

// ============================================================================
// Static imports for builtin plugins (required for esbuild bundling)
// ============================================================================
import * as coreToolsPlugin from './builtin/core-tools/index.js';
import * as fileToolsPlugin from './builtin/file-tools/index.js';
import * as shellToolsPlugin from './builtin/shell-tools/index.js';
import * as sshToolsPlugin from './builtin/ssh-tools/index.js';
import * as searchToolsPlugin from './builtin/search-tools/index.js';
import * as devToolsPlugin from './builtin/dev-tools/index.js';
import * as agentToolsPlugin from './builtin/agent-tools/index.js';
import * as memoryToolsPlugin from './builtin/memory-tools/index.js';
import * as storageToolsPlugin from './builtin/storage-tools/index.js';
import * as productivityToolsPlugin from './builtin/productivity-tools/index.js';
import * as apiToolsPlugin from './builtin/api-tools/index.js';
import * as databaseToolsPlugin from './builtin/database-tools/index.js';
import * as gitToolsPlugin from './builtin/git-tools/index.js';
import * as lspToolsPlugin from './builtin/lsp-tools/index.js';
import * as mcpToolsPlugin from './builtin/mcp-tools/index.js';
import * as codeAnalysisToolsPlugin from './builtin/code-analysis-tools/index.js';

const debugLogger = createDebugLogger('PLUGIN_REGISTRY');

// ============================================================================
// Type Guards for Unified Tool Detection
// ============================================================================

/**
 * Check if an item is a PluginTool object (has execute method)
 */
function isPluginTool(item: unknown): item is PluginTool {
  return (
    typeof item === 'object' &&
    item !== null &&
    'execute' in item &&
    typeof (item as PluginTool).execute === 'function'
  );
}

/**
 * Check if an item is a tool class constructor (has prototype)
 * Tool classes are constructors that can be instantiated with `new`
 */
function isToolClass(item: unknown): boolean {
  if (typeof item !== 'function') return false;
  // Check if it's a class constructor (has prototype and prototype.constructor points to itself)
  const fn = item as (...args: unknown[]) => unknown;
  return fn.prototype !== undefined && fn.prototype.constructor === item;
}

/**
 * Check if a tool class constructor requires Config parameter
 * This is determined by checking the constructor parameter count
 * Most tool classes that need config have exactly 1 parameter
 */
function toolClassNeedsConfig(
  item: abstract new (...args: unknown[]) => unknown,
): boolean {
  // Check if the constructor has parameters
  // For classes that extend BaseDeclarativeTool, if they have a config parameter,
  // the constructor will typically have 1 parameter
  try {
    // Get the string representation of the constructor
    const str = item.toString();
    // Check if constructor has parameters - looks for "constructor(" with content inside
    const constructorMatch = str.match(/constructor\s*\(([^)]*)\)/);
    if (constructorMatch) {
      const params = constructorMatch[1].trim();
      // If there are parameters and they're not empty, it likely needs config
      return params.length > 0;
    }
    // Also check the class signature for "private readonly config" pattern
    if (
      str.includes('private readonly config') ||
      str.includes('private config')
    ) {
      return true;
    }
    return false;
  } catch {
    // If we can't determine, assume it needs config to be safe
    return true;
  }
}

/**
 * Check if an item is a tool factory function (function without class prototype)
 * Factory functions take config and return tool instances
 */
function isToolFactory(item: unknown): boolean {
  return typeof item === 'function' && !isToolClass(item);
}

/**
 * Check if an item is a tool instance (object that looks like a tool but not a PluginTool)
 * Tool instances are already instantiated and can be registered directly
 */
function isToolInstance(item: unknown): boolean {
  // It's an object but not a PluginTool (no execute method)
  // and not a function (not a class or factory)
  return typeof item === 'object' && item !== null && !isPluginTool(item);
}

/**
 * Plugin Registry - Manages plugin integration with ToolRegistry
 */
export class PluginRegistry {
  private initialized = false;
  private toolRegistry: ToolRegistry | null = null;
  private config: Config | null = null;
  private projectRoot: string;
  private pluginConfig: PluginConfig;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.pluginConfig = createPluginConfig(this.projectRoot);
  }

  /**
   * Initialize the plugin registry with a tool registry and config
   */
  async initialize(toolRegistry: ToolRegistry, config?: Config): Promise<void> {
    if (this.initialized) {
      debugLogger.warn('Plugin registry already initialized');
      return;
    }

    this.toolRegistry = toolRegistry;
    this.config = config || null;

    debugLogger.info(
      `Initializing plugin registry with config: ${this.config ? 'provided' : 'NOT provided'}`,
    );

    // Set tool registry in plugin manager for cross-plugin tool execution
    pluginManager.setToolRegistry(toolRegistry);
    debugLogger.info(
      'ToolRegistry set in PluginManager for cross-plugin tool execution',
    );

    if (!this.config) {
      debugLogger.warn(
        'Config not provided to plugin registry - factory tools will NOT be registered!',
      );
    }

    // Load builtin plugins
    await this.loadBuiltinPlugins();

    this.initialized = true;
    debugLogger.info('Plugin registry initialized');
  }

  /**
   * Load builtin plugins
   */
  private async loadBuiltinPlugins(): Promise<void> {
    try {
      // Import builtin plugins dynamically
      debugLogger.info('Loading builtin plugins...');
      const builtinPlugins = await this.importBuiltinPlugins();
      let enabledCount = 0;
      let loadedCount = 0;
      let totalAliases = 0;
      let totalTools = 0;

      debugLogger.info(
        `Found ${builtinPlugins.length} builtin plugins to load`,
      );

      for (const plugin of builtinPlugins) {
        try {
          loadedCount++;
          const pluginId = plugin.metadata.id;
          const pluginName = plugin.metadata.name;
          const toolCount = plugin.tools?.length || 0;
          const aliasCount = plugin.aliases?.length || 0;

          debugLogger.debug(
            `Processing plugin ${loadedCount}/${builtinPlugins.length}: ${pluginName} (${toolCount} tools, ${aliasCount} aliases)`,
          );

          // Check if plugin is enabled via configuration
          const isEnabled = this.pluginConfig.isEnabled(
            plugin.metadata.id,
            plugin.metadata.enabledByDefault ?? true,
          );

          if (!isEnabled) {
            debugLogger.info(
              `Plugin ${pluginId} is disabled via configuration`,
            );
            continue;
          }

          await pluginManager.registerPlugin(plugin);
          await pluginManager.enablePlugin(plugin.metadata.id);
          enabledCount++;

          // Register tools from unified tools array
          if (plugin.tools && this.toolRegistry) {
            const beforeCount = this.toolRegistry.getAllToolNames().length;
            await this.registerUnifiedTools(plugin.tools, plugin.metadata.id);
            const afterCount = this.toolRegistry.getAllToolNames().length;
            const registered = afterCount - beforeCount;
            totalTools += registered;
            debugLogger.debug(
              `Plugin ${pluginId}: registered ${registered} tools (total: ${afterCount})`,
            );
          } else if (!this.toolRegistry) {
            debugLogger.error(
              `Cannot register tools for ${pluginId}: toolRegistry not available`,
            );
          }

          // Register aliases from plugin
          if (plugin.aliases && plugin.aliases.length > 0) {
            const registered = registerPluginAliases(
              plugin.metadata.id,
              plugin.aliases,
            );
            totalAliases += registered;
          }

          debugLogger.info(`Loaded builtin plugin: ${pluginName}`);
        } catch (error) {
          debugLogger.error(
            `Failed to load builtin plugin ${plugin.metadata?.id || 'unknown'}:`,
            error,
          );
        }
      }

      // Update telemetry with plugin counts
      uiTelemetryService.setPluginCounts(loadedCount, enabledCount);
      debugLogger.info(
        `Loaded ${enabledCount}/${loadedCount} builtin plugins with ${totalTools} tools and ${totalAliases} aliases`,
      );

      // Log final tool count
      if (this.toolRegistry) {
        const finalToolCount = this.toolRegistry.getAllToolNames().length;
        debugLogger.info(`Total tools in registry: ${finalToolCount}`);
        uiTelemetryService.setToolCount(finalToolCount);
      }
    } catch (error) {
      debugLogger.error('Failed to load builtin plugins:', error);
    }
  }

  /**
   * Register tools from unified tools array
   * Handles PluginTool objects, tool classes, factory functions, and tool instances
   */
  private async registerUnifiedTools(
    tools: UnifiedToolItem[],
    pluginId: string,
  ): Promise<void> {
    if (!this.toolRegistry) {
      debugLogger.warn(
        `Cannot register tools for plugin ${pluginId}: toolRegistry is null`,
      );
      return;
    }

    debugLogger.info(
      `Registering ${tools.length} tools from plugin ${pluginId}`,
    );
    let registeredCount = 0;

    for (const item of tools) {
      try {
        if (isPluginTool(item)) {
          // PluginTool object - register via registerPluginTools
          const toolName = (item as { name?: string })?.name || 'unknown';
          debugLogger.debug(
            `Registering PluginTool: ${toolName} from ${pluginId}`,
          );
          registerPluginTools([item], pluginId, (tool) =>
            this.toolRegistry!.registerTool(tool),
          );
          registeredCount++;
        } else if (isToolClass(item)) {
          // Tool class constructor - check if config is needed
          const className = (item as { name?: string })?.name || 'unknown';
          debugLogger.debug(
            `Detected tool class: ${className} from ${pluginId}`,
          );

          // Check if this tool class requires Config parameter
          const needsConfig = toolClassNeedsConfig(
            item as abstract new (...args: unknown[]) => unknown,
          );
          debugLogger.debug(
            `Tool class ${className} needs config: ${needsConfig}`,
          );

          if (needsConfig) {
            // Tool needs config - check if config is available
            if (!this.config) {
              debugLogger.error(
                `Cannot register tool class ${className}: requires Config but config is not available`,
              );
              continue; // Skip this tool
            }

            // Instantiate with config
            try {
              const toolInstance = new (item as new (
                config: unknown,
              ) => unknown)(this.config);
              const toolName =
                (toolInstance as { name?: string })?.name || className;
              this.toolRegistry.registerTool(
                toolInstance as Parameters<
                  typeof this.toolRegistry.registerTool
                >[0],
              );
              debugLogger.info(
                `Registered tool class with config: ${toolName}`,
              );
              registeredCount++;
            } catch (e) {
              debugLogger.error(
                `Failed to register tool class ${className}: ${e}`,
              );
            }
          } else {
            // Tool doesn't need config - instantiate without it
            try {
              const toolInstance = new (item as new () => unknown)();
              const toolName =
                (toolInstance as { name?: string })?.name || className;
              this.toolRegistry.registerTool(
                toolInstance as Parameters<
                  typeof this.toolRegistry.registerTool
                >[0],
              );
              debugLogger.info(`Registered tool class instance: ${toolName}`);
              registeredCount++;
            } catch (e) {
              debugLogger.error(
                `Failed to register tool class ${className} without config: ${e}`,
              );
            }
          }
        } else if (isToolFactory(item)) {
          // Factory function - needs config
          debugLogger.debug(`Detected factory function from ${pluginId}`);
          if (this.config) {
            const toolInstance = (item as (config: unknown) => unknown)(
              this.config,
            );
            const toolName =
              (toolInstance as { name?: string })?.name || 'unknown';
            debugLogger.info(
              `Registering factory tool: ${toolName} from plugin ${pluginId}`,
            );
            this.toolRegistry.registerTool(
              toolInstance as Parameters<
                typeof this.toolRegistry.registerTool
              >[0],
            );
            debugLogger.info(`Successfully registered tool: ${toolName}`);
            registeredCount++;
          } else {
            debugLogger.error(
              `Cannot register tool factory from plugin ${pluginId}: config is null`,
            );
          }
        } else if (isToolInstance(item)) {
          // Tool instance - already instantiated, register directly
          const toolName = (item as { name?: string })?.name || 'unknown';
          debugLogger.debug(`Registering tool instance: ${toolName}`);
          this.toolRegistry.registerTool(
            item as Parameters<typeof this.toolRegistry.registerTool>[0],
          );
          registeredCount++;
        } else {
          debugLogger.warn(
            `Unknown tool item type in plugin ${pluginId}: ${typeof item}`,
          );
        }
      } catch (error) {
        debugLogger.error(
          `Failed to register tool in plugin ${pluginId}:`,
          error,
        );
      }
    }

    debugLogger.info(
      `Registered ${registeredCount}/${tools.length} tools from plugin ${pluginId}`,
    );
  }

  /**
   * Import builtin plugins
   */
  private async importBuiltinPlugins(): Promise<PluginDefinition[]> {
    const plugins: PluginDefinition[] = [];

    // Use statically imported modules (required for esbuild bundling)
    const pluginModules = [
      { path: 'core-tools', module: coreToolsPlugin },
      { path: 'file-tools', module: fileToolsPlugin },
      { path: 'shell-tools', module: shellToolsPlugin },
      { path: 'ssh-tools', module: sshToolsPlugin },
      { path: 'search-tools', module: searchToolsPlugin },
      { path: 'dev-tools', module: devToolsPlugin },
      { path: 'agent-tools', module: agentToolsPlugin },
      { path: 'memory-tools', module: memoryToolsPlugin },
      { path: 'storage-tools', module: storageToolsPlugin },
      { path: 'productivity-tools', module: productivityToolsPlugin },
      { path: 'api-tools', module: apiToolsPlugin },
      { path: 'database-tools', module: databaseToolsPlugin },
      { path: 'git-tools', module: gitToolsPlugin },
      { path: 'lsp-tools', module: lspToolsPlugin },
      { path: 'mcp-tools', module: mcpToolsPlugin },
      { path: 'code-analysis-tools', module: codeAnalysisToolsPlugin },
    ];

    debugLogger.debug(
      `Importing ${pluginModules.length} builtin plugin modules...`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const { path: modulePath, module } of pluginModules) {
      try {
        if (module.default) {
          const pluginId =
            (module.default as { metadata?: { id?: string } })?.metadata?.id ||
            modulePath;
          plugins.push(module.default);
          successCount++;
          debugLogger.debug(`Successfully imported plugin: ${pluginId}`);
        } else {
          debugLogger.warn(`Plugin ${modulePath} has no default export`);
          failCount++;
        }
      } catch (error) {
        // Log the full error for debugging
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        debugLogger.error(
          `Failed to import plugin ${modulePath}: ${errorMessage}`,
        );
        failCount++;
      }
    }

    debugLogger.info(
      `Imported ${successCount} plugins successfully, ${failCount} failed`,
    );
    return plugins;
  }

  /**
   * Discover and load external plugins
   */
  async discoverExternalPlugins(): Promise<{
    loaded: string[];
    failed: string[];
  }> {
    if (!this.toolRegistry) {
      throw new Error('Plugin registry not initialized');
    }

    const loader = createPluginLoader(pluginManager, this.projectRoot);
    const discovered = await loader.discoverPlugins();

    // Filter out already loaded builtin plugins
    const externalPlugins = discovered.filter(
      (p) => p.type !== 'builtin' && p.valid,
    );

    const result = await loader.loadAllPlugins(externalPlugins);

    // Register tools using unified method
    for (const pluginId of result.loaded) {
      const plugin = pluginManager.getPlugin(pluginId);
      if (plugin?.definition.tools) {
        await this.registerUnifiedTools(plugin.definition.tools, pluginId);
      }
    }

    return result;
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): Array<import('./types.js').PluginInstance> {
    return pluginManager.getAllPlugins();
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): Array<import('./types.js').PluginInstance> {
    return pluginManager.getEnabledPlugins();
  }

  /**
   * Get plugin configuration
   */
  getPluginConfig(): PluginConfig {
    return this.pluginConfig;
  }

  /**
   * Check if a plugin is enabled via configuration
   */
  isPluginEnabled(pluginId: string, defaultEnabled?: boolean): boolean {
    return this.pluginConfig.isEnabled(pluginId, defaultEnabled);
  }

  /**
   * Enable a plugin via configuration
   */
  setPluginEnabled(pluginId: string, enabled: boolean): void {
    if (enabled) {
      this.pluginConfig.enablePlugin(pluginId);
    } else {
      this.pluginConfig.disablePlugin(pluginId);
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    await pluginManager.enablePlugin(pluginId);

    // Register tools if tool registry is available
    if (this.toolRegistry) {
      const plugin = pluginManager.getPlugin(pluginId);
      if (plugin?.definition.tools) {
        await this.registerUnifiedTools(plugin.definition.tools, pluginId);
      }

      // Register aliases from plugin
      if (plugin?.definition.aliases && plugin.definition.aliases.length > 0) {
        registerPluginAliases(pluginId, plugin.definition.aliases);
      }
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = pluginManager.getPlugin(pluginId);

    // Collect canonical names for alias cleanup
    const canonicalNames = new Set<string>();
    if (plugin?.definition.aliases) {
      for (const alias of plugin.definition.aliases) {
        canonicalNames.add(alias.canonicalName);
      }
    }

    // Unregister aliases
    if (canonicalNames.size > 0) {
      const removed = unregisterPluginAliases(canonicalNames);
      debugLogger.info(
        `Unregistered ${removed} aliases for disabled plugin ${pluginId}`,
      );
    }

    // Unregister tools from ToolRegistry
    if (this.toolRegistry) {
      const removed = this.toolRegistry.unregisterToolsByPlugin(pluginId);
      if (removed > 0) {
        debugLogger.info(
          `Unregistered ${removed} tools for disabled plugin ${pluginId}`,
        );
      }
    }

    await pluginManager.disablePlugin(pluginId);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get plugin manager
   */
  getPluginManager(): typeof pluginManager {
    return pluginManager;
  }

  /**
   * Get list of available builtin plugin categories
   */
  getBuiltinPluginCategories(): string[] {
    return [
      'core-tools',
      'file-tools',
      'shell-tools',
      'ssh-tools',
      'search-tools',
      'dev-tools',
      'agent-tools',
      'memory-tools',
      'storage-tools',
      'productivity-tools',
      'api-tools',
      'database-tools',
      'git-tools',
      'lsp-tools',
      'mcp-tools',
    ];
  }

  /**
   * Get plugin metrics for telemetry
   */
  getMetrics(): {
    loadedPlugins: number;
    enabledPlugins: number;
    toolCount: number;
    aliasCount: number;
    skillCount: number;
    disabledPlugins: string[];
  } {
    const allPlugins = this.getLoadedPlugins();
    const enabledPlugins = this.getEnabledPlugins();
    const disabledPlugins = this.pluginConfig.getDisabledPlugins();
    const toolCount = this.toolRegistry?.getAllToolNames().length ?? 0;
    const aliasCount = getDynamicAliasCount();
    const skillCount = BuiltinAgentRegistry.getBuiltinAgentNames().length;

    // Update telemetry
    uiTelemetryService.setToolCount(toolCount);
    uiTelemetryService.setSkillCount(skillCount);

    return {
      loadedPlugins: allPlugins.length,
      enabledPlugins: enabledPlugins.length,
      toolCount,
      aliasCount,
      skillCount,
      disabledPlugins,
    };
  }

  // ============================================================================
  // Hot Reload Support
  // ============================================================================

  /**
   * Hot reload a plugin - useful for development
   * Unregisters, re-registers, and re-enables the plugin
   */
  async reloadPlugin(
    pluginId: string,
    newDefinition?: PluginDefinition,
  ): Promise<void> {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }

    debugLogger.info(`Reloading plugin: ${pluginId}`);

    // Unregister tools from ToolRegistry
    if (this.toolRegistry) {
      this.toolRegistry.unregisterToolsByPlugin(pluginId);
    }

    // Unregister aliases
    const canonicalNames = new Set<string>();
    if (plugin.definition.aliases) {
      for (const alias of plugin.definition.aliases) {
        canonicalNames.add(alias.canonicalName);
      }
    }
    if (canonicalNames.size > 0) {
      unregisterPluginAliases(canonicalNames);
    }

    // Reload via plugin manager
    await pluginManager.reloadPlugin(pluginId, newDefinition);

    // Re-register tools
    const reloadedPlugin = pluginManager.getPlugin(pluginId);
    if (reloadedPlugin?.definition.tools && this.toolRegistry) {
      await this.registerUnifiedTools(
        reloadedPlugin.definition.tools,
        pluginId,
      );
    }

    // Re-register aliases
    if (
      reloadedPlugin?.definition.aliases &&
      reloadedPlugin.definition.aliases.length > 0
    ) {
      registerPluginAliases(pluginId, reloadedPlugin.definition.aliases);
    }

    debugLogger.info(`Plugin "${pluginId}" reloaded successfully`);
  }

  /**
   * Reload all plugins
   */
  async reloadAllPlugins(): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };
    const pluginIds = pluginManager
      .getAllPlugins()
      .map((p) => p.definition.metadata.id);

    for (const pluginId of pluginIds) {
      try {
        await this.reloadPlugin(pluginId);
        results.success.push(pluginId);
      } catch (error) {
        debugLogger.error(`Failed to reload plugin ${pluginId}:`, error);
        results.failed.push(pluginId);
      }
    }

    return results;
  }

  // ============================================================================
  // Dependency Validation
  // ============================================================================

  /**
   * Validate dependencies for a plugin definition
   */
  validatePluginDependencies(
    definition: PluginDefinition,
  ): DependencyValidationResult {
    return pluginManager.validateDependencies(definition);
  }

  /**
   * Get recommended load order for plugins based on dependencies
   */
  getPluginLoadOrder(): PluginLoadOrder[] {
    return pluginManager.getLoadOrder();
  }

  /**
   * Check if a plugin can be safely loaded (dependencies satisfied)
   */
  canLoadPlugin(pluginId: string): { canLoad: boolean; reason?: string } {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) {
      return { canLoad: false, reason: 'Plugin not found' };
    }

    const validation = pluginManager.validateDependencies(plugin.definition);
    if (!validation.valid) {
      const reasons = [];
      if (validation.missingRequired.length > 0) {
        reasons.push(
          `Missing required dependencies: ${validation.missingRequired.map((d) => d.pluginId).join(', ')}`,
        );
      }
      if (validation.versionConflicts.length > 0) {
        reasons.push(
          `Version conflicts: ${validation.versionConflicts.map((c) => `${c.pluginId} (required: ${c.required}, actual: ${c.actual})`).join(', ')}`,
        );
      }
      if (validation.circularDependencies.length > 0) {
        reasons.push(`Circular dependencies detected`);
      }
      return { canLoad: false, reason: reasons.join('; ') };
    }

    return { canLoad: true };
  }

  // ============================================================================
  // Health Monitoring
  // ============================================================================

  /**
   * Get health metrics for a specific plugin
   */
  getPluginHealth(pluginId: string): PluginHealth | undefined {
    return pluginManager.getPluginHealth(pluginId);
  }

  /**
   * Get health metrics for all plugins
   */
  getAllPluginHealth(): PluginHealth[] {
    return pluginManager.getAllPluginHealth();
  }

  /**
   * Check health of all plugins
   */
  async checkAllPluginHealth(): Promise<PluginHealth[]> {
    return pluginManager.checkAllPluginHealth({ includeMemory: true });
  }

  /**
   * Check health of all plugins with detailed metrics
   */
  async checkAllPluginHealthDetailed(): Promise<
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
  > {
    const healthMetrics = await this.checkAllPluginHealth();
    return healthMetrics.map((h) => ({
      pluginId: h.pluginId,
      status: h.status,
      toolCallsTotal: h.toolCallsTotal,
      toolCallsFailed: h.toolCallsFailed,
      toolCallsSuccessful: h.toolCallsSuccessful,
      avgExecutionTimeMs: h.avgExecutionTimeMs,
      uptimeMs: h.uptimeMs,
      lastError: h.lastError,
      lastErrorAt: h.lastErrorAt,
    }));
  }

  /**
   * Get plugins with degraded or error status
   */
  getUnhealthyPlugins(): PluginHealth[] {
    return this.getAllPluginHealth().filter(
      (h) => h.status === 'degraded' || h.status === 'error',
    );
  }

  /**
   * Get plugin event history
   */
  getPluginEventHistory(filter?: {
    pluginId?: string;
    type?: string;
  }): Array<import('./types.js').PluginEvent> {
    return pluginManager.getEventHistory(
      filter as {
        pluginId?: string;
        type?: import('./types.js').PluginEventType;
      },
    );
  }
}

/**
 * Singleton instance
 */
let pluginRegistryInstance: PluginRegistry | null = null;

/**
 * Get or create plugin registry instance
 */
export function getPluginRegistry(projectRoot?: string): PluginRegistry {
  if (!pluginRegistryInstance) {
    pluginRegistryInstance = new PluginRegistry(projectRoot);
  }
  return pluginRegistryInstance;
}

/**
 * Initialize plugin registry with tool registry
 * Also sets up the global context provider for plugin tools
 */
export async function initializePluginRegistry(
  toolRegistry: ToolRegistry,
  projectRoot?: string,
  config?: Config,
): Promise<PluginRegistry> {
  const registry = getPluginRegistry(projectRoot);

  // Set up the global context provider for ALL plugin tools
  // This ensures all tools have access to storage, env, prompts, etc.
  if (config) {
    const contextProvider: PluginToolContextProvider = {
      getStorage: () => config.storage,
      getPromptRegistry: () => config.getPromptRegistry(),
      getSessionId: () => config.getSessionId(),
      getModelId: () => config.getModel(),
      getEnv: (name: string, defaultValue?: string) =>
        process.env[name] ?? defaultValue,
      getAllEnv: () =>
        ({ ...process.env }) as Record<string, string | undefined>,
      // Cross-plugin tool execution
      executeTool: async (toolName: string, params: Record<string, unknown>) =>
        pluginManager.executeToolByName(toolName, params),
      findTool: (toolName: string) => pluginManager.findToolByName(toolName),
    };
    setPluginToolContextProvider(contextProvider);
    debugLogger.info('Plugin tool context provider initialized with config');
  }

  await registry.initialize(toolRegistry, config);
  return registry;
}
