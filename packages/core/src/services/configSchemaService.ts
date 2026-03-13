/**
 * Config Schema Service
 *
 * Unified configuration management with Zod schema validation.
 * Provides a single source of truth for all configuration sources.
 */

import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  type ConfigSource,
  type ConfigSources,
  cliSource,
  settingsSource,
  defaultSource,
} from '../utils/configResolver.js';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('config-schema');

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Approval mode enum
 */
export const ApprovalModeSchema = z.enum(['plan', 'default', 'auto-edit', 'yolo']);

/**
 * Log level enum
 */
export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'fatal']);

/**
 * Output format enum
 */
export const OutputFormatSchema = z.enum(['text', 'json', 'stream-json']);

/**
 * Input format enum
 */
export const InputFormatSchema = z.enum(['text', 'stream-json']);

/**
 * File encoding enum
 */
export const FileEncodingSchema = z.enum(['utf8', 'utf16le', 'latin1', 'ascii', 'base64']);

/**
 * Web search provider type
 */
export const WebSearchProviderTypeSchema = z.enum(['tavily', 'google', 'dashscope']);

/**
 * Auth type enum
 */
export const AuthTypeSchema = z.enum([
  'ollama',
  'openai',
  'anthropic',
  'gemini',
  'openrouter',
  'azure',
  'custom',
]);

/**
 * Accessibility settings schema
 */
export const AccessibilitySettingsSchema = z.object({
  enableLoadingPhrases: z.boolean().optional().default(true),
  screenReader: z.boolean().optional().default(false),
});

/**
 * Git co-author settings schema
 */
export const GitCoAuthorSettingsSchema = z.object({
  enabled: z.boolean().optional().default(true),
  name: z.string().optional().default('Ollama-Code'),
  email: z.string().optional().default('ollama-code@ollama.ai'),
});

/**
 * File filtering options schema
 */
export const FileFilteringOptionsSchema = z.object({
  respectGitIgnore: z.boolean().optional().default(true),
  respectOllamaCodeIgnore: z.boolean().optional().default(true),
  enableRecursiveFileSearch: z.boolean().optional().default(true),
  enableFuzzySearch: z.boolean().optional().default(true),
});

/**
 * Chat compression settings schema
 */
export const ChatCompressionSettingsSchema = z.object({
  contextPercentageThreshold: z.number().min(0).max(100).optional().default(80),
});

/**
 * Shell execution config schema
 */
export const ShellExecutionConfigSchema = z.object({
  terminalWidth: z.number().int().min(1).max(1000).optional().default(80),
  terminalHeight: z.number().int().min(1).max(100).optional().default(24),
  showColor: z.boolean().optional().default(false),
  pager: z.string().optional().default('cat'),
});

/**
 * Web search provider config
 */
export const WebSearchProviderSchema = z.object({
  type: WebSearchProviderTypeSchema,
  apiKey: z.string().optional(),
  searchEngineId: z.string().optional(),
});

/**
 * Web search config
 */
export const WebSearchConfigSchema = z.object({
  provider: z.array(WebSearchProviderSchema).min(1),
  default: z.string(),
});

/**
 * MCP server config schema
 */
export const MCPServerConfigSchema = z.object({
  // stdio transport
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().optional(),
  // sse transport
  url: z.string().optional(),
  // http transport
  httpUrl: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  // websocket transport
  tcp: z.string().optional(),
  // common
  timeout: z.number().int().positive().optional(),
  trust: z.boolean().optional(),
  // metadata
  description: z.string().optional(),
  includeTools: z.array(z.string()).optional(),
  excludeTools: z.array(z.string()).optional(),
  extensionName: z.string().optional(),
  // oauth
  oauth: z
    .object({
      clientId: z.string(),
      clientSecret: z.string().optional(),
      authorizationUrl: z.string().optional(),
      tokenUrl: z.string().optional(),
      scopes: z.array(z.string()).optional(),
    })
    .optional(),
  // sdk type
  type: z.literal('sdk').optional(),
});

/**
 * Sandbox config schema
 */
export const SandboxConfigSchema = z.object({
  command: z.enum(['docker', 'podman', 'sandbox-exec']),
  image: z.string(),
});

/**
 * Content generator config schema
 */
export const ContentGeneratorConfigSchema = z.object({
  model: z.string(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  authType: AuthTypeSchema.optional(),
});

/**
 * Model provider config
 */
export const ModelProviderConfigSchema = z.object({
  authType: AuthTypeSchema,
  models: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        contextWindow: z.number().int().positive().optional(),
        maxOutputTokens: z.number().int().positive().optional(),
        supportsVision: z.boolean().optional(),
        supportsTools: z.boolean().optional(),
      }),
    )
    .optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
});

/**
 * Subagent config schema
 */
export const SubagentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  tools: z.array(z.string()).optional(),
  maxTurns: z.number().int().positive().optional(),
});

// ============================================================================
// Main Config Schema
// ============================================================================

/**
 * Complete configuration schema
 */
export const ConfigSchema = z.object({
  // Session
  sessionId: z.string().uuid().optional(),
  maxSessionTurns: z.number().int().optional().default(-1),
  sessionTokenLimit: z.number().int().optional().default(-1),

  // Core
  targetDir: z.string(),
  cwd: z.string(),
  debugMode: z.boolean().optional().default(false),
  interactive: z.boolean().optional().default(true),
  sdkMode: z.boolean().optional().default(false),
  ideMode: z.boolean().optional().default(false),

  // Model
  model: z.string().optional(),
  embeddingModel: z.string().optional(),
  authType: AuthTypeSchema.optional(),
  contentGenerator: ContentGeneratorConfigSchema.optional(),
  modelProviders: z.record(z.string(), ModelProviderConfigSchema).optional(),

  // Approval
  approvalMode: ApprovalModeSchema.optional().default('default'),

  // File handling
  fileFiltering: FileFilteringOptionsSchema.optional(),
  defaultFileEncoding: FileEncodingSchema.optional().default('utf8'),

  // Shell
  shellExecution: ShellExecutionConfigSchema.optional(),
  shouldUseNodePtyShell: z.boolean().optional().default(false),

  // Tools
  coreTools: z.array(z.string()).optional(),
  allowedTools: z.array(z.string()).optional(),
  excludeTools: z.array(z.string()).optional(),

  // MCP
  mcpServers: z.record(z.string(), MCPServerConfigSchema).optional(),
  allowedMcpServers: z.array(z.string()).optional(),
  excludedMcpServers: z.array(z.string()).optional(),

  // LSP
  lsp: z
    .object({
      enabled: z.boolean().optional().default(false),
    })
    .optional(),

  // Memory
  userMemory: z.string().optional(),
  contextFileName: z.union([z.string(), z.array(z.string())]).optional(),
  loadMemoryFromIncludeDirectories: z.boolean().optional().default(false),

  // Web search
  webSearch: WebSearchConfigSchema.optional(),

  // Features
  checkpointing: z.boolean().optional().default(false),
  chatRecording: z.boolean().optional().default(true),
  usageStatisticsEnabled: z.boolean().optional().default(true),
  folderTrustFeature: z.boolean().optional().default(false),
  folderTrust: z.boolean().optional().default(false),

  // Output
  outputFormat: OutputFormatSchema.optional().default('text'),
  inputFormat: InputFormatSchema.optional().default('text'),
  includePartialMessages: z.boolean().optional().default(false),
  truncateToolOutputThreshold: z.number().int().positive().optional().default(25000),
  truncateToolOutputLines: z.number().int().positive().optional().default(1000),
  enableToolOutputTruncation: z.boolean().optional().default(true),

  // Accessibility
  accessibility: AccessibilitySettingsSchema.optional(),

  // Git
  gitCoAuthor: GitCoAuthorSettingsSchema.optional(),

  // Chat compression
  chatCompression: ChatCompressionSettingsSchema.optional(),

  // Sandbox
  sandbox: SandboxConfigSchema.optional(),

  // Proxy
  proxy: z.string().optional(),

  // Extensions
  listExtensions: z.boolean().optional().default(false),
  overrideExtensions: z.array(z.string()).optional(),

  // Subagents
  subagents: z.array(SubagentConfigSchema).optional(),

  // Import format
  importFormat: z.enum(['tree', 'flat']).optional().default('tree'),

  // Skip options
  skipLoopDetection: z.boolean().optional().default(false),
  skipStartupContext: z.boolean().optional().default(false),
  skipNextSpeakerCheck: z.boolean().optional().default(true),

  // VLM
  vlmSwitchMode: z.string().optional(),

  // Channel
  channel: z.string().optional(),
});

export type ConfigSchemaType = z.infer<typeof ConfigSchema>;

// ============================================================================
// Config Layer Types
// ============================================================================

/**
 * Configuration layer with source tracking
 */
export interface ConfigLayerWithValue {
  values: Partial<ConfigSchemaType>;
  source: ConfigSource;
  priority: number; // Higher = more priority
}

/**
 * Config schema field metadata
 */
export interface ConfigFieldMeta {
  key: string;
  description: string;
  defaultValue?: unknown;
  envKey?: string;
  cliFlag?: string;
  deprecated?: boolean;
  deprecationMessage?: string;
}

/**
 * Validation result for partial config
 */
export interface ValidationResult {
  success: boolean;
  errors?: Array<{ path: string; message: string }>;
}

// ============================================================================
// Config Schema Service
// ============================================================================

/**
 * Unified configuration management service
 *
 * Provides:
 * - Schema validation with Zod
 * - Multi-source resolution (CLI, env, settings, defaults)
 * - Source tracking for debugging
 * - Change notifications
 * - Persistence helpers
 */
export class ConfigSchemaService {
  private config: ConfigSchemaType;
  private sources: ConfigSources = {};
  private layers: ConfigLayerWithValue[] = [];
  private changeListeners: Set<(key: string, value: unknown, source: ConfigSource) => void> = new Set();
  private configPath: string;
  private userConfigPath: string;

  constructor(private readonly targetDir: string) {
    this.configPath = path.join(targetDir, '.ollama-code', 'config.json');
    this.userConfigPath = path.join(os.homedir(), '.ollama-code', 'settings.json');

    // Initialize with defaults
    this.config = this.getDefaults(targetDir);
    this.sources = {};
  }

  /**
   * Get default configuration values
   */
  private getDefaults(targetDir: string): ConfigSchemaType {
    return {
      targetDir,
      cwd: process.cwd(),
      debugMode: false,
      interactive: true,
      sdkMode: false,
      ideMode: false,
      approvalMode: 'default',
      fileFiltering: {
        respectGitIgnore: true,
        respectOllamaCodeIgnore: true,
        enableRecursiveFileSearch: true,
        enableFuzzySearch: true,
      },
      defaultFileEncoding: 'utf8',
      shellExecution: {
        terminalWidth: 80,
        terminalHeight: 24,
        showColor: false,
        pager: 'cat',
      },
      shouldUseNodePtyShell: false,
      maxSessionTurns: -1,
      sessionTokenLimit: -1,
      checkpointing: false,
      chatRecording: true,
      usageStatisticsEnabled: true,
      folderTrustFeature: false,
      folderTrust: false,
      outputFormat: 'text',
      inputFormat: 'text',
      includePartialMessages: false,
      truncateToolOutputThreshold: 25000,
      truncateToolOutputLines: 1000,
      enableToolOutputTruncation: true,
      accessibility: {
        enableLoadingPhrases: true,
        screenReader: false,
      },
      gitCoAuthor: {
        enabled: true,
        name: 'Ollama-Code',
        email: 'ollama-code@ollama.ai',
      },
      chatCompression: {
        contextPercentageThreshold: 80,
      },
      importFormat: 'tree',
      loadMemoryFromIncludeDirectories: false,
      skipLoopDetection: false,
      skipStartupContext: false,
      skipNextSpeakerCheck: true,
      lsp: {
        enabled: false,
      },
      listExtensions: false,
    };
  }

  /**
   * Add a configuration layer
   *
   * Layers are merged in priority order (higher priority wins).
   */
  addLayer(values: Partial<ConfigSchemaType>, source: ConfigSource, priority: number = 0): void {
    this.layers.push({ values, source, priority });
    this.layers.sort((a, b) => b.priority - a.priority);
    logger.debug('Added config layer', { source: source.kind, priority });
  }

  /**
   * Load configuration from all sources and merge
   */
  async load(): Promise<ConfigSchemaType> {
    logger.info('Loading configuration from all sources');

    // Load layers in order of increasing priority
    await this.loadDefaults();
    await this.loadUserSettings();
    await this.loadProjectSettings();
    this.loadEnvironment(process.env as Record<string, string | undefined>);

    // Merge all layers
    this.mergeLayers();

    // Validate final config
    const result = ConfigSchema.safeParse(this.config);
    if (!result.success) {
      logger.error('Configuration validation failed', undefined, {
        errors: result.error.issues,
      });
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    logger.info('Configuration loaded successfully', {
      fields: Object.keys(this.config).length,
    });

    return this.config;
  }

  /**
   * Load default values
   */
  private async loadDefaults(): Promise<void> {
    this.addLayer(this.getDefaults(this.targetDir), defaultSource('initial'), 0);
  }

  /**
   * Load user-level settings
   */
  private async loadUserSettings(): Promise<void> {
    if (!fs.existsSync(this.userConfigPath)) {
      logger.debug('User settings file not found', { path: this.userConfigPath });
      return;
    }

    try {
      const content = await fs.promises.readFile(this.userConfigPath, 'utf-8');
      const settings = JSON.parse(content);
      this.addLayer(settings, settingsSource('user'), 10);
      logger.debug('Loaded user settings', { path: this.userConfigPath });
    } catch (error) {
      logger.warn('Failed to load user settings', { error: String(error) });
    }
  }

  /**
   * Load project-level settings
   */
  private async loadProjectSettings(): Promise<void> {
    if (!fs.existsSync(this.configPath)) {
      logger.debug('Project config file not found', { path: this.configPath });
      return;
    }

    try {
      const content = await fs.promises.readFile(this.configPath, 'utf-8');
      const settings = JSON.parse(content);
      this.addLayer(settings, settingsSource('project'), 20);
      logger.debug('Loaded project settings', { path: this.configPath });
    } catch (error) {
      logger.warn('Failed to load project settings', { error: String(error) });
    }
  }

  /**
   * Load configuration from environment variables
   */
  loadEnvironment(env: Record<string, string | undefined>): void {
    const envMappings: Record<string, keyof ConfigSchemaType> = {
      OLLAMA_CODE_MODEL: 'model',
      OLLAMA_CODE_DEBUG: 'debugMode',
      OLLAMA_CODE_APPROVAL_MODE: 'approvalMode',
      OLLAMA_CODE_OUTPUT_FORMAT: 'outputFormat',
      OLLAMA_CODE_MAX_TURNS: 'maxSessionTurns',
      OLLAMA_CODE_TOKEN_LIMIT: 'sessionTokenLimit',
      OLLAMA_CODE_PROXY: 'proxy',
      OLLAMA_CODE_BASE_URL: 'contentGenerator',
      OLLAMA_CODE_API_KEY: 'contentGenerator',
      OLLAMA_CODE_TIMEOUT: 'contentGenerator',
      ANTHROPIC_API_KEY: 'contentGenerator',
      OPENAI_API_KEY: 'contentGenerator',
      GEMINI_API_KEY: 'contentGenerator',
    };

    const envValues: Partial<ConfigSchemaType> = {};
    const contentGeneratorValue: { baseUrl?: string; apiKey?: string; timeout?: number; model?: string } = {};

    for (const [envKey, configKey] of Object.entries(envMappings)) {
      const value = env[envKey];
      if (value !== undefined) {
        // Handle special cases
        if (configKey === 'debugMode') {
          (envValues as Record<string, unknown>)[configKey] = value === 'true' || value === '1';
        } else if (configKey === 'maxSessionTurns' || configKey === 'sessionTokenLimit') {
          (envValues as Record<string, unknown>)[configKey] = parseInt(value, 10);
        } else if (configKey === 'contentGenerator') {
          // Handle content generator specific env vars
          if (envKey.includes('BASE_URL')) {
            contentGeneratorValue.baseUrl = value;
          } else if (envKey.includes('API_KEY')) {
            contentGeneratorValue.apiKey = value;
          } else if (envKey.includes('TIMEOUT')) {
            contentGeneratorValue.timeout = parseInt(value, 10);
          }
        } else {
          (envValues as Record<string, unknown>)[configKey] = value;
        }
        this.sources[configKey] = { kind: 'env', envKey };
      }
    }

    // Set contentGenerator if any values were set
    if (Object.keys(contentGeneratorValue).length > 0) {
      envValues.contentGenerator = {
        model: contentGeneratorValue.model || '',
        ...contentGeneratorValue,
      };
    }

    if (Object.keys(envValues).length > 0) {
      this.addLayer(envValues, { kind: 'env' }, 30);
      logger.debug('Loaded environment config', { count: Object.keys(envValues).length });
    }
  }

  /**
   * Merge all layers into final configuration
   */
  private mergeLayers(): void {
    this.config = { ...this.getDefaults(this.targetDir) };
    this.sources = {};

    // Process layers in priority order (already sorted)
    for (const layer of this.layers) {
      for (const [key, value] of Object.entries(layer.values)) {
        if (value !== undefined) {
          // Deep merge for objects
          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            typeof (this.config as Record<string, unknown>)[key] === 'object'
          ) {
            (this.config as Record<string, unknown>)[key] = {
              ...((this.config as Record<string, unknown>)[key] as Record<string, unknown>),
              ...value,
            };
          } else {
            (this.config as Record<string, unknown>)[key] = value;
          }
          this.sources[key] = layer.source;
        }
      }
    }

    logger.debug('Merged configuration layers', { layerCount: this.layers.length });
  }

  /**
   * Get a configuration value
   */
  get<K extends keyof ConfigSchemaType>(key: K): ConfigSchemaType[K] {
    return this.config[key];
  }

  /**
   * Get a configuration value with its source
   */
  getWithSource<K extends keyof ConfigSchemaType>(
    key: K,
  ): { value: ConfigSchemaType[K]; source: ConfigSource } {
    return {
      value: this.config[key],
      source: this.sources[key] || defaultSource(),
    };
  }

  /**
   * Set a configuration value
   */
  set<K extends keyof ConfigSchemaType>(
    key: K,
    value: ConfigSchemaType[K],
    source: ConfigSource = { kind: 'programmatic' },
  ): void {
    this.config[key] = value;
    this.sources[key] = source;

    // Notify listeners
    for (const listener of this.changeListeners) {
      listener(key, value, source);
    }

    logger.debug('Config value set', { key, source: source.kind });
  }

  /**
   * Update multiple configuration values
   */
  update(values: Partial<ConfigSchemaType>, source: ConfigSource = { kind: 'programmatic' }): void {
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) {
        this.set(key as keyof ConfigSchemaType, value, source);
      }
    }
  }

  /**
   * Get the entire configuration object
   */
  getAll(): ConfigSchemaType {
    return { ...this.config };
  }

  /**
   * Get all sources
   */
  getSources(): ConfigSources {
    return { ...this.sources };
  }

  /**
   * Subscribe to configuration changes
   */
  onChange(
    listener: (key: string, value: unknown, source: ConfigSource) => void,
  ): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Validate a partial configuration
   */
  validatePartial(values: Partial<ConfigSchemaType>): ValidationResult {
    const result = ConfigSchema.partial().safeParse(values);
    if (result.success) {
      return { success: true };
    }
    return {
      success: false,
      errors: result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    };
  }

  /**
   * Save configuration to project settings
   */
  async saveProjectConfig(values: Partial<ConfigSchemaType>): Promise<void> {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    // Load existing config
    let existing: Partial<ConfigSchemaType> = {};
    if (fs.existsSync(this.configPath)) {
      const content = await fs.promises.readFile(this.configPath, 'utf-8');
      existing = JSON.parse(content);
    }

    // Merge and save
    const merged = { ...existing, ...values };
    await fs.promises.writeFile(this.configPath, JSON.stringify(merged, null, 2), 'utf-8');

    logger.info('Saved project config', { path: this.configPath });
  }

  /**
   * Save configuration to user settings
   */
  async saveUserConfig(values: Partial<ConfigSchemaType>): Promise<void> {
    const dir = path.dirname(this.userConfigPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    // Load existing config
    let existing: Partial<ConfigSchemaType> = {};
    if (fs.existsSync(this.userConfigPath)) {
      const content = await fs.promises.readFile(this.userConfigPath, 'utf-8');
      existing = JSON.parse(content);
    }

    // Merge and save
    const merged = { ...existing, ...values };
    await fs.promises.writeFile(this.userConfigPath, JSON.stringify(merged, null, 2), 'utf-8');

    logger.info('Saved user config', { path: this.userConfigPath });
  }

  /**
   * Get configuration schema metadata
   */
  static getSchemaMeta(): ConfigFieldMeta[] {
    return [
      { key: 'model', description: 'AI model to use', envKey: 'OLLAMA_CODE_MODEL', cliFlag: '--model' },
      { key: 'debugMode', description: 'Enable debug logging', envKey: 'OLLAMA_CODE_DEBUG', cliFlag: '--debug' },
      { key: 'approvalMode', description: 'Approval mode for tool execution', cliFlag: '--approval-mode' },
      { key: 'outputFormat', description: 'Output format', envKey: 'OLLAMA_CODE_OUTPUT_FORMAT', cliFlag: '--output' },
      { key: 'maxSessionTurns', description: 'Maximum turns per session', envKey: 'OLLAMA_CODE_MAX_TURNS', cliFlag: '--max-turns' },
      { key: 'sessionTokenLimit', description: 'Token limit per session', envKey: 'OLLAMA_CODE_TOKEN_LIMIT', cliFlag: '--token-limit' },
      { key: 'proxy', description: 'HTTP proxy URL', envKey: 'OLLAMA_CODE_PROXY', cliFlag: '--proxy' },
      { key: 'cwd', description: 'Current working directory', cliFlag: '--cwd' },
      { key: 'targetDir', description: 'Target project directory', cliFlag: '--target-dir' },
      { key: 'checkpointing', description: 'Enable git checkpointing', cliFlag: '--checkpointing' },
      { key: 'chatRecording', description: 'Record chat history', cliFlag: '--chat-recording' },
      { key: 'interactive', description: 'Interactive mode', cliFlag: '--interactive' },
      { key: 'sdkMode', description: 'SDK mode', cliFlag: '--sdk-mode' },
      { key: 'ideMode', description: 'IDE integration mode', cliFlag: '--ide-mode' },
    ];
  }

  /**
   * Create a config schema service with CLI arguments
   */
  static fromCLI(
    argv: Record<string, unknown>,
    targetDir: string,
  ): ConfigSchemaService {
    const service = new ConfigSchemaService(targetDir);

    // Convert CLI args to config format
    const cliValues: Partial<ConfigSchemaType> = {};

    if (argv['model']) cliValues.model = argv['model'] as string;
    if (argv['debug']) cliValues.debugMode = true;
    if (argv['approval-mode']) cliValues.approvalMode = argv['approval-mode'] as z.infer<typeof ApprovalModeSchema>;
    if (argv['output']) cliValues.outputFormat = argv['output'] as z.infer<typeof OutputFormatSchema>;
    if (argv['max-turns']) cliValues.maxSessionTurns = argv['max-turns'] as number;
    if (argv['token-limit']) cliValues.sessionTokenLimit = argv['token-limit'] as number;
    if (argv['proxy']) cliValues.proxy = argv['proxy'] as string;
    if (argv['cwd']) cliValues.cwd = argv['cwd'] as string;
    if (argv['checkpointing']) cliValues.checkpointing = true;
    if (argv['chat-recording'] === false) cliValues.chatRecording = false;
    if (argv['interactive'] === false) cliValues.interactive = false;
    if (argv['sdk-mode']) cliValues.sdkMode = true;
    if (argv['ide-mode']) cliValues.ideMode = true;

    // Add CLI layer with highest priority
    if (Object.keys(cliValues).length > 0) {
      service.addLayer(cliValues, cliSource('argv'), 50);
    }

    return service;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let configSchemaService: ConfigSchemaService | null = null;

/**
 * Get the global config schema service instance
 */
export function getConfigSchemaService(targetDir?: string): ConfigSchemaService {
  if (!configSchemaService && targetDir) {
    configSchemaService = new ConfigSchemaService(targetDir);
  }
  if (!configSchemaService) {
    throw new Error('ConfigSchemaService not initialized. Call getConfigSchemaService with targetDir first.');
  }
  return configSchemaService;
}

/**
 * Initialize the global config schema service
 */
export async function initConfigSchemaService(targetDir: string): Promise<ConfigSchemaService> {
  configSchemaService = new ConfigSchemaService(targetDir);
  await configSchemaService.load();
  return configSchemaService;
}

/**
 * Reset the global instance (for testing)
 */
export function resetConfigSchemaService(): void {
  configSchemaService = null;
}
