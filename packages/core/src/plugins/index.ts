/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plugin System
 *
 * This module provides a plugin architecture for extending
 * Ollama Code with custom tools, commands, and functionality.
 *
 * **Builtin Plugins (16):**
 * - agent-tools - Task and Skill tools for subagent management
 * - api-tools - HTTP API interaction tools
 * - code-analysis-tools - Code analysis and linting
 * - core-tools - Echo, timestamp, environment tools
 * - database-tools - Database query and management
 * - dev-tools - Development and debugging utilities
 * - file-tools - File read, write, edit, glob, grep, list
 * - git-tools - Git version control operations
 * - lsp-tools - Language Server Protocol integration
 * - mcp-tools - Model Context Protocol client
 * - memory-tools - Ollama.md memory management
 * - productivity-tools - Todo and plan mode tools
 * - search-tools - Web search capabilities
 * - shell-tools - Shell command execution
 * - ssh-tools - SSH remote operations
 * - storage-tools - Persistent storage namespaces
 *
 * **Plugin Discovery Sources:**
 * - Builtin plugins (bundled with core)
 * - User plugins from ~/.ollama-code/plugins/
 * - Project plugins from .ollama-code/plugins/
 * - NPM packages with @ollama-code/plugin- prefix
 *
 * **Exports:**
 * - `BUILTIN_TOOL_NAMES` - All tool names from builtin plugins
 * - `BUILTIN_TOOL_NAMES_SET` - Set for quick lookup
 * - `FILE_MODIFYING_TOOLS` - Tools that modify files
 * - `COMMAND_EXECUTING_TOOLS` - Tools that execute commands
 * - Plugin management classes (PluginManager, PluginLoader, PluginRegistry)
 * - Security sandbox utilities
 * - Marketplace integration
 */

// ============================================================================
// Builtin Tool Names (from all plugins - single source of truth)
// ============================================================================

// Import tool names from each builtin plugin
import { TOOL_NAMES as AGENT_TOOLS } from './builtin/agent-tools/index.js';
import { TOOL_NAMES as API_TOOLS } from './builtin/api-tools/index.js';
import { TOOL_NAMES as CODE_ANALYSIS_TOOLS } from './builtin/code-analysis-tools/index.js';
import { TOOL_NAMES as CORE_TOOLS } from './builtin/core-tools/index.js';
import { TOOL_NAMES as DATABASE_TOOLS } from './builtin/database-tools/index.js';
import { TOOL_NAMES as DEV_TOOLS } from './builtin/dev-tools/index.js';
import { TOOL_NAMES as FILE_TOOLS } from './builtin/file-tools/index.js';
import { TOOL_NAMES as GIT_TOOLS } from './builtin/git-tools/index.js';
import { TOOL_NAMES as LSP_TOOLS } from './builtin/lsp-tools/index.js';
import { TOOL_NAMES as MCP_TOOLS } from './builtin/mcp-tools/index.js';
import { TOOL_NAMES as MEMORY_TOOLS } from './builtin/memory-tools/index.js';
import { TOOL_NAMES as PRODUCTIVITY_TOOLS } from './builtin/productivity-tools/index.js';
import { TOOL_NAMES as SEARCH_TOOLS } from './builtin/search-tools/index.js';
import { TOOL_NAMES as SHELL_TOOLS } from './builtin/shell-tools/index.js';
import { TOOL_NAMES as SSH_TOOLS } from './builtin/ssh-tools/index.js';
import { TOOL_NAMES as STORAGE_TOOLS } from './builtin/storage-tools/index.js';

/**
 * All builtin tool names - merged from all plugins
 */
export const BUILTIN_TOOL_NAMES = {
  ...AGENT_TOOLS,
  ...API_TOOLS,
  ...CODE_ANALYSIS_TOOLS,
  ...CORE_TOOLS,
  ...DATABASE_TOOLS,
  ...DEV_TOOLS,
  ...FILE_TOOLS,
  ...GIT_TOOLS,
  ...LSP_TOOLS,
  ...MCP_TOOLS,
  ...MEMORY_TOOLS,
  ...PRODUCTIVITY_TOOLS,
  ...SEARCH_TOOLS,
  ...SHELL_TOOLS,
  ...SSH_TOOLS,
  ...STORAGE_TOOLS,
} as const;

/**
 * Type for all builtin tool names
 */
export type BuiltinToolName =
  (typeof BUILTIN_TOOL_NAMES)[keyof typeof BUILTIN_TOOL_NAMES];

/**
 * Set of all builtin tool names for quick lookup
 */
export const BUILTIN_TOOL_NAMES_SET = new Set<string>(
  Object.values(BUILTIN_TOOL_NAMES),
);

/**
 * Check if a tool name is a builtin tool
 */
export function isBuiltinTool(name: string): boolean {
  return BUILTIN_TOOL_NAMES_SET.has(name);
}

/**
 * Tools that modify files (require approval in default mode)
 */
export const FILE_MODIFYING_TOOLS = new Set<string>([
  BUILTIN_TOOL_NAMES.WRITE_FILE,
  BUILTIN_TOOL_NAMES.EDIT,
]);

/**
 * Tools that execute commands (require approval in default mode)
 */
export const COMMAND_EXECUTING_TOOLS = new Set<string>([
  BUILTIN_TOOL_NAMES.RUN_SHELL_COMMAND,
]);

// ============================================================================
// Plugin System Exports
// ============================================================================

export * from './types.js';
export { PluginManager, pluginManager } from './pluginManager.js';
export { PluginLoader, createPluginLoader } from './pluginLoader.js';
export type { DiscoveredPlugin } from './pluginLoader.js';
export {
  PluginToolAdapter,
  registerPluginTools,
  unregisterPluginTools,
  pluginToolToDeclarative,
} from './pluginToolAdapter.js';
export {
  PluginRegistry,
  getPluginRegistry,
  initializePluginRegistry,
} from './pluginRegistry.js';

// Plugin Configuration
export {
  PluginConfig,
  createPluginConfig,
  type PluginConfigEntry,
  type PluginConfigFile,
} from './pluginConfig.js';

// Security Sandbox
export {
  PluginSandbox,
  createPluginSandbox,
  createBuiltinSandbox,
  createTrustedSandbox,
  createUntrustedSandbox,
  SandboxViolationError,
  DEFAULT_RESOURCE_LIMITS,
  UNTRUSTED_PLUGIN_CONFIG,
  TRUSTED_PLUGIN_CONFIG,
  BUILTIN_PLUGIN_CONFIG,
} from './pluginSandbox.js';
export type {
  FilesystemAccessLevel,
  NetworkAccessLevel,
  CommandExecutionLevel,
  FilesystemPermission,
  NetworkPermission,
  CommandPermission,
  ResourceLimits,
  PluginSandboxConfig,
  ViolationType,
  SandboxViolation,
  SandboxContext,
} from './pluginSandbox.js';

// Plugin Marketplace
export {
  PluginMarketplace,
  createPluginMarketplace,
} from './pluginMarketplace.js';
export type {
  MarketplacePlugin,
  MarketplaceSearchOptions,
  PluginInstallOptions,
  PluginUpdateOptions,
} from './pluginMarketplace.js';

// ============================================================================
// Re-exports from Builtin Plugins (for core/index.ts)
// ============================================================================

// MCP tools
export type {
  SendSdkMcpMessage,
  DiscoveredMCPPrompt,
} from './builtin/mcp-tools/index.js';
export {
  McpClient,
  McpClientManager,
  DiscoveredMCPTool,
  MCPServerStatus,
  MCPDiscoveryState,
  getMCPServerStatus,
  getMCPDiscoveryState,
  getAllMCPServerStatuses,
  updateMCPServerStatus,
  addMCPStatusChangeListener,
  removeMCPStatusChangeListener,
  discoverMcpTools,
  connectAndDiscover,
  discoverTools,
  discoverPrompts,
  connectToMcpServer,
  createTransport,
  hasNetworkTransport,
  isEnabled,
  mcpServerRequiresOAuth,
} from './builtin/mcp-tools/index.js';

// Web Search tools - export types for configuration
export type {
  WebSearchProviderConfig,
  WebSearchConfig,
  WebSearchToolParams,
  WebSearchToolResult,
  WebSearchResultItem,
  WebSearchProvider,
  TavilyProviderConfig,
  GoogleProviderConfig,
  DashScopeProviderConfig,
} from './builtin/search-tools/web-search/types.js';

// Productivity tools - export tool classes
export { TodoWriteTool } from './builtin/productivity-tools/todo-write/index.js';
export type {
  TodoItem,
  TodoWriteParams,
} from './builtin/productivity-tools/todo-write/index.js';
export { ExitPlanModeTool } from './builtin/productivity-tools/exit-plan-mode/index.js';
export type { ExitPlanModeParams } from './builtin/productivity-tools/exit-plan-mode/index.js';

// Storage tools - export types and utilities
export {
  StorageNamespaces,
  type StorageNamespace,
  type StorageEntry,
  type StorageMetadata,
  type ProjectInfo,
  getProjectInfo,
  setSessionId,
  getSessionId,
  clearSessionStorage,
  cleanupExpiredEntries,
  startTTLBackgroundCleanup,
  stopTTLBackgroundCleanup,
  isTTLBackgroundCleanupRunning,
} from './builtin/storage-tools/index.js';

// Memory tools - export memory management utilities
export {
  MemoryTool,
  setOllamaMdFilename,
  getCurrentOllamaMdFilename,
  getAllOllamaMdFilenames,
  OLLAMA_CONFIG_DIR,
  OLLAMA_CODE_CONFIG_DIR,
  DEFAULT_CONTEXT_FILENAME,
} from './builtin/memory-tools/index.js';

// Agent tools - export TaskTool and SkillTool
export { TaskTool } from './builtin/agent-tools/task/index.js';
export type { TaskParams } from './builtin/agent-tools/task/index.js';
export { SkillTool } from './builtin/agent-tools/skill/index.js';
export type { SkillParams } from './builtin/agent-tools/skill/index.js';

// Shell tools - export ShellTool and ShellToolInvocation
export { ShellTool, ShellToolInvocation } from './builtin/shell-tools/index.js';
export type { ShellToolParams } from './builtin/shell-tools/shell.js';
