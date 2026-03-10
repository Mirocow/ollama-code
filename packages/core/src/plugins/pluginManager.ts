/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plugin Manager
 * 
 * Manages plugin lifecycle, registration, and execution.
 */

import type {
  PluginDefinition,
  PluginInstance,
  PluginStatus,
  PluginTool,
  PluginContext,
  PluginLogger,
  PluginEventEmitter,
  PluginServices,
  PluginHealth,
  PluginHealthStatus,
  HealthCheckOptions,
  DependencyValidationResult,
  PluginLoadOrder,
  PluginEvent,
  PluginEventType,
} from './types.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import type { Storage } from '../config/storage.js';

const debugLogger = createDebugLogger('PLUGIN_MANAGER');

/**
 * Plugin Manager - Central registry and lifecycle manager for plugins
 */
export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private tools: Map<string, PluginTool> = new Map();
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private config: Record<string, unknown> = {};
  private storage: Storage | null = null;
  private storageData: Record<string, unknown> = {};
  private promptRegistry: import('../prompts/prompt-registry.js').PromptRegistry | null = null;
  private sessionId: string = '';
  private modelId: string | undefined;

  // Health monitoring
  private healthMetrics: Map<string, PluginHealth> = new Map();
  private toolExecutionTimes: Map<string, number[]> = new Map();
  private pluginStartTimes: Map<string, number> = new Map();

  // Event history
  private eventHistory: PluginEvent[] = [];
  private maxEventHistory = 100;

  /**
   * Set storage instance for plugins
   */
  setStorage(storage: Storage): void {
    this.storage = storage;
  }

  /**
   * Set prompt registry for plugins
   */
  setPromptRegistry(registry: import('../prompts/prompt-registry.js').PromptRegistry): void {
    this.promptRegistry = registry;
  }

  /**
   * Set session ID for plugins
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Set model ID for plugins
   */
  setModelId(modelId: string | undefined): void {
    this.modelId = modelId;
  }

  /**
   * Register a plugin
   */
  async registerPlugin(definition: PluginDefinition): Promise<void> {
    const { metadata } = definition;
    
    if (this.plugins.has(metadata.id)) {
      throw new Error(`Plugin "${metadata.id}" is already registered`);
    }
    
    debugLogger.info(`Registering plugin: ${metadata.name} (${metadata.id})`);
    
    const context = this.createPluginContext(definition);
    const instance: PluginInstance = {
      definition,
      context,
      status: 'unloaded',
      config: definition.defaultConfig ?? {},
    };
    
    this.plugins.set(metadata.id, instance);
    
    // Register PluginTool objects (simple declarative tools)
    // Tool classes and factory functions are handled by pluginRegistry
    if (definition.tools) {
      for (const tool of definition.tools) {
        // Only register PluginTool objects (plain objects with execute method)
        if (typeof tool === 'object' && tool !== null && 'execute' in tool) {
          this.registerTool(tool as PluginTool, metadata.id);
        }
      }
    }
    
    debugLogger.info(`Plugin "${metadata.id}" registered successfully`);
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }
    
    // Disable if enabled
    if (instance.status === 'enabled') {
      await this.disablePlugin(pluginId);
    }
    
    // Unload if loaded
    if (instance.status === 'loaded') {
      await this.unloadPlugin(pluginId);
    }
    
    // Unregister tools
    for (const [toolId, tool] of this.tools) {
      if (tool.id.startsWith(`${pluginId}:`)) {
        this.tools.delete(toolId);
      }
    }
    
    this.plugins.delete(pluginId);
    debugLogger.info(`Plugin "${pluginId}" unregistered`);
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }
    
    if (instance.status !== 'unloaded') {
      throw new Error(`Plugin "${pluginId}" is already loaded (status: ${instance.status})`);
    }
    
    debugLogger.info(`Loading plugin: ${pluginId}`);
    
    try {
      const { definition, context } = instance;
      
      if (definition.hooks?.onLoad) {
        await definition.hooks.onLoad(context);
      }
      
      instance.status = 'loaded';
      instance.loadedAt = new Date();
      
      this.emitEvent(`plugin:${pluginId}:loaded`, { pluginId });
      debugLogger.info(`Plugin "${pluginId}" loaded successfully`);
    } catch (error) {
      instance.status = 'error';
      instance.error = error instanceof Error ? error : new Error(String(error));
      debugLogger.error(`Failed to load plugin "${pluginId}":`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }
    
    if (instance.status !== 'loaded' && instance.status !== 'error') {
      throw new Error(`Plugin "${pluginId}" is not loaded (status: ${instance.status})`);
    }
    
    debugLogger.info(`Unloading plugin: ${pluginId}`);
    
    try {
      const { definition, context } = instance;
      
      if (definition.hooks?.onUnload) {
        await definition.hooks.onUnload(context);
      }
      
      instance.status = 'unloaded';
      instance.loadedAt = undefined;
      
      this.emitEvent(`plugin:${pluginId}:unloaded`, { pluginId });
      debugLogger.info(`Plugin "${pluginId}" unloaded successfully`);
    } catch (error) {
      debugLogger.error(`Failed to unload plugin "${pluginId}":`, error);
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }
    
    if (instance.status === 'enabled') {
      return; // Already enabled
    }
    
    if (instance.status === 'unloaded') {
      await this.loadPlugin(pluginId);
    }
    
    debugLogger.info(`Enabling plugin: ${pluginId}`);
    
    try {
      const { definition, context } = instance;
      
      if (definition.hooks?.onEnable) {
        await definition.hooks.onEnable(context);
      }
      
      instance.status = 'enabled';
      instance.enabledAt = new Date();
      
      this.emitEvent('plugin:enabled', { pluginId });
      debugLogger.info(`Plugin "${pluginId}" enabled successfully`);
    } catch (error) {
      instance.status = 'error';
      instance.error = error instanceof Error ? error : new Error(String(error));
      debugLogger.error(`Failed to enable plugin "${pluginId}":`, error);
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }
    
    if (instance.status !== 'enabled') {
      return; // Already disabled
    }
    
    debugLogger.info(`Disabling plugin: ${pluginId}`);
    
    try {
      const { definition, context } = instance;
      
      if (definition.hooks?.onDisable) {
        await definition.hooks.onDisable(context);
      }
      
      instance.status = 'loaded';
      instance.enabledAt = undefined;
      
      this.emitEvent('plugin:disabled', { pluginId });
      debugLogger.info(`Plugin "${pluginId}" disabled successfully`);
    } catch (error) {
      debugLogger.error(`Failed to disable plugin "${pluginId}":`, error);
      throw error;
    }
  }

  /**
   * Get plugin instance
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by status
   */
  getPluginsByStatus(status: PluginStatus): PluginInstance[] {
    return this.getAllPlugins().filter(p => p.status === status);
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): PluginInstance[] {
    return this.getPluginsByStatus('enabled');
  }

  /**
   * Register a tool
   */
  private registerTool(tool: PluginTool, pluginId: string): void {
    const toolId = `${pluginId}:${tool.id}`;
    
    if (this.tools.has(toolId)) {
      throw new Error(`Tool "${toolId}" is already registered`);
    }
    
    this.tools.set(toolId, { ...tool, id: toolId });
    debugLogger.info(`Tool "${toolId}" registered`);
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): PluginTool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Get all tools
   */
  getAllTools(): PluginTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolId: string,
    params: Record<string, unknown>,
    context?: Partial<import('./types.js').ToolExecutionContext>
  ): Promise<unknown> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool "${toolId}" not found`);
    }
    
    // Find plugin context
    const [pluginId] = toolId.split(':');
    const instance = this.plugins.get(pluginId);
    
    if (!instance || instance.status !== 'enabled') {
      throw new Error(`Plugin for tool "${toolId}" is not enabled`);
    }
    
    // Execute with lifecycle hooks
    const { definition } = instance;
    const startTime = Date.now();
    
    try {
      // Before execute hook
      if (definition.hooks?.onBeforeToolExecute) {
        const shouldContinue = await definition.hooks.onBeforeToolExecute(
          toolId,
          params,
          instance.context
        );
        if (!shouldContinue) {
          throw new Error(`Tool execution cancelled by plugin hook`);
        }
      }
      
      // Build complete execution context with ALL required properties
      const envAccess = {
        get: (name: string, defaultValue?: string) => process.env[name] ?? defaultValue,
        getAll: () => ({ ...process.env }) as Record<string, string | undefined>,
      };
      
      const fullContext: import('./types.js').ToolExecutionContext = {
        plugin: instance.context,
        // Storage - available to ALL tools
        storage: this.storage ?? context?.storage!,
        // Prompt registry - available to ALL tools
        promptRegistry: this.promptRegistry ?? context?.promptRegistry!,
        // Session ID - available to ALL tools
        sessionId: this.sessionId ?? context?.sessionId ?? '',
        // Model ID
        modelId: this.modelId ?? context?.modelId,
        // Environment variables - available to ALL tools
        env: envAccess,
        // Spread any additional context
        ...context,
      };
      
      // Execute tool
      const result = await tool.execute(params, fullContext);
      
      // Record successful execution for health metrics
      const executionTime = Date.now() - startTime;
      this.recordToolExecution(pluginId, executionTime, true);
      
      // After execute hook
      if (definition.hooks?.onAfterToolExecute) {
        await definition.hooks.onAfterToolExecute(
          toolId,
          params,
          result,
          instance.context
        );
      }
      
      return result;
    } catch (error) {
      // Record failed execution for health metrics
      const executionTime = Date.now() - startTime;
      this.recordToolExecution(pluginId, executionTime, false);
      
      debugLogger.error(`Tool "${toolId}" execution failed:`, error);
      throw error;
    }
  }

  /**
   * Create plugin context with ALL services available
   */
  private createPluginContext(definition: PluginDefinition): PluginContext {
    const { metadata } = definition;
    
    const logger: PluginLogger = {
      debug: (...args) => debugLogger.debug(`[${metadata.name}]`, ...args),
      info: (...args) => debugLogger.info(`[${metadata.name}]`, ...args),
      warn: (...args) => debugLogger.warn(`[${metadata.name}]`, ...args),
      error: (...args) => debugLogger.error(`[${metadata.name}]`, ...args),
    };
    
    const events: PluginEventEmitter = {
      emit: (event, data) => this.emitEvent(`plugin:${metadata.id}:${event}`, data),
      on: (event, callback) => this.addEventListener(`plugin:${metadata.id}:${event}`, callback),
      once: (event, callback) => {
        const unsubscribe = this.addEventListener(`plugin:${metadata.id}:${event}`, (data) => {
          unsubscribe();
          callback(data);
        });
        return unsubscribe;
      },
    };
    
    const services: PluginServices = {
      registerTool: (tool) => this.registerTool(tool, metadata.id),
      unregisterTool: (toolId) => this.tools.delete(`${metadata.id}:${toolId}`),
      getTools: () => this.getAllTools().filter(t => t.id.startsWith(`${metadata.id}:`)),
      showNotification: (notification) => {
        this.emitEvent('notification', notification);
      },
      executeCommand: async (commandId, ...args) => {
        this.emitEvent('command:execute', { commandId, args });
        return undefined;
      },
      getConfig: () => this.config,
      setConfig: (config) => {
        this.config = { ...this.config, ...config };
      },
      getStorage: () => {
        if (!this.storage) {
          throw new Error('Storage not initialized. Call setStorage() first.');
        }
        return this.storage;
      },
      getStorageItem: (key: string) => {
        const fullKey = `${metadata.id}:${key}`;
        return this.storageData[fullKey];
      },
      setStorageItem: (key: string, value: unknown) => {
        const fullKey = `${metadata.id}:${key}`;
        this.storageData[fullKey] = value;
      },
      // Environment variables access - available to ALL plugins
      getEnv: (name: string, defaultValue?: string) => {
        return process.env[name] ?? defaultValue;
      },
      getAllEnv: () => {
        return { ...process.env } as Record<string, string | undefined>;
      },
      // Prompt registry access - available to ALL plugins
      getPromptRegistry: () => {
        if (!this.promptRegistry) {
          throw new Error('PromptRegistry not initialized. Call setPromptRegistry() first.');
        }
        return this.promptRegistry;
      },
      // Session ID access - available to ALL plugins
      getSessionId: () => this.sessionId,
      // Model ID access - available to ALL plugins
      getModelId: () => this.modelId,
    };
    
    return {
      config: definition.defaultConfig ?? {},
      metadata,
      logger,
      events,
      services,
    };
  }

  /**
   * Event handling
   */
  private emitEvent(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          debugLogger.error(`Error in event listener for "${event}":`, error);
        }
      }
    }
  }

  private addEventListener(event: string, callback: (data: unknown) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Subscribe to plugin events
   */
  on(event: string, callback: (data: unknown) => void): () => void {
    return this.addEventListener(event, callback);
  }

  // ============================================================================
  // Hot Reload
  // ============================================================================

  /**
   * Hot reload a plugin - disable, unregister, re-register, and enable
   * Useful for development and updating plugins without restart
   */
  async reloadPlugin(pluginId: string, newDefinition?: PluginDefinition): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }

    debugLogger.info(`Hot reloading plugin: ${pluginId}`);

    // Store current state
    const wasEnabled = instance.status === 'enabled';
    const currentDefinition = instance.definition;

    try {
      // Unregister completely
      await this.unregisterPlugin(pluginId);

      // Use new definition if provided, otherwise use existing
      const definitionToLoad = newDefinition || currentDefinition;

      // Re-register
      await this.registerPlugin(definitionToLoad);

      // Re-enable if it was enabled
      if (wasEnabled) {
        await this.enablePlugin(pluginId);
      }

      // Record event
      this.recordEvent('plugin:reloaded', pluginId);
      
      debugLogger.info(`Plugin "${pluginId}" reloaded successfully`);
    } catch (error) {
      debugLogger.error(`Failed to reload plugin "${pluginId}":`, error);
      
      // Try to recover by re-registering original definition
      try {
        await this.registerPlugin(currentDefinition);
        if (wasEnabled) {
          await this.enablePlugin(pluginId);
        }
      } catch (recoveryError) {
        debugLogger.error(`Failed to recover plugin "${pluginId}":`, recoveryError);
      }
      
      throw error;
    }
  }

  /**
   * Reload all plugins
   */
  async reloadAllPlugins(): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };
    const pluginIds = Array.from(this.plugins.keys());

    for (const pluginId of pluginIds) {
      try {
        await this.reloadPlugin(pluginId);
        results.success.push(pluginId);
      } catch {
        results.failed.push(pluginId);
      }
    }

    return results;
  }

  // ============================================================================
  // Dependency Validation
  // ============================================================================

  /**
   * Validate dependencies for a plugin
   */
  validateDependencies(definition: PluginDefinition): DependencyValidationResult {
    const result: DependencyValidationResult = {
      valid: true,
      missingRequired: [],
      missingOptional: [],
      versionConflicts: [],
      circularDependencies: [],
      warnings: [],
    };

    const { metadata } = definition;
    const dependencies = metadata.dependencies || [];

    for (const dep of dependencies) {
      const instance = this.plugins.get(dep.pluginId);
      
      if (!instance) {
        if (dep.optional) {
          result.missingOptional.push({
            pluginId: dep.pluginId,
            minVersion: dep.minVersion,
            maxVersion: dep.maxVersion,
          });
        } else {
          result.missingRequired.push({
            pluginId: dep.pluginId,
            minVersion: dep.minVersion,
            maxVersion: dep.maxVersion,
          });
          result.valid = false;
        }
        continue;
      }

      // Check version constraints
      const actualVersion = instance.definition.metadata.version;
      
      if (dep.minVersion && this.compareVersions(actualVersion, dep.minVersion) < 0) {
        result.versionConflicts.push({
          pluginId: dep.pluginId,
          required: dep.minVersion,
          actual: actualVersion,
        });
        if (!dep.optional) {
          result.valid = false;
        }
      }

      if (dep.maxVersion && this.compareVersions(actualVersion, dep.maxVersion) > 0) {
        result.versionConflicts.push({
          pluginId: dep.pluginId,
          required: `<=${dep.maxVersion}`,
          actual: actualVersion,
        });
        if (!dep.optional) {
          result.valid = false;
        }
      }
    }

    // Check for circular dependencies
    const circular = this.detectCircularDependencies(definition);
    if (circular.length > 0) {
      result.circularDependencies = circular;
      result.valid = false;
    }

    return result;
  }

  /**
   * Get load order for all plugins based on dependencies
   */
  getLoadOrder(): PluginLoadOrder[] {
    const orders: PluginLoadOrder[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (pluginId: string, depth: number): number => {
      if (visited.has(pluginId)) {
        const existing = orders.find(o => o.pluginId === pluginId);
        return existing?.order ?? 0;
      }

      if (visiting.has(pluginId)) {
        // Circular dependency detected
        return -1;
      }

      visiting.add(pluginId);
      const instance = this.plugins.get(pluginId);
      
      let maxDepOrder = -1;
      const deps: string[] = [];

      if (instance?.definition.metadata.dependencies) {
        for (const dep of instance.definition.metadata.dependencies) {
          if (!dep.optional && this.plugins.has(dep.pluginId)) {
            deps.push(dep.pluginId);
            const depOrder = visit(dep.pluginId, depth + 1);
            if (depOrder === -1) {
              orders.push({
                pluginId,
                order: -1,
                dependencies: deps,
                canLoad: false,
                reason: `Circular dependency detected involving ${pluginId}`,
              });
              visiting.delete(pluginId);
              return -1;
            }
            maxDepOrder = Math.max(maxDepOrder, depOrder);
          }
        }
      }

      visiting.delete(pluginId);
      visited.add(pluginId);

      const order = maxDepOrder + 1;
      orders.push({
        pluginId,
        order,
        dependencies: deps,
        canLoad: true,
      });

      return order;
    };

    // Visit all plugins
    for (const pluginId of this.plugins.keys()) {
      visit(pluginId, 0);
    }

    return orders.sort((a, b) => a.order - b.order);
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA < numB) return -1;
      if (numA > numB) return 1;
    }
    return 0;
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(definition: PluginDefinition): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (pluginId: string): boolean => {
      if (visited.has(pluginId)) {
        const cycleStart = path.indexOf(pluginId);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), pluginId]);
          return true;
        }
        return false;
      }

      visited.add(pluginId);
      path.push(pluginId);

      const instance = this.plugins.get(pluginId);
      if (instance?.definition.metadata.dependencies) {
        for (const dep of instance.definition.metadata.dependencies) {
          if (!dep.optional) {
            dfs(dep.pluginId);
          }
        }
      }

      path.pop();
      return false;
    };

    dfs(definition.metadata.id);
    return cycles;
  }

  // ============================================================================
  // Health Monitoring
  // ============================================================================

  /**
   * Get health metrics for a plugin
   */
  getPluginHealth(pluginId: string): PluginHealth | undefined {
    return this.healthMetrics.get(pluginId);
  }

  /**
   * Get health metrics for all plugins
   */
  getAllPluginHealth(): PluginHealth[] {
    return Array.from(this.healthMetrics.values());
  }

  /**
   * Check health of a specific plugin
   */
  async checkPluginHealth(
    pluginId: string,
    options: HealthCheckOptions = {}
  ): Promise<PluginHealth> {
    const instance = this.plugins.get(pluginId);
    const existing = this.healthMetrics.get(pluginId);

    const now = new Date();
    const startTime = this.pluginStartTimes.get(pluginId) || Date.now();

    const health: PluginHealth = {
      pluginId,
      status: 'unknown',
      lastChecked: now,
      toolCallsTotal: existing?.toolCallsTotal ?? 0,
      toolCallsFailed: existing?.toolCallsFailed ?? 0,
      toolCallsSuccessful: existing?.toolCallsSuccessful ?? 0,
      avgExecutionTimeMs: existing?.avgExecutionTimeMs ?? 0,
      uptimeMs: Date.now() - startTime,
    };

    if (!instance) {
      health.status = 'error';
      health.lastError = 'Plugin not found';
      health.lastErrorAt = now;
      return health;
    }

    // Determine health status based on error rate
    if (instance.status === 'error') {
      health.status = 'error';
      health.lastError = instance.error?.message || 'Unknown error';
      health.lastErrorAt = now;
    } else if (instance.status === 'enabled') {
      const failureRate = health.toolCallsTotal > 0
        ? health.toolCallsFailed / health.toolCallsTotal
        : 0;

      if (failureRate > 0.5) {
        health.status = 'error';
      } else if (failureRate > 0.1) {
        health.status = 'degraded';
      } else {
        health.status = 'healthy';
      }
    } else {
      health.status = 'unknown';
    }

    // Include memory metrics if requested
    if (options.includeMemory) {
      try {
        const memUsage = process.memoryUsage();
        health.peakMemoryBytes = memUsage.heapUsed;
      } catch {
        // Memory not available
      }
    }

    // Update stored health
    this.healthMetrics.set(pluginId, health);

    // Record event if status changed
    if (existing && existing.status !== health.status) {
      this.recordEvent('plugin:health-changed', pluginId, { 
        oldStatus: existing.status, 
        newStatus: health.status 
      });
    }

    return health;
  }

  /**
   * Check health of all plugins
   */
  async checkAllPluginHealth(options: HealthCheckOptions = {}): Promise<PluginHealth[]> {
    const results: PluginHealth[] = [];

    for (const pluginId of this.plugins.keys()) {
      try {
        const health = await this.checkPluginHealth(pluginId, options);
        results.push(health);
      } catch (error) {
        debugLogger.error(`Failed to check health for plugin ${pluginId}:`, error);
      }
    }

    return results;
  }

  /**
   * Record tool execution for health metrics
   */
  private recordToolExecution(pluginId: string, executionTimeMs: number, success: boolean): void {
    const health = this.healthMetrics.get(pluginId) || {
      pluginId,
      status: 'unknown' as PluginHealthStatus,
      lastChecked: new Date(),
      toolCallsTotal: 0,
      toolCallsFailed: 0,
      toolCallsSuccessful: 0,
      avgExecutionTimeMs: 0,
      uptimeMs: 0,
    };

    health.toolCallsTotal++;
    if (success) {
      health.toolCallsSuccessful++;
    } else {
      health.toolCallsFailed++;
      health.lastError = 'Tool execution failed';
      health.lastErrorAt = new Date();
    }

    // Update average execution time
    const times = this.toolExecutionTimes.get(pluginId) || [];
    times.push(executionTimeMs);
    if (times.length > 100) times.shift(); // Keep last 100
    this.toolExecutionTimes.set(pluginId, times);

    health.avgExecutionTimeMs = times.reduce((a, b) => a + b, 0) / times.length;
    health.lastChecked = new Date();

    this.healthMetrics.set(pluginId, health);
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  /**
   * Record an event for history
   */
  private recordEvent(type: PluginEventType, pluginId?: string, data?: unknown): void {
    const event: PluginEvent = {
      type,
      pluginId,
      timestamp: new Date(),
      data,
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   */
  getEventHistory(filter?: { pluginId?: string; type?: PluginEventType }): PluginEvent[] {
    if (!filter) return [...this.eventHistory];

    return this.eventHistory.filter(event => {
      if (filter.pluginId && event.pluginId !== filter.pluginId) return false;
      if (filter.type && event.type !== filter.type) return false;
      return true;
    });
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }
}

/**
 * Singleton instance
 */
export const pluginManager = new PluginManager();
