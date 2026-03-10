/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plugin Configuration System
 * 
 * Manages plugin enable/disable state, user preferences, and configuration.
 * Configuration is stored in .ollama-code/plugins.json in the project root
 * or ~/.ollama-code/plugins.json for user-level settings.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('PLUGIN_CONFIG');

/**
 * Plugin configuration entry
 */
export interface PluginConfigEntry {
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Plugin-specific configuration */
  config?: Record<string, unknown>;
  /** Last modified timestamp */
  modifiedAt?: string;
}

/**
 * Plugin configuration file structure
 */
export interface PluginConfigFile {
  /** Configuration version */
  version: string;
  /** Plugin configurations */
  plugins: Record<string, PluginConfigEntry>;
  /** Global plugin settings */
  settings: {
    /** Auto-discover external plugins */
    autoDiscover: boolean;
    /** Enable plugins by default */
    enableByDefault: boolean;
    /** Plugin discovery paths */
    discoveryPaths: string[];
  };
}

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG: PluginConfigFile = {
  version: '1.0.0',
  plugins: {},
  settings: {
    autoDiscover: true,
    enableByDefault: true,
    discoveryPaths: [],
  },
};

/**
 * Plugin Configuration Manager
 */
export class PluginConfig {
  private config: PluginConfigFile;
  private configPath: string;
  private projectConfigPath: string | null = null;

  constructor(projectRoot?: string) {
    // User-level config path
    const userConfigDir = path.join(os.homedir(), '.ollama-code');
    this.configPath = path.join(userConfigDir, 'plugins.json');

    // Project-level config path
    if (projectRoot) {
      this.projectConfigPath = path.join(projectRoot, '.ollama-code', 'plugins.json');
    }

    // Load configuration
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from file(s)
   */
  private loadConfig(): PluginConfigFile {
    let config = { ...DEFAULT_CONFIG };

    // Load user-level config
    if (fs.existsSync(this.configPath)) {
      try {
        const content = fs.readFileSync(this.configPath, 'utf8');
        const userConfig = JSON.parse(content) as PluginConfigFile;
        config = this.mergeConfigs(config, userConfig);
        debugLogger.info(`Loaded user config from ${this.configPath}`);
      } catch (error) {
        debugLogger.warn(`Failed to load user config: ${error}`);
      }
    }

    // Load project-level config (overrides user config)
    if (this.projectConfigPath && fs.existsSync(this.projectConfigPath)) {
      try {
        const content = fs.readFileSync(this.projectConfigPath, 'utf8');
        const projectConfig = JSON.parse(content) as PluginConfigFile;
        config = this.mergeConfigs(config, projectConfig);
        debugLogger.info(`Loaded project config from ${this.projectConfigPath}`);
      } catch (error) {
        debugLogger.warn(`Failed to load project config: ${error}`);
      }
    }

    return config;
  }

  /**
   * Merge two configurations
   */
  private mergeConfigs(base: PluginConfigFile, override: PluginConfigFile): PluginConfigFile {
    return {
      version: override.version || base.version,
      plugins: {
        ...base.plugins,
        ...override.plugins,
      },
      settings: {
        ...base.settings,
        ...override.settings,
      },
    };
  }

  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    try {
      // Ensure directory exists
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Write config
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf8'
      );
      debugLogger.info(`Saved config to ${this.configPath}`);
    } catch (error) {
      debugLogger.error(`Failed to save config: ${error}`);
    }
  }

  /**
   * Check if a plugin is enabled
   */
  isEnabled(pluginId: string, defaultEnabled: boolean = true): boolean {
    if (pluginId in this.config.plugins) {
      return this.config.plugins[pluginId].enabled;
    }
    return defaultEnabled ? this.config.settings.enableByDefault : false;
  }

  /**
   * Enable a plugin
   */
  enablePlugin(pluginId: string): void {
    this.config.plugins[pluginId] = {
      enabled: true,
      modifiedAt: new Date().toISOString(),
    };
    this.saveConfig();
    debugLogger.info(`Enabled plugin: ${pluginId}`);
  }

  /**
   * Disable a plugin
   */
  disablePlugin(pluginId: string): void {
    this.config.plugins[pluginId] = {
      enabled: false,
      modifiedAt: new Date().toISOString(),
    };
    this.saveConfig();
    debugLogger.info(`Disabled plugin: ${pluginId}`);
  }

  /**
   * Get plugin configuration
   */
  getPluginConfig(pluginId: string): PluginConfigEntry | undefined {
    return this.config.plugins[pluginId];
  }

  /**
   * Set plugin configuration
   */
  setPluginConfig(pluginId: string, config: PluginConfigEntry): void {
    this.config.plugins[pluginId] = {
      ...config,
      modifiedAt: new Date().toISOString(),
    };
    this.saveConfig();
    debugLogger.info(`Updated config for plugin: ${pluginId}`);
  }

  /**
   * Get plugin-specific configuration value
   */
  getPluginSetting<T = unknown>(pluginId: string, key: string, defaultValue?: T): T | undefined {
    const pluginConfig = this.config.plugins[pluginId];
    if (pluginConfig?.config && key in pluginConfig.config) {
      return pluginConfig.config[key] as T;
    }
    return defaultValue;
  }

  /**
   * Set plugin-specific configuration value
   */
  setPluginSetting(pluginId: string, key: string, value: unknown): void {
    if (!this.config.plugins[pluginId]) {
      this.config.plugins[pluginId] = {
        enabled: true,
        config: {},
      };
    }
    if (!this.config.plugins[pluginId].config) {
      this.config.plugins[pluginId].config = {};
    }
    this.config.plugins[pluginId].config![key] = value;
    this.config.plugins[pluginId].modifiedAt = new Date().toISOString();
    this.saveConfig();
    debugLogger.info(`Set setting ${key} for plugin ${pluginId}`);
  }

  /**
   * Get all enabled plugins
   */
  getEnabledPlugins(): string[] {
    return Object.entries(this.config.plugins)
      .filter(([, config]) => config.enabled)
      .map(([id]) => id);
  }

  /**
   * Get all disabled plugins
   */
  getDisabledPlugins(): string[] {
    return Object.entries(this.config.plugins)
      .filter(([, config]) => !config.enabled)
      .map(([id]) => id);
  }

  /**
   * Get global settings
   */
  getSettings(): PluginConfigFile['settings'] {
    return { ...this.config.settings };
  }

  /**
   * Update global settings
   */
  updateSettings(settings: Partial<PluginConfigFile['settings']>): void {
    this.config.settings = {
      ...this.config.settings,
      ...settings,
    };
    this.saveConfig();
    debugLogger.info('Updated global settings');
  }

  /**
   * Add discovery path
   */
  addDiscoveryPath(discoveryPath: string): void {
    if (!this.config.settings.discoveryPaths.includes(discoveryPath)) {
      this.config.settings.discoveryPaths.push(discoveryPath);
      this.saveConfig();
      debugLogger.info(`Added discovery path: ${discoveryPath}`);
    }
  }

  /**
   * Remove discovery path
   */
  removeDiscoveryPath(discoveryPath: string): void {
    const index = this.config.settings.discoveryPaths.indexOf(discoveryPath);
    if (index !== -1) {
      this.config.settings.discoveryPaths.splice(index, 1);
      this.saveConfig();
      debugLogger.info(`Removed discovery path: ${discoveryPath}`);
    }
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
    debugLogger.info('Reset configuration to defaults');
  }

  /**
   * Export configuration as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  fromJSON(json: string): void {
    try {
      const config = JSON.parse(json) as PluginConfigFile;
      this.config = this.mergeConfigs(DEFAULT_CONFIG, config);
      this.saveConfig();
      debugLogger.info('Imported configuration from JSON');
    } catch (error) {
      debugLogger.error(`Failed to import config: ${error}`);
      throw new Error('Invalid configuration JSON');
    }
  }
}

/**
 * Create a plugin config instance
 */
export function createPluginConfig(projectRoot?: string): PluginConfig {
  return new PluginConfig(projectRoot);
}
