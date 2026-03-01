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
} from './types.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('PLUGIN_MANAGER');

/**
 * Plugin Manager - Central registry and lifecycle manager for plugins
 */
export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private tools: Map<string, PluginTool> = new Map();
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private config: Record<string, unknown> = {};

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
    
    // Register tools
    if (definition.tools) {
      for (const tool of definition.tools) {
        this.registerTool(tool, metadata.id);
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
    context?: Partial<PluginTool>
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
      
      // Execute tool
      const result = await tool.execute(params, {
        plugin: instance.context,
        ...context,
      });
      
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
      debugLogger.error(`Tool "${toolId}" execution failed:`, error);
      throw error;
    }
  }

  /**
   * Create plugin context
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
}

/**
 * Singleton instance
 */
export const pluginManager = new PluginManager();
