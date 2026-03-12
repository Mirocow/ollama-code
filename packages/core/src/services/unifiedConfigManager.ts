/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified Configuration Manager Service
 *
 * Provides centralized configuration management with:
 * - Priority-based configuration merging
 * - Schema validation
 * - Change notifications
 * - Environment variable resolution
 * - Configuration persistence
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir, platform } from 'node:os';
import process from 'node:process';
import * as dotenv from 'dotenv';
import { createLogger, type StructuredLogger } from './structuredLogger.js';
import { OLLAMA_DIR } from '../utils/paths.js';
import { Storage } from '../config/storage.js';

/**
 * Configuration scope - determines where config is stored/loaded from
 */
export type ConfigScope = 'system' | 'user' | 'project' | 'runtime';

/**
 * Configuration priority (higher number = higher priority)
 */
export const ConfigPriority = {
  DEFAULT: 0,
  SYSTEM: 1,
  USER: 2,
  PROJECT: 3,
  ENVIRONMENT: 4,
  CLI: 5,
  RUNTIME: 6,
} as const;

/**
 * Configuration change event
 */
export interface ConfigChangeEvent<T = unknown> {
  /** Key that changed (dot-notation) */
  key: string;

  /** Old value */
  oldValue: T | undefined;

  /** New value */
  newValue: T | undefined;

  /** Source of the change */
  source: ConfigScope;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Configuration listener function
 */
export type ConfigChangeListener = (event: ConfigChangeEvent) => void;

/**
 * Configuration source metadata
 */
export interface ConfigSource {
  /** Where the value came from */
  scope: ConfigScope;

  /** File path if applicable */
  filePath?: string;

  /** Environment variable name if applicable */
  envVar?: string;

  /** CLI argument name if applicable */
  cliArg?: string;
}

/**
 * Configuration value with source information
 */
export interface ConfigValue<T = unknown> {
  /** The configuration value */
  value: T;

  /** Source of the value */
  source: ConfigSource;

  /** Whether the value is from a secure source (env var, etc.) */
  isSecure?: boolean;
}

/**
 * Configuration schema field definition
 */
export interface ConfigSchemaField {
  /** Field type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';

  /** Default value */
  default?: unknown;

  /** Whether the field is required */
  required?: boolean;

  /** Validation function */
  validate?: (value: unknown) => boolean | string;

  /** Transform function for value conversion */
  transform?: (value: unknown) => unknown;

  /** Environment variable mapping */
  envVar?: string | string[];

  /** CLI argument mapping */
  cliArg?: string | string[];

  /** Description for documentation */
  description?: string;

  /** Whether the value should be redacted in logs */
  sensitive?: boolean;
}

/**
 * Configuration schema
 */
export type ConfigSchema = Record<string, ConfigSchemaField>;

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
  /** Project root directory */
  projectRoot?: string;

  /** Custom schema */
  schema?: ConfigSchema;

  /** Whether to load environment variables */
  loadEnv?: boolean;

  /** Whether to watch for file changes */
  watchFiles?: boolean;

  /** Custom system config path */
  systemConfigPath?: string;

  /** Custom user config path */
  userConfigPath?: string;
}

/**
 * Unified Configuration Manager
 *
 * Centralizes all configuration management.
 */
export class ConfigManager {
  private readonly logger: StructuredLogger;
  private readonly options: ConfigManagerOptions;
  private readonly schema: ConfigSchema;
  private readonly listeners: Set<ConfigChangeListener> = new Set();
  private readonly sources: Map<string, ConfigSource> = new Map();

  private systemConfig: Record<string, unknown> = {};
  private userConfig: Record<string, unknown> = {};
  private projectConfig: Record<string, unknown> = {};
  private envConfig: Record<string, unknown> = {};
  private cliConfig: Record<string, unknown> = {};
  private runtimeConfig: Record<string, unknown> = {};
  private defaults: Record<string, unknown> = {};

  private mergedConfig: Record<string, unknown> = {};
  private initialized = false;

  constructor(options: ConfigManagerOptions = {}) {
    this.options = {
      projectRoot: process.cwd(),
      loadEnv: true,
      watchFiles: false,
      ...options,
    };
    this.logger = createLogger('CONFIG_MANAGER');
    this.schema = options.schema || this.getDefaultSchema();
  }

  /**
   * Initializes the configuration manager.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('ConfigManager already initialized');
      return;
    }

    this.logger.info('Initializing ConfigManager...');

    this.loadDefaults();
    await this.loadSystemConfig();
    await this.loadUserConfig();
    await this.loadProjectConfig();

    if (this.options.loadEnv) {
      this.loadEnvironmentConfig();
    }

    this.mergeConfigurations();

    this.initialized = true;
    this.logger.info('ConfigManager initialized', {
      keysCount: Object.keys(this.mergedConfig).length,
    });
  }

  /**
   * Gets a configuration value.
   */
  get<T = unknown>(key: string, defaultValue?: T): T {
    this.ensureInitialized();
    const value = this.getNestedValue(this.mergedConfig, key);
    return (value as T) ?? (defaultValue as T);
  }

  /**
   * Gets a configuration value with source information.
   */
  getWithSource<T = unknown>(key: string): ConfigValue<T> | undefined {
    this.ensureInitialized();
    const value = this.getNestedValue(this.mergedConfig, key);
    const source = this.sources.get(key) || { scope: 'runtime' as const };

    if (value === undefined) {
      return undefined;
    }

    return {
      value: value as T,
      source,
      isSecure: this.isSensitiveKey(key),
    };
  }

  /**
   * Sets a configuration value at runtime.
   */
  set<T>(key: string, value: T): void {
    this.ensureInitialized();

    const oldValue = this.getNestedValue(this.mergedConfig, key);
    this.setNestedValue(this.runtimeConfig, key, value);
    this.mergeConfigurations();

    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      source: 'runtime',
      timestamp: new Date(),
    });

    this.logger.debug(`Configuration updated: ${key}`, {
      source: 'runtime',
      sensitive: this.isSensitiveKey(key),
    });
  }

  /**
   * Sets a CLI configuration value.
   */
  setCli<T>(key: string, value: T): void {
    this.setNestedValue(this.cliConfig, key, value);
    if (this.initialized) {
      this.mergeConfigurations();
    }
  }

  /**
   * Sets multiple CLI configuration values at once.
   */
  setCliMany(config: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(config)) {
      this.setNestedValue(this.cliConfig, key, value);
    }
    if (this.initialized) {
      this.mergeConfigurations();
    }
  }

  /**
   * Persists a configuration value to a specific scope.
   */
  async persist<T>(
    key: string,
    value: T,
    scope: 'user' | 'project',
  ): Promise<void> {
    this.ensureInitialized();

    const configPath = this.getConfigPath(scope);
    const config = await this.loadConfigFile(configPath);

    this.setNestedValue(config, key, value);

    await this.saveConfigFile(configPath, config);

    if (scope === 'user') {
      this.setNestedValue(this.userConfig, key, value);
    } else {
      this.setNestedValue(this.projectConfig, key, value);
    }

    const oldValue = this.getNestedValue(this.mergedConfig, key);
    this.mergeConfigurations();

    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      source: scope,
      timestamp: new Date(),
    });

    this.logger.info(`Configuration persisted: ${key}`, { scope });
  }

  /**
   * Gets the entire merged configuration.
   */
  getAll(): Record<string, unknown> {
    this.ensureInitialized();
    return { ...this.mergedConfig };
  }

  /**
   * Gets configuration for a specific scope.
   */
  getScope(scope: ConfigScope): Record<string, unknown> {
    switch (scope) {
      case 'system':
        return { ...this.systemConfig };
      case 'user':
        return { ...this.userConfig };
      case 'project':
        return { ...this.projectConfig };
      case 'runtime':
        return { ...this.runtimeConfig };
      default:
        return {};
    }
  }

  /**
   * Adds a configuration change listener.
   */
  onChange(listener: ConfigChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Validates a configuration value against the schema.
   */
  validate(
    key: string,
    value: unknown,
  ): { valid: boolean; errors: string[] } {
    const field = this.schema[key];
    if (!field) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];

    if (!this.checkType(value, field.type)) {
      errors.push(`Expected type "${field.type}" but got "${typeof value}"`);
    }

    if (field.validate) {
      const result = field.validate(value);
      if (result !== true) {
        errors.push(
          typeof result === 'string' ? result : 'Validation failed',
        );
      }
    }

    if (field.required && (value === undefined || value === null)) {
      errors.push('Value is required');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Reloads all configuration from disk.
   */
  async reload(): Promise<void> {
    this.logger.info('Reloading configuration...');

    await this.loadSystemConfig();
    await this.loadUserConfig();
    await this.loadProjectConfig();

    if (this.options.loadEnv) {
      this.loadEnvironmentConfig();
    }

    this.mergeConfigurations();

    this.notifyListeners({
      key: '*',
      oldValue: undefined,
      newValue: undefined,
      source: 'system',
      timestamp: new Date(),
    });
  }

  // Private methods

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'ConfigManager not initialized. Call initialize() first.',
      );
    }
  }

  private loadDefaults(): void {
    for (const [key, field] of Object.entries(this.schema)) {
      if (field.default !== undefined) {
        this.defaults[key] = field.default;
      }
    }
    this.logger.debug('Loaded defaults', {
      count: Object.keys(this.defaults).length,
    });
  }

  private async loadSystemConfig(): Promise<void> {
    const configPath =
      this.options.systemConfigPath || this.getSystemConfigPath();
    this.systemConfig = await this.loadConfigFile(configPath);
    this.logger.debug('Loaded system config', { path: configPath });
  }

  private async loadUserConfig(): Promise<void> {
    const configPath =
      this.options.userConfigPath || Storage.getGlobalSettingsPath();
    this.userConfig = await this.loadConfigFile(configPath);
    this.logger.debug('Loaded user config', { path: configPath });
  }

  private async loadProjectConfig(): Promise<void> {
    if (!this.options.projectRoot) return;

    const configPath = path.join(
      this.options.projectRoot,
      OLLAMA_DIR,
      'settings.json',
    );

    const projectRoot = path.resolve(this.options.projectRoot);
    const homeDir = homedir();
    if (projectRoot === path.resolve(homeDir)) {
      this.logger.debug(
        'Skipping project config: project root is home directory',
      );
      return;
    }

    this.projectConfig = await this.loadConfigFile(configPath);
    this.logger.debug('Loaded project config', { path: configPath });
  }

  private loadEnvironmentConfig(): void {
    const envFilePath = this.findEnvFile();
    if (envFilePath) {
      try {
        const content = fs.readFileSync(envFilePath, 'utf-8');
        const parsed = dotenv.parse(content);

        for (const [key, field] of Object.entries(this.schema)) {
          if (field.envVar) {
            const envVars = Array.isArray(field.envVar)
              ? field.envVar
              : [field.envVar];

            for (const envVar of envVars) {
              if (parsed[envVar] || process.env[envVar]) {
                let value = parsed[envVar] || process.env[envVar];

                if (field.transform) {
                  value = field.transform(value);
                } else {
                  value = this.convertValue(value as string, field.type);
                }

                this.envConfig[key] = value;
                this.sources.set(key, {
                  scope: 'runtime',
                  envVar,
                });
                break;
              }
            }
          }
        }

        this.logger.debug('Loaded environment config', {
          keys: Object.keys(this.envConfig),
        });
      } catch (error) {
        this.logger.warn('Failed to load .env file', { error });
      }
    }
  }

  private mergeConfigurations(): void {
    this.mergedConfig = this.deepMerge(
      this.defaults,
      this.systemConfig,
      this.userConfig,
      this.projectConfig,
      this.envConfig,
      this.cliConfig,
      this.runtimeConfig,
    );

    this.updateSources();
  }

  private updateSources(): void {
    this.trackSources(this.defaults, 'system');
    this.trackSources(this.systemConfig, 'system');
    this.trackSources(this.userConfig, 'user');
    this.trackSources(this.projectConfig, 'project');
    this.trackSources(this.envConfig, 'runtime');
    this.trackSources(this.cliConfig, 'runtime');
    this.trackSources(this.runtimeConfig, 'runtime');
  }

  private trackSources(
    config: Record<string, unknown>,
    scope: ConfigScope,
  ): void {
    const traverse = (
      obj: Record<string, unknown>,
      prefix = '',
    ): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value !== undefined && value !== null) {
          this.sources.set(fullKey, { scope });

          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
          ) {
            traverse(value as Record<string, unknown>, fullKey);
          }
        }
      }
    };

    traverse(config);
  }

  private deepMerge(
    ...objects: Record<string, unknown>[]
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const obj of objects) {
      for (const [key, value] of Object.entries(obj)) {
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          result[key] &&
          typeof result[key] === 'object'
        ) {
          result[key] = this.deepMerge(
            result[key] as Record<string, unknown>,
            value as Record<string, unknown>,
          );
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  private getNestedValue(
    obj: Record<string, unknown>,
    key: string,
  ): unknown {
    const keys = key.split('.');
    let current: unknown = obj;

    for (const k of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[k];
    }

    return current;
  }

  private setNestedValue(
    obj: Record<string, unknown>,
    key: string,
    value: unknown,
  ): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;

    let current: Record<string, unknown> = obj;
    for (const k of keys) {
      if (typeof current[k] !== 'object' || current[k] === null) {
        current[k] = {};
      }
      current = current[k] as Record<string, unknown>;
    }

    current[lastKey] = value;
  }

  private async loadConfigFile(
    filePath: string,
  ): Promise<Record<string, unknown>> {
    try {
      if (!fs.existsSync(filePath)) {
        return {};
      }

      const content = await fs.promises.readFile(filePath, 'utf-8');
      const cleaned = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.warn(`Failed to load config file: ${filePath}`, { error });
      return {};
    }
  }

  private async saveConfigFile(
    filePath: string,
    config: Record<string, unknown>,
  ): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(config, null, 2),
      'utf-8',
    );
  }

  private getSystemConfigPath(): string {
    if (process.env['OLLAMA_CODE_SYSTEM_CONFIG_PATH']) {
      return process.env['OLLAMA_CODE_SYSTEM_CONFIG_PATH'];
    }

    if (platform() === 'darwin') {
      return '/Library/Application Support/OllamaCode/settings.json';
    } else if (platform() === 'win32') {
      return 'C:\\ProgramData\\ollama-code\\settings.json';
    } else {
      return '/etc/ollama-code/settings.json';
    }
  }

  private getConfigPath(scope: 'user' | 'project'): string {
    if (scope === 'user') {
      return Storage.getGlobalSettingsPath();
    }
    return path.join(
      this.options.projectRoot || process.cwd(),
      OLLAMA_DIR,
      'settings.json',
    );
  }

  private findEnvFile(): string | null {
    const homeDir = homedir();
    const projectRoot = this.options.projectRoot || process.cwd();

    const projectEnv = path.join(projectRoot, '.env');
    if (fs.existsSync(projectEnv)) {
      return projectEnv;
    }

    const projectOllamaEnv = path.join(projectRoot, OLLAMA_DIR, '.env');
    if (fs.existsSync(projectOllamaEnv)) {
      return projectOllamaEnv;
    }

    const userEnv = path.join(homeDir, '.env');
    if (fs.existsSync(userEnv)) {
      return userEnv;
    }

    const userOllamaEnv = path.join(homeDir, OLLAMA_DIR, '.env');
    if (fs.existsSync(userOllamaEnv)) {
      return userOllamaEnv;
    }

    return null;
  }

  private checkType(value: unknown, type: string): boolean {
    if (value === undefined || value === null) {
      return true;
    }

    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value as number);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  private convertValue(value: string, type: string): unknown {
    switch (type) {
      case 'number': {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      }
      case 'boolean':
        return value === 'true' || value === '1';
      case 'object':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case 'array':
        try {
          return JSON.parse(value);
        } catch {
          return value.split(',').map((s) => s.trim());
        }
      default:
        return value;
    }
  }

  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      'password',
      'secret',
      'token',
      'key',
      'credential',
      'auth',
    ];

    const lowerKey = key.toLowerCase();
    return sensitivePatterns.some((pattern) => lowerKey.includes(pattern));
  }

  private notifyListeners(event: ConfigChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger.warn('Config change listener threw an error', { error });
      }
    }
  }

  private getDefaultSchema(): ConfigSchema {
    return {
      'model.name': {
        type: 'string',
        envVar: 'OLLAMA_MODEL',
        cliArg: 'model',
        description: 'Default model to use',
      },
      'model.temperature': {
        type: 'number',
        default: 0.7,
        description: 'Model temperature for generation',
      },
      'tools.sandbox.enabled': {
        type: 'boolean',
        default: false,
        envVar: 'OLLAMA_SANDBOX',
        description: 'Enable sandbox mode for tool execution',
      },
      'context.fileName': {
        type: 'string',
        default: 'OLLAMA.md',
        description: 'Name of the context file',
      },
      'logging.level': {
        type: 'string',
        default: 'info',
        envVar: 'OLLAMA_LOG_LEVEL',
        description: 'Logging level',
      },
      'logging.format': {
        type: 'string',
        default: 'text',
        description: 'Log output format',
      },
      'ui.theme': {
        type: 'string',
        default: 'default',
        description: 'UI theme name',
      },
      'security.folderTrust.enabled': {
        type: 'boolean',
        default: false,
        description: 'Enable folder trust checks',
      },
    };
  }
}

// Singleton instance
let configManagerInstance: ConfigManager | null = null;

/**
 * Gets the singleton ConfigManager instance.
 */
export function getConfigManager(): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager();
  }
  return configManagerInstance;
}

/**
 * Initializes the global ConfigManager.
 */
export async function initializeConfigManager(
  options?: ConfigManagerOptions,
): Promise<ConfigManager> {
  if (configManagerInstance) {
    return configManagerInstance;
  }

  configManagerInstance = new ConfigManager(options);
  await configManagerInstance.initialize();
  return configManagerInstance;
}

/**
 * Resets the ConfigManager singleton (useful for testing).
 */
export function resetConfigManager(): void {
  configManagerInstance = null;
}
