/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extension Types and Interfaces
 *
 * This module defines the core types for the Extension System,
 * including tools support, aliases, and lifecycle management.
 */

import type { Kind, ToolResultDisplay } from '../tools/tools.js';
import type { MCPServerConfig } from '../index.js';
import type { ExtensionSetting } from './extensionSettings.js';
import type { SkillConfig } from '../skills/types.js';
import type { SubagentConfig } from '../subagents/types.js';

// ============================================================================
// Extension Types
// ============================================================================

/**
 * Defines the type of extension.
 * - 'user': User-installed extensions from marketplace or local
 * - 'builtin': Built-in extensions shipped with Ollama Code
 * - 'plugin': Internal plugins for core functionality
 */
export type ExtensionType = 'user' | 'builtin' | 'plugin';

/**
 * Extension origin source for tracking where an extension came from.
 */
export type ExtensionOriginSource =
  | 'OllamaCode'
  | 'Claude'
  | 'Gemini'
  | 'Local'
  | 'Git'
  | 'GitHubRelease';

// ============================================================================
// Extension Tool Types
// ============================================================================

/**
 * JSON Schema definition for tool parameters.
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
  description?: string;
  enum?: string[];
  default?: unknown;
  [key: string]: unknown;
}

/**
 * Defines a tool provided by an extension.
 * Extensions can define custom tools that integrate with Ollama Code's tool system.
 */
export interface ExtensionToolDefinition {
  /** Unique name for the tool (e.g., 'my_extension_my_tool') */
  name: string;

  /** Human-readable display name */
  displayName: string;

  /** Description of what the tool does */
  description: string;

  /** Kind of tool for categorization and permissions */
  kind: Kind;

  /** JSON Schema for tool parameters */
  parameterSchema: JSONSchema;

  /** Path to the handler module relative to extension root */
  handler: string;

  /** Whether the tool's output should be rendered as markdown */
  isOutputMarkdown?: boolean;

  /** Whether the tool supports live (streaming) output */
  canUpdateOutput?: boolean;

  /** Whether the tool requires confirmation before execution */
  requiresConfirmation?: boolean;

  /** Tool timeout in milliseconds (default: 60000) */
  timeout?: number;

  /** Tool version for compatibility checking */
  version?: string;
}

/**
 * Context provided to tool handlers during execution.
 */
export interface ExtensionToolContext {
  /** Extension ID */
  extensionId: string;

  /** Extension name */
  extensionName: string;

  /** Extension version */
  extensionVersion: string;

  /** Path to extension root directory */
  extensionPath: string;

  /** Working directory */
  workingDirectory: string;

  /** Abort signal for cancellation */
  abortSignal: AbortSignal;

  /** Logger instance */
  logger: ExtensionLoggerInterface;

  /** Configuration values */
  config: Record<string, unknown>;
}

/**
 * Result returned by extension tool handlers.
 */
export interface ExtensionToolResult {
  /** Content for LLM context */
  llmContent: string;

  /** Display content for UI */
  returnDisplay: ToolResultDisplay;

  /** Error if tool execution failed */
  error?: {
    message: string;
    type?: string;
  };
}

/**
 * Interface for extension tool handler modules.
 */
export interface ExtensionToolHandler {
  /**
   * Executes the tool with the given parameters.
   * @param params Validated tool parameters
   * @param context Execution context
   * @returns Tool execution result
   */
  execute(
    params: Record<string, unknown>,
    context: ExtensionToolContext,
  ): Promise<ExtensionToolResult>;

  /**
   * Optional validation method for parameters.
   * Called before execute if defined.
   * @param params Raw parameters to validate
   * @returns Error message string if invalid, null if valid
   */
  validate?(params: Record<string, unknown>): string | null;

  /**
   * Optional method to get a description of what the tool will do.
   * @param params Tool parameters
   * @returns Markdown string describing the operation
   */
  getDescription?(params: Record<string, unknown>): string;
}

// ============================================================================
// Extension Alias Types
// ============================================================================

/**
 * Defines an alias for tools or commands.
 * Aliases provide shortcuts for frequently used tools.
 */
export interface ExtensionAliasDefinition {
  /** Alias name (e.g., 'mct' for 'my_custom_tool') */
  name: string;

  /** Target tool or command name */
  target: string;

  /** Optional description of what the alias does */
  description?: string;

  /** Type of alias target */
  type?: 'tool' | 'command' | 'agent' | 'skill';

  /** Optional default parameters for tool aliases */
  defaultParams?: Record<string, unknown>;
}

/**
 * Registry for extension aliases (interface).
 * Use ExtensionAliasRegistry class from extensionAliasRegistry.js for the implementation.
 */
export interface IExtensionAliasRegistry {
  /** Register an alias */
  register(alias: ExtensionAliasDefinition): void;

  /** Resolve an alias to its target */
  resolve(name: string): ExtensionAliasDefinition | null;

  /** List all aliases */
  list(): ExtensionAliasDefinition[];

  /** Remove an alias */
  remove(name: string): void;

  /** Clear all aliases for an extension */
  clearForExtension(extensionId: string): void;
}

// ============================================================================
// Extension Lifecycle Types
// ============================================================================

/**
 * Lifecycle event types for extensions.
 */
export type ExtensionLifecycleEvent =
  | 'activate'
  | 'deactivate'
  | 'install'
  | 'update'
  | 'uninstall';

/**
 * Context provided to lifecycle hooks.
 */
export interface ExtensionLifecycleContext {
  /** Extension ID */
  extensionId: string;

  /** Extension name */
  extensionName: string;

  /** Extension version */
  extensionVersion: string;

  /** Path to extension root directory */
  extensionPath: string;

  /** Previous version (for update events) */
  previousVersion?: string;

  /** Logger instance */
  logger: ExtensionLoggerInterface;

  /** Configuration values */
  config: Record<string, unknown>;
}

/**
 * Result returned by lifecycle hooks.
 */
export interface ExtensionLifecycleResult {
  /** Whether the hook completed successfully */
  success: boolean;

  /** Optional message to display */
  message?: string;

  /** Optional error if hook failed */
  error?: Error;
}

/**
 * Defines lifecycle hooks for an extension.
 */
export interface ExtensionLifecycleDefinition {
  /** Called when extension is activated */
  onActivate?: string;

  /** Called when extension is deactivated */
  onDeactivate?: string;

  /** Called after extension is installed */
  onInstall?: string;

  /** Called after extension is updated */
  onUpdate?: string;

  /** Called before extension is uninstalled */
  onUninstall?: string;
}

/**
 * Interface for lifecycle handler modules.
 */
export interface ExtensionLifecycleHandler {
  /**
   * Handle the lifecycle event.
   * @param event The lifecycle event type
   * @param context The execution context
   * @returns Result of the lifecycle hook
   */
  handle(
    event: ExtensionLifecycleEvent,
    context: ExtensionLifecycleContext,
  ): Promise<ExtensionLifecycleResult>;
}

// ============================================================================
// Extension Logger Types
// ============================================================================

/**
 * Log levels for extension logging.
 */
export type ExtensionLogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure.
 */
export interface ExtensionLogEntry {
  /** Timestamp of the log entry */
  timestamp: Date;

  /** Extension ID */
  extensionId: string;

  /** Extension name */
  extensionName: string;

  /** Log level */
  level: ExtensionLogLevel;

  /** Log message */
  message: string;

  /** Additional data */
  data?: Record<string, unknown>;

  /** Error object if applicable */
  error?: Error;
}

/**
 * Interface for extension logger.
 */
export interface ExtensionLoggerInterface {
  /** Log debug message */
  debug(message: string, data?: Record<string, unknown>): void;

  /** Log info message */
  info(message: string, data?: Record<string, unknown>): void;

  /** Log warning message */
  warn(message: string, data?: Record<string, unknown>): void;

  /** Log error message */
  error(message: string, error?: Error, data?: Record<string, unknown>): void;

  /** Get all log entries for this extension */
  getLogs(): ExtensionLogEntry[];

  /** Clear logs for this extension */
  clearLogs(): void;
}

// ============================================================================
// Extension Config Types
// ============================================================================

/**
 * Complete extension configuration as stored in ollama-extension.json.
 * This is the main configuration interface that extends the existing config.
 */
export interface ExtensionConfigV2 {
  // Required fields
  name: string;
  version: string;

  // Extension type (new)
  type?: ExtensionType;

  // Tools support (new)
  tools?: ExtensionToolDefinition[];

  // Aliases support (new)
  aliases?: ExtensionAliasDefinition[];

  // Lifecycle hooks (new)
  lifecycle?: ExtensionLifecycleDefinition;

  // Existing fields
  mcpServers?: Record<string, MCPServerConfig>;
  lspServers?: string | Record<string, unknown>;
  contextFileName?: string | string[];
  commands?: string | string[];
  skills?: string | string[];
  agents?: string | string[];
  settings?: ExtensionSetting[];

  // Metadata (new)
  displayName?: string;
  description?: string;
  author?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  homepage?: string;
  bugs?: string;

  // Dependencies (new)
  dependencies?: Record<string, string>;
  ollamaCodeVersion?: string;
  nodeVersion?: string;
}

/**
 * Installation metadata for extensions.
 */
export interface ExtensionInstallMetadataV2 {
  /** Source URL or path */
  source: string;

  /** Installation type */
  type: 'local' | 'link' | 'git' | 'github-release';

  /** Origin source */
  originSource: ExtensionOriginSource;

  /** Installation timestamp */
  installedAt?: string;

  /** Last updated timestamp */
  updatedAt?: string;

  /** Auto-update enabled */
  autoUpdate?: boolean;

  /** Release tag if installed from GitHub release */
  releaseTag?: string;

  /** Plugin name for Claude extensions */
  pluginName?: string;

  /** Marketplace config if from Claude marketplace */
  marketplaceConfig?: {
    type: 'claude';
    url: string;
  };
}

// ============================================================================
// Extension Instance Types
// ============================================================================

/**
 * Complete extension instance with all features.
 */
export interface ExtensionV2 {
  /** Unique extension ID */
  id: string;

  /** Extension name */
  name: string;

  /** Extension version */
  version: string;

  /** Whether the extension is active */
  isActive: boolean;

  /** Path to extension directory */
  path: string;

  /** Extension configuration */
  config: ExtensionConfigV2;

  /** Extension type */
  type: ExtensionType;

  /** Installation metadata */
  installMetadata?: ExtensionInstallMetadataV2;

  // Loaded features

  /** MCP servers provided by this extension */
  mcpServers?: Record<string, MCPServerConfig>;

  /** Context files */
  contextFiles: string[];

  /** Settings schema */
  settings?: ExtensionSetting[];

  /** Resolved settings values */
  resolvedSettings?: Record<string, unknown>;

  /** Commands provided by this extension */
  commands?: string[];

  /** Skills provided by this extension */
  skills?: SkillConfig[];

  /** Agents provided by this extension */
  agents?: SubagentConfig[];

  // New features

  /** Tools provided by this extension */
  tools?: ExtensionToolDefinition[];

  /** Aliases provided by this extension */
  aliases?: ExtensionAliasDefinition[];

  /** Lifecycle definition */
  lifecycle?: ExtensionLifecycleDefinition;

  /** Logger instance */
  logger?: ExtensionLoggerInterface;

  // Runtime state

  /** Whether the extension is currently loading */
  isLoading?: boolean;

  /** Last error if extension failed to load */
  loadError?: Error;

  /** Whether lifecycle hooks have been executed */
  lifecycleExecuted?: boolean;
}

// ============================================================================
// Extension Events
// ============================================================================

/**
 * Events emitted by the extension system.
 */
export interface ExtensionEvents {
  /** Emitted when an extension starts loading */
  'extension:loading': { extensionId: string; extensionName: string };

  /** Emitted when an extension finishes loading */
  'extension:loaded': { extension: ExtensionV2 };

  /** Emitted when an extension fails to load */
  'extension:load-error': { extensionId: string; error: Error };

  /** Emitted when an extension is activated */
  'extension:activated': { extension: ExtensionV2 };

  /** Emitted when an extension is deactivated */
  'extension:deactivated': { extension: ExtensionV2 };

  /** Emitted when an extension is installed */
  'extension:installed': { extension: ExtensionV2 };

  /** Emitted when an extension is updated */
  'extension:updated': {
    extension: ExtensionV2;
    previousVersion: string;
  };

  /** Emitted when an extension is uninstalled */
  'extension:uninstalled': { extensionId: string; extensionName: string };

  /** Emitted when an extension tool is registered */
  'extension:tool-registered': {
    extensionId: string;
    toolName: string;
  };

  /** Emitted when an extension alias is registered */
  'extension:alias-registered': {
    extensionId: string;
    aliasName: string;
    target: string;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Options for loading an extension.
 */
export interface LoadExtensionOptions {
  /** Extension directory path */
  extensionDir: string;

  /** Workspace directory */
  workspaceDir?: string;

  /** Force reload even if cached */
  forceReload?: boolean;

  /** Skip lifecycle hooks */
  skipLifecycle?: boolean;
}

/**
 * Options for listing extensions.
 */
export interface ListExtensionsOptions {
  /** Filter by type */
  type?: ExtensionType;

  /** Filter by active status */
  activeOnly?: boolean;

  /** Sort field */
  sortBy?: 'name' | 'version' | 'type' | 'lastModified';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Result of extension validation.
 */
export interface ExtensionValidationResult {
  /** Whether the extension is valid */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}
