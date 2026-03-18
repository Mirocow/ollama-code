/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plugin Tool Adapter
 *
 * Bridges the plugin system with the tool registry,
 * allowing plugins to register tools that integrate seamlessly
 * with the existing tool system.
 *
 * ALL tools have access to storage, env, and prompts by default.
 */

import type {
  PluginTool,
  ToolExecutionContext,
  ToolExecutionResult,
} from './types.js';
import type {
  AnyDeclarativeTool,
  ToolResult,
  ToolResultDisplay,
  ToolInvocation,
  Kind,
} from '../tools/tools.js';
import { BaseDeclarativeTool, BaseToolInvocation } from '../tools/tools.js';
import { ToolErrorType } from '../tools/tool-error.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import type { Storage } from '../config/storage.js';
import type { PromptRegistry } from '../prompts/prompt-registry.js';

const debugLogger = createDebugLogger('PLUGIN_TOOL_ADAPTER');

/**
 * Context provider for plugin tools
 * Provides access to storage, env, prompts, and other services
 */
export interface PluginToolContextProvider {
  /** Get storage instance */
  getStorage(): Storage;
  /** Get prompt registry */
  getPromptRegistry(): PromptRegistry;
  /** Get session ID */
  getSessionId(): string;
  /** Get model ID */
  getModelId(): string | undefined;
  /** Get environment variable */
  getEnv(name: string, defaultValue?: string): string | undefined;
  /** Get all environment variables */
  getAllEnv(): Record<string, string | undefined>;
  /** Execute another tool by name or alias */
  executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<import('./types.js').ToolExecutionResult>;
  /** Find a tool by name or alias */
  findTool(toolName: string): string | undefined;
}

/**
 * Global context provider - set during initialization
 */
let globalContextProvider: PluginToolContextProvider | null = null;

/**
 * Set the global context provider for all plugin tools
 */
export function setPluginToolContextProvider(
  provider: PluginToolContextProvider,
): void {
  globalContextProvider = provider;
}

/**
 * Get the global context provider
 */
export function getPluginToolContextProvider(): PluginToolContextProvider | null {
  return globalContextProvider;
}

/**
 * Adapter that wraps a PluginTool to work with the DeclarativeTool system
 */
export class PluginToolAdapter extends BaseDeclarativeTool<
  Record<string, unknown>,
  ToolResult
> {
  private pluginTool: PluginTool;
  private pluginId: string;
  private contextProvider?: PluginToolContextProvider;

  constructor(
    pluginTool: PluginTool,
    pluginId: string,
    contextProvider?: PluginToolContextProvider,
  ) {
    super(
      pluginTool.name,
      pluginTool.name,
      pluginTool.description,
      mapToolCategory(pluginTool.category),
      pluginTool.parameters as Record<string, unknown>,
      true, // isOutputMarkdown
      false, // canUpdateOutput
    );
    this.pluginTool = pluginTool;
    this.pluginId = pluginId;
    this.contextProvider = contextProvider;
  }

  protected createInvocation(
    params: Record<string, unknown>,
  ): ToolInvocation<Record<string, unknown>, ToolResult> {
    return new PluginToolInvocation(
      this.pluginTool,
      this.pluginId,
      params,
      this.contextProvider || globalContextProvider,
    );
  }

  /**
   * Get the original plugin tool
   */
  getPluginTool(): PluginTool {
    return this.pluginTool;
  }

  /**
   * Get the plugin ID
   */
  getPluginId(): string {
    return this.pluginId;
  }
}

/**
 * Invocation for a plugin tool
 */
class PluginToolInvocation extends BaseToolInvocation<
  Record<string, unknown>,
  ToolResult
> {
  private pluginTool: PluginTool;
  private pluginId: string;
  private contextProvider: PluginToolContextProvider | null;

  constructor(
    pluginTool: PluginTool,
    pluginId: string,
    params: Record<string, unknown>,
    contextProvider: PluginToolContextProvider | null | undefined,
  ) {
    super(params);
    this.pluginTool = pluginTool;
    this.pluginId = pluginId;
    this.contextProvider = contextProvider || null;
  }

  getDescription(): string {
    if (this.pluginTool.buildConfirmationMessage) {
      return this.pluginTool.buildConfirmationMessage(this.params);
    }
    return `${this.pluginTool.name}(${JSON.stringify(this.params)})`;
  }

  async execute(
    signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    try {
      // Create execution context with ALL services available
      const context = this.createExecutionContext(signal);

      // Execute with timeout if specified
      const timeout = this.pluginTool.timeout;
      let result: ToolExecutionResult;

      if (timeout) {
        result = await this.executeWithTimeout(
          this.pluginTool.execute(this.params, context),
          timeout,
          signal,
        );
      } else {
        result = await this.pluginTool.execute(this.params, context);
      }

      // Convert to ToolResult
      return {
        llmContent: result.success
          ? typeof result.data === 'string'
            ? result.data
            : JSON.stringify(result.data, null, 2)
          : `Error: ${result.error || 'Unknown error'}`,
        returnDisplay: result.display?.summary || result.error || 'Success',
        error: result.success
          ? undefined
          : {
              message: result.error || 'Plugin tool execution failed',
              type: ToolErrorType.EXECUTION_FAILED,
            },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Error: ${errorMessage}`,
        returnDisplay: errorMessage,
        error: {
          message: errorMessage,
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }
  }

  /**
   * Create execution context with ALL services available
   */
  private createExecutionContext(signal: AbortSignal): ToolExecutionContext {
    const provider = this.contextProvider;

    // Create env access object
    const envAccess = {
      get: (name: string, defaultValue?: string) =>
        provider?.getEnv(name, defaultValue) ??
        process.env[name] ??
        defaultValue,
      getAll: () =>
        provider?.getAllEnv() ??
        ({ ...process.env } as Record<string, string | undefined>),
    };

    // If we have a context provider, use it
    if (provider) {
      return {
        signal,
        plugin: {
          config: {},
          metadata: {
            id: this.pluginId,
            name: this.pluginId,
            version: '1.0.0',
          },
          logger: {
            debug: (...args) =>
              debugLogger.debug(`[${this.pluginId}]`, ...args),
            info: (...args) => debugLogger.info(`[${this.pluginId}]`, ...args),
            warn: (...args) => debugLogger.warn(`[${this.pluginId}]`, ...args),
            error: (...args) =>
              debugLogger.error(`[${this.pluginId}]`, ...args),
          },
          events: {
            emit: () => {},
            on: () => () => {},
            once: () => {},
          },
          services: {
            registerTool: () => {},
            unregisterTool: () => {},
            getTools: () => [],
            showNotification: () => {},
            executeCommand: async () => undefined,
            getConfig: () => ({}),
            setConfig: () => {},
            getStorage: () => provider.getStorage(),
            getStorageItem: () => undefined,
            setStorageItem: () => {},
            getEnv: envAccess.get,
            getAllEnv: envAccess.getAll,
            getPromptRegistry: () => provider.getPromptRegistry(),
            getSessionId: () => provider.getSessionId(),
            getModelId: () => provider.getModelId(),
            executeTool: async (
              toolName: string,
              params: Record<string, unknown>,
            ) => provider.executeTool(toolName, params),
            findTool: (toolName: string) => provider.findTool(toolName),
          },
        },
        // Storage - available to ALL tools by default
        storage: provider.getStorage(),
        // Prompt registry - available to ALL tools by default
        promptRegistry: provider.getPromptRegistry(),
        // Session ID - available to ALL tools by default
        sessionId: provider.getSessionId(),
        // Model ID
        modelId: provider.getModelId(),
        // Environment variables - available to ALL tools by default
        env: envAccess,
      };
    }

    // Fallback context when no provider is available (should not happen in normal operation)
    debugLogger.warn(
      `No context provider available for plugin tool ${this.pluginId}`,
    );

    return {
      signal,
      plugin: {
        config: {},
        metadata: {
          id: this.pluginId,
          name: this.pluginId,
          version: '1.0.0',
        },
        logger: {
          debug: (...args) => debugLogger.debug(`[${this.pluginId}]`, ...args),
          info: (...args) => debugLogger.info(`[${this.pluginId}]`, ...args),
          warn: (...args) => debugLogger.warn(`[${this.pluginId}]`, ...args),
          error: (...args) => debugLogger.error(`[${this.pluginId}]`, ...args),
        },
        events: {
          emit: () => {},
          on: () => () => {},
          once: () => {},
        },
        services: {
          registerTool: () => {},
          unregisterTool: () => {},
          getTools: () => [],
          showNotification: () => {},
          executeCommand: async () => undefined,
          getConfig: () => ({}),
          setConfig: () => {},
          getStorage: () => {
            throw new Error('Storage not available - no context provider set.');
          },
          getStorageItem: () => undefined,
          setStorageItem: () => {},
          getEnv: envAccess.get,
          getAllEnv: envAccess.getAll,
          getPromptRegistry: () => {
            throw new Error(
              'PromptRegistry not available - no context provider set.',
            );
          },
          getSessionId: () => '',
          getModelId: () => undefined,
          executeTool: async () => {
            throw new Error(
              'Tool execution not available - no context provider set.',
            );
          },
          findTool: () => undefined,
        },
      },
      // These will throw when accessed if no provider
      storage: null as unknown as Storage,
      promptRegistry: null as unknown as PromptRegistry,
      sessionId: '',
      env: envAccess,
    };
  }

  private async executeWithTimeout(
    promise: Promise<ToolExecutionResult>,
    timeout: number,
    signal: AbortSignal,
  ): Promise<ToolExecutionResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Plugin tool execution timed out after ${timeout}ms`));
      }, timeout);

      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new Error('Plugin tool execution was cancelled'));
      };

      signal.addEventListener('abort', abortHandler);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => {
          clearTimeout(timeoutId);
          signal.removeEventListener('abort', abortHandler);
        });
    });
  }
}

/**
 * Map plugin tool category to Kind
 */
function mapToolCategory(category?: string): Kind {
  const categoryMap: Record<string, Kind> = {
    read: 'read' as Kind,
    edit: 'edit' as Kind,
    delete: 'delete' as Kind,
    move: 'move' as Kind,
    search: 'search' as Kind,
    execute: 'execute' as Kind,
    fetch: 'fetch' as Kind,
    other: 'other' as Kind,
  };

  return category
    ? categoryMap[category] || ('other' as Kind)
    : ('other' as Kind);
}

/**
 * Register plugin tools with the tool registry
 */
export function registerPluginTools(
  tools: PluginTool[],
  pluginId: string,
  registerFn: (tool: AnyDeclarativeTool) => void,
  contextProvider?: PluginToolContextProvider,
): void {
  for (const tool of tools) {
    const adapter = new PluginToolAdapter(tool, pluginId, contextProvider);
    registerFn(adapter);
    debugLogger.info(`Registered plugin tool: ${tool.name} (from ${pluginId})`);
  }
}

/**
 * Unregister plugin tools from the tool registry
 */
export function unregisterPluginTools(
  toolIds: string[],
  unregisterFn: (toolId: string) => void,
): void {
  for (const toolId of toolIds) {
    unregisterFn(toolId);
    debugLogger.info(`Unregistered plugin tool: ${toolId}`);
  }
}

/**
 * Convert plugin tool to declarative tool format
 */
export function pluginToolToDeclarative(
  pluginTool: PluginTool,
  pluginId: string,
  contextProvider?: PluginToolContextProvider,
): AnyDeclarativeTool {
  return new PluginToolAdapter(pluginTool, pluginId, contextProvider);
}
