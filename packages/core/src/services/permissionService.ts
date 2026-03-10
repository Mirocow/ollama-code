/**
 * Permission Service
 *
 * Manages tool execution permissions, approval policies, and security settings.
 * Provides fine-grained control over which tools can execute without confirmation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('PERMISSION_SERVICE');

/**
 * Permission levels for tools
 */
export type PermissionLevel =
  | 'always_allow' // Tool can execute without any confirmation
  | 'ask_once' // Ask once per session, then remember
  | 'ask_always' // Always ask for confirmation
  | 'never_allow'; // Tool is blocked from execution

/**
 * Tool category for permission grouping
 */
export type ToolCategory =
  | 'file_read' // Reading files
  | 'file_write' // Writing/editing files
  | 'file_delete' // Deleting files
  | 'shell_execute' // Shell command execution
  | 'network' // Network operations (web fetch, API calls)
  | 'ssh' // SSH connections
  | 'database' // Database operations
  | 'git' // Git operations
  | 'mcp' // MCP server operations
  | 'extension' // Extension management
  | 'system' // System-level operations
  | 'other'; // Uncategorized tools

/**
 * Permission rule for a specific tool or pattern
 */
export interface PermissionRule {
  /** Tool name or pattern (supports glob patterns) */
  tool: string;

  /** Permission level for this tool */
  level: PermissionLevel;

  /** Category for grouping */
  category: ToolCategory;

  /** Optional condition for the rule */
  condition?: {
    /** Pattern for allowed paths (for file tools) */
    pathPattern?: string;
    /** Pattern for allowed hosts (for network tools) */
    hostPattern?: string;
    /** Pattern for allowed commands (for shell tools) */
    commandPattern?: string;
    /** Maximum allowed file size in bytes */
    maxFileSize?: number;
    /** Allowed file extensions */
    allowedExtensions?: string[];
  };

  /** Whether this rule is active */
  enabled: boolean;

  /** Description of why this rule exists */
  reason?: string;

  /** When this rule was created */
  createdAt: string;

  /** When this rule was last used */
  lastUsedAt?: string;

  /** How many times this rule was applied */
  useCount: number;
}

/**
 * Session allowlist entry
 */
export interface SessionAllowlistEntry {
  tool: string;
  params?: Record<string, unknown>;
  addedAt: number;
  expiresAt?: number;
}

/**
 * Permission configuration
 */
export interface PermissionConfig {
  /** Default permission level for unknown tools */
  defaultLevel: PermissionLevel;

  /** Whether to use session allowlist */
  useSessionAllowlist: boolean;

  /** Session allowlist expiry time in ms (0 = no expiry) */
  sessionAllowlistExpiry: number;

  /** Whether to save decisions for future sessions */
  persistDecisions: boolean;

  /** Maximum number of persisted rules */
  maxPersistedRules: number;

  /** Whether to log permission decisions */
  logDecisions: boolean;

  /** Whether to ask for dangerous operations */
  confirmDangerousOperations: boolean;

  /** List of dangerous shell command patterns */
  dangerousCommandPatterns: string[];

  /** List of protected paths */
  protectedPaths: string[];
}

/**
 * Default permission configuration
 */
export const DEFAULT_PERMISSION_CONFIG: PermissionConfig = {
  defaultLevel: 'ask_always',
  useSessionAllowlist: true,
  sessionAllowlistExpiry: 0, // No expiry within session
  persistDecisions: true,
  maxPersistedRules: 100,
  logDecisions: true,
  confirmDangerousOperations: true,
  dangerousCommandPatterns: [
    'rm -rf',
    'rm -r',
    'rmdir',
    'format',
    'mkfs',
    'dd if=',
    '> /dev/',
    'chmod -R 777',
    'chown -R',
    'shutdown',
    'reboot',
    'halt',
    'init 0',
    'init 6',
    'systemctl restart',
    'systemctl stop',
    'service * stop',
    'kill -9',
    'pkill -9',
    'drop table',
    'delete from',
    'truncate table',
  ],
  protectedPaths: [
    '/etc/passwd',
    '/etc/shadow',
    '/etc/sudoers',
    '~/.ssh',
    '~/.gnupg',
    '~/.config/gh',
  ],
};

/**
 * Default permission rules for common tools
 */
export const DEFAULT_PERMISSION_RULES: PermissionRule[] = [
  // File operations
  {
    tool: 'read_file',
    level: 'always_allow',
    category: 'file_read',
    enabled: true,
    reason: 'Reading files is generally safe',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  {
    tool: 'list_directory',
    level: 'always_allow',
    category: 'file_read',
    enabled: true,
    reason: 'Listing directories is safe',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  {
    tool: 'glob',
    level: 'always_allow',
    category: 'file_read',
    enabled: true,
    reason: 'Finding files is safe',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  {
    tool: 'grep',
    level: 'always_allow',
    category: 'file_read',
    enabled: true,
    reason: 'Searching files is safe',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  {
    tool: 'write_file',
    level: 'ask_once',
    category: 'file_write',
    enabled: true,
    reason: 'Writing files needs confirmation',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  {
    tool: 'edit_file',
    level: 'ask_once',
    category: 'file_write',
    enabled: true,
    reason: 'Editing files needs confirmation',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  // Shell operations
  {
    tool: 'run_shell_command',
    level: 'ask_always',
    category: 'shell_execute',
    enabled: true,
    reason: 'Shell commands need confirmation',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  // Network operations
  {
    tool: 'web_fetch',
    level: 'ask_once',
    category: 'network',
    enabled: true,
    reason: 'Network access needs confirmation',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  {
    tool: 'web_search',
    level: 'ask_once',
    category: 'network',
    enabled: true,
    reason: 'Web search needs confirmation',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
  // SSH operations
  {
    tool: 'ssh_connect',
    level: 'ask_always',
    category: 'ssh',
    enabled: true,
    reason: 'SSH connections need confirmation',
    createdAt: new Date().toISOString(),
    useCount: 0,
  },
];

/**
 * Permission Service class
 */
export class PermissionService {
  private config: PermissionConfig;
  private rules: Map<string, PermissionRule> = new Map();
  private sessionAllowlist: Map<string, SessionAllowlistEntry> = new Map();
  private configPath: string;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.configPath = path.join(
      os.homedir(),
      '.ollama-code',
      'permissions.json',
    );
    this.config = { ...DEFAULT_PERMISSION_CONFIG };
    this.loadPermissions();
  }

  /**
   * Load permissions from file
   */
  private loadPermissions(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const data = JSON.parse(content) as {
          config?: Partial<PermissionConfig>;
          rules?: PermissionRule[];
        };

        if (data.config) {
          this.config = { ...DEFAULT_PERMISSION_CONFIG, ...data.config };
        }

        if (data.rules) {
          for (const rule of data.rules) {
            this.rules.set(rule.tool, rule);
          }
        }

        // Add default rules for tools not in saved rules
        for (const defaultRule of DEFAULT_PERMISSION_RULES) {
          if (!this.rules.has(defaultRule.tool)) {
            this.rules.set(defaultRule.tool, { ...defaultRule });
          }
        }

        debugLogger.info('Loaded permissions from file');
      } else {
        // First run - use defaults
        for (const rule of DEFAULT_PERMISSION_RULES) {
          this.rules.set(rule.tool, { ...rule });
        }
        this.savePermissions();
      }
    } catch (error) {
      debugLogger.warn('Failed to load permissions:', error);
      // Use defaults on error
      for (const rule of DEFAULT_PERMISSION_RULES) {
        this.rules.set(rule.tool, { ...rule });
      }
    }
  }

  /**
   * Save permissions to file
   */
  private savePermissions(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        config: this.config,
        rules: Array.from(this.rules.values()),
      };

      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
      debugLogger.info('Saved permissions to file');
    } catch (error) {
      debugLogger.error('Failed to save permissions:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<PermissionConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<PermissionConfig>): void {
    this.config = { ...this.config, ...updates };
    this.savePermissions();
    this.notifyListeners();
  }

  /**
   * Get all rules
   */
  getRules(): PermissionRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: ToolCategory): PermissionRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.category === category,
    );
  }

  /**
   * Get rule for a specific tool
   */
  getRule(toolName: string): PermissionRule | undefined {
    // First try exact match
    let rule = this.rules.get(toolName);

    if (!rule) {
      // Try pattern matching
      for (const [pattern, r] of this.rules) {
        if (this.matchesPattern(toolName, pattern)) {
          rule = r;
          break;
        }
      }
    }

    return rule;
  }

  /**
   * Add or update a rule
   */
  setRule(rule: Omit<PermissionRule, 'createdAt' | 'useCount'>): void {
    const existing = this.rules.get(rule.tool);
    const newRule: PermissionRule = {
      ...rule,
      createdAt: existing?.createdAt || new Date().toISOString(),
      useCount: existing?.useCount || 0,
    };

    this.rules.set(rule.tool, newRule);
    this.savePermissions();
    this.notifyListeners();
  }

  /**
   * Remove a rule
   */
  removeRule(toolName: string): boolean {
    if (this.rules.delete(toolName)) {
      this.savePermissions();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Check if a tool requires confirmation
   */
  requiresConfirmation(
    toolName: string,
    params?: Record<string, unknown>,
  ): boolean {
    const rule = this.getRule(toolName);

    if (!rule || !rule.enabled) {
      return this.config.defaultLevel !== 'always_allow';
    }

    // Check if tool is blocked
    if (rule.level === 'never_allow') {
      return true; // Block by requiring confirmation that will be denied
    }

    // Check if always allowed
    if (rule.level === 'always_allow') {
      return false;
    }

    // Check session allowlist for ask_once rules
    if (rule.level === 'ask_once' && this.config.useSessionAllowlist) {
      const allowlistKey = this.getAllowlistKey(toolName, params);
      if (this.isInSessionAllowlist(allowlistKey)) {
        return false;
      }
    }

    // Check for dangerous operations
    if (this.config.confirmDangerousOperations) {
      if (this.isDangerousOperation(toolName, params)) {
        return true;
      }
    }

    // At this point, level is either 'ask_once' or 'ask_always', both require confirmation
    return true;
  }

  /**
   * Check if operation is dangerous
   */
  private isDangerousOperation(
    toolName: string,
    params?: Record<string, unknown>,
  ): boolean {
    // Check shell commands
    if (toolName === 'run_shell_command' || toolName === 'shell') {
      const command = (params?.['command'] as string) || '';
      for (const pattern of this.config.dangerousCommandPatterns) {
        if (command.toLowerCase().includes(pattern.toLowerCase())) {
          return true;
        }
      }
    }

    // Check file operations on protected paths
    if (
      toolName === 'write_file' ||
      toolName === 'edit_file' ||
      toolName === 'delete_file'
    ) {
      const filePath = (params?.['path'] as string) || '';
      for (const protectedPath of this.config.protectedPaths) {
        const expanded = protectedPath.replace('~', os.homedir());
        if (filePath.startsWith(expanded)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get permission level for a tool
   */
  getPermissionLevel(toolName: string): PermissionLevel {
    const rule = this.getRule(toolName);
    return rule?.level || this.config.defaultLevel;
  }

  /**
   * Check if tool is allowed
   */
  isToolAllowed(toolName: string): boolean {
    const level = this.getPermissionLevel(toolName);
    return level !== 'never_allow';
  }

  /**
   * Add to session allowlist
   */
  addToSessionAllowlist(
    toolName: string,
    params?: Record<string, unknown>,
    ttl?: number,
  ): void {
    const key = this.getAllowlistKey(toolName, params);
    const entry: SessionAllowlistEntry = {
      tool: toolName,
      params,
      addedAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    };
    this.sessionAllowlist.set(key, entry);
    debugLogger.info(`Added to session allowlist: ${toolName}`);
  }

  /**
   * Check if in session allowlist
   */
  private isInSessionAllowlist(key: string): boolean {
    const entry = this.sessionAllowlist.get(key);
    if (!entry) return false;

    // Check expiry
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.sessionAllowlist.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get allowlist key
   */
  private getAllowlistKey(
    toolName: string,
    params?: Record<string, unknown>,
  ): string {
    if (!params) return toolName;
    // Create a stable key from tool name and relevant params
    const relevantParams = { ...params };
    // Remove volatile params
    delete relevantParams['sessionId'];
    delete relevantParams['timestamp'];
    return `${toolName}:${JSON.stringify(relevantParams)}`;
  }

  /**
   * Clear session allowlist
   */
  clearSessionAllowlist(): void {
    this.sessionAllowlist.clear();
    debugLogger.info('Cleared session allowlist');
  }

  /**
   * Record tool execution
   */
  recordExecution(toolName: string): void {
    const rule = this.rules.get(toolName);
    if (rule) {
      rule.lastUsedAt = new Date().toISOString();
      rule.useCount++;
      this.savePermissions();
    }
  }

  /**
   * Reset all rules to defaults
   */
  resetToDefaults(): void {
    this.rules.clear();
    for (const rule of DEFAULT_PERMISSION_RULES) {
      this.rules.set(rule.tool, { ...rule });
    }
    this.config = { ...DEFAULT_PERMISSION_CONFIG };
    this.savePermissions();
    this.notifyListeners();
  }

  /**
   * Check if tool name matches pattern
   */
  private matchesPattern(toolName: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
      'i',
    );
    return regex.test(toolName);
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        debugLogger.error('Error in permission listener:', error);
      }
    }
  }

  /**
   * Export permissions
   */
  export(): string {
    return JSON.stringify(
      {
        config: this.config,
        rules: Array.from(this.rules.values()),
        sessionAllowlist: Array.from(this.sessionAllowlist.entries()),
      },
      null,
      2,
    );
  }

  /**
   * Import permissions
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.config) {
        this.config = { ...DEFAULT_PERMISSION_CONFIG, ...data.config };
      }
      if (data.rules) {
        this.rules.clear();
        for (const rule of data.rules) {
          this.rules.set(rule.tool, rule);
        }
      }
      this.savePermissions();
      this.notifyListeners();
      return true;
    } catch (error) {
      debugLogger.error('Failed to import permissions:', error);
      return false;
    }
  }

  /**
   * Get permission summary
   */
  getSummary(): {
    totalRules: number;
    enabledRules: number;
    byLevel: Record<PermissionLevel, number>;
    byCategory: Record<ToolCategory, number>;
    sessionAllowlistSize: number;
  } {
    const byLevel: Record<PermissionLevel, number> = {
      always_allow: 0,
      ask_once: 0,
      ask_always: 0,
      never_allow: 0,
    };

    const byCategory: Record<ToolCategory, number> = {
      file_read: 0,
      file_write: 0,
      file_delete: 0,
      shell_execute: 0,
      network: 0,
      ssh: 0,
      database: 0,
      git: 0,
      mcp: 0,
      extension: 0,
      system: 0,
      other: 0,
    };

    let enabledRules = 0;
    for (const rule of this.rules.values()) {
      byLevel[rule.level]++;
      byCategory[rule.category]++;
      if (rule.enabled) enabledRules++;
    }

    return {
      totalRules: this.rules.size,
      enabledRules,
      byLevel,
      byCategory,
      sessionAllowlistSize: this.sessionAllowlist.size,
    };
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
