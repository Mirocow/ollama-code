/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plugin System Types
 * 
 * This module defines the interfaces for the plugin system,
 * allowing dynamic loading and management of tools and extensions.
 */

import type { FunctionDeclaration } from '../types/content.js';

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Unique plugin identifier */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Plugin version (semver) */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin homepage URL */
  homepage?: string;
  /** Plugin repository URL */
  repository?: string;
  /** Plugin license */
  license?: string;
  /** Minimum Ollama Code version required */
  minVersion?: string;
  /** Maximum Ollama Code version supported */
  maxVersion?: string;
  /** Plugin dependencies */
  dependencies?: PluginDependency[];
  /** Plugin configuration schema */
  configSchema?: PluginConfigSchema;
  /** Plugin tags for categorization */
  tags?: string[];
  /** Whether the plugin is enabled by default */
  enabledByDefault?: boolean;
}

/**
 * Plugin dependency
 */
export interface PluginDependency {
  /** Dependency plugin ID */
  pluginId: string;
  /** Minimum version required */
  minVersion?: string;
  /** Maximum version supported */
  maxVersion?: string;
  /** Whether the dependency is optional */
  optional?: boolean;
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  /** JSON Schema for configuration */
  type: 'object';
  properties: Record<string, PluginConfigProperty>;
  required?: string[];
}

/**
 * Plugin configuration property
 */
export interface PluginConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: PluginConfigProperty;
  properties?: Record<string, PluginConfigProperty>;
}

/**
 * Plugin context provided to plugin hooks
 */
export interface PluginContext {
  /** Plugin configuration */
  config: Record<string, unknown>;
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** Logger instance */
  logger: PluginLogger;
  /** Event emitter for plugin events */
  events: PluginEventEmitter;
  /** Access to Ollama Code services */
  services: PluginServices;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * Plugin event emitter
 */
export interface PluginEventEmitter {
  emit: (event: string, data: unknown) => void;
  on: (event: string, callback: (data: unknown) => void) => () => void;
  once: (event: string, callback: (data: unknown) => void) => void;
}

/**
 * Plugin services - access to Ollama Code internals
 * ALL plugins have access to these services by default
 */
export interface PluginServices {
  /** Register a tool */
  registerTool: (tool: PluginTool) => void;
  /** Unregister a tool */
  unregisterTool: (toolId: string) => void;
  /** Get registered tools */
  getTools: () => PluginTool[];
  /** Show a notification to the user */
  showNotification: (notification: PluginNotification) => void;
  /** Execute a command */
  executeCommand: (commandId: string, ...args: unknown[]) => Promise<unknown>;
  /** Get configuration */
  getConfig: () => Record<string, unknown>;
  /** Set configuration */
  setConfig: (config: Record<string, unknown>) => void;
  /**
   * Get storage instance for persistent data
   * Available to ALL plugins by default
   */
  getStorage: () => import('../config/storage.js').Storage;
  /** Get storage item by key */
  getStorageItem: (key: string) => unknown;
  /** Set storage item */
  setStorageItem: (key: string, value: unknown) => void;
  /**
   * Get environment variable value
   * Available to ALL plugins by default
   * @param name - Environment variable name
   * @param defaultValue - Default value if not set
   */
  getEnv: (name: string, defaultValue?: string) => string | undefined;
  /**
   * Get all environment variables
   * Returns a copy of process.env
   */
  getAllEnv: () => Record<string, string | undefined>;
  /**
   * Get prompt registry for accessing prompts
   * Available to ALL plugins by default
   */
  getPromptRegistry: () => import('../prompts/prompt-registry.js').PromptRegistry;
  /**
   * Get session ID for the current conversation
   */
  getSessionId: () => string;
  /**
   * Get model ID being used
   */
  getModelId: () => string | undefined;
}

/**
 * Tool alias definition - maps short names to canonical tool names
 */
export interface ToolAlias {
  /** Short alias name (e.g., 'ssh', 'run', 'edit') */
  alias: string;
  /** Canonical tool name this alias resolves to */
  canonicalName: string;
  /** Optional description of what this alias does */
  description?: string;
}

/**
 * Tool prompt definition - provides context-aware prompts for the model
 */
export interface ToolPrompt {
  /** Prompt content - can include placeholders like {{toolName}} */
  content: string;
  /** Minimum context window size required for this prompt */
  minContextWindow?: number;
  /** Maximum context window size for this prompt */
  maxContextWindow?: number;
  /** Priority when multiple prompts match (higher = preferred) */
  priority?: number;
}

/**
 * Plugin tool definition
 */
export interface PluginTool {
  /** Unique tool identifier */
  id: string;
  /** Tool name (used in function calls) */
  name: string;
  /** Tool description */
  description: string;
  /** Tool parameters schema */
  parameters: FunctionDeclaration['parameters'];
  /** Tool execution handler */
  execute: (params: Record<string, unknown>, context: ToolExecutionContext) => Promise<ToolExecutionResult>;
  /** Whether the tool requires confirmation */
  requiresConfirmation?: boolean;
  /** Confirmation message builder */
  buildConfirmationMessage?: (params: Record<string, unknown>) => string;
  /** Tool timeout in milliseconds */
  timeout?: number;
  /** Whether the tool is destructive */
  isDestructive?: boolean;
  /** Tool category */
  category?: string;
  /** Tool tags */
  tags?: string[];
  /** Tool aliases - short names that resolve to this tool */
  aliases?: string[];
  /** Context-aware prompts for this tool */
  prompts?: ToolPrompt[];
}

/**
 * Tool execution context
 * Provides access to all shared resources for tool execution
 * ALL tools have access to storage, env, prompts, and config by default
 */
export interface ToolExecutionContext {
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Working directory */
  workingDirectory?: string;
  /** User preferences */
  preferences?: Record<string, unknown>;
  /** Plugin context */
  plugin: PluginContext;
  /**
   * Config instance for tools that need it
   * Available to ALL tools by default
   */
  config?: import('../config/config.js').Config;
  /** 
   * Storage instance for persisting data across sessions
   * Available to ALL tools by default
   */
  storage: import('../config/storage.js').Storage;
  /**
   * Prompt registry for accessing and managing prompts
   * Available to ALL tools by default
   */
  promptRegistry: import('../prompts/prompt-registry.js').PromptRegistry;
  /**
   * Session ID for the current conversation
   */
  sessionId: string;
  /**
   * Model ID being used
   */
  modelId?: string;
  /**
   * Environment variables access
   * Available to ALL tools by default
   */
  env: {
    /** Get environment variable value */
    get: (name: string, defaultValue?: string) => string | undefined;
    /** Get all environment variables */
    getAll: () => Record<string, string | undefined>;
  };
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  /** Whether the execution was successful */
  success: boolean;
  /** Result data */
  data?: unknown;
  /** Error message if failed */
  error?: string;
  /** Display information */
  display?: {
    title?: string;
    summary?: string;
    details?: string;
    file?: string;
    line?: number;
  };
}

/**
 * Plugin notification
 */
export interface PluginNotification {
  /** Notification type */
  type: 'info' | 'warning' | 'error' | 'success';
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Notification duration in milliseconds (0 for persistent) */
  duration?: number;
  /** Actions available for the user */
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /** Called when the plugin is loaded */
  onLoad?: (context: PluginContext) => Promise<void>;
  /** Called when the plugin is enabled */
  onEnable?: (context: PluginContext) => Promise<void>;
  /** Called when the plugin is disabled */
  onDisable?: (context: PluginContext) => Promise<void>;
  /** Called when the plugin is unloaded */
  onUnload?: (context: PluginContext) => Promise<void>;
  /** Called when configuration changes */
  onConfigChange?: (config: Record<string, unknown>, context: PluginContext) => Promise<void>;
  /** Called before a tool is executed */
  onBeforeToolExecute?: (toolId: string, params: Record<string, unknown>, context: PluginContext) => Promise<boolean>;
  /** Called after a tool is executed */
  onAfterToolExecute?: (toolId: string, params: Record<string, unknown>, result: ToolExecutionResult, context: PluginContext) => Promise<void>;
}

/**
 * Unified tool item - can be one of these types:
 * 1. PluginTool object (simple declarative tool)
 * 2. Tool class constructor (for BaseDeclarativeTool)
 * 3. Tool factory function (config) => tool (for tools needing Config)
 * 4. Tool instance (already instantiated tool object)
 * 
 * This type is intentionally permissive to allow various tool registration patterns.
 * The pluginRegistry handles runtime type detection and appropriate instantiation.
 */
export type UnifiedToolItem = 
  | PluginTool 
  | (new (...args: unknown[]) => unknown)  // Any class constructor
  | ((...args: unknown[]) => unknown)      // Any function (factory or otherwise)
  | object;  // Tool instances (already instantiated)

/**
 * Plugin definition
 * ALL plugins have access to storage, env, and prompts by default
 */
export interface PluginDefinition {
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** Plugin hooks */
  hooks?: PluginHooks;
  /**
   * Unified tools array - accepts PluginTool objects, tool class constructors, or factory functions.
   * 
   * Items can be:
   * - PluginTool: Plain object with { id, name, description, parameters, execute }
   * - Tool class: Constructor that can be instantiated with `new` (no config needed)
   * - Factory function: (config) => tool instance (for tools needing Config)
   * 
   * This unifies all tool registration patterns into a single array.
   */
  tools?: UnifiedToolItem[];
  /** Commands provided by this plugin */
  commands?: PluginCommand[];
  /** Default configuration */
  defaultConfig?: Record<string, unknown>;
  /** Tool aliases - short names that map to canonical tool names */
  aliases?: ToolAlias[];
  /** Context-aware prompts for this plugin's tools */
  prompts?: ToolPrompt[];
  /** Plugin capabilities - declares what this plugin can do */
  capabilities?: PluginCapabilities;
  /** 
   * Plugin category for organization
   * Examples: 'core', 'dev-tools', 'file-tools', 'search', 'network'
   */
  category?: string;
  /** 
   * Whether this plugin can be disabled by user configuration
   * Core plugins should set this to false
   */
  userDisableable?: boolean;
  /**
   * Whether this plugin is enabled
   * Can be controlled via configuration file
   */
  enabled?: boolean;
}

/**
 * Unified plugin definition - the standard interface for ALL plugins
 * This interface ensures consistency across all plugin types
 * 
 * @example
 * const myPlugin: UnifiedPluginDefinition = {
 *   metadata: {
 *     id: 'my-plugin',
 *     name: 'My Plugin',
 *     version: '1.0.0',
 *   },
 *   tools: [tool1, tool2], // All tools go here (PluginTool, class, or factory)
 *   requiresStorage: true, // Enable storage for all tools
 *   aliases: [
 *     { alias: 'my', canonicalName: 'my_tool' }
 *   ],
 * };
 */
export interface UnifiedPluginDefinition extends PluginDefinition {
  /** 
   * Unified tools array - ALL tools must be registered here
   * Accepts PluginTool objects, tool class constructors, or factory functions
   * This replaces toolClasses and toolFactories for consistency
   */
  tools: UnifiedToolItem[];
  /** Required: Storage access flag - all plugins can access storage */
  requiresStorage?: boolean;
  /** Plugin capabilities declaration */
  capabilities?: PluginCapabilities;
}

/**
 * Plugin capabilities declaration
 */
export interface PluginCapabilities {
  /** Can read files */
  canReadFiles?: boolean;
  /** Can write files */
  canWriteFiles?: boolean;
  /** Can execute shell commands */
  canExecuteCommands?: boolean;
  /** Can access network */
  canAccessNetwork?: boolean;
  /** Can use storage */
  canUseStorage?: boolean;
  /** Can access prompts */
  canUsePrompts?: boolean;
  /** Can spawn subagents */
  canSpawnAgents?: boolean;
}

/**
 * Plugin command definition
 */
export interface PluginCommand {
  /** Unique command identifier */
  id: string;
  /** Command name (e.g., '/mycommand') */
  name: string;
  /** Command description */
  description: string;
  /** Command handler */
  execute: (args: string[], context: PluginContext) => Promise<unknown>;
  /** Command aliases */
  aliases?: string[];
  /** Whether the command is available in shell mode */
  shellMode?: boolean;
}

/**
 * Plugin status
 */
export type PluginStatus = 
  | 'unloaded'   // Plugin is not loaded
  | 'loaded'     // Plugin is loaded but not enabled
  | 'enabled'    // Plugin is enabled and running
  | 'error'      // Plugin has an error
  | 'disabled';  // Plugin is explicitly disabled

/**
 * Plugin instance (runtime state)
 */
export interface PluginInstance {
  /** Plugin definition */
  definition: PluginDefinition;
  /** Plugin context */
  context: PluginContext;
  /** Plugin status */
  status: PluginStatus;
  /** Plugin error if any */
  error?: Error;
  /** Plugin configuration */
  config: Record<string, unknown>;
  /** Load timestamp */
  loadedAt?: Date;
  /** Enable timestamp */
  enabledAt?: Date;
}

/**
 * Plugin manifest (for discovery)
 */
export interface PluginManifest {
  /** Entry point file */
  entry: string;
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** Whether the plugin is built-in */
  builtin?: boolean;
}

// ============================================================================
// Plugin Health Monitoring
// ============================================================================

/**
 * Plugin health status
 */
export type PluginHealthStatus = 'healthy' | 'degraded' | 'error' | 'unknown';

/**
 * Plugin health metrics for monitoring
 */
export interface PluginHealth {
  /** Plugin ID */
  pluginId: string;
  /** Current health status */
  status: PluginHealthStatus;
  /** Last check timestamp */
  lastChecked: Date;
  /** Last error message if any */
  lastError?: string;
  /** Last error timestamp */
  lastErrorAt?: Date;
  /** Total number of tool calls */
  toolCallsTotal: number;
  /** Number of failed tool calls */
  toolCallsFailed: number;
  /** Number of successful tool calls */
  toolCallsSuccessful: number;
  /** Average execution time in milliseconds */
  avgExecutionTimeMs: number;
  /** Peak memory usage in bytes (if available) */
  peakMemoryBytes?: number;
  /** Uptime in milliseconds */
  uptimeMs: number;
  /** Custom health metrics from plugin */
  customMetrics?: Record<string, number | string | boolean>;
}

/**
 * Health check options
 */
export interface HealthCheckOptions {
  /** Include memory metrics */
  includeMemory?: boolean;
  /** Include custom metrics from plugin */
  includeCustomMetrics?: boolean;
  /** Timeout for health check in milliseconds */
  timeout?: number;
}

// ============================================================================
// Dependency Validation
// ============================================================================

/**
 * Dependency validation result
 */
export interface DependencyValidationResult {
  /** Whether all dependencies are satisfied */
  valid: boolean;
  /** List of missing required dependencies */
  missingRequired: Array<{
    pluginId: string;
    minVersion?: string;
    maxVersion?: string;
  }>;
  /** List of missing optional dependencies */
  missingOptional: Array<{
    pluginId: string;
    minVersion?: string;
    maxVersion?: string;
  }>;
  /** List of version conflicts */
  versionConflicts: Array<{
    pluginId: string;
    required: string;
    actual: string;
  }>;
  /** List of circular dependencies detected */
  circularDependencies: string[][];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Plugin load order info
 */
export interface PluginLoadOrder {
  /** Plugin ID */
  pluginId: string;
  /** Load order index (lower = load first) */
  order: number;
  /** Dependencies that must be loaded before this plugin */
  dependencies: string[];
  /** Whether this plugin can be loaded */
  canLoad: boolean;
  /** Reason if cannot be loaded */
  reason?: string;
}

// ============================================================================
// Plugin Events
// ============================================================================

/**
 * Plugin event types
 */
export type PluginEventType =
  | 'plugin:registered'
  | 'plugin:unregistered'
  | 'plugin:loaded'
  | 'plugin:unloaded'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'plugin:error'
  | 'plugin:reloaded'
  | 'plugin:health-changed'
  | 'tool:registered'
  | 'tool:unregistered'
  | 'tool:executed'
  | 'tool:failed';

/**
 * Plugin event payload
 */
export interface PluginEvent {
  /** Event type */
  type: PluginEventType;
  /** Plugin ID */
  pluginId?: string;
  /** Tool ID */
  toolId?: string;
  /** Event timestamp */
  timestamp: Date;
  /** Event data */
  data?: unknown;
  /** Error if any */
  error?: Error;
}
