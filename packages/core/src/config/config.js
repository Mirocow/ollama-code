/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as path from 'node:path';
import process from 'node:process';
// External dependencies
import { ProxyAgent, setGlobalDispatcher } from 'undici';
// Core
import { BaseLlmClient } from '../core/baseLlmClient.js';
import { OllamaClient } from '../core/ollamaClient.js';
import { createContentGenerator, resolveContentGeneratorConfigWithSources, } from '../core/contentGenerator.js';
// Services
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { StandardFileSystemService, FileEncoding, } from '../services/fileSystemService.js';
import { GitService } from '../services/gitService.js';
// Tools
import { EditTool } from '../tools/edit.js';
import { ExitPlanModeTool } from '../tools/exitPlanMode.js';
import { GlobTool } from '../tools/glob.js';
import { GrepTool } from '../tools/grep.js';
import { LSTool } from '../tools/ls.js';
import { MemoryTool, setOllamaMdFilename } from '../tools/memoryTool.js';
import { ReadFileTool } from '../tools/read-file.js';
import { canUseRipgrep } from '../utils/ripgrepUtils.js';
import { RipGrepTool } from '../tools/ripGrep.js';
import { ShellTool } from '../tools/shell.js';
import { SkillTool } from '../tools/skill.js';
import { TaskTool } from '../tools/task.js';
import { TodoWriteTool } from '../tools/todoWrite.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { WebFetchTool } from '../tools/web-fetch.js';
import { WebSearchTool } from '../tools/web-search/index.js';
import { WriteFileTool } from '../tools/write-file.js';
import { LspTool } from '../tools/lsp.js';
// Other modules
import { ideContextStore } from '../ide/ideContext.js';
import { InputFormat, OutputFormat } from '../output/types.js';
import { PromptRegistry } from '../prompts/prompt-registry.js';
import { SkillManager } from '../skills/skill-manager.js';
import { SubagentManager } from '../subagents/subagent-manager.js';
import { DEFAULT_OTLP_ENDPOINT, DEFAULT_TELEMETRY_TARGET, initializeTelemetry, logStartSession, logRipgrepFallback, RipgrepFallbackEvent, StartSessionEvent, } from '../telemetry/index.js';
import { ExtensionManager, } from '../extension/extensionManager.js';
// Utils
import { shouldAttemptBrowserLaunch } from '../utils/browser.js';
import { FileExclusions } from '../utils/ignorePatterns.js';
import { WorkspaceContext } from '../utils/workspaceContext.js';
import { isToolEnabled } from '../utils/tool-utils.js';
import { getErrorMessage } from '../utils/errors.js';
import { DEFAULT_FILE_FILTERING_OPTIONS, DEFAULT_MEMORY_FILE_FILTERING_OPTIONS, } from './constants.js';
import { DEFAULT_OLLAMA_EMBEDDING_MODEL } from './models.js';
import { Storage } from './storage.js';
import { ChatRecordingService } from '../services/chatRecordingService.js';
import { SessionService, } from '../services/sessionService.js';
import { randomUUID } from 'node:crypto';
import { loadServerHierarchicalMemory } from '../utils/memoryDiscovery.js';
import { createDebugLogger, setDebugLogSession, } from '../utils/debugLogger.js';
import { ModelsConfig, } from '../models/index.js';
export { DEFAULT_FILE_FILTERING_OPTIONS, DEFAULT_MEMORY_FILE_FILTERING_OPTIONS, };
export var ApprovalMode;
(function (ApprovalMode) {
    ApprovalMode["PLAN"] = "plan";
    ApprovalMode["DEFAULT"] = "default";
    ApprovalMode["AUTO_EDIT"] = "auto-edit";
    ApprovalMode["YOLO"] = "yolo";
})(ApprovalMode || (ApprovalMode = {}));
export const APPROVAL_MODES = Object.values(ApprovalMode);
/**
 * Detailed information about each approval mode.
 * Used for UI display and protocol responses.
 */
export const APPROVAL_MODE_INFO = {
    [ApprovalMode.PLAN]: {
        id: ApprovalMode.PLAN,
        name: 'Plan',
        description: 'Analyze only, do not modify files or execute commands',
    },
    [ApprovalMode.DEFAULT]: {
        id: ApprovalMode.DEFAULT,
        name: 'Default',
        description: 'Require approval for file edits or shell commands',
    },
    [ApprovalMode.AUTO_EDIT]: {
        id: ApprovalMode.AUTO_EDIT,
        name: 'Auto Edit',
        description: 'Automatically approve file edits',
    },
    [ApprovalMode.YOLO]: {
        id: ApprovalMode.YOLO,
        name: 'YOLO',
        description: 'Automatically approve all tools',
    },
};
export const DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD = 25_000;
export const DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES = 1000;
export class MCPServerConfig {
    command;
    args;
    env;
    cwd;
    url;
    httpUrl;
    headers;
    tcp;
    timeout;
    trust;
    description;
    includeTools;
    excludeTools;
    extensionName;
    oauth;
    authProviderType;
    targetAudience;
    targetServiceAccount;
    type;
    constructor(
    // For stdio transport
    command, args, env, cwd, 
    // For sse transport
    url, 
    // For streamable http transport
    httpUrl, headers, 
    // For websocket transport
    tcp, 
    // Common
    timeout, trust, 
    // Metadata
    description, includeTools, excludeTools, extensionName, 
    // OAuth configuration
    oauth, authProviderType, 
    // Service Account Configuration
    /* targetAudience format: CLIENT_ID.apps.googleusercontent.com */
    targetAudience, 
    /* targetServiceAccount format: <service-account-name>@<project-num>.iam.gserviceaccount.com */
    targetServiceAccount, 
    // SDK MCP server type - 'sdk' indicates server runs in SDK process
    type) {
        this.command = command;
        this.args = args;
        this.env = env;
        this.cwd = cwd;
        this.url = url;
        this.httpUrl = httpUrl;
        this.headers = headers;
        this.tcp = tcp;
        this.timeout = timeout;
        this.trust = trust;
        this.description = description;
        this.includeTools = includeTools;
        this.excludeTools = excludeTools;
        this.extensionName = extensionName;
        this.oauth = oauth;
        this.authProviderType = authProviderType;
        this.targetAudience = targetAudience;
        this.targetServiceAccount = targetServiceAccount;
        this.type = type;
    }
}
/**
 * Check if an MCP server config represents an SDK server
 */
export function isSdkMcpServerConfig(config) {
    return config.type === 'sdk';
}
export var AuthProviderType;
(function (AuthProviderType) {
    AuthProviderType["DYNAMIC_DISCOVERY"] = "dynamic_discovery";
    AuthProviderType["GOOGLE_CREDENTIALS"] = "google_credentials";
    AuthProviderType["SERVICE_ACCOUNT_IMPERSONATION"] = "service_account_impersonation";
})(AuthProviderType || (AuthProviderType = {}));
function normalizeConfigOutputFormat(format) {
    if (!format) {
        return undefined;
    }
    switch (format) {
        case 'stream-json':
            return OutputFormat.STREAM_JSON;
        case 'json':
        case OutputFormat.JSON:
            return OutputFormat.JSON;
        case 'text':
        case OutputFormat.TEXT:
        default:
            return OutputFormat.TEXT;
    }
}
export class Config {
    sessionId;
    sessionData;
    debugLogger;
    toolRegistry;
    promptRegistry;
    subagentManager;
    extensionManager;
    skillManager = null;
    fileSystemService;
    contentGeneratorConfig;
    contentGeneratorConfigSources = {};
    contentGenerator;
    embeddingModel;
    modelsConfig;
    modelProvidersConfig;
    sandbox;
    targetDir;
    workspaceContext;
    debugMode;
    inputFormat;
    outputFormat;
    includePartialMessages;
    question;
    coreTools;
    allowedTools;
    excludeTools;
    toolDiscoveryCommand;
    toolCallCommand;
    mcpServerCommand;
    mcpServers;
    lspEnabled;
    lspClient;
    allowedMcpServers;
    excludedMcpServers;
    sessionSubagents;
    userMemory;
    sdkMode;
    geminiMdFileCount;
    approvalMode;
    accessibility;
    telemetrySettings;
    gitCoAuthor;
    usageStatisticsEnabled;
    ollamaClient;
    baseLlmClient;
    fileFiltering;
    fileDiscoveryService = null;
    gitService = undefined;
    sessionService = undefined;
    chatRecordingService = undefined;
    checkpointing;
    proxy;
    cwd;
    bugCommand;
    outputLanguageFilePath;
    noBrowser;
    folderTrustFeature;
    folderTrust;
    ideMode;
    maxSessionTurns;
    sessionTokenLimit;
    listExtensions;
    overrideExtensions;
    summarizeToolOutput;
    cliVersion;
    experimentalZedIntegration = false;
    chatRecordingEnabled;
    loadMemoryFromIncludeDirectories = false;
    importFormat;
    webSearch;
    chatCompression;
    interactive;
    trustedFolder;
    useRipgrep;
    useBuiltinRipgrep;
    shouldUseNodePtyShell;
    skipNextSpeakerCheck;
    shellExecutionConfig;
    skipLoopDetection;
    skipStartupContext;
    vlmSwitchMode;
    initialized = false;
    storage;
    fileExclusions;
    truncateToolOutputThreshold;
    truncateToolOutputLines;
    enableToolOutputTruncation;
    eventEmitter;
    channel;
    defaultFileEncoding;
    constructor(params) {
        this.sessionId = params.sessionId ?? randomUUID();
        this.sessionData = params.sessionData;
        setDebugLogSession(this);
        this.debugLogger = createDebugLogger();
        this.embeddingModel =
            params.embeddingModel ?? DEFAULT_OLLAMA_EMBEDDING_MODEL;
        this.fileSystemService = new StandardFileSystemService();
        this.sandbox = params.sandbox;
        this.targetDir = path.resolve(params.targetDir);
        this.workspaceContext = new WorkspaceContext(this.targetDir, params.includeDirectories ?? []);
        this.debugMode = params.debugMode;
        this.inputFormat = params.inputFormat ?? InputFormat.TEXT;
        const normalizedOutputFormat = normalizeConfigOutputFormat(params.outputFormat ?? params.output?.format);
        this.outputFormat = normalizedOutputFormat ?? OutputFormat.TEXT;
        this.includePartialMessages = params.includePartialMessages ?? false;
        this.question = params.question;
        this.coreTools = params.coreTools;
        this.allowedTools = params.allowedTools;
        this.excludeTools = params.excludeTools;
        this.toolDiscoveryCommand = params.toolDiscoveryCommand;
        this.toolCallCommand = params.toolCallCommand;
        this.mcpServerCommand = params.mcpServerCommand;
        this.mcpServers = params.mcpServers;
        this.lspEnabled = params.lsp?.enabled ?? false;
        this.lspClient = params.lspClient;
        this.allowedMcpServers = params.allowedMcpServers;
        this.excludedMcpServers = params.excludedMcpServers;
        this.sessionSubagents = params.sessionSubagents ?? [];
        this.sdkMode = params.sdkMode ?? false;
        this.userMemory = params.userMemory ?? '';
        this.geminiMdFileCount = params.geminiMdFileCount ?? 0;
        this.approvalMode = params.approvalMode ?? ApprovalMode.DEFAULT;
        this.accessibility = params.accessibility ?? {};
        this.telemetrySettings = {
            enabled: params.telemetry?.enabled ?? false,
            target: params.telemetry?.target ?? DEFAULT_TELEMETRY_TARGET,
            otlpEndpoint: params.telemetry?.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT,
            otlpProtocol: params.telemetry?.otlpProtocol,
            logPrompts: params.telemetry?.logPrompts ?? true,
            outfile: params.telemetry?.outfile,
            useCollector: params.telemetry?.useCollector,
        };
        this.gitCoAuthor = {
            enabled: params.gitCoAuthor ?? true,
            name: 'Ollama-Code',
            email: 'ollama-code@ollama.ai',
        };
        this.usageStatisticsEnabled = params.usageStatisticsEnabled ?? true;
        this.outputLanguageFilePath = params.outputLanguageFilePath;
        this.fileFiltering = {
            respectGitIgnore: params.fileFiltering?.respectGitIgnore ?? true,
            respectOllamaCodeIgnore: params.fileFiltering?.respectOllamaCodeIgnore ?? true,
            enableRecursiveFileSearch: params.fileFiltering?.enableRecursiveFileSearch ?? true,
            enableFuzzySearch: params.fileFiltering?.enableFuzzySearch ?? true,
        };
        this.checkpointing = params.checkpointing ?? false;
        this.proxy = params.proxy;
        this.cwd = params.cwd ?? process.cwd();
        this.fileDiscoveryService = params.fileDiscoveryService ?? null;
        this.bugCommand = params.bugCommand;
        this.maxSessionTurns = params.maxSessionTurns ?? -1;
        this.sessionTokenLimit = params.sessionTokenLimit ?? -1;
        this.experimentalZedIntegration =
            params.experimentalZedIntegration ?? false;
        this.listExtensions = params.listExtensions ?? false;
        this.overrideExtensions = params.overrideExtensions;
        this.noBrowser = params.noBrowser ?? false;
        this.summarizeToolOutput = params.summarizeToolOutput;
        this.folderTrustFeature = params.folderTrustFeature ?? false;
        this.folderTrust = params.folderTrust ?? false;
        this.ideMode = params.ideMode ?? false;
        this.modelProvidersConfig = params.modelProvidersConfig;
        this.cliVersion = params.cliVersion;
        this.chatRecordingEnabled = params.chatRecording ?? true;
        this.loadMemoryFromIncludeDirectories =
            params.loadMemoryFromIncludeDirectories ?? false;
        this.importFormat = params.importFormat ?? 'tree';
        this.chatCompression = params.chatCompression;
        this.interactive = params.interactive ?? false;
        this.trustedFolder = params.trustedFolder;
        this.skipLoopDetection = params.skipLoopDetection ?? false;
        this.skipStartupContext = params.skipStartupContext ?? false;
        // Web search
        this.webSearch = params.webSearch;
        this.useRipgrep = params.useRipgrep ?? true;
        this.useBuiltinRipgrep = params.useBuiltinRipgrep ?? true;
        this.shouldUseNodePtyShell = params.shouldUseNodePtyShell ?? false;
        this.skipNextSpeakerCheck = params.skipNextSpeakerCheck ?? true;
        this.shellExecutionConfig = {
            terminalWidth: params.shellExecutionConfig?.terminalWidth ?? 80,
            terminalHeight: params.shellExecutionConfig?.terminalHeight ?? 24,
            showColor: params.shellExecutionConfig?.showColor ?? false,
            pager: params.shellExecutionConfig?.pager ?? 'cat',
        };
        this.truncateToolOutputThreshold =
            params.truncateToolOutputThreshold ??
                DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD;
        this.truncateToolOutputLines =
            params.truncateToolOutputLines ?? DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES;
        this.enableToolOutputTruncation = params.enableToolOutputTruncation ?? true;
        this.channel = params.channel;
        this.defaultFileEncoding = params.defaultFileEncoding ?? FileEncoding.UTF8;
        this.storage = new Storage(this.targetDir);
        this.vlmSwitchMode = params.vlmSwitchMode;
        this.inputFormat = params.inputFormat ?? InputFormat.TEXT;
        this.fileExclusions = new FileExclusions(this);
        this.eventEmitter = params.eventEmitter;
        if (params.contextFileName) {
            setOllamaMdFilename(params.contextFileName);
        }
        // Create ModelsConfig for centralized model management
        // Prefer params.authType over generationConfig.authType because:
        // - params.authType preserves undefined (user hasn't selected yet)
        // - generationConfig.authType may have a default value from resolvers
        this.modelsConfig = new ModelsConfig({
            initialAuthType: params.authType ?? params.generationConfig?.authType,
            modelProvidersConfig: this.modelProvidersConfig,
            generationConfig: {
                model: params.model,
                ...(params.generationConfig || {}),
                baseUrl: params.generationConfig?.baseUrl,
            },
            generationConfigSources: params.generationConfigSources,
            onModelChange: this.handleModelChange.bind(this),
        });
        if (this.telemetrySettings.enabled) {
            initializeTelemetry(this);
        }
        if (this.getProxy()) {
            setGlobalDispatcher(new ProxyAgent(this.getProxy()));
        }
        this.ollamaClient = new OllamaClient(this);
        this.chatRecordingService = this.chatRecordingEnabled
            ? new ChatRecordingService(this)
            : undefined;
        this.extensionManager = new ExtensionManager({
            workspaceDir: this.targetDir,
            enabledExtensionOverrides: this.overrideExtensions,
            isWorkspaceTrusted: this.isTrustedFolder(),
        });
    }
    /**
     * Must only be called once, throws if called again.
     * @param options Optional initialization options including sendSdkMcpMessage callback
     */
    async initialize(options) {
        if (this.initialized) {
            throw Error('Config was already initialized');
        }
        this.initialized = true;
        this.debugLogger.info('Config initialization started');
        // Initialize centralized FileDiscoveryService
        this.getFileService();
        if (this.getCheckpointingEnabled()) {
            await this.getGitService();
        }
        this.promptRegistry = new PromptRegistry();
        this.extensionManager.setConfig(this);
        await this.extensionManager.refreshCache();
        this.debugLogger.debug('Extension manager initialized');
        this.subagentManager = new SubagentManager(this);
        this.skillManager = new SkillManager(this);
        await this.skillManager.startWatching();
        this.debugLogger.debug('Skill manager initialized');
        // Load session subagents if they were provided before initialization
        if (this.sessionSubagents.length > 0) {
            this.subagentManager.loadSessionSubagents(this.sessionSubagents);
        }
        await this.extensionManager.refreshCache();
        await this.refreshHierarchicalMemory();
        this.debugLogger.debug('Hierarchical memory loaded');
        this.toolRegistry = await this.createToolRegistry(options?.sendSdkMcpMessage);
        this.debugLogger.info(`Tool registry initialized with ${this.toolRegistry.getAllToolNames().length} tools`);
        await this.ollamaClient.initialize();
        this.debugLogger.info('Gemini client initialized');
        // Detect and capture runtime model snapshot (from CLI/ENV/credentials)
        this.modelsConfig.detectAndCaptureRuntimeModel();
        logStartSession(this, new StartSessionEvent(this));
        this.debugLogger.info('Config initialization completed');
    }
    async refreshHierarchicalMemory() {
        const { memoryContent, fileCount } = await loadServerHierarchicalMemory(this.getWorkingDir(), this.shouldLoadMemoryFromIncludeDirectories()
            ? this.getWorkspaceContext().getDirectories()
            : [], this.getFileService(), this.getExtensionContextFilePaths(), this.isTrustedFolder(), this.getImportFormat());
        this.setUserMemory(memoryContent);
        this.setGeminiMdFileCount(fileCount);
    }
    getContentGenerator() {
        return this.contentGenerator;
    }
    /**
     * Get the ModelsConfig instance for model-related operations.
     * External code (e.g., CLI) can use this to access model configuration.
     */
    getModelsConfig() {
        return this.modelsConfig;
    }
    /**
     * Updates the credentials in the generation config.
     * Exclusive for `OpenAIKeyPrompt` to update credentials via `/auth`
     * Delegates to ModelsConfig.
     */
    updateCredentials(credentials, settingsGenerationConfig) {
        this.modelsConfig.updateCredentials(credentials, settingsGenerationConfig);
    }
    /**
     * Reload model providers configuration at runtime.
     * This enables hot-reloading of modelProviders settings without restarting the CLI.
     * Should be called before refreshAuth when settings.json has been updated.
     *
     * @param modelProvidersConfig - The updated model providers configuration
     */
    reloadModelProvidersConfig(modelProvidersConfig) {
        this.modelsConfig.reloadModelProvidersConfig(modelProvidersConfig);
    }
    /**
     * Refresh authentication and rebuild ContentGenerator.
     */
    async refreshAuth(authMethod, isInitialAuth) {
        // Sync modelsConfig state for this auth refresh
        const modelId = this.modelsConfig.getModel();
        this.modelsConfig.syncAfterAuthRefresh(authMethod, modelId);
        // Check and consume cached credentials flag
        const requireCached = this.modelsConfig.consumeRequireCachedCredentialsFlag();
        const { config, sources } = resolveContentGeneratorConfigWithSources(this, authMethod, this.modelsConfig.getGenerationConfig(), this.modelsConfig.getGenerationConfigSources(), {
            strictModelProvider: this.modelsConfig.isStrictModelProviderSelection(),
        });
        const newContentGeneratorConfig = config;
        this.contentGenerator = await createContentGenerator(newContentGeneratorConfig, this, requireCached ? true : isInitialAuth);
        // Only assign to instance properties after successful initialization
        this.contentGeneratorConfig = newContentGeneratorConfig;
        this.contentGeneratorConfigSources = sources;
        // Initialize BaseLlmClient now that the ContentGenerator is available
        this.baseLlmClient = new BaseLlmClient(this.contentGenerator, this);
    }
    /**
     * Provides access to the BaseLlmClient for stateless LLM operations.
     */
    getBaseLlmClient() {
        if (!this.baseLlmClient) {
            // Handle cases where initialization might be deferred or authentication failed
            if (this.contentGenerator) {
                this.baseLlmClient = new BaseLlmClient(this.getContentGenerator(), this);
            }
            else {
                throw new Error('BaseLlmClient not initialized. Ensure authentication has occurred and ContentGenerator is ready.');
            }
        }
        return this.baseLlmClient;
    }
    getSessionId() {
        return this.sessionId;
    }
    getDebugLogger() {
        return this.debugLogger;
    }
    /**
     * Starts a new session and resets session-scoped services.
     */
    startNewSession(sessionId, sessionData) {
        this.sessionId = sessionId ?? randomUUID();
        this.sessionData = sessionData;
        setDebugLogSession(this);
        this.debugLogger = createDebugLogger();
        this.chatRecordingService = this.chatRecordingEnabled
            ? new ChatRecordingService(this)
            : undefined;
        if (this.initialized) {
            logStartSession(this, new StartSessionEvent(this));
        }
        return this.sessionId;
    }
    /**
     * Returns the resumed session data if this session was resumed from a previous one.
     */
    getResumedSessionData() {
        return this.sessionData;
    }
    shouldLoadMemoryFromIncludeDirectories() {
        return this.loadMemoryFromIncludeDirectories;
    }
    getImportFormat() {
        return this.importFormat;
    }
    getContentGeneratorConfig() {
        return this.contentGeneratorConfig;
    }
    getContentGeneratorConfigSources() {
        // If contentGeneratorConfigSources is empty (before initializeAuth),
        // get sources from ModelsConfig
        if (Object.keys(this.contentGeneratorConfigSources).length === 0 &&
            this.modelsConfig) {
            return this.modelsConfig.getGenerationConfigSources();
        }
        return this.contentGeneratorConfigSources;
    }
    getModel() {
        return this.contentGeneratorConfig?.model || this.modelsConfig.getModel();
    }
    /**
     * Set model programmatically (e.g., VLM auto-switch, fallback).
     * Delegates to ModelsConfig.
     */
    async setModel(newModel, metadata) {
        await this.modelsConfig.setModel(newModel, metadata);
        // Also update contentGeneratorConfig for hot-update compatibility
        if (this.contentGeneratorConfig) {
            this.contentGeneratorConfig.model = newModel;
        }
    }
    /**
     * Handle model change from ModelsConfig.
     * This updates the content generator config with the new model settings.
     */
    async handleModelChange(authType, _requiresRefresh) {
        if (!this.contentGeneratorConfig) {
            return;
        }
        // Full refresh path - always refresh for Ollama
        await this.refreshAuth(authType);
    }
    /**
     * Get available models for the current authType.
     * Delegates to ModelsConfig.
     */
    getAvailableModels() {
        return this.modelsConfig.getAvailableModels();
    }
    /**
     * Get available models for a specific authType.
     * Delegates to ModelsConfig.
     */
    getAvailableModelsForAuthType(authType) {
        return this.modelsConfig.getAvailableModelsForAuthType(authType);
    }
    /**
     * Get all configured models across authTypes.
     * Delegates to ModelsConfig.
     */
    getAllConfiguredModels(authTypes) {
        return this.modelsConfig.getAllConfiguredModels(authTypes);
    }
    /**
     * Get the currently active runtime model snapshot.
     * Delegates to ModelsConfig.
     */
    getActiveRuntimeModelSnapshot() {
        return this.modelsConfig.getActiveRuntimeModelSnapshot();
    }
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
    async switchModel(authType, modelId, options) {
        await this.modelsConfig.switchModel(authType, modelId, options);
    }
    getMaxSessionTurns() {
        return this.maxSessionTurns;
    }
    getSessionTokenLimit() {
        return this.sessionTokenLimit;
    }
    getEmbeddingModel() {
        return this.embeddingModel;
    }
    getSandbox() {
        return this.sandbox;
    }
    isRestrictiveSandbox() {
        const sandboxConfig = this.getSandbox();
        const seatbeltProfile = process.env['SEATBELT_PROFILE'];
        return (!!sandboxConfig &&
            sandboxConfig.command === 'sandbox-exec' &&
            !!seatbeltProfile &&
            seatbeltProfile.startsWith('restrictive-'));
    }
    getTargetDir() {
        return this.targetDir;
    }
    getProjectRoot() {
        return this.targetDir;
    }
    getWorkspaceContext() {
        return this.workspaceContext;
    }
    getToolRegistry() {
        return this.toolRegistry;
    }
    /**
     * Shuts down the Config and releases all resources.
     * This method is idempotent and safe to call multiple times.
     * It handles the case where initialization was not completed.
     */
    async shutdown() {
        if (!this.initialized) {
            // Nothing to clean up if not initialized
            return;
        }
        try {
            this.skillManager?.stopWatching();
            if (this.toolRegistry) {
                await this.toolRegistry.stop();
            }
        }
        catch (error) {
            // Log but don't throw - cleanup should be best-effort
            this.debugLogger.error('Error during Config shutdown:', error);
        }
    }
    getPromptRegistry() {
        return this.promptRegistry;
    }
    getDebugMode() {
        return this.debugMode;
    }
    getQuestion() {
        return this.question;
    }
    getCoreTools() {
        return this.coreTools;
    }
    getAllowedTools() {
        return this.allowedTools;
    }
    getExcludeTools() {
        return this.excludeTools;
    }
    getToolDiscoveryCommand() {
        return this.toolDiscoveryCommand;
    }
    getToolCallCommand() {
        return this.toolCallCommand;
    }
    getMcpServerCommand() {
        return this.mcpServerCommand;
    }
    getMcpServers() {
        let mcpServers = { ...(this.mcpServers || {}) };
        const extensions = this.getActiveExtensions();
        for (const extension of extensions) {
            Object.entries(extension.config.mcpServers || {}).forEach(([key, server]) => {
                if (mcpServers[key])
                    return;
                mcpServers[key] = {
                    ...server,
                    extensionName: extension.config.name,
                };
            });
        }
        if (this.allowedMcpServers) {
            mcpServers = Object.fromEntries(Object.entries(mcpServers).filter(([key]) => this.allowedMcpServers?.includes(key)));
        }
        if (this.excludedMcpServers) {
            mcpServers = Object.fromEntries(Object.entries(mcpServers).filter(([key]) => !this.excludedMcpServers?.includes(key)));
        }
        return mcpServers;
    }
    addMcpServers(servers) {
        if (this.initialized) {
            throw new Error('Cannot modify mcpServers after initialization');
        }
        this.mcpServers = { ...this.mcpServers, ...servers };
    }
    isLspEnabled() {
        return this.lspEnabled;
    }
    getLspClient() {
        return this.lspClient;
    }
    /**
     * Allows wiring an LSP client after Config construction but before initialize().
     */
    setLspClient(client) {
        if (this.initialized) {
            throw new Error('Cannot set LSP client after initialization');
        }
        this.lspClient = client;
    }
    getSessionSubagents() {
        return this.sessionSubagents;
    }
    setSessionSubagents(subagents) {
        if (this.initialized) {
            throw new Error('Cannot modify sessionSubagents after initialization');
        }
        this.sessionSubagents = subagents;
    }
    getSdkMode() {
        return this.sdkMode;
    }
    setSdkMode(value) {
        this.sdkMode = value;
    }
    getUserMemory() {
        return this.userMemory;
    }
    setUserMemory(newUserMemory) {
        this.userMemory = newUserMemory;
    }
    getGeminiMdFileCount() {
        return this.geminiMdFileCount;
    }
    setGeminiMdFileCount(count) {
        this.geminiMdFileCount = count;
    }
    getApprovalMode() {
        return this.approvalMode;
    }
    setApprovalMode(mode) {
        if (!this.isTrustedFolder() &&
            mode !== ApprovalMode.DEFAULT &&
            mode !== ApprovalMode.PLAN) {
            throw new Error('Cannot enable privileged approval modes in an untrusted folder.');
        }
        this.approvalMode = mode;
    }
    getInputFormat() {
        return this.inputFormat;
    }
    getIncludePartialMessages() {
        return this.includePartialMessages;
    }
    getAccessibility() {
        return this.accessibility;
    }
    getTelemetryEnabled() {
        return this.telemetrySettings.enabled ?? false;
    }
    getTelemetryLogPromptsEnabled() {
        return this.telemetrySettings.logPrompts ?? true;
    }
    getTelemetryOtlpEndpoint() {
        return this.telemetrySettings.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT;
    }
    getTelemetryOtlpProtocol() {
        return this.telemetrySettings.otlpProtocol ?? 'grpc';
    }
    getTelemetryTarget() {
        return this.telemetrySettings.target ?? DEFAULT_TELEMETRY_TARGET;
    }
    getTelemetryOutfile() {
        return this.telemetrySettings.outfile;
    }
    getGitCoAuthor() {
        return this.gitCoAuthor;
    }
    getTelemetryUseCollector() {
        return this.telemetrySettings.useCollector ?? false;
    }
    getOllamaClient() {
        return this.ollamaClient;
    }
    getEnableRecursiveFileSearch() {
        return this.fileFiltering.enableRecursiveFileSearch;
    }
    getFileFilteringEnableFuzzySearch() {
        return this.fileFiltering.enableFuzzySearch;
    }
    getFileFilteringRespectGitIgnore() {
        return this.fileFiltering.respectGitIgnore;
    }
    getFileFilteringRespectOllamaCodeIgnore() {
        return this.fileFiltering.respectOllamaCodeIgnore;
    }
    getFileFilteringOptions() {
        return {
            respectGitIgnore: this.fileFiltering.respectGitIgnore,
            respectOllamaCodeIgnore: this.fileFiltering.respectOllamaCodeIgnore,
        };
    }
    /**
     * Gets custom file exclusion patterns from configuration.
     * TODO: This is a placeholder implementation. In the future, this could
     * read from settings files, CLI arguments, or environment variables.
     */
    getCustomExcludes() {
        // Placeholder implementation - returns empty array for now
        // Future implementation could read from:
        // - User settings file
        // - Project-specific configuration
        // - Environment variables
        // - CLI arguments
        return [];
    }
    getCheckpointingEnabled() {
        return this.checkpointing;
    }
    getProxy() {
        return this.proxy;
    }
    getWorkingDir() {
        return this.cwd;
    }
    getBugCommand() {
        return this.bugCommand;
    }
    getFileService() {
        if (!this.fileDiscoveryService) {
            this.fileDiscoveryService = new FileDiscoveryService(this.targetDir);
        }
        return this.fileDiscoveryService;
    }
    getUsageStatisticsEnabled() {
        return this.usageStatisticsEnabled;
    }
    getExtensionContextFilePaths() {
        const extensionContextFilePaths = this.getActiveExtensions().flatMap((e) => e.contextFiles);
        return [
            ...extensionContextFilePaths,
            ...(this.outputLanguageFilePath ? [this.outputLanguageFilePath] : []),
        ];
    }
    getExperimentalZedIntegration() {
        return this.experimentalZedIntegration;
    }
    getListExtensions() {
        return this.listExtensions;
    }
    getExtensionManager() {
        return this.extensionManager;
    }
    getExtensions() {
        const extensions = this.extensionManager.getLoadedExtensions();
        if (this.overrideExtensions) {
            return extensions.filter((e) => this.overrideExtensions?.includes(e.name));
        }
        else {
            return extensions;
        }
    }
    getActiveExtensions() {
        return this.getExtensions().filter((e) => e.isActive);
    }
    getBlockedMcpServers() {
        const mcpServers = { ...(this.mcpServers || {}) };
        const extensions = this.getActiveExtensions();
        for (const extension of extensions) {
            Object.entries(extension.config.mcpServers || {}).forEach(([key, server]) => {
                if (mcpServers[key])
                    return;
                mcpServers[key] = {
                    ...server,
                    extensionName: extension.config.name,
                };
            });
        }
        const blockedMcpServers = [];
        if (this.allowedMcpServers) {
            Object.entries(mcpServers).forEach(([key, server]) => {
                const isAllowed = this.allowedMcpServers?.includes(key);
                if (!isAllowed) {
                    blockedMcpServers.push({
                        name: key,
                        extensionName: server.extensionName || '',
                    });
                }
            });
        }
        return blockedMcpServers;
    }
    getNoBrowser() {
        return this.noBrowser;
    }
    isBrowserLaunchSuppressed() {
        return this.getNoBrowser() || !shouldAttemptBrowserLaunch();
    }
    getSummarizeToolOutputConfig() {
        return this.summarizeToolOutput;
    }
    // Web search provider configuration
    getWebSearchConfig() {
        return this.webSearch;
    }
    getIdeMode() {
        return this.ideMode;
    }
    getFolderTrustFeature() {
        return this.folderTrustFeature;
    }
    /**
     * Returns 'true' if the workspace is considered "trusted".
     * 'false' for untrusted.
     */
    getFolderTrust() {
        return this.folderTrust;
    }
    isTrustedFolder() {
        // isWorkspaceTrusted in cli/src/config/trustedFolder.js returns undefined
        // when the file based trust value is unavailable, since it is mainly used
        // in the initialization for trust dialogs, etc. Here we return true since
        // config.isTrustedFolder() is used for the main business logic of blocking
        // tool calls etc in the rest of the application.
        //
        // Default value is true since we load with trusted settings to avoid
        // restarts in the more common path. If the user chooses to mark the folder
        // as untrusted, the CLI will restart and we will have the trust value
        // reloaded.
        const context = ideContextStore.get();
        if (context?.workspaceState?.isTrusted !== undefined) {
            return context.workspaceState.isTrusted;
        }
        return this.trustedFolder ?? true;
    }
    setIdeMode(value) {
        this.ideMode = value;
    }
    getAuthType() {
        return this.contentGeneratorConfig?.authType;
    }
    getCliVersion() {
        return this.cliVersion;
    }
    getChannel() {
        return this.channel;
    }
    /**
     * Get the default file encoding for new files.
     * @returns FileEncodingType
     */
    getDefaultFileEncoding() {
        return this.defaultFileEncoding;
    }
    /**
     * Get the current FileSystemService
     */
    getFileSystemService() {
        return this.fileSystemService;
    }
    /**
     * Set a custom FileSystemService
     */
    setFileSystemService(fileSystemService) {
        this.fileSystemService = fileSystemService;
    }
    getChatCompression() {
        return this.chatCompression;
    }
    isInteractive() {
        return this.interactive;
    }
    getUseRipgrep() {
        return this.useRipgrep;
    }
    getUseBuiltinRipgrep() {
        return this.useBuiltinRipgrep;
    }
    getShouldUseNodePtyShell() {
        return this.shouldUseNodePtyShell;
    }
    getSkipNextSpeakerCheck() {
        return this.skipNextSpeakerCheck;
    }
    getShellExecutionConfig() {
        return this.shellExecutionConfig;
    }
    setShellExecutionConfig(config) {
        this.shellExecutionConfig = {
            terminalWidth: config.terminalWidth ?? this.shellExecutionConfig.terminalWidth,
            terminalHeight: config.terminalHeight ?? this.shellExecutionConfig.terminalHeight,
            showColor: config.showColor ?? this.shellExecutionConfig.showColor,
            pager: config.pager ?? this.shellExecutionConfig.pager,
        };
    }
    getScreenReader() {
        return this.accessibility.screenReader ?? false;
    }
    getSkipLoopDetection() {
        return this.skipLoopDetection;
    }
    getSkipStartupContext() {
        return this.skipStartupContext;
    }
    getVlmSwitchMode() {
        return this.vlmSwitchMode;
    }
    getEnableToolOutputTruncation() {
        return this.enableToolOutputTruncation;
    }
    getTruncateToolOutputThreshold() {
        if (!this.enableToolOutputTruncation ||
            this.truncateToolOutputThreshold <= 0) {
            return Number.POSITIVE_INFINITY;
        }
        return this.truncateToolOutputThreshold;
    }
    getTruncateToolOutputLines() {
        if (!this.enableToolOutputTruncation || this.truncateToolOutputLines <= 0) {
            return Number.POSITIVE_INFINITY;
        }
        return this.truncateToolOutputLines;
    }
    getOutputFormat() {
        return this.outputFormat;
    }
    async getGitService() {
        if (!this.gitService) {
            this.gitService = new GitService(this.targetDir, this.storage);
            await this.gitService.initialize();
        }
        return this.gitService;
    }
    /**
     * Returns the chat recording service.
     */
    getChatRecordingService() {
        if (!this.chatRecordingEnabled) {
            return undefined;
        }
        if (!this.chatRecordingService) {
            this.chatRecordingService = new ChatRecordingService(this);
        }
        return this.chatRecordingService;
    }
    /**
     * Gets or creates a SessionService for managing chat sessions.
     */
    getSessionService() {
        if (!this.sessionService) {
            this.sessionService = new SessionService(this.targetDir);
        }
        return this.sessionService;
    }
    getFileExclusions() {
        return this.fileExclusions;
    }
    getSubagentManager() {
        return this.subagentManager;
    }
    getSkillManager() {
        return this.skillManager;
    }
    async createToolRegistry(sendSdkMcpMessage) {
        const registry = new ToolRegistry(this, this.eventEmitter, sendSdkMcpMessage);
        const coreToolsConfig = this.getCoreTools();
        const excludeToolsConfig = this.getExcludeTools();
        // Helper to create & register core tools that are enabled
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const registerCoreTool = (ToolClass, ...args) => {
            const toolName = ToolClass?.Name;
            const className = ToolClass?.name ?? 'UnknownTool';
            if (!toolName) {
                // Log warning and skip this tool instead of crashing
                this.debugLogger.warn(`Skipping tool registration: ${className} is missing static Name property. ` +
                    `Tools must define a static Name property to be registered.`);
                return;
            }
            if (isToolEnabled(toolName, coreToolsConfig, excludeToolsConfig)) {
                try {
                    registry.registerTool(new ToolClass(...args));
                }
                catch (error) {
                    this.debugLogger.error(`Failed to register tool ${className} (${toolName}):`, error);
                    throw error; // Re-throw after logging context
                }
            }
        };
        registerCoreTool(TaskTool, this);
        registerCoreTool(SkillTool, this);
        registerCoreTool(LSTool, this);
        registerCoreTool(ReadFileTool, this);
        if (this.getUseRipgrep()) {
            let useRipgrep = false;
            let errorString = undefined;
            try {
                useRipgrep = await canUseRipgrep(this.getUseBuiltinRipgrep());
            }
            catch (error) {
                errorString = getErrorMessage(error);
            }
            if (useRipgrep) {
                registerCoreTool(RipGrepTool, this);
            }
            else {
                // Log for telemetry
                logRipgrepFallback(this, new RipgrepFallbackEvent(this.getUseRipgrep(), this.getUseBuiltinRipgrep(), errorString || 'ripgrep is not available'));
                registerCoreTool(GrepTool, this);
            }
        }
        else {
            registerCoreTool(GrepTool, this);
        }
        registerCoreTool(GlobTool, this);
        registerCoreTool(EditTool, this);
        registerCoreTool(WriteFileTool, this);
        registerCoreTool(ShellTool, this);
        registerCoreTool(MemoryTool);
        registerCoreTool(TodoWriteTool, this);
        !this.sdkMode && registerCoreTool(ExitPlanModeTool, this);
        registerCoreTool(WebFetchTool, this);
        // Conditionally register web search tool if web search provider is configured
        // buildWebSearchConfig ensures qwen-oauth users get dashscope provider, so
        // if tool is registered, config must exist
        if (this.getWebSearchConfig()) {
            registerCoreTool(WebSearchTool, this);
        }
        if (this.isLspEnabled() && this.getLspClient()) {
            // Register the unified LSP tool
            registerCoreTool(LspTool, this);
        }
        await registry.discoverAllTools();
        this.debugLogger.debug(`ToolRegistry created: ${JSON.stringify(registry.getAllToolNames())} (${registry.getAllToolNames().length} tools)`);
        return registry;
    }
}
//# sourceMappingURL=config.js.map