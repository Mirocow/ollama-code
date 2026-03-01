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
 */

import type { PluginTool, ToolExecutionContext, ToolExecutionResult } from './types.js';
import type { 
  AnyDeclarativeTool, 
  ToolResult, 
  ToolResultDisplay,
  ToolInvocation,
  Kind 
} from '../tools/tools.js';
import { BaseDeclarativeTool, BaseToolInvocation } from '../tools/tools.js';
import { ToolErrorType } from '../tools/tool-error.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('PLUGIN_TOOL_ADAPTER');

/**
 * Adapter that wraps a PluginTool to work with the DeclarativeTool system
 */
export class PluginToolAdapter extends BaseDeclarativeTool<
  Record<string, unknown>,
  ToolResult
> {
  private pluginTool: PluginTool;
  private pluginId: string;
  
  constructor(pluginTool: PluginTool, pluginId: string) {
    super(
      pluginTool.name,
      pluginTool.name,
      pluginTool.description,
      mapToolCategory(pluginTool.category),
      pluginTool.parameters as Record<string, unknown>,
      true, // isOutputMarkdown
      false // canUpdateOutput
    );
    this.pluginTool = pluginTool;
    this.pluginId = pluginId;
  }
  
  protected createInvocation(
    params: Record<string, unknown>
  ): ToolInvocation<Record<string, unknown>, ToolResult> {
    return new PluginToolInvocation(
      this.pluginTool,
      this.pluginId,
      params
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
  
  constructor(
    pluginTool: PluginTool,
    pluginId: string,
    params: Record<string, unknown>
  ) {
    super(params);
    this.pluginTool = pluginTool;
    this.pluginId = pluginId;
  }
  
  getDescription(): string {
    if (this.pluginTool.buildConfirmationMessage) {
      return this.pluginTool.buildConfirmationMessage(this.params);
    }
    return `${this.pluginTool.name}(${JSON.stringify(this.params)})`;
  }
  
  async execute(
    signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void
  ): Promise<ToolResult> {
    try {
      // Create execution context
      const context: ToolExecutionContext = {
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
          },
        },
      };
      
      // Execute with timeout if specified
      const timeout = this.pluginTool.timeout;
      let result: ToolExecutionResult;
      
      if (timeout) {
        result = await this.executeWithTimeout(
          this.pluginTool.execute(this.params, context),
          timeout,
          signal
        );
      } else {
        result = await this.pluginTool.execute(this.params, context);
      }
      
      // Convert to ToolResult
      return {
        llmContent: result.success 
          ? (typeof result.data === 'string' 
              ? result.data 
              : JSON.stringify(result.data, null, 2))
          : `Error: ${result.error || 'Unknown error'}`,
        returnDisplay: result.display?.summary || result.error || 'Success',
        error: result.success ? undefined : {
          message: result.error || 'Plugin tool execution failed',
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
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
  
  private async executeWithTimeout(
    promise: Promise<ToolExecutionResult>,
    timeout: number,
    signal: AbortSignal
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
    'read': 'read' as Kind,
    'edit': 'edit' as Kind,
    'delete': 'delete' as Kind,
    'move': 'move' as Kind,
    'search': 'search' as Kind,
    'execute': 'execute' as Kind,
    'fetch': 'fetch' as Kind,
    'other': 'other' as Kind,
  };
  
  return category ? (categoryMap[category] || 'other' as Kind) : 'other' as Kind;
}

/**
 * Register plugin tools with the tool registry
 */
export function registerPluginTools(
  tools: PluginTool[],
  pluginId: string,
  registerFn: (tool: AnyDeclarativeTool) => void
): void {
  for (const tool of tools) {
    const adapter = new PluginToolAdapter(tool, pluginId);
    registerFn(adapter);
    debugLogger.info(`Registered plugin tool: ${tool.name} (from ${pluginId})`);
  }
}

/**
 * Unregister plugin tools from the tool registry
 */
export function unregisterPluginTools(
  toolIds: string[],
  unregisterFn: (toolId: string) => void
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
  pluginId: string
): AnyDeclarativeTool {
  return new PluginToolAdapter(pluginTool, pluginId);
}
