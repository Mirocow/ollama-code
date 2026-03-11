/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extension Tool Registry
 *
 * Manages tools provided by extensions. Handles registration,
 * validation, loading, and execution of extension tools.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { createDebugLogger } from '../utils/debugLogger.js';
import type {
  ExtensionToolDefinition,
  ExtensionToolHandler,
  ExtensionToolContext,
  ExtensionV2,
  ExtensionLoggerInterface,
} from './extension-types.js';
import {
  DeclarativeTool,
  BaseToolInvocation,
  type ToolResult,
  type Kind,
} from '../tools/tools.js';
import { ToolErrorType } from '../tools/tool-error.js';
import { SchemaValidator } from '../utils/schemaValidator.js';

const debugLogger = createDebugLogger('EXTENSION_TOOLS');

// ============================================================================
// Types
// ============================================================================

/**
 * Registered tool entry in the registry.
 */
interface RegisteredTool {
  /** Tool definition */
  definition: ExtensionToolDefinition;

  /** Extension that owns this tool */
  extensionId: string;

  /** Extension name */
  extensionName: string;

  /** Extension path */
  extensionPath: string;

  /** Cached handler module */
  handler?: ExtensionToolHandler;

  /** Whether the tool is currently loaded */
  isLoaded: boolean;
}

/**
 * Options for the ExtensionToolRegistry.
 */
export interface ExtensionToolRegistryOptions {
  /** Enable lazy loading of tool handlers */
  lazyLoading?: boolean;

  /** Tool execution timeout in milliseconds */
  defaultTimeout?: number;

  /** Whether to validate tool schemas on registration */
  validateSchemas?: boolean;
}

// ============================================================================
// Extension Tool Invocation
// ============================================================================

/**
 * Tool invocation for extension tools.
 */
class ExtensionToolInvocation extends BaseToolInvocation<
  Record<string, unknown>,
  ToolResult
> {
  constructor(
    params: Record<string, unknown>,
    private readonly tool: RegisteredTool,
    private readonly context: ExtensionToolContext,
  ) {
    super(params);
  }

  getDescription(): string {
    if (this.tool.handler?.getDescription) {
      try {
        return this.tool.handler.getDescription(this.params);
      } catch {
        // Fall back to default description
      }
    }
    return `Execute ${this.tool.definition.displayName}: ${this.tool.definition.description}`;
  }

  toolLocations(): Array<{ path: string; line?: number }> {
    // Extension tools don't have file locations in the traditional sense
    return [];
  }

  async execute(
    signal: AbortSignal,
    _updateOutput?: (output: ToolResult['returnDisplay']) => void,
  ): Promise<ToolResult> {
    const handler = await this.getHandler();

    if (!handler) {
      return {
        llmContent: `Error: Tool handler not found for ${this.tool.definition.name}`,
        returnDisplay: `Tool handler not found`,
        error: {
          message: 'Tool handler not found',
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }

    // Validate with handler if available
    if (handler.validate) {
      const validationError = handler.validate(this.params);
      if (validationError) {
        return {
          llmContent: `Validation error: ${validationError}`,
          returnDisplay: validationError,
          error: {
            message: validationError,
            type: ToolErrorType.INVALID_TOOL_PARAMS,
          },
        };
      }
    }

    try {
      const executionContext: ExtensionToolContext = {
        ...this.context,
        abortSignal: signal,
      };

      const result = await Promise.race([
        handler.execute(this.params, executionContext),
        this.createTimeoutPromise(this.tool.definition.timeout ?? 60000),
      ]);

      return {
        llmContent: result.llmContent,
        returnDisplay: result.returnDisplay,
        error: result.error,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Error executing tool: ${errorMessage}`,
        returnDisplay: errorMessage,
        error: {
          message: errorMessage,
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }
  }

  private async getHandler(): Promise<ExtensionToolHandler | null> {
    if (this.tool.handler) {
      return this.tool.handler;
    }

    const handlerPath = path.join(
      this.tool.extensionPath,
      this.tool.definition.handler,
    );

    if (!fs.existsSync(handlerPath)) {
      debugLogger.error(`Handler file not found: ${handlerPath}`);
      return null;
    }

    try {
      // Dynamic import of handler module
      const handlerModule = await import(handlerPath);
      this.tool.handler = handlerModule.default || handlerModule;
      return this.tool.handler;
    } catch (error) {
      debugLogger.error(`Failed to load handler: ${handlerPath}`, error);
      return null;
    }
  }

  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }
}

// ============================================================================
// Extension Tool Wrapper
// ============================================================================

/**
 * Wraps an extension tool as a DeclarativeTool for integration with the tool system.
 */
export class ExtensionToolWrapper extends DeclarativeTool<
  Record<string, unknown>,
  ToolResult
> {
  constructor(
    private readonly registeredTool: RegisteredTool,
    private readonly contextFactory: () => ExtensionToolContext,
  ) {
    super(
      registeredTool.definition.name,
      registeredTool.definition.displayName,
      registeredTool.definition.description,
      registeredTool.definition.kind as Kind,
      registeredTool.definition.parameterSchema,
      registeredTool.definition.isOutputMarkdown ?? true,
      registeredTool.definition.canUpdateOutput ?? false,
    );
  }

  build(params: Record<string, unknown>): ExtensionToolInvocation {
    const validationError = this.validateToolParams(params);
    if (validationError) {
      throw new Error(validationError);
    }
    return new ExtensionToolInvocation(
      params,
      this.registeredTool,
      this.contextFactory(),
    );
  }

  override validateToolParams(params: Record<string, unknown>): string | null {
    // First, validate against JSON schema
    const schemaErrors = SchemaValidator.validate(
      this.schema.parametersJsonSchema,
      params,
    );
    if (schemaErrors) {
      return schemaErrors;
    }
    return null;
  }
}

// ============================================================================
// Extension Tool Registry
// ============================================================================

/**
 * Registry for extension-provided tools.
 */
export class ExtensionToolRegistry {
  private readonly tools: Map<string, RegisteredTool> = new Map();
  private readonly options: ExtensionToolRegistryOptions;
  private readonly logger: ExtensionLoggerInterface;

  constructor(
    options: ExtensionToolRegistryOptions = {},
    logger?: ExtensionLoggerInterface,
  ) {
    this.options = {
      lazyLoading: true,
      defaultTimeout: 60000,
      validateSchemas: true,
      ...options,
    };

    // Default logger implementation
    this.logger = logger ?? {
      debug: (msg, data) => debugLogger.debug(msg, data),
      info: (msg, data) => debugLogger.info(msg, data),
      warn: (msg, data) => debugLogger.warn(msg, data),
      error: (msg, err, data) => debugLogger.error(msg, err, data),
      getLogs: () => [],
      clearLogs: () => {},
    };
  }

  /**
   * Register tools from an extension.
   * @param extension The extension to register tools from
   * @returns Array of registered tool names
   */
  registerToolsFromExtension(extension: ExtensionV2): string[] {
    if (!extension.tools || extension.tools.length === 0) {
      return [];
    }

    const registered: string[] = [];

    for (const toolDef of extension.tools) {
      try {
        const toolName = this.getFullToolName(extension.name, toolDef.name);

        // Validate schema if enabled
        if (this.options.validateSchemas) {
          const validation = this.validateToolDefinition(toolDef);
          if (!validation.valid) {
            this.logger.warn(
              `Skipping invalid tool ${toolName}: ${validation.errors.join(', ')}`,
            );
            continue;
          }
        }

        // Check for conflicts
        if (this.tools.has(toolName)) {
          this.logger.warn(`Tool ${toolName} already registered, overwriting`);
        }

        this.tools.set(toolName, {
          definition: toolDef,
          extensionId: extension.id,
          extensionName: extension.name,
          extensionPath: extension.path,
          isLoaded: false,
        });

        registered.push(toolName);
        this.logger.debug(`Registered tool: ${toolName}`);
      } catch (error) {
        this.logger.error(
          `Failed to register tool ${toolDef.name} from extension ${extension.name}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    return registered;
  }

  /**
   * Unregister all tools from an extension.
   * @param extensionId The extension ID to unregister tools from
   */
  unregisterToolsFromExtension(extensionId: string): void {
    for (const [toolName, tool] of this.tools.entries()) {
      if (tool.extensionId === extensionId) {
        this.tools.delete(toolName);
        this.logger.debug(`Unregistered tool: ${toolName}`);
      }
    }
  }

  /**
   * Get a tool by name.
   * @param name Full tool name or short name
   * @param extensionName Optional extension name for disambiguation
   */
  getTool(name: string, extensionName?: string): RegisteredTool | undefined {
    // Try exact match first
    if (this.tools.has(name)) {
      return this.tools.get(name);
    }

    // Try with extension prefix
    if (extensionName) {
      const prefixedName = this.getFullToolName(extensionName, name);
      return this.tools.get(prefixedName);
    }

    // Try to find by short name
    for (const [_toolName, tool] of this.tools.entries()) {
      if (tool.definition.name === name) {
        return tool;
      }
    }

    return undefined;
  }

  /**
   * Get all registered tools.
   */
  getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tools from a specific extension.
   */
  getToolsByExtension(extensionId: string): RegisteredTool[] {
    return this.getAllTools().filter(
      (tool) => tool.extensionId === extensionId,
    );
  }

  /**
   * Create a tool wrapper for integration with the main tool registry.
   */
  createToolWrapper(
    toolName: string,
    contextFactory: () => ExtensionToolContext,
  ): ExtensionToolWrapper | null {
    const tool = this.getTool(toolName);
    if (!tool) {
      return null;
    }
    return new ExtensionToolWrapper(tool, contextFactory);
  }

  /**
   * Load a tool handler (for non-lazy loading).
   */
  async loadToolHandler(toolName: string): Promise<boolean> {
    const tool = this.getTool(toolName);
    if (!tool) {
      return false;
    }

    if (tool.isLoaded && tool.handler) {
      return true;
    }

    const handlerPath = path.join(tool.extensionPath, tool.definition.handler);

    if (!fs.existsSync(handlerPath)) {
      this.logger.error(`Handler file not found: ${handlerPath}`);
      return false;
    }

    try {
      const handlerModule = await import(handlerPath);
      tool.handler = handlerModule.default || handlerModule;
      tool.isLoaded = true;
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to load handler for ${toolName}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  }

  /**
   * Clear all registered tools.
   */
  clear(): void {
    this.tools.clear();
    this.logger.debug('Cleared all registered tools');
  }

  /**
   * Get statistics about registered tools.
   */
  getStats(): {
    totalTools: number;
    loadedTools: number;
    extensionsWithTools: Set<string>;
  } {
    const tools = this.getAllTools();
    return {
      totalTools: tools.length,
      loadedTools: tools.filter((t) => t.isLoaded).length,
      extensionsWithTools: new Set(tools.map((t) => t.extensionId)),
    };
  }

  // Private methods

  private getFullToolName(extensionName: string, toolName: string): string {
    // Use a namespaced format: extensionName_toolName
    return `${extensionName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_${toolName}`;
  }

  private validateToolDefinition(toolDef: ExtensionToolDefinition): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!toolDef.name) {
      errors.push('Tool name is required');
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(toolDef.name)) {
      errors.push(
        'Tool name must start with a letter and contain only letters, numbers, and underscores',
      );
    }

    if (!toolDef.displayName) {
      errors.push('Display name is required');
    }

    if (!toolDef.description) {
      errors.push('Description is required');
    }

    if (!toolDef.handler) {
      errors.push('Handler path is required');
    }

    if (!toolDef.parameterSchema) {
      errors.push('Parameter schema is required');
    } else {
      // Validate JSON schema structure
      if (!toolDef.parameterSchema.type) {
        errors.push('Parameter schema must have a type');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalRegistry: ExtensionToolRegistry | null = null;

/**
 * Get the global extension tool registry instance.
 */
export function getExtensionToolRegistry(): ExtensionToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new ExtensionToolRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (for testing).
 */
export function resetExtensionToolRegistry(): void {
  globalRegistry = null;
}
