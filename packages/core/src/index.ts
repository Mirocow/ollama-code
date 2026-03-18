/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @packageDocumentation
 *
 * Ollama Code Core Library - A comprehensive toolkit for building AI-powered
 * code assistants with local LLM support through Ollama.
 *
 * @remarks
 * This package provides the core functionality for Ollama Code, including:
 * - Native Ollama API client with streaming support
 * - Context caching for KV-cache reuse
 * - Tool system with MCP (Model Context Protocol) support
 * - Plugin system with sandboxing
 * - LSP (Language Server Protocol) integration
 * - Model management and configuration
 *
 * @example
 * ```typescript
 * import { OllamaNativeClient, createOllamaNativeClient } from '@ollama-code/ollama-code-core';
 *
 * // Create a client
 * const client = createOllamaNativeClient({ baseUrl: 'http://localhost:11434' });
 *
 * // List available models
 * const models = await client.listModels();
 *
 * // Chat with streaming
 * await client.chat(
 *   { model: 'llama3.2', messages: [{ role: 'user', content: 'Hello!' }] },
 *   (chunk) => console.log(chunk.message.content)
 * );
 * ```
 */

// ============================================================================
// Types (Ollama Code native types)
// ============================================================================

/**
 * Core type definitions for Ollama Code.
 * @module types
 */
export * from './types/index.js';

// ============================================================================
// Configuration & Models
// ============================================================================

/**
 * Configuration management and model registry.
 *
 * @module config
 * @remarks
 * The configuration system supports multiple sources:
 * - Command-line arguments (highest priority)
 * - Settings file (.ollama-code/settings.json)
 * - Environment variables
 * - Default values (lowest priority)
 *
 * @example
 * ```typescript
 * import { Config, createConfig } from '@ollama-code/ollama-code-core';
 *
 * const config = await createConfig({
 *   model: 'llama3.2',
 *   ollamaUrl: 'http://localhost:11434'
 * });
 * ```
 */

// Core configuration
export * from './config/config.js';
export { Storage } from './config/storage.js';
export * from './utils/configResolver.js';

/**
 * Model registry and configuration.
 *
 * @module models
 * @remarks
 * Manages model definitions, capabilities detection, and provider configurations.
 * Supports multiple model providers: Ollama, OpenAI, Anthropic, Google, and more.
 */
export {
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
} from './config/models.js';
export {
  type AvailableModel,
  type ModelCapabilities as ProviderModelCapabilities,
  type ModelConfig as ProviderModelConfig,
  type ModelConfigCliInput,
  type ModelConfigResolutionResult,
  type ModelConfigSettingsInput,
  type ModelConfigSourcesInput,
  type ModelConfigValidationResult,
  ModelRegistry,
  type ModelGenerationConfig,
  ModelsConfig,
  type ModelsConfigOptions,
  type ModelProvidersConfig,
  type ModelSwitchMetadata,
  type OnModelChangeCallback,
  OLLAMA_MODELS,
  resolveModelConfig,
  type ResolvedModelConfig,
  validateModelConfig,
} from './models/index.js';

// Output formatting
export * from './output/json-formatter.js';
export * from './output/types.js';

// ============================================================================
// Core Engine
// ============================================================================

/**
 * Core engine components for content generation and chat.
 *
 * @module core
 * @remarks
 * The core engine provides:
 * - {@link OllamaClient} - High-level client for Ollama API
 * - {@link OllamaChat} - Chat session management with history
 * - {@link OllamaNativeClient} - Low-level native Ollama API client
 * - {@link HybridContentGenerator} - Multi-provider content generation
 * - {@link ContentGenerator} - Abstract content generation interface
 *
 * @example
 * ```typescript
 * import { OllamaNativeClient } from '@ollama-code/ollama-code-core';
 *
 * const client = new OllamaNativeClient({
 *   baseUrl: 'http://localhost:11434',
 *   timeout: 300000
 * });
 *
 * // List models
 * const { models } = await client.listModels();
 *
 * // Chat with streaming
 * await client.chat({
 *   model: 'llama3.2',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * }, (chunk) => process.stdout.write(chunk.message.content ?? ''));
 * ```
 */

export * from './core/ollamaClient.js';
export * from './core/contentGenerator.js';
export * from './core/coreToolScheduler.js';
export * from './core/logger.js';
export * from './core/nonInteractiveToolExecutor.js';
export * from './core/prompts.js';
export * from './core/promptOptimizer.js';
export * from './core/tokenLimits.js';
export * from './core/turn.js';
export { OllamaChat, type StreamEvent } from './core/ollamaChat.js';
export * from './tools/tool-names.js';

/**
 * Native Ollama API Client - Direct REST API communication.
 *
 * @module ollama-native
 * @remarks
 * Provides low-level access to Ollama's native REST API endpoints:
 * - `/api/tags` - List local models
 * - `/api/show` - Show model info
 * - `/api/generate` - Text generation with streaming
 * - `/api/chat` - Chat completion with streaming
 * - `/api/embed` - Text embeddings
 * - `/api/pull`, `/api/push` - Model registry operations
 * - `/api/create`, `/api/copy`, `/api/delete` - Model management
 *
 * @see {@link https://github.com/ollama/ollama/blob/main/docs/api.md | Ollama API Documentation}
 */
export {
  OllamaNativeClient,
  createOllamaNativeClient,
  DEFAULT_OLLAMA_NATIVE_URL,
  DEFAULT_OLLAMA_TIMEOUT,
  type OllamaModel,
  type OllamaModelDetails,
  type OllamaTagsResponse,
  type OllamaRunningModel,
  type OllamaPsResponse,
  type OllamaGenerateRequest,
  type OllamaGenerateResponse,
  type OllamaChatMessage,
  type OllamaChatRequest,
  type OllamaChatResponse,
  type OllamaEmbedRequest,
  type OllamaEmbedResponse,
  type OllamaEmbeddingsRequest,
  type OllamaEmbeddingsResponse,
  type OllamaPullRequest,
  type OllamaPullResponse,
  type OllamaPushRequest,
  type OllamaPushResponse,
  type OllamaCopyRequest,
  type OllamaDeleteRequest,
  type OllamaShowRequest,
  type OllamaShowResponse,
  type OllamaVersionResponse,
  type OllamaModelOptions,
  type OllamaTool,
  type OllamaToolCall,
  type OllamaProgressEvent,
  type StreamCallback,
  type ProgressCallback,
  type RequestOptions,
} from './core/ollamaNativeClient.js';

// Context Caching
export {
  OllamaContextClient,
  ollamaContextClient,
  type OllamaContextGenerateRequest,
  type OllamaContextGenerateResponse,
  type ContextStreamCallback,
} from './core/ollamaContextClient.js';

export {
  HybridContentGenerator,
  createHybridContentGenerator,
  type HybridContentGeneratorConfig,
} from './core/hybridContentGenerator.js';

// ============================================================================
// Tools
// ============================================================================

/**
 * Tool system for AI-powered code operations.
 *
 * @module tools
 * @remarks
 * The tool system provides a comprehensive set of tools for code operations:
 *
 * **File Operations:**
 * - {@link ReadFileTool} - Read file contents
 * - {@link WriteFileTool} - Write files
 * - {@link EditTool} - Edit files with diff/patch operations
 * - {@link GlobTool} - Find files by pattern
 * - {@link GrepTool} - Search file contents
 * - {@link ListDirectoryTool} - List directory contents
 *
 * **Code Analysis:**
 * - {@link LSPTool} - Language Server Protocol integration
 *
 * **Execution:**
 * - {@link ShellTool} - Execute shell commands
 * - {@link TaskTool} - Create and manage subagents
 *
 * **MCP Support:**
 * - {@link MCPClient} - Model Context Protocol client
 * - {@link MCPTool} - MCP tool wrapper
 *
 * @example
 * ```typescript
 * import { ToolRegistry, ReadFileTool } from '@ollama-code/ollama-code-core';
 *
 * const registry = new ToolRegistry();
 * registry.registerTool(new ReadFileTool(config));
 *
 * const result = await registry.executeTool('read_file', { path: '/src/index.ts' });
 * ```
 */

// Export utilities
export * from './utils/paths.js';
export * from './utils/schemaValidator.js';
export * from './utils/errors.js';
export * from './utils/debugLogger.js';
export * as jsonl from './utils/jsonl-utils.js';
export * from './utils/getFolderStructure.js';
export * from './utils/memoryDiscovery.js';
export * from './utils/gitIgnoreParser.js';
export * from './utils/gitUtils.js';
export * from './utils/editor.js';
export * from './utils/quotaErrorDetection.js';
export * from './utils/fileUtils.js';
export * from './utils/retry.js';
export * from './utils/shell-utils.js';
export * from './utils/tool-utils.js';
export * from './utils/terminalSerializer.js';
export * from './utils/systemEncoding.js';
export * from './utils/textUtils.js';
export * from './utils/formatters.js';
export * from './utils/generateContentResponseUtilities.js';
export * from './utils/filesearch/fileSearch.js';
export * from './utils/errorParsing.js';
export * from './utils/workspaceContext.js';
export * from './utils/ignorePatterns.js';
export * from './utils/partUtils.js';
export * from './utils/subagentGenerator.js';
export * from './utils/projectSummary.js';
export * from './utils/promptIdContext.js';
export * from './utils/thoughtUtils.js';
export * from './utils/toml-to-markdown-converter.js';
export * from './utils/yaml-parser.js';

// Config resolution utilities
export * from './utils/configResolver.js';

// Export services
export * from './services/fileDiscoveryService.js';
export * from './services/gitService.js';
export * from './services/chatRecordingService.js';
export * from './services/sessionService.js';
export * from './services/fileSystemService.js';

// Export IDE specific logic
export * from './ide/ide-client.js';
export * from './ide/ideContext.js';
export {
  IDE_DEFINITIONS,
  detectIdeFromEnv,
  detectIde,
  isCloudShell,
  type IdeInfo,
} from './ide/detect-ide.js';
export * from './ide/constants.js';
export * from './ide/types.js';

// Export Shell Execution Service
export * from './services/shellExecutionService.js';

// Export base tool definitions
export * from './tools/tools.js';
export * from './tools/tool-error.js';
export * from './tools/tool-registry.js';

// Export subagents (Phase 1)
export * from './subagents/index.js';

// Export skills
export * from './skills/index.js';

// Export learning system
export * from './learning/index.js';

/**
 * Plugin system with sandboxing and marketplace.
 *
 * @module plugins
 * @remarks
 * The plugin system enables extensibility through:
 *
 * **Plugin Discovery:**
 * - Builtin plugins (core-tools, dev-tools, file-tools, search-tools, shell-tools)
 * - User plugins from ~/.ollama-code/plugins/
 * - Project plugins from .ollama-code/plugins/
 * - NPM packages with @ollama-code/plugin- prefix
 *
 * **Plugin Lifecycle:**
 * - Load → Register → Enable → Disable → Unload
 *
 * **Security:**
 * - Filesystem access restrictions
 * - Network restrictions
 * - Command execution limits
 *
 * @example
 * ```typescript
 * import { PluginManager, PluginLoader } from '@ollama-code/ollama-code-core';
 *
 * const loader = new PluginLoader(config);
 * const manager = new PluginManager(config);
 *
 * // Discover plugins
 * const plugins = await loader.discoverAll();
 *
 * // Register and enable
 * await manager.registerPlugin(myPlugin);
 * await manager.enablePlugin('my-plugin');
 * ```
 */
export * from './plugins/index.js';

// Export prompt logic
export * from './prompts/mcp-prompts.js';

// ============================================================================
// Services
// ============================================================================

export * from './services/chatRecordingService.js';
export * from './services/fileDiscoveryService.js';
export * from './services/fileSystemService.js';
export * from './services/gitService.js';
export * from './services/sessionService.js';
export * from './services/shellExecutionService.js';

// ============================================================================
// LSP Support
// ============================================================================

// LSP support
export * from './lsp/constants.js';
export * from './lsp/LspConfigLoader.js';
export * from './lsp/LspConnectionFactory.js';
export * from './lsp/LspLanguageDetector.js';
export * from './lsp/LspResponseNormalizer.js';
export * from './lsp/LspServerManager.js';
export * from './lsp/NativeLspClient.js';
export * from './lsp/NativeLspService.js';
export * from './lsp/types.js';

// ============================================================================
// MCP (Model Context Protocol)
// ============================================================================

export { MCPOAuthProvider } from './mcp/oauth-provider.js';
export type { MCPOAuthConfig } from './mcp/oauth-provider.js';
export { MCPOAuthTokenStorage } from './mcp/oauth-token-storage.js';
export { KeychainTokenStorage } from './mcp/token-storage/keychain-token-storage.js';
export type {
  OAuthCredentials,
  OAuthToken,
} from './mcp/token-storage/types.js';
export { OAuthUtils } from './mcp/oauth-utils.js';
export type {
  OAuthAuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
} from './mcp/oauth-utils.js';

// ============================================================================
// Extensions & Subagents
// ============================================================================

export * from './extension/index.js';
export * from './prompts/mcp-prompts.js';
export * from './skills/index.js';
export * from './subagents/index.js';

// ============================================================================
// Telemetry (UI metrics + backward compatibility stubs)
// ============================================================================

export {
  uiTelemetryService,
  type SessionMetrics,
  type ToolCallStats,
  type ModelMetrics,
  type FileMetrics,
  type StorageMetrics,
  type PluginMetrics,
  type TelemetrySerializableState,
} from './services/uiTelemetryService.js';

// Telemetry stubs for backward compatibility
export * from './telemetry-stubs.js';

// ============================================================================
// Streaming (Priority 3.1)
// ============================================================================

/**
 * Streaming support with backpressure control and cancellation.
 *
 * @module streaming
 * @remarks
 * Provides robust streaming capabilities:
 *
 * **Components:**
 * - {@link StreamingController} - Flow control and chunk management
 * - {@link BackpressureController} - Buffer management for slow consumers
 * - {@link StreamBuffer} - Efficient chunk buffering
 * - {@link ChunkValidator} - Validate stream chunks
 * - {@link CancellationToken} - Cooperative cancellation support
 *
 * @example
 * ```typescript
 * import { CancellationTokenSource } from '@ollama-code/ollama-code-core';
 *
 * const source = new CancellationTokenSource({ timeout: 30000 });
 * const token = source.token;
 *
 * // Pass to async operation
 * await fetchData({ signal: token.toAbortSignal() });
 *
 * // Cancel on demand
 * source.cancel('User requested');
 * ```
 */
export * from './streaming/index.js';

// ============================================================================
// Caching (Priority 3.2)
// ============================================================================

/**
 * Caching system for context and tool results.
 *
 * @module cache
 * @remarks
 * Provides multiple caching strategies:
 *
 * **Context Caching:**
 * - KV-cache reuse through Ollama's context API
 * - Reduces token processing for repeated prompts
 *
 * **Tool Result Caching:**
 * - Caches tool execution results
 * - Content-hash based invalidation
 *
 * **Embedding Cache:**
 * - Caches text embeddings
 * - LRU eviction policy
 *
 * @example
 * ```typescript
 * import { ContextCacheManager, OllamaContextClient } from '@ollama-code/ollama-code-core';
 *
 * const contextClient = new OllamaContextClient({ baseUrl: 'http://localhost:11434' });
 *
 * // First request - creates context
 * const result1 = await contextClient.generate({
 *   model: 'llama3.2',
 *   sessionId: 'chat-1',
 *   prompt: 'Hello!'
 * });
 *
 * // Second request - reuses context (faster!)
 * const result2 = await contextClient.generate({
 *   model: 'llama3.2',
 *   sessionId: 'chat-1',
 *   prompt: 'How are you?'
 * });
 * ```
 */
export * from './cache/index.js';

// ============================================================================
// Observability (Priority 3.3)
// ============================================================================

/**
 * Observability and telemetry for monitoring and debugging.
 *
 * @module observability
 * @remarks
 * Provides comprehensive observability:
 *
 * **Metrics:**
 * - Token usage tracking
 * - Response latency measurement
 * - Tool execution statistics
 *
 * **Tracing:**
 * - OpenTelemetry integration
 * - Distributed tracing support
 * - Span management
 *
 * **Logging:**
 * - Structured logging
 * - Debug logging with levels
 * - API request/response logging
 *
 * @example
 * ```typescript
 * import { MetricsCollector, Tracer } from '@ollama-code/ollama-code-core';
 *
 * const metrics = new MetricsCollector();
 * metrics.recordTokenUsage({ input: 100, output: 50 });
 *
 * const tracer = new Tracer('my-service');
 * const span = tracer.startSpan('operation');
 * // ... do work ...
 * span.end();
 * ```
 */
export * from './observability/index.js';

// ============================================================================
// Utilities
// ============================================================================

export * from './utils/browser.js';
export * from './utils/editor.js';
export * from './utils/errorParsing.js';
export * from './utils/errors.js';
export * from './utils/fileUtils.js';
export * from './utils/filesearch/fileSearch.js';
export * from './utils/formatters.js';
export * from './utils/generateContentResponseUtilities.js';
export * from './utils/getFolderStructure.js';
export * from './utils/gitIgnoreParser.js';
export * from './utils/gitUtils.js';
export * from './utils/ignorePatterns.js';
export * from './utils/memoryDiscovery.js';
export { ApiLogger, apiLogger } from './utils/apiLogger.js';
export * from './utils/partUtils.js';
export * from './utils/pathReader.js';
export * from './utils/paths.js';
export * from './utils/promptIdContext.js';
export * from './utils/projectSummary.js';
export * from './utils/quotaErrorDetection.js';
export * from './utils/readManyFiles.js';
export * from './utils/request-tokenizer/supportedImageFormats.js';
export { TextTokenizer } from './utils/request-tokenizer/textTokenizer.js';
export * from './utils/retry.js';
export * from './utils/schemaValidator.js';
export * from './utils/shell-utils.js';
export * from './utils/subagentGenerator.js';
export * from './utils/systemEncoding.js';
export * from './utils/terminalSerializer.js';
export * from './utils/textUtils.js';
export * from './utils/thoughtUtils.js';
export * from './utils/toml-to-markdown-converter.js';
export * from './utils/tool-utils.js';
export * from './utils/workspaceContext.js';
export * from './utils/yaml-parser.js';

// ============================================================================
// Testing Utilities
// ============================================================================

export { makeFakeConfig } from './test-utils/config.js';
export * from './test-utils/index.js';

// ============================================================================
// Model Definitions
// ============================================================================

export {
  DEFAULT_VISION_MODEL,
  getModelCapabilities,
  getModelDefinition,
  getDefaultVisionModel,
  getToolCallFormat,
  supportsThinking,
  supportsTools,
  supportsVision,
  type ModelCapabilities as ModelCapabilitiesInfo,
  type ModelDefinition,
  type ModelFamilyDefinition,
  type ToolCallFormat,
} from './model-definitions/index.js';
// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export {
  keyBindingsService,
  KeyBindingsService,
  AVAILABLE_COMMANDS,
  CATEGORY_ORDER,
  DEFAULT_BINDINGS,
  type KeyBindingDefinition,
  type UserKeyBindingsConfig,
  type CommandInfo,
} from './services/keyBindingsService.js';

// ============================================================================
// Notifications
// ============================================================================

export {
  notificationService,
  NotificationService,
  DEFAULT_NOTIFICATION_CONFIG,
  type NotificationType,
  type NotificationOptions,
  type NotificationConfig,
} from './services/notificationService.js';

// ============================================================================
// Dashboard
// ============================================================================

export {
  DashboardService,
  getDashboardService,
  resetDashboardService,
  type DashboardSessionRecord,
  type DashboardStats,
} from './services/dashboardService.js';

// ============================================================================
// Permissions
// ============================================================================

export {
  PermissionService,
  getPermissionService,
  resetPermissionService,
  DEFAULT_PERMISSION_CONFIG,
  DEFAULT_PERMISSION_RULES,
  type PermissionLevel,
  type ToolCategory,
  type PermissionRule,
  type SessionAllowlistEntry,
  type PermissionConfig,
} from './services/permissionService.js';

// ============================================================================
// Audit Logging (Debug Mode Only)
// ============================================================================

export {
  auditLogService,
  AuditLogService,
  type AuditEvent,
  type AuditCategory,
} from './services/auditLogService.js';

// ============================================================================
// Structured Logging
// ============================================================================

export {
  StructuredLogger,
  loggerRegistry,
  createLogger,
  DEFAULT_LOGGER_CONFIG,
  type LogLevel,
  type LogFormat,
  type LogDestination,
  type LogContext,
  type LogEntry,
  type LoggerConfig,
} from './services/structuredLogger.js';

// ============================================================================
// Token Graph
// ============================================================================

export {
  TokenGraphService,
  getTokenGraphService,
  resetTokenGraphService,
  DEFAULT_TOKEN_GRAPH_CONFIG,
  type TokenUsageRecord,
  type TokenGraphConfig,
} from './services/tokenGraphService.js';

// ============================================================================
// Enhanced Dashboard
// ============================================================================

export {
  EnhancedDashboardService,
  getEnhancedDashboardService,
  resetEnhancedDashboardService,
  type SpeedMetrics,
  type FileOperationRecord,
  type ToolExecutionRecord,
  type EnhancedSessionRecord,
  type EnhancedDashboardStats,
} from './services/enhancedDashboardService.js';

// ============================================================================
// Compression Report Service
// ============================================================================

export {
  CompressionReportService,
  type CompressionReport,
} from './services/compressionReportService.js';

// ============================================================================
// Chat Recording Service
// ============================================================================

export {
  ChatRecordingService,
  type ChatRecord,
  type ChatCompressionRecordPayload,
  type SlashCommandRecordPayload,
  type UiTelemetryRecordPayload,
  type AtCommandRecordPayload,
  type ErrorRecordPayload,
  type LoopDetectedRecordPayload,
  type ActivityLogRecordPayload,
  type ActivityType,
} from './services/chatRecordingService.js';

// ============================================================================
// Memory Summary Service
// ============================================================================

export {
  MemorySummaryService,
  getMemorySummaryService,
  resetMemorySummaryService,
  type ActivitySummary,
  type SessionMemorySummary,
  type CreateSummaryOptions,
} from './services/memorySummaryService.js';

// ============================================================================
// Unified Resource Management
// ============================================================================

// Note: ValidationResult is already exported from './subagents/index.js'
// So we only export additional types from unified that don't conflict
export {
  ResourceError,
  ResourceErrorCode,
  BaseResourceManager,
  // Unified Managers
  UnifiedSkillManager,
  UnifiedSubagentManager,
  // Resource Factory
  UnifiedResourceFactory,
  getUnifiedResourceFactory,
  resetUnifiedResourceFactory,
} from './unified/index.js';

export type {
  ResourceLevel,
  BaseResourceConfig,
  ListResourcesOptions,
  CreateResourceOptions,
  ResourceChangeEvent,
  ResourceChangeListener,
  ResourceManagerStats,
  IResourceManager,
  ResourceType,
  ResourceConfigMap,
  ResourceManagerMap,
} from './unified/index.js';

// ============================================================================
// Unified Configuration Manager
// ============================================================================

export {
  ConfigManager,
  getConfigManager,
  initializeConfigManager,
  type ConfigScope,
  type ConfigChangeEvent,
  type ConfigChangeListener,
  type ConfigSource,
  type ConfigValue,
  type ConfigSchemaField,
  type ConfigSchema,
  type ConfigManagerOptions,
  ConfigPriority,
} from './services/unifiedConfigManager.js';

// ============================================================================
// Resource Logging
// ============================================================================

export {
  ResourceLogger,
  createResourceLogger,
  LogOperation,
  type ResourceLogContext,
} from './services/resourceLogger.js';

// ============================================================================
// Plan Management (exit_plan_mode integration)
// ============================================================================

export {
  getActivePlan,
  clearActivePlan,
  type PlanData,
} from './plugins/builtin/productivity-tools/exit-plan-mode/index.js';

// ============================================================================
// Session Reminder (storage-based context)
// ============================================================================

export {
  getSessionReminders,
  getSessionContextForPrompt,
  formatRemindersForPrompt,
  getActivePlan as getStorageActivePlan,
  getActiveTodos,
  type SessionReminder,
  type ReminderType,
  type ReminderPriority,
  type PlanData as StoragePlanData,
  type TodosData,
} from './services/sessionReminder.js';

// ============================================================================
// Auto Storage (Model's Notebook)
// ============================================================================

export {
  initializeAutoStorage,
  autoSaveGeneratedText,
  autoSaveWebContent,
  autoSaveUserClarification,
  autoSaveConversationContext,
  getAutoSavedEntries,
  clearAutoSavedEntries,
  setAutoStorageService,
  getAutoStorageService,
  AUTO_STORAGE_NAMESPACE,
  AutoStorageKeys,
  type AutoStorageKey,
  type AutoSavedEntry,
  type StorageService,
  type StorageAdapter,
} from './utils/autoStorage.js';

// ============================================================================
// Multi-File Buffer Manager
// ============================================================================

export {
  MultiFileBufferManager,
  getBufferManager,
  resetBufferManager,
  type FileBuffer,
  type BufferListEntry,
  type BufferEvent,
  type BufferEventType,
  type BufferEventListener,
  type BufferManagerOptions,
} from './services/MultiFileBufferManager.js';
