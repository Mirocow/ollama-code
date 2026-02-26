/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { EventEmitter } from 'node:events';
import type { ContentGenerator, ContentGeneratorConfig } from '../core/contentGenerator.js';
import type { ContentGeneratorConfigSources } from '../core/contentGenerator.js';
import type { MCPOAuthConfig } from '../mcp/oauth-provider.js';
import type { ShellExecutionConfig } from '../services/shellExecutionService.js';
import type { AnyToolInvocation } from '../tools/tools.js';
import { BaseLlmClient } from '../core/baseLlmClient.js';
import { OllamaClient } from '../core/ollamaClient.js';
import { type AuthType } from '../core/contentGenerator.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { type FileSystemService, type FileEncodingType } from '../services/fileSystemService.js';
import { GitService } from '../services/gitService.js';
import type { SendSdkMcpMessage } from '../tools/mcp-client.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import type { LspClient } from '../lsp/types.js';
import { InputFormat, OutputFormat } from '../output/types.js';
import { PromptRegistry } from '../prompts/prompt-registry.js';
import { SkillManager } from '../skills/skill-manager.js';
import { SubagentManager } from '../subagents/subagent-manager.js';
import type { SubagentConfig } from '../subagents/types.js';
import { type TelemetryTarget } from '../telemetry/index.js';
import { ExtensionManager, type Extension } from '../extension/extensionManager.js';
import { FileExclusions } from '../utils/ignorePatterns.js';
import { WorkspaceContext } from '../utils/workspaceContext.js';
import type { FileFilteringOptions } from './constants.js';
import { DEFAULT_FILE_FILTERING_OPTIONS, DEFAULT_MEMORY_FILE_FILTERING_OPTIONS } from './constants.js';
import { Storage } from './storage.js';
import { ChatRecordingService } from '../services/chatRecordingService.js';
import { SessionService, type ResumedSessionData } from '../services/sessionService.js';
import { type DebugLogger } from '../utils/debugLogger.js';
import { ModelsConfig, type ModelProvidersConfig, type AvailableModel, type RuntimeModelSnapshot } from '../models/index.js';
import type { ClaudeMarketplaceConfig } from '../extension/claude-converter.js';
export type { AnyToolInvocation, FileFilteringOptions, MCPOAuthConfig };
export { DEFAULT_FILE_FILTERING_OPTIONS, DEFAULT_MEMORY_FILE_FILTERING_OPTIONS, };
export declare enum ApprovalMode {
    PLAN = "plan",
    DEFAULT = "default",
    AUTO_EDIT = "auto-edit",
    YOLO = "yolo"
}
export declare const APPROVAL_MODES: ApprovalMode[];
/**
 * Information about an approval mode including display name and description.
 */
export interface ApprovalModeInfo {
    id: ApprovalMode;
    name: string;
    description: string;
}
/**
 * Detailed information about each approval mode.
 * Used for UI display and protocol responses.
 */
export declare const APPROVAL_MODE_INFO: Record<ApprovalMode, ApprovalModeInfo>;
export interface AccessibilitySettings {
    enableLoadingPhrases?: boolean;
    screenReader?: boolean;
}
export interface BugCommandSettings {
    urlTemplate: string;
}
export interface ChatCompressionSettings {
    contextPercentageThreshold?: number;
}
export interface SummarizeToolOutputSettings {
    tokenBudget?: number;
}
export interface TelemetrySettings {
    enabled?: boolean;
    target?: TelemetryTarget;
    otlpEndpoint?: string;
    otlpProtocol?: 'grpc' | 'http';
    logPrompts?: boolean;
    outfile?: string;
    useCollector?: boolean;
}
export interface OutputSettings {
    format?: OutputFormat;
}
export interface GitCoAuthorSettings {
    enabled?: boolean;
    name?: string;
    email?: string;
}
export type ExtensionOriginSource = 'QwenCode' | 'Claude' | 'Gemini';
export interface ExtensionInstallMetadata {
    source: string;
    type: 'git' | 'local' | 'link' | 'github-release';
    originSource?: ExtensionOriginSource;
    releaseTag?: string;
    ref?: string;
    autoUpdate?: boolean;
    allowPreRelease?: boolean;
    marketplaceConfig?: ClaudeMarketplaceConfig;
    pluginName?: string;
}
export declare const DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD = 25000;
export declare const DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES = 1000;
export declare class MCPServerConfig {
    readonly command?: string | undefined;
    readonly args?: string[] | undefined;
    readonly env?: Record<string, string> | undefined;
    readonly cwd?: string | undefined;
    readonly url?: string | undefined;
    readonly httpUrl?: string | undefined;
    readonly headers?: Record<string, string> | undefined;
    readonly tcp?: string | undefined;
    readonly timeout?: number | undefined;
    readonly trust?: boolean | undefined;
    readonly description?: string | undefined;
    readonly includeTools?: string[] | undefined;
    readonly excludeTools?: string[] | undefined;
    readonly extensionName?: string | undefined;
    readonly oauth?: MCPOAuthConfig | undefined;
    readonly authProviderType?: AuthProviderType | undefined;
    readonly targetAudience?: string | undefined;
    readonly targetServiceAccount?: string | undefined;
    readonly type?: "sdk" | undefined;
    constructor(command?: string | undefined, args?: string[] | undefined, env?: Record<string, string> | undefined, cwd?: string | undefined, url?: string | undefined, httpUrl?: string | undefined, headers?: Record<string, string> | undefined, tcp?: string | undefined, timeout?: number | undefined, trust?: boolean | undefined, description?: string | undefined, includeTools?: string[] | undefined, excludeTools?: string[] | undefined, extensionName?: string | undefined, oauth?: MCPOAuthConfig | undefined, authProviderType?: AuthProviderType | undefined, targetAudience?: string | undefined, targetServiceAccount?: string | undefined, type?: "sdk" | undefined);
}
/**
 * Check if an MCP server config represents an SDK server
 */
export declare function isSdkMcpServerConfig(config: MCPServerConfig): boolean;
export declare enum AuthProviderType {
    DYNAMIC_DISCOVERY = "dynamic_discovery",
    GOOGLE_CREDENTIALS = "google_credentials",
    SERVICE_ACCOUNT_IMPERSONATION = "service_account_impersonation"
}
export interface SandboxConfig {
    command: 'docker' | 'podman' | 'sandbox-exec';
    image: string;
}
export interface ConfigParameters {
    sessionId?: string;
    sessionData?: ResumedSessionData;
    embeddingModel?: string;
    sandbox?: SandboxConfig;
    targetDir: string;
    debugMode: boolean;
    includePartialMessages?: boolean;
    question?: string;
    coreTools?: string[];
    allowedTools?: string[];
    excludeTools?: string[];
    toolDiscoveryCommand?: string;
    toolCallCommand?: string;
    mcpServerCommand?: string;
    mcpServers?: Record<string, MCPServerConfig>;
    lsp?: {
        enabled?: boolean;
    };
    lspClient?: LspClient;
    userMemory?: string;
    geminiMdFileCount?: number;
    approvalMode?: ApprovalMode;
    contextFileName?: string | string[];
    accessibility?: AccessibilitySettings;
    telemetry?: TelemetrySettings;
    gitCoAuthor?: boolean;
    usageStatisticsEnabled?: boolean;
    fileFiltering?: {
        respectGitIgnore?: boolean;
        respectOllamaCodeIgnore?: boolean;
        enableRecursiveFileSearch?: boolean;
        enableFuzzySearch?: boolean;
    };
    checkpointing?: boolean;
    proxy?: string;
    cwd: string;
    fileDiscoveryService?: FileDiscoveryService;
    includeDirectories?: string[];
    bugCommand?: BugCommandSettings;
    model?: string;
    outputLanguageFilePath?: string;
    maxSessionTurns?: number;
    sessionTokenLimit?: number;
    experimentalZedIntegration?: boolean;
    listExtensions?: boolean;
    overrideExtensions?: string[];
    allowedMcpServers?: string[];
    excludedMcpServers?: string[];
    noBrowser?: boolean;
    summarizeToolOutput?: Record<string, SummarizeToolOutputSettings>;
    folderTrustFeature?: boolean;
    folderTrust?: boolean;
    ideMode?: boolean;
    authType?: AuthType;
    generationConfig?: Partial<ContentGeneratorConfig>;
    /**
     * Optional source map for generationConfig fields (e.g. CLI/env/settings attribution).
     * This is used to produce per-field source badges in the UI.
     */
    generationConfigSources?: ContentGeneratorConfigSources;
    cliVersion?: string;
    loadMemoryFromIncludeDirectories?: boolean;
    importFormat?: 'tree' | 'flat';
    chatRecording?: boolean;
    webSearch?: {
        provider: Array<{
            type: 'tavily' | 'google' | 'dashscope';
            apiKey?: string;
            searchEngineId?: string;
        }>;
        default: string;
    };
    chatCompression?: ChatCompressionSettings;
    interactive?: boolean;
    trustedFolder?: boolean;
    defaultFileEncoding?: FileEncodingType;
    useRipgrep?: boolean;
    useBuiltinRipgrep?: boolean;
    shouldUseNodePtyShell?: boolean;
    skipNextSpeakerCheck?: boolean;
    shellExecutionConfig?: ShellExecutionConfig;
    skipLoopDetection?: boolean;
    vlmSwitchMode?: string;
    truncateToolOutputThreshold?: number;
    truncateToolOutputLines?: number;
    enableToolOutputTruncation?: boolean;
    eventEmitter?: EventEmitter;
    output?: OutputSettings;
    inputFormat?: InputFormat;
    outputFormat?: OutputFormat;
    skipStartupContext?: boolean;
    sdkMode?: boolean;
    sessionSubagents?: SubagentConfig[];
    channel?: string;
    /** Model providers configuration grouped by authType */
    modelProvidersConfig?: ModelProvidersConfig;
}
/**
 * Options for Config.initialize()
 */
export interface ConfigInitializeOptions {
    /**
     * Callback for sending MCP messages to SDK servers via control plane.
     * Required for SDK MCP server support in SDK mode.
     */
    sendSdkMcpMessage?: SendSdkMcpMessage;
}
export declare class Config {
    private sessionId;
    private sessionData?;
    private debugLogger;
    private toolRegistry;
    private promptRegistry;
    private subagentManager;
    private extensionManager;
    private skillManager;
    private fileSystemService;
    private contentGeneratorConfig;
    private contentGeneratorConfigSources;
    private contentGenerator;
    private readonly embeddingModel;
    private modelsConfig;
    private readonly modelProvidersConfig?;
    private readonly sandbox;
    private readonly targetDir;
    private workspaceContext;
    private readonly debugMode;
    private readonly inputFormat;
    private readonly outputFormat;
    private readonly includePartialMessages;
    private readonly question;
    private readonly coreTools;
    private readonly allowedTools;
    private readonly excludeTools;
    private readonly toolDiscoveryCommand;
    private readonly toolCallCommand;
    private readonly mcpServerCommand;
    private mcpServers;
    private readonly lspEnabled;
    private lspClient?;
    private readonly allowedMcpServers?;
    private readonly excludedMcpServers?;
    private sessionSubagents;
    private userMemory;
    private sdkMode;
    private geminiMdFileCount;
    private approvalMode;
    private readonly accessibility;
    private readonly telemetrySettings;
    private readonly gitCoAuthor;
    private readonly usageStatisticsEnabled;
    private ollamaClient;
    private baseLlmClient;
    private readonly fileFiltering;
    private fileDiscoveryService;
    private gitService;
    private sessionService;
    private chatRecordingService;
    private readonly checkpointing;
    private readonly proxy;
    private readonly cwd;
    private readonly bugCommand;
    private readonly outputLanguageFilePath?;
    private readonly noBrowser;
    private readonly folderTrustFeature;
    private readonly folderTrust;
    private ideMode;
    private readonly maxSessionTurns;
    private readonly sessionTokenLimit;
    private readonly listExtensions;
    private readonly overrideExtensions?;
    private readonly summarizeToolOutput;
    private readonly cliVersion?;
    private readonly experimentalZedIntegration;
    private readonly chatRecordingEnabled;
    private readonly loadMemoryFromIncludeDirectories;
    private readonly importFormat;
    private readonly webSearch?;
    private readonly chatCompression;
    private readonly interactive;
    private readonly trustedFolder;
    private readonly useRipgrep;
    private readonly useBuiltinRipgrep;
    private readonly shouldUseNodePtyShell;
    private readonly skipNextSpeakerCheck;
    private shellExecutionConfig;
    private readonly skipLoopDetection;
    private readonly skipStartupContext;
    private readonly vlmSwitchMode;
    private initialized;
    readonly storage: Storage;
    private readonly fileExclusions;
    private readonly truncateToolOutputThreshold;
    private readonly truncateToolOutputLines;
    private readonly enableToolOutputTruncation;
    private readonly eventEmitter?;
    private readonly channel;
    private readonly defaultFileEncoding;
    constructor(params: ConfigParameters);
    /**
     * Must only be called once, throws if called again.
     * @param options Optional initialization options including sendSdkMcpMessage callback
     */
    initialize(options?: ConfigInitializeOptions): Promise<void>;
    refreshHierarchicalMemory(): Promise<void>;
    getContentGenerator(): ContentGenerator;
    /**
     * Get the ModelsConfig instance for model-related operations.
     * External code (e.g., CLI) can use this to access model configuration.
     */
    getModelsConfig(): ModelsConfig;
    /**
     * Updates the credentials in the generation config.
     * Exclusive for `OpenAIKeyPrompt` to update credentials via `/auth`
     * Delegates to ModelsConfig.
     */
    updateCredentials(credentials: {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
    }, settingsGenerationConfig?: Partial<ContentGeneratorConfig>): void;
    /**
     * Reload model providers configuration at runtime.
     * This enables hot-reloading of modelProviders settings without restarting the CLI.
     * Should be called before refreshAuth when settings.json has been updated.
     *
     * @param modelProvidersConfig - The updated model providers configuration
     */
    reloadModelProvidersConfig(modelProvidersConfig?: ModelProvidersConfig): void;
    /**
     * Refresh authentication and rebuild ContentGenerator.
     */
    refreshAuth(authMethod: AuthType, isInitialAuth?: boolean): Promise<void>;
    /**
     * Provides access to the BaseLlmClient for stateless LLM operations.
     */
    getBaseLlmClient(): BaseLlmClient;
    getSessionId(): string;
    getDebugLogger(): DebugLogger;
    /**
     * Starts a new session and resets session-scoped services.
     */
    startNewSession(sessionId?: string, sessionData?: ResumedSessionData): string;
    /**
     * Returns the resumed session data if this session was resumed from a previous one.
     */
    getResumedSessionData(): ResumedSessionData | undefined;
    shouldLoadMemoryFromIncludeDirectories(): boolean;
    getImportFormat(): 'tree' | 'flat';
    getContentGeneratorConfig(): ContentGeneratorConfig;
    getContentGeneratorConfigSources(): ContentGeneratorConfigSources;
    getModel(): string;
    /**
     * Set model programmatically (e.g., VLM auto-switch, fallback).
     * Delegates to ModelsConfig.
     */
    setModel(newModel: string, metadata?: {
        reason?: string;
        context?: string;
    }): Promise<void>;
    /**
     * Handle model change from ModelsConfig.
     * This updates the content generator config with the new model settings.
     */
    private handleModelChange;
    /**
     * Get available models for the current authType.
     * Delegates to ModelsConfig.
     */
    getAvailableModels(): AvailableModel[];
    /**
     * Get available models for a specific authType.
     * Delegates to ModelsConfig.
     */
    getAvailableModelsForAuthType(authType: AuthType): AvailableModel[];
    /**
     * Get all configured models across authTypes.
     * Delegates to ModelsConfig.
     */
    getAllConfiguredModels(authTypes?: AuthType[]): AvailableModel[];
    /**
     * Get the currently active runtime model snapshot.
     * Delegates to ModelsConfig.
     */
    getActiveRuntimeModelSnapshot(): RuntimeModelSnapshot | undefined;
    /**
     * Switch authType+model.
     * Supports both registry-backed models and runtime model snapshots.
     *
     * For runtime models, the modelId should be in format `$runtime|${authType}|${modelId}`.
     * This triggers a refresh of the ContentGenerator when required (always on authType changes).
     * For qwen-oauth model switches that are hot-update safe, this may update in place.
     *
     * @param authType - Target authentication type
     * @param modelId - Target model ID (or `$runtime|${authType}|${modelId}` for runtime models)
     * @param options - Additional options like requireCachedCredentials
     */
    switchModel(authType: AuthType, modelId: string, options?: {
        requireCachedCredentials?: boolean;
    }): Promise<void>;
    getMaxSessionTurns(): number;
    getSessionTokenLimit(): number;
    getEmbeddingModel(): string;
    getSandbox(): SandboxConfig | undefined;
    isRestrictiveSandbox(): boolean;
    getTargetDir(): string;
    getProjectRoot(): string;
    getWorkspaceContext(): WorkspaceContext;
    getToolRegistry(): ToolRegistry;
    /**
     * Shuts down the Config and releases all resources.
     * This method is idempotent and safe to call multiple times.
     * It handles the case where initialization was not completed.
     */
    shutdown(): Promise<void>;
    getPromptRegistry(): PromptRegistry;
    getDebugMode(): boolean;
    getQuestion(): string | undefined;
    getCoreTools(): string[] | undefined;
    getAllowedTools(): string[] | undefined;
    getExcludeTools(): string[] | undefined;
    getToolDiscoveryCommand(): string | undefined;
    getToolCallCommand(): string | undefined;
    getMcpServerCommand(): string | undefined;
    getMcpServers(): Record<string, MCPServerConfig> | undefined;
    addMcpServers(servers: Record<string, MCPServerConfig>): void;
    isLspEnabled(): boolean;
    getLspClient(): LspClient | undefined;
    /**
     * Allows wiring an LSP client after Config construction but before initialize().
     */
    setLspClient(client: LspClient | undefined): void;
    getSessionSubagents(): SubagentConfig[];
    setSessionSubagents(subagents: SubagentConfig[]): void;
    getSdkMode(): boolean;
    setSdkMode(value: boolean): void;
    getUserMemory(): string;
    setUserMemory(newUserMemory: string): void;
    getGeminiMdFileCount(): number;
    setGeminiMdFileCount(count: number): void;
    getApprovalMode(): ApprovalMode;
    setApprovalMode(mode: ApprovalMode): void;
    getInputFormat(): 'text' | 'stream-json';
    getIncludePartialMessages(): boolean;
    getAccessibility(): AccessibilitySettings;
    getTelemetryEnabled(): boolean;
    getTelemetryLogPromptsEnabled(): boolean;
    getTelemetryOtlpEndpoint(): string;
    getTelemetryOtlpProtocol(): 'grpc' | 'http';
    getTelemetryTarget(): TelemetryTarget;
    getTelemetryOutfile(): string | undefined;
    getGitCoAuthor(): GitCoAuthorSettings;
    getTelemetryUseCollector(): boolean;
    getOllamaClient(): OllamaClient;
    getEnableRecursiveFileSearch(): boolean;
    getFileFilteringEnableFuzzySearch(): boolean;
    getFileFilteringRespectGitIgnore(): boolean;
    getFileFilteringRespectOllamaCodeIgnore(): boolean;
    getFileFilteringOptions(): FileFilteringOptions;
    /**
     * Gets custom file exclusion patterns from configuration.
     * TODO: This is a placeholder implementation. In the future, this could
     * read from settings files, CLI arguments, or environment variables.
     */
    getCustomExcludes(): string[];
    getCheckpointingEnabled(): boolean;
    getProxy(): string | undefined;
    getWorkingDir(): string;
    getBugCommand(): BugCommandSettings | undefined;
    getFileService(): FileDiscoveryService;
    getUsageStatisticsEnabled(): boolean;
    getExtensionContextFilePaths(): string[];
    getExperimentalZedIntegration(): boolean;
    getListExtensions(): boolean;
    getExtensionManager(): ExtensionManager;
    getExtensions(): Extension[];
    getActiveExtensions(): Extension[];
    getBlockedMcpServers(): Array<{
        name: string;
        extensionName: string;
    }>;
    getNoBrowser(): boolean;
    isBrowserLaunchSuppressed(): boolean;
    getSummarizeToolOutputConfig(): Record<string, SummarizeToolOutputSettings> | undefined;
    getWebSearchConfig(): {
        provider: Array<{
            type: "tavily" | "google" | "dashscope";
            apiKey?: string;
            searchEngineId?: string;
        }>;
        default: string;
    } | undefined;
    getIdeMode(): boolean;
    getFolderTrustFeature(): boolean;
    /**
     * Returns 'true' if the workspace is considered "trusted".
     * 'false' for untrusted.
     */
    getFolderTrust(): boolean;
    isTrustedFolder(): boolean;
    setIdeMode(value: boolean): void;
    getAuthType(): AuthType | undefined;
    getCliVersion(): string | undefined;
    getChannel(): string | undefined;
    /**
     * Get the default file encoding for new files.
     * @returns FileEncodingType
     */
    getDefaultFileEncoding(): FileEncodingType;
    /**
     * Get the current FileSystemService
     */
    getFileSystemService(): FileSystemService;
    /**
     * Set a custom FileSystemService
     */
    setFileSystemService(fileSystemService: FileSystemService): void;
    getChatCompression(): ChatCompressionSettings | undefined;
    isInteractive(): boolean;
    getUseRipgrep(): boolean;
    getUseBuiltinRipgrep(): boolean;
    getShouldUseNodePtyShell(): boolean;
    getSkipNextSpeakerCheck(): boolean;
    getShellExecutionConfig(): ShellExecutionConfig;
    setShellExecutionConfig(config: ShellExecutionConfig): void;
    getScreenReader(): boolean;
    getSkipLoopDetection(): boolean;
    getSkipStartupContext(): boolean;
    getVlmSwitchMode(): string | undefined;
    getEnableToolOutputTruncation(): boolean;
    getTruncateToolOutputThreshold(): number;
    getTruncateToolOutputLines(): number;
    getOutputFormat(): OutputFormat;
    getGitService(): Promise<GitService>;
    /**
     * Returns the chat recording service.
     */
    getChatRecordingService(): ChatRecordingService | undefined;
    /**
     * Gets or creates a SessionService for managing chat sessions.
     */
    getSessionService(): SessionService;
    getFileExclusions(): FileExclusions;
    getSubagentManager(): SubagentManager;
    getSkillManager(): SkillManager | null;
    createToolRegistry(sendSdkMcpMessage?: SendSdkMcpMessage): Promise<ToolRegistry>;
}
