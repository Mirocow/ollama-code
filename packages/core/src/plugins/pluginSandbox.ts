/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plugin Security Sandbox
 *
 * Provides isolation and security boundaries for plugin execution.
 * Limits plugin access to filesystem, network, and system resources.
 *
 * Features:
 * - Filesystem access control (whitelist/blacklist)
 * - Network access control (allowed domains/ports)
 * - Command execution restrictions
 * - Resource limits (timeout, memory)
 * - Environment variable isolation
 */

import * as path from 'node:path';
import { createDebugLogger } from '../utils/debugLogger.js';
import * as os from 'node:os';

const debugLogger = createDebugLogger('PLUGIN_SANDBOX');

// ============================================================================
// Types
// ============================================================================

/**
 * Filesystem access level
 */
export type FilesystemAccessLevel = 'none' | 'read' | 'write' | 'full';

/**
 * Network access level
 */
export type NetworkAccessLevel = 'none' | 'api-only' | 'full';

/**
 * Command execution level
 */
export type CommandExecutionLevel = 'none' | 'safe-only' | 'full';

/**
 * Filesystem permission entry
 */
export interface FilesystemPermission {
  /** Path pattern (supports glob) */
  pattern: string;
  /** Access level */
  access: FilesystemAccessLevel;
  /** Optional description */
  description?: string;
}

/**
 * Network permission entry
 */
export interface NetworkPermission {
  /** Domain pattern (supports wildcards) */
  domain: string;
  /** Allowed ports (empty = all) */
  ports?: number[];
  /** Allowed methods */
  methods?: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>;
}

/**
 * Command permission entry
 */
export interface CommandPermission {
  /** Command name or pattern */
  command: string;
  /** Whether arguments are allowed */
  allowArgs?: boolean;
  /** Argument whitelist patterns */
  allowedArgPatterns?: string[];
}

/**
 * Resource limits for plugin execution
 */
export interface ResourceLimits {
  /** Maximum execution time in milliseconds */
  timeout: number;
  /** Maximum memory in bytes (0 = unlimited) */
  maxMemory: number;
  /** Maximum file size that can be read/written */
  maxFileSize: number;
  /** Maximum number of concurrent operations */
  maxConcurrentOps: number;
}

/**
 * Plugin sandbox configuration
 */
export interface PluginSandboxConfig {
  /** Unique identifier for the plugin */
  pluginId: string;
  /** Plugin version */
  pluginVersion: string;
  /** Trust level (affects default permissions) */
  trustLevel: 'untrusted' | 'trusted' | 'builtin';
  /** Filesystem permissions */
  filesystem: FilesystemPermission[];
  /** Network permissions */
  network: NetworkPermission[];
  /** Command execution permissions */
  commands: CommandPermission[];
  /** Resource limits */
  limits: ResourceLimits;
  /** Allowed environment variables (patterns) */
  allowedEnvVars: string[];
  /** Whether to log all sandbox violations */
  logViolations: boolean;
}

/**
 * Sandbox violation type
 */
export type ViolationType =
  | 'filesystem_read'
  | 'filesystem_write'
  | 'filesystem_delete'
  | 'network_request'
  | 'command_execute'
  | 'env_access'
  | 'resource_limit'
  | 'timeout';

/**
 * Sandbox violation record
 */
export interface SandboxViolation {
  /** Type of violation */
  type: ViolationType;
  /** Plugin that caused the violation */
  pluginId: string;
  /** Resource that was accessed */
  resource: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Sandbox execution context
 */
export interface SandboxContext {
  /** Working directory for the plugin */
  workingDirectory: string;
  /** Temporary directory for the plugin */
  tempDirectory: string;
  /** Isolated environment variables */
  env: Record<string, string>;
  /** Whether the sandbox is active */
  active: boolean;
  /** Violation log */
  violations: SandboxViolation[];
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default resource limits
 */
export const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  timeout: 30000, // 30 seconds
  maxMemory: 100 * 1024 * 1024, // 100 MB
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  maxConcurrentOps: 10,
};

/**
 * Default configuration for untrusted plugins
 */
export const UNTRUSTED_PLUGIN_CONFIG: Partial<PluginSandboxConfig> = {
  trustLevel: 'untrusted',
  filesystem: [
    {
      pattern: '${workingDir}/**',
      access: 'read',
      description: 'Read project files',
    },
    {
      pattern: '${tempDir}/**',
      access: 'write',
      description: 'Write to temp directory',
    },
  ],
  network: [
    { domain: 'api.github.com', methods: ['GET'] },
    { domain: 'registry.npmjs.org', methods: ['GET'] },
  ],
  commands: [],
  limits: {
    timeout: 15000,
    maxMemory: 50 * 1024 * 1024,
    maxFileSize: 5 * 1024 * 1024,
    maxConcurrentOps: 5,
  },
  allowedEnvVars: ['PATH', 'HOME', 'USER', 'LANG'],
};

/**
 * Default configuration for trusted plugins
 */
export const TRUSTED_PLUGIN_CONFIG: Partial<PluginSandboxConfig> = {
  trustLevel: 'trusted',
  filesystem: [
    {
      pattern: '${workingDir}/**',
      access: 'write',
      description: 'Full project access',
    },
    {
      pattern: '${tempDir}/**',
      access: 'write',
      description: 'Temp directory',
    },
    {
      pattern: '${home}/.ollama-code/**',
      access: 'write',
      description: 'Config directory',
    },
  ],
  network: [{ domain: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }],
  commands: [
    { command: 'npm', allowArgs: true },
    { command: 'node', allowArgs: true },
    { command: 'git', allowArgs: true },
  ],
  limits: DEFAULT_RESOURCE_LIMITS,
  allowedEnvVars: ['*'],
};

/**
 * Default configuration for builtin plugins
 */
export const BUILTIN_PLUGIN_CONFIG: Partial<PluginSandboxConfig> = {
  trustLevel: 'builtin',
  filesystem: [
    { pattern: '**', access: 'full', description: 'Full filesystem access' },
  ],
  network: [
    { domain: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
  ],
  commands: [{ command: '*', allowArgs: true }],
  limits: {
    timeout: 60000,
    maxMemory: 0, // unlimited
    maxFileSize: 0, // unlimited
    maxConcurrentOps: 50,
  },
  allowedEnvVars: ['*'],
};

// ============================================================================
// Plugin Sandbox Class
// ============================================================================

/**
 * Plugin Security Sandbox
 *
 * Provides isolation and access control for plugin execution.
 */
export class PluginSandbox {
  private config: PluginSandboxConfig;
  private context: SandboxContext;
  private violationCallbacks: Array<(violation: SandboxViolation) => void> = [];

  constructor(
    config: Partial<PluginSandboxConfig>,
    private workingDir: string,
    private tempDir: string,
  ) {
    // Merge with defaults based on trust level
    const defaults = this.getDefaultsForTrustLevel(
      config.trustLevel ?? 'untrusted',
    );

    this.config = {
      pluginId: config.pluginId ?? 'unknown',
      pluginVersion: config.pluginVersion ?? '0.0.0',
      trustLevel: config.trustLevel ?? 'untrusted',
      filesystem: config.filesystem ?? defaults.filesystem ?? [],
      network: config.network ?? defaults.network ?? [],
      commands: config.commands ?? defaults.commands ?? [],
      limits: {
        ...DEFAULT_RESOURCE_LIMITS,
        ...defaults.limits,
        ...config.limits,
      },
      allowedEnvVars: config.allowedEnvVars ?? defaults.allowedEnvVars ?? [],
      logViolations: config.logViolations ?? true,
    };

    // Create isolated environment
    this.context = {
      workingDirectory: workingDir,
      tempDirectory: tempDir,
      env: this.createIsolatedEnv(),
      active: false,
      violations: [],
    };

    debugLogger.info(`Sandbox created for plugin ${this.config.pluginId}`, {
      trustLevel: this.config.trustLevel,
      filesystemRules: this.config.filesystem.length,
      networkRules: this.config.network.length,
    });
  }

  /**
   * Get default configuration for trust level
   */
  private getDefaultsForTrustLevel(
    trustLevel: 'untrusted' | 'trusted' | 'builtin',
  ): Partial<PluginSandboxConfig> {
    switch (trustLevel) {
      case 'builtin':
        return BUILTIN_PLUGIN_CONFIG;
      case 'trusted':
        return TRUSTED_PLUGIN_CONFIG;
      default:
        return UNTRUSTED_PLUGIN_CONFIG;
    }
  }

  /**
   * Create isolated environment variables
   */
  private createIsolatedEnv(): Record<string, string> {
    const env: Record<string, string> = {};

    for (const pattern of this.config.allowedEnvVars) {
      if (pattern === '*') {
        // Copy all environment variables
        return { ...process.env } as Record<string, string>;
      }

      // Check for wildcard patterns
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        for (const [key, value] of Object.entries(process.env)) {
          if (key.startsWith(prefix)) {
            env[key] = value ?? '';
          }
        }
      } else {
        // Exact match
        const value = process.env[pattern];
        if (value !== undefined) {
          env[pattern] = value;
        }
      }
    }

    return env;
  }

  /**
   * Expand path patterns with context variables
   */
  private expandPattern(pattern: string): string {
    return pattern
      .replace('${workingDir}', this.workingDir)
      .replace('${tempDir}', this.tempDir)
      .replace(
        '${home}',
        process.env['HOME'] ?? process.env['USERPROFILE'] ?? '',
      )
      .replace('${pluginId}', this.config.pluginId);
  }

  /**
   * Check if a path matches a pattern
   */
  private matchPath(filePath: string, pattern: string): boolean {
    const expandedPattern = this.expandPattern(pattern);

    // Simple glob matching
    if (expandedPattern === '**' || expandedPattern === '*') {
      return true;
    }

    if (expandedPattern.endsWith('/**')) {
      const prefix = expandedPattern.slice(0, -3);
      return filePath.startsWith(prefix);
    }

    if (expandedPattern.endsWith('/*')) {
      const prefix = expandedPattern.slice(0, -2);
      if (!filePath.startsWith(prefix)) return false;
      const relative = filePath.slice(prefix.length);
      return !relative.includes('/');
    }

    // Exact match
    return filePath === expandedPattern;
  }

  /**
   * Check if a domain matches a pattern
   */
  private matchDomain(domain: string, pattern: string): boolean {
    if (pattern === '*') return true;

    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return domain === suffix || domain.endsWith('.' + suffix);
    }

    return domain === pattern;
  }

  // ========================================================================
  // Filesystem Access Control
  // ========================================================================

  /**
   * Check if filesystem read is allowed
   */
  canReadFile(filePath: string): boolean {
    const absolutePath = path.resolve(filePath);

    for (const perm of this.config.filesystem) {
      if (this.matchPath(absolutePath, perm.pattern)) {
        const allowed =
          perm.access === 'read' ||
          perm.access === 'write' ||
          perm.access === 'full';
        if (!allowed) {
          this.recordViolation('filesystem_read', filePath);
        }
        return allowed;
      }
    }

    this.recordViolation('filesystem_read', filePath);
    return false;
  }

  /**
   * Check if filesystem write is allowed
   */
  canWriteFile(filePath: string): boolean {
    const absolutePath = path.resolve(filePath);

    for (const perm of this.config.filesystem) {
      if (this.matchPath(absolutePath, perm.pattern)) {
        const allowed = perm.access === 'write' || perm.access === 'full';
        if (!allowed) {
          this.recordViolation('filesystem_write', filePath);
        }
        return allowed;
      }
    }

    this.recordViolation('filesystem_write', filePath);
    return false;
  }

  /**
   * Check if filesystem delete is allowed
   */
  canDeleteFile(filePath: string): boolean {
    const absolutePath = path.resolve(filePath);

    for (const perm of this.config.filesystem) {
      if (this.matchPath(absolutePath, perm.pattern)) {
        const allowed = perm.access === 'full';
        if (!allowed) {
          this.recordViolation('filesystem_delete', filePath);
        }
        return allowed;
      }
    }

    this.recordViolation('filesystem_delete', filePath);
    return false;
  }

  // ========================================================================
  // Network Access Control
  // ========================================================================

  /**
   * Check if network request is allowed
   */
  canMakeRequest(url: string, method: string = 'GET'): boolean {
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const port =
        parseInt(parsedUrl.port, 10) ||
        (parsedUrl.protocol === 'https:' ? 443 : 80);

      for (const perm of this.config.network) {
        if (this.matchDomain(domain, perm.domain)) {
          // Check port
          if (
            perm.ports &&
            perm.ports.length > 0 &&
            !perm.ports.includes(port)
          ) {
            this.recordViolation('network_request', url, { method, port });
            return false;
          }

          // Check method
          if (
            perm.methods &&
            !perm.methods.includes(
              method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
            )
          ) {
            this.recordViolation('network_request', url, { method, port });
            return false;
          }

          return true;
        }
      }

      this.recordViolation('network_request', url, { method });
      return false;
    } catch {
      this.recordViolation('network_request', url, {
        method,
        error: 'Invalid URL',
      });
      return false;
    }
  }

  // ========================================================================
  // Command Execution Control
  // ========================================================================

  /**
   * Check if command execution is allowed
   */
  canExecuteCommand(command: string, args: string[] = []): boolean {
    const baseCommand = path.basename(command);

    for (const perm of this.config.commands) {
      if (perm.command === '*' || perm.command === baseCommand) {
        if (!perm.allowArgs && args.length > 0) {
          this.recordViolation('command_execute', command, { args });
          return false;
        }

        // Check argument patterns if specified
        if (perm.allowedArgPatterns && perm.allowedArgPatterns.length > 0) {
          for (const arg of args) {
            const allowed = perm.allowedArgPatterns.some((pattern) =>
              this.matchPath(arg, pattern),
            );
            if (!allowed) {
              this.recordViolation('command_execute', command, { arg });
              return false;
            }
          }
        }

        return true;
      }
    }

    this.recordViolation('command_execute', command, { args });
    return false;
  }

  // ========================================================================
  // Environment Variable Access
  // ========================================================================

  /**
   * Check if environment variable access is allowed
   */
  canAccessEnvVar(name: string): boolean {
    for (const pattern of this.config.allowedEnvVars) {
      if (pattern === '*') return true;

      if (pattern.endsWith('*')) {
        if (name.startsWith(pattern.slice(0, -1))) return true;
      } else {
        if (name === pattern) return true;
      }
    }

    this.recordViolation('env_access', name);
    return false;
  }

  /**
   * Get allowed environment variable value
   */
  getEnvVar(name: string): string | undefined {
    if (!this.canAccessEnvVar(name)) {
      return undefined;
    }
    return this.context.env[name];
  }

  // ========================================================================
  // Resource Limits
  // ========================================================================

  /**
   * Get resource limits
   */
  getLimits(): ResourceLimits {
    return { ...this.config.limits };
  }

  /**
   * Check if file size is within limits
   */
  isFileSizeAllowed(size: number): boolean {
    const limit = this.config.limits.maxFileSize;
    if (limit === 0) return true; // unlimited

    if (size > limit) {
      this.recordViolation('resource_limit', `file_size_${size}`, { limit });
      return false;
    }
    return true;
  }

  // ========================================================================
  // Sandbox Lifecycle
  // ========================================================================

  /**
   * Activate the sandbox
   */
  activate(): void {
    this.context.active = true;
    debugLogger.info(`Sandbox activated for ${this.config.pluginId}`);
  }

  /**
   * Deactivate the sandbox
   */
  deactivate(): void {
    this.context.active = false;
    debugLogger.info(`Sandbox deactivated for ${this.config.pluginId}`);
  }

  /**
   * Check if sandbox is active
   */
  isActive(): boolean {
    return this.context.active;
  }

  // ========================================================================
  // Violation Handling
  // ========================================================================

  /**
   * Record a sandbox violation
   */
  private recordViolation(
    type: ViolationType,
    resource: string,
    context?: Record<string, unknown>,
  ): void {
    const violation: SandboxViolation = {
      type,
      pluginId: this.config.pluginId,
      resource,
      timestamp: new Date(),
      context,
    };

    this.context.violations.push(violation);

    if (this.config.logViolations) {
      debugLogger.warn(`Sandbox violation: ${type}`, {
        pluginId: this.config.pluginId,
        resource,
        context,
      });
    }

    // Notify callbacks
    for (const callback of this.violationCallbacks) {
      try {
        callback(violation);
      } catch (error) {
        debugLogger.error('Error in violation callback', error);
      }
    }
  }

  /**
   * Register a violation callback
   */
  onViolation(callback: (violation: SandboxViolation) => void): void {
    this.violationCallbacks.push(callback);
  }

  /**
   * Get all violations
   */
  getViolations(): SandboxViolation[] {
    return [...this.context.violations];
  }

  /**
   * Clear violation history
   */
  clearViolations(): void {
    this.context.violations = [];
  }

  // ========================================================================
  // Context Access
  // ========================================================================

  /**
   * Get sandbox context
   */
  getContext(): SandboxContext {
    return { ...this.context };
  }

  /**
   * Get isolated environment
   */
  getEnvironment(): Record<string, string> {
    return { ...this.context.env };
  }

  /**
   * Get working directory
   */
  getWorkingDirectory(): string {
    return this.context.workingDirectory;
  }

  /**
   * Get temp directory
   */
  getTempDirectory(): string {
    return this.context.tempDirectory;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a sandbox for a plugin
 */
export function createPluginSandbox(
  pluginId: string,
  pluginVersion: string,
  options: {
    trustLevel?: 'untrusted' | 'trusted' | 'builtin';
    workingDir?: string;
    tempDir?: string;
    customConfig?: Partial<PluginSandboxConfig>;
  } = {},
): PluginSandbox {
  const workingDir = options.workingDir ?? process.cwd();
  const tempDir = options.tempDir ?? os.tmpdir();

  return new PluginSandbox(
    {
      pluginId,
      pluginVersion,
      trustLevel: options.trustLevel,
      ...options.customConfig,
    },
    workingDir,
    tempDir,
  );
}

/**
 * Create a sandbox for a builtin plugin
 */
export function createBuiltinSandbox(
  pluginId: string,
  pluginVersion: string,
): PluginSandbox {
  return createPluginSandbox(pluginId, pluginVersion, {
    trustLevel: 'builtin',
  });
}

/**
 * Create a sandbox for a trusted plugin
 */
export function createTrustedSandbox(
  pluginId: string,
  pluginVersion: string,
  workingDir: string,
): PluginSandbox {
  return createPluginSandbox(pluginId, pluginVersion, {
    trustLevel: 'trusted',
    workingDir,
  });
}

/**
 * Create a sandbox for an untrusted plugin
 */
export function createUntrustedSandbox(
  pluginId: string,
  pluginVersion: string,
  workingDir: string,
  tempDir?: string,
): PluginSandbox {
  return createPluginSandbox(pluginId, pluginVersion, {
    trustLevel: 'untrusted',
    workingDir,
    tempDir,
  });
}

// ============================================================================
// Violation Error
// ============================================================================

/**
 * Error thrown when a sandbox violation occurs
 */
export class SandboxViolationError extends Error {
  constructor(readonly violation: SandboxViolation) {
    super(
      `Sandbox violation: ${violation.type} - ${violation.resource} (plugin: ${violation.pluginId})`,
    );
    this.name = 'SandboxViolationError';
  }
}
