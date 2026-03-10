/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Keyboard Shortcuts Configuration Service
 *
 * Allows users to customize keyboard shortcuts via:
 * - ~/.ollama-code/keybindings.json - global configuration
 * - .ollama-code/keybindings.json - project configuration
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('KEYBINDINGS');

/**
 * Key binding definition
 */
export interface KeyBindingDefinition {
  /** The key name (e.g., 'a', 'return', 'tab', 'escape') */
  key?: string;
  /** The key sequence (e.g., '\x18' for Ctrl+X) */
  sequence?: string;
  /** Control key requirement */
  ctrl?: boolean;
  /** Shift key requirement */
  shift?: boolean;
  /** Command/meta key requirement */
  command?: boolean;
  /** Meta key requirement (alias for command) */
  meta?: boolean;
  /** Paste operation requirement */
  paste?: boolean;
}

/**
 * User keybindings configuration
 */
export interface UserKeyBindingsConfig {
  /** Version of the config format */
  version?: number;
  /** Custom keybindings - key is command name, value is array of bindings */
  bindings?: Record<string, KeyBindingDefinition[]>;
  /** Description/comments for the config */
  description?: string;
}

/**
 * Available command info for help display
 */
export interface CommandInfo {
  name: string;
  description: string;
  category: string;
  defaultBinding: string;
}

/**
 * All available commands with their descriptions
 */
export const AVAILABLE_COMMANDS: CommandInfo[] = [
  // Basic
  {
    name: 'return',
    description: 'Submit input',
    category: 'Basic',
    defaultBinding: 'Enter',
  },
  {
    name: 'escape',
    description: 'Cancel/Close',
    category: 'Basic',
    defaultBinding: 'Esc',
  },

  // Cursor
  {
    name: 'home',
    description: 'Go to start of line',
    category: 'Cursor',
    defaultBinding: 'Ctrl+A',
  },
  {
    name: 'end',
    description: 'Go to end of line',
    category: 'Cursor',
    defaultBinding: 'Ctrl+E',
  },

  // Editing
  {
    name: 'killLineRight',
    description: 'Delete from cursor to end',
    category: 'Editing',
    defaultBinding: 'Ctrl+K',
  },
  {
    name: 'killLineLeft',
    description: 'Delete from start to cursor',
    category: 'Editing',
    defaultBinding: 'Ctrl+U',
  },
  {
    name: 'clearInput',
    description: 'Clear input',
    category: 'Editing',
    defaultBinding: 'Ctrl+C',
  },
  {
    name: 'deleteWordBackward',
    description: 'Delete word backward',
    category: 'Editing',
    defaultBinding: 'Ctrl+Backspace',
  },
  {
    name: 'newline',
    description: 'Insert newline',
    category: 'Editing',
    defaultBinding: 'Ctrl+J / Shift+Enter',
  },

  // Navigation
  {
    name: 'historyUp',
    description: 'Previous history item',
    category: 'Navigation',
    defaultBinding: 'Ctrl+P / ↑',
  },
  {
    name: 'historyDown',
    description: 'Next history item',
    category: 'Navigation',
    defaultBinding: 'Ctrl+N / ↓',
  },

  // Screen
  {
    name: 'clearScreen',
    description: 'Clear terminal',
    category: 'Screen',
    defaultBinding: 'Ctrl+L',
  },
  {
    name: 'showMoreLines',
    description: 'Show more output lines',
    category: 'Screen',
    defaultBinding: 'Ctrl+S',
  },

  // Tools
  {
    name: 'openExternalEditor',
    description: 'Open in external editor',
    category: 'Tools',
    defaultBinding: 'Ctrl+X',
  },
  {
    name: 'pasteClipboardImage',
    description: 'Paste image from clipboard',
    category: 'Tools',
    defaultBinding: 'Ctrl+V',
  },
  {
    name: 'reverseSearch',
    description: 'Search command history',
    category: 'Tools',
    defaultBinding: 'Ctrl+R',
  },

  // Session
  {
    name: 'saveSession',
    description: 'Save current session',
    category: 'Session',
    defaultBinding: 'Ctrl+Shift+S',
  },
  {
    name: 'showSessions',
    description: 'List saved sessions',
    category: 'Session',
    defaultBinding: 'Ctrl+O',
  },

  // Model
  {
    name: 'switchModel',
    description: 'Switch AI model',
    category: 'Model',
    defaultBinding: 'Ctrl+M',
  },
  {
    name: 'reloadModel',
    description: 'Reload current model',
    category: 'Model',
    defaultBinding: 'Ctrl+Shift+R',
  },

  // Help
  {
    name: 'showHelp',
    description: 'Show help',
    category: 'Help',
    defaultBinding: 'Ctrl+H',
  },
  {
    name: 'showShortcuts',
    description: 'Show keyboard shortcuts',
    category: 'Help',
    defaultBinding: 'Shift+?',
  },

  // Undo/Redo
  {
    name: 'undo',
    description: 'Undo last action',
    category: 'History',
    defaultBinding: 'Ctrl+Z',
  },
  {
    name: 'redo',
    description: 'Redo last action',
    category: 'History',
    defaultBinding: 'Ctrl+Y / Ctrl+Shift+Z',
  },

  // App
  {
    name: 'quit',
    description: 'Quit application',
    category: 'App',
    defaultBinding: 'Ctrl+C',
  },
  {
    name: 'exit',
    description: 'Exit application',
    category: 'App',
    defaultBinding: 'Ctrl+D',
  },
];

/**
 * Category display order
 */
export const CATEGORY_ORDER = [
  'Basic',
  'Cursor',
  'Editing',
  'Navigation',
  'Screen',
  'Tools',
  'Session',
  'Model',
  'Help',
  'History',
  'App',
];

/**
 * Default key bindings for commands
 */
export const DEFAULT_BINDINGS: Record<string, string> = {
  return: 'Enter',
  escape: 'Esc',
  home: 'Ctrl+A',
  end: 'Ctrl+E',
  killLineRight: 'Ctrl+K',
  killLineLeft: 'Ctrl+U',
  clearInput: 'Ctrl+C',
  deleteWordBackward: 'Ctrl+Backspace',
  newline: 'Ctrl+J / Shift+Enter',
  historyUp: 'Ctrl+P / ↑',
  historyDown: 'Ctrl+N / ↓',
  clearScreen: 'Ctrl+L',
  showMoreLines: 'Ctrl+S',
  openExternalEditor: 'Ctrl+X',
  pasteClipboardImage: 'Ctrl+V',
  reverseSearch: 'Ctrl+R',
  saveSession: 'Ctrl+Shift+S',
  showSessions: 'Ctrl+O',
  switchModel: 'Ctrl+M',
  reloadModel: 'Ctrl+Shift+R',
  showHelp: 'Ctrl+H',
  showShortcuts: 'Shift+?',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y / Ctrl+Shift+Z',
  quit: 'Ctrl+C',
  exit: 'Ctrl+D',
};

/**
 * KeyBindings Service
 */
export class KeyBindingsService {
  private static instance: KeyBindingsService;
  private globalConfigPath: string;
  private projectConfigPath: string | null = null;
  private userConfig: UserKeyBindingsConfig | null = null;

  private constructor() {
    const homeDir = os.homedir();
    this.globalConfigPath = path.join(
      homeDir,
      '.ollama-code',
      'keybindings.json',
    );
  }

  /**
   * Get singleton instance
   */
  static getInstance(): KeyBindingsService {
    if (!KeyBindingsService.instance) {
      KeyBindingsService.instance = new KeyBindingsService();
    }
    return KeyBindingsService.instance;
  }

  /**
   * Set project root for project-specific keybindings
   */
  setProjectRoot(projectRoot: string): void {
    this.projectConfigPath = path.join(
      projectRoot,
      '.ollama-code',
      'keybindings.json',
    );
  }

  /**
   * Load user keybindings configuration
   */
  async loadConfig(): Promise<UserKeyBindingsConfig> {
    if (this.userConfig) {
      return this.userConfig;
    }

    // Try global config first
    let config: UserKeyBindingsConfig = { version: 1, bindings: {} };

    try {
      const globalData = await fs.readFile(this.globalConfigPath, 'utf-8');
      config = JSON.parse(globalData);
      debugLogger.info('Loaded global keybindings config');
    } catch {
      // No global config, use defaults
      debugLogger.info('No global keybindings config found, using defaults');
    }

    // Merge project config if exists
    if (this.projectConfigPath) {
      try {
        const projectData = await fs.readFile(this.projectConfigPath, 'utf-8');
        const projectConfig = JSON.parse(projectData);
        config = this.mergeConfigs(config, projectConfig);
        debugLogger.info('Merged project keybindings config');
      } catch {
        // No project config
      }
    }

    this.userConfig = config;
    return config;
  }

  /**
   * Merge two configurations (project overrides global)
   */
  private mergeConfigs(
    global: UserKeyBindingsConfig,
    project: UserKeyBindingsConfig,
  ): UserKeyBindingsConfig {
    return {
      version: project.version ?? global.version ?? 1,
      bindings: {
        ...global.bindings,
        ...project.bindings,
      },
      description: project.description ?? global.description,
    };
  }

  /**
   * Save configuration to file
   */
  async saveConfig(
    config: UserKeyBindingsConfig,
    scope: 'global' | 'project' = 'global',
  ): Promise<void> {
    const configPath =
      scope === 'global'
        ? this.globalConfigPath
        : (this.projectConfigPath ?? this.globalConfigPath);

    // Ensure directory exists
    const dir = path.dirname(configPath);
    await fs.mkdir(dir, { recursive: true });

    // Write config with formatting
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, 'utf-8');

    // Update cached config
    this.userConfig = config;
    debugLogger.info(`Saved keybindings config to ${configPath}`);
  }

  /**
   * Get user bindings for a command
   */
  async getUserBindings(
    command: string,
  ): Promise<KeyBindingDefinition[] | null> {
    const config = await this.loadConfig();
    return config.bindings?.[command] ?? null;
  }

  /**
   * Set user binding for a command
   */
  async setBinding(
    command: string,
    bindings: KeyBindingDefinition[],
    scope: 'global' | 'project' = 'global',
  ): Promise<void> {
    const config = await this.loadConfig();
    config.bindings = config.bindings ?? {};
    config.bindings[command] = bindings;
    await this.saveConfig(config, scope);
  }

  /**
   * Reset binding to default (remove from user config)
   */
  async resetBinding(
    command: string,
    scope: 'global' | 'project' = 'global',
  ): Promise<void> {
    const config = await this.loadConfig();
    if (config.bindings && command in config.bindings) {
      delete config.bindings[command];
      await this.saveConfig(config, scope);
    }
  }

  /**
   * Reset all bindings to defaults
   */
  async resetAllBindings(
    scope: 'global' | 'project' = 'global',
  ): Promise<void> {
    await this.saveConfig({ version: 1, bindings: {} }, scope);
  }

  /**
   * Get all commands grouped by category
   */
  getCommandsByCategory(): Record<string, CommandInfo[]> {
    const result: Record<string, CommandInfo[]> = {};

    for (const cmd of AVAILABLE_COMMANDS) {
      if (!result[cmd.category]) {
        result[cmd.category] = [];
      }
      result[cmd.category].push(cmd);
    }

    return result;
  }

  /**
   * Format keybinding for display
   */
  formatBinding(binding: KeyBindingDefinition): string {
    const parts: string[] = [];

    if (binding.ctrl) parts.push('Ctrl');
    if (binding.shift) parts.push('Shift');
    if (binding.command || binding.meta) parts.push('⌘');
    if (binding.key) {
      // Format key name
      let keyName = binding.key;
      switch (keyName) {
        case 'return':
          keyName = 'Enter';
          break;
        case 'escape':
          keyName = 'Esc';
          break;
        case 'up':
          keyName = '↑';
          break;
        case 'down':
          keyName = '↓';
          break;
        case 'left':
          keyName = '←';
          break;
        case 'right':
          keyName = '→';
          break;
        case 'backspace':
          keyName = '⌫';
          break;
        case 'tab':
          keyName = '⇥';
          break;
        default:
          // Keep original key name for other keys
          break;
      }
      parts.push(keyName.toUpperCase());
    }

    return parts.join('+');
  }

  /**
   * Generate example config file
   */
  generateExampleConfig(): UserKeyBindingsConfig {
    return {
      version: 1,
      description: 'Ollama Code Keyboard Shortcuts Configuration',
      bindings: {
        // Example: Change "save session" to Ctrl+S
        // saveSession: [{ key: 's', ctrl: true }],
        // Example: Add alternative for newline
        // newline: [
        //   { key: 'return', ctrl: true },
        //   { key: 'return', shift: true },
        //   { key: 'j', ctrl: true },
        // ],
      },
    };
  }

  /**
   * Get config file path
   */
  getConfigPath(scope: 'global' | 'project' = 'global'): string {
    return scope === 'global'
      ? this.globalConfigPath
      : (this.projectConfigPath ?? this.globalConfigPath);
  }
}

/**
 * Export singleton instance
 */
export const keyBindingsService = KeyBindingsService.getInstance();
