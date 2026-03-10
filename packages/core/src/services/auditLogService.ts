/**
 * Audit Log Service
 *
 * Provides comprehensive audit logging for security and compliance.
 * Tracks all tool executions, permission changes, and system events.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('AUDIT_LOG');

/**
 * Audit event severity levels
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Audit event categories
 */
export type AuditCategory =
  | 'tool_execution'
  | 'tool_confirmation'
  | 'permission_change'
  | 'session'
  | 'authentication'
  | 'file_operation'
  | 'shell_command'
  | 'network'
  | 'ssh'
  | 'git'
  | 'config_change'
  | 'plugin'
  | 'system';

/**
 * Audit event structure
 */
export interface AuditEvent {
  /** Unique event ID */
  id: string;

  /** Timestamp in ISO format */
  timestamp: string;

  /** Event category */
  category: AuditCategory;

  /** Event type within category */
  type: string;

  /** Severity level */
  severity: AuditSeverity;

  /** Human-readable message */
  message: string;

  /** User who triggered the event */
  user?: string;

  /** Session ID */
  sessionId?: string;

  /** Tool name if applicable */
  toolName?: string;

  /** Tool parameters (sanitized) */
  toolParams?: Record<string, unknown>;

  /** Result status */
  status: 'success' | 'failure' | 'cancelled' | 'pending';

  /** Error message if failed */
  error?: string;

  /** Exit code for commands */
  exitCode?: number;

  /** Duration in milliseconds */
  duration?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Source IP or host */
  source?: string;

  /** Target resource */
  target?: string;

  /** File paths involved */
  files?: string[];

  /** Commands executed */
  commands?: string[];

  /** Tags for filtering */
  tags?: string[];
}

/**
 * Audit log configuration
 */
export interface AuditLogConfig {
  /** Enable audit logging */
  enabled: boolean;

  /** Log file path */
  logFilePath: string;

  /** Maximum log file size in bytes (0 = unlimited) */
  maxFileSize: number;

  /** Maximum number of log files to keep */
  maxFiles: number;

  /** Minimum severity to log */
  minSeverity: AuditSeverity;

  /** Categories to log (empty = all) */
  categories: AuditCategory[];

  /** Categories to exclude */
  excludeCategories: AuditCategory[];

  /** Include tool parameters in logs */
  includeToolParams: boolean;

  /** Sanitize sensitive data */
  sanitizeSensitive: boolean;

  /** Sensitive parameter names to sanitize */
  sensitiveParams: string[];

  /** Log to console as well */
  logToConsole: boolean;

  /** Include stack traces for errors */
  includeStackTrace: boolean;

  /** Rotation interval in hours (0 = disabled) */
  rotationInterval: number;
}

/**
 * Default audit log configuration
 */
export const DEFAULT_AUDIT_LOG_CONFIG: AuditLogConfig = {
  enabled: true,
  logFilePath: '',
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  maxFiles: 10,
  minSeverity: 'info',
  categories: [],
  excludeCategories: [],
  includeToolParams: true,
  sanitizeSensitive: true,
  sensitiveParams: [
    'password',
    'apiKey',
    'api_key',
    'token',
    'secret',
    'credential',
    'privateKey',
    'private_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
  ],
  logToConsole: false,
  includeStackTrace: false,
  rotationInterval: 24, // Daily rotation
};

/**
 * Audit log statistics
 */
export interface AuditLogStats {
  totalEvents: number;
  eventsByCategory: Record<AuditCategory, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsByStatus: Record<string, number>;
  oldestEvent: string | null;
  newestEvent: string | null;
  logFileSize: number;
  logFileCount: number;
}

/**
 * Query options for searching audit logs
 */
export interface AuditLogQuery {
  /** Filter by category */
  category?: AuditCategory;

  /** Filter by severity */
  severity?: AuditSeverity;

  /** Filter by status */
  status?: string;

  /** Filter by tool name */
  toolName?: string;

  /** Filter by session ID */
  sessionId?: string;

  /** Filter by user */
  user?: string;

  /** Filter by start time */
  startTime?: string;

  /** Filter by end time */
  endTime?: string;

  /** Filter by tags */
  tags?: string[];

  /** Search in message */
  search?: string;

  /** Limit results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit Log Service class
 */
export class AuditLogService {
  private config: AuditLogConfig;
  private logPath: string;
  private eventBuffer: AuditEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private stats: AuditLogStats;

  constructor(config: Partial<AuditLogConfig> = {}) {
    this.config = { ...DEFAULT_AUDIT_LOG_CONFIG, ...config };

    // Set default log file path
    if (!this.config.logFilePath) {
      const appDir = path.join(os.homedir(), '.ollama-code');
      this.logPath = path.join(appDir, 'audit.log');
    } else {
      this.logPath = this.config.logFilePath;
    }

    // Ensure log directory exists
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Initialize stats
    this.stats = {
      totalEvents: 0,
      eventsByCategory: {} as Record<AuditCategory, number>,
      eventsBySeverity: {} as Record<AuditSeverity, number>,
      eventsByStatus: {},
      oldestEvent: null,
      newestEvent: null,
      logFileSize: 0,
      logFileCount: 1,
    };

    // Start periodic flush
    this.startFlushInterval();
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `evt_${timestamp}_${random}`;
  }

  /**
   * Sanitize sensitive parameters
   */
  private sanitizeParams(
    params: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!params || !this.config.sanitizeSensitive) {
      return params;
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.config.sensitiveParams.some((s) =>
        lowerKey.includes(s.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeParams(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if event should be logged based on config
   */
  private shouldLog(event: AuditEvent): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Check severity
    const severityLevels: AuditSeverity[] = [
      'info',
      'warning',
      'error',
      'critical',
    ];
    const minIndex = severityLevels.indexOf(this.config.minSeverity);
    const eventIndex = severityLevels.indexOf(event.severity);

    if (eventIndex < minIndex) {
      return false;
    }

    // Check category filter
    if (
      this.config.categories.length > 0 &&
      !this.config.categories.includes(event.category)
    ) {
      return false;
    }

    // Check excluded categories
    if (this.config.excludeCategories.includes(event.category)) {
      return false;
    }

    return true;
  }

  /**
   * Log an audit event
   */
  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      toolParams: this.config.includeToolParams
        ? this.sanitizeParams(event.toolParams)
        : undefined,
    };

    if (!this.shouldLog(fullEvent)) {
      return fullEvent;
    }

    // Add to buffer
    this.eventBuffer.push(fullEvent);

    // Update stats
    this.updateStats(fullEvent);

    // Log to console if enabled
    if (this.config.logToConsole) {
      this.logToConsole(fullEvent);
    }

    // Flush if buffer is large
    if (this.eventBuffer.length >= 100) {
      this.flush();
    }

    debugLogger.debug(`Audit event: ${fullEvent.category}/${fullEvent.type}`);
    return fullEvent;
  }

  /**
   * Log tool execution start
   */
  logToolStart(
    toolName: string,
    params: Record<string, unknown>,
    sessionId?: string,
  ): AuditEvent {
    return this.log({
      category: 'tool_execution',
      type: 'tool_start',
      severity: 'info',
      message: `Tool ${toolName} started`,
      toolName,
      toolParams: params,
      sessionId,
      status: 'pending',
    });
  }

  /**
   * Log tool execution end
   */
  logToolEnd(
    toolName: string,
    params: Record<string, unknown>,
    status: 'success' | 'failure' | 'cancelled',
    duration: number,
    sessionId?: string,
    error?: string,
    exitCode?: number,
  ): AuditEvent {
    return this.log({
      category: 'tool_execution',
      type: 'tool_end',
      severity: status === 'failure' ? 'error' : 'info',
      message: `Tool ${toolName} ${status}`,
      toolName,
      toolParams: params,
      sessionId,
      status,
      duration,
      error,
      exitCode,
    });
  }

  /**
   * Log tool confirmation
   */
  logToolConfirmation(
    toolName: string,
    outcome: 'approved' | 'denied' | 'approved_always',
    sessionId?: string,
  ): AuditEvent {
    return this.log({
      category: 'tool_confirmation',
      type: 'confirmation',
      severity: outcome === 'denied' ? 'warning' : 'info',
      message: `Tool ${toolName} ${outcome.replace('_', ' ')}`,
      toolName,
      sessionId,
      status: outcome === 'denied' ? 'cancelled' : 'success',
    });
  }

  /**
   * Log shell command
   */
  logShellCommand(
    command: string,
    status: 'success' | 'failure' | 'cancelled',
    exitCode?: number,
    duration?: number,
    sessionId?: string,
  ): AuditEvent {
    return this.log({
      category: 'shell_command',
      type: 'command_executed',
      severity: status === 'failure' ? 'error' : 'info',
      message: `Shell command: ${command.substring(0, 100)}...`,
      commands: [command],
      sessionId,
      status,
      exitCode,
      duration,
    });
  }

  /**
   * Log SSH connection
   */
  logSSHConnection(
    host: string,
    user: string,
    command: string,
    status: 'success' | 'failure' | 'cancelled',
    sessionId?: string,
  ): AuditEvent {
    return this.log({
      category: 'ssh',
      type: 'ssh_connection',
      severity: status === 'failure' ? 'error' : 'info',
      message: `SSH ${user}@${host}: ${command.substring(0, 50)}...`,
      source: host,
      target: `${user}@${host}`,
      commands: [command],
      sessionId,
      status,
    });
  }

  /**
   * Log file operation
   */
  logFileOperation(
    operation: 'read' | 'write' | 'edit' | 'delete',
    filePath: string,
    status: 'success' | 'failure',
    sessionId?: string,
  ): AuditEvent {
    return this.log({
      category: 'file_operation',
      type: `file_${operation}`,
      severity: status === 'failure' ? 'error' : 'info',
      message: `File ${operation}: ${filePath}`,
      files: [filePath],
      target: filePath,
      sessionId,
      status,
    });
  }

  /**
   * Log git operation
   */
  logGitOperation(
    operation: string,
    status: 'success' | 'failure',
    sessionId?: string,
    metadata?: Record<string, unknown>,
  ): AuditEvent {
    return this.log({
      category: 'git',
      type: `git_${operation}`,
      severity: status === 'failure' ? 'error' : 'info',
      message: `Git ${operation}`,
      sessionId,
      status,
      metadata,
    });
  }

  /**
   * Log permission change
   */
  logPermissionChange(
    tool: string,
    level: string,
    sessionId?: string,
  ): AuditEvent {
    return this.log({
      category: 'permission_change',
      type: 'permission_updated',
      severity: 'warning',
      message: `Permission for ${tool} changed to ${level}`,
      toolName: tool,
      sessionId,
      status: 'success',
    });
  }

  /**
   * Log session event
   */
  logSessionEvent(
    event: 'start' | 'end' | 'save' | 'load' | 'delete',
    sessionId: string,
    metadata?: Record<string, unknown>,
  ): AuditEvent {
    return this.log({
      category: 'session',
      type: `session_${event}`,
      severity: 'info',
      message: `Session ${event}`,
      sessionId,
      status: 'success',
      metadata,
    });
  }

  /**
   * Log plugin event
   */
  logPluginEvent(
    event: 'load' | 'enable' | 'disable' | 'error',
    pluginName: string,
    metadata?: Record<string, unknown>,
  ): AuditEvent {
    return this.log({
      category: 'plugin',
      type: `plugin_${event}`,
      severity: event === 'error' ? 'error' : 'info',
      message: `Plugin ${pluginName} ${event}`,
      metadata: { pluginName, ...metadata },
      status: event === 'error' ? 'failure' : 'success',
    });
  }

  /**
   * Log config change
   */
  logConfigChange(
    key: string,
    oldValue: unknown,
    newValue: unknown,
    sessionId?: string,
  ): AuditEvent {
    return this.log({
      category: 'config_change',
      type: 'config_updated',
      severity: 'warning',
      message: `Config ${key} changed`,
      metadata: { key, oldValue: String(oldValue), newValue: String(newValue) },
      sessionId,
      status: 'success',
    });
  }

  /**
   * Update statistics
   */
  private updateStats(event: AuditEvent): void {
    this.stats.totalEvents++;

    // Update category counts
    if (!this.stats.eventsByCategory[event.category]) {
      this.stats.eventsByCategory[event.category] = 0;
    }
    this.stats.eventsByCategory[event.category]++;

    // Update severity counts
    if (!this.stats.eventsBySeverity[event.severity]) {
      this.stats.eventsBySeverity[event.severity] = 0;
    }
    this.stats.eventsBySeverity[event.severity]++;

    // Update status counts
    if (!this.stats.eventsByStatus[event.status]) {
      this.stats.eventsByStatus[event.status] = 0;
    }
    this.stats.eventsByStatus[event.status]++;

    // Update time range
    if (!this.stats.oldestEvent || event.timestamp < this.stats.oldestEvent) {
      this.stats.oldestEvent = event.timestamp;
    }
    if (!this.stats.newestEvent || event.timestamp > this.stats.newestEvent) {
      this.stats.newestEvent = event.timestamp;
    }
  }

  /**
   * Log to console
   */
  private logToConsole(event: AuditEvent): void {
    const severityColors: Record<AuditSeverity, string> = {
      info: '\x1b[36m', // Cyan
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      critical: '\x1b[35m', // Magenta
    };

    const color = severityColors[event.severity] || '\x1b[0m';
    const reset = '\x1b[0m';

    console.log(
      `${color}[AUDIT]${reset} ${event.timestamp} [${event.severity.toUpperCase()}] [${event.category}] ${event.message}`,
    );
  }

  /**
   * Flush event buffer to file
   */
  flush(): void {
    if (this.eventBuffer.length === 0) {
      return;
    }

    try {
      // Check file size and rotate if needed
      this.rotateIfNeeded();

      // Append events to log file
      const lines = this.eventBuffer.map((e) => JSON.stringify(e)).join('\n') + '\n';
      fs.appendFileSync(this.logPath, lines, 'utf-8');

      // Update file size
      const stats = fs.statSync(this.logPath);
      this.stats.logFileSize = stats.size;

      // Clear buffer
      debugLogger.debug(`Flushed ${this.eventBuffer.length} audit events`);
      this.eventBuffer = [];
    } catch (error) {
      debugLogger.error('Failed to flush audit log:', error);
    }
  }

  /**
   * Rotate log file if needed
   */
  private rotateIfNeeded(): void {
    if (this.config.maxFileSize === 0) {
      return;
    }

    try {
      if (!fs.existsSync(this.logPath)) {
        return;
      }

      const stats = fs.statSync(this.logPath);
      if (stats.size >= this.config.maxFileSize) {
        // Rotate: rename current file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = `${this.logPath}.${timestamp}`;
        fs.renameSync(this.logPath, rotatedPath);

        // Clean up old files
        this.cleanupOldFiles();

        this.stats.logFileCount++;
        debugLogger.info(`Rotated audit log to ${rotatedPath}`);
      }
    } catch (error) {
      debugLogger.error('Failed to rotate audit log:', error);
    }
  }

  /**
   * Clean up old log files
   */
  private cleanupOldFiles(): void {
    if (this.config.maxFiles <= 0) {
      return;
    }

    try {
      const logDir = path.dirname(this.logPath);
      const logBase = path.basename(this.logPath);
      const files = fs.readdirSync(logDir);

      // Find rotated log files
      const logFiles = files
        .filter((f) => f.startsWith(logBase) && f !== logBase)
        .map((f) => ({
          name: f,
          path: path.join(logDir, f),
          time: fs.statSync(path.join(logDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      // Remove files beyond maxFiles
      const toRemove = logFiles.slice(this.config.maxFiles - 1);
      for (const file of toRemove) {
        fs.unlinkSync(file.path);
        debugLogger.debug(`Removed old audit log: ${file.name}`);
      }

      this.stats.logFileCount = Math.min(logFiles.length + 1, this.config.maxFiles);
    } catch (error) {
      debugLogger.error('Failed to cleanup old audit logs:', error);
    }
  }

  /**
   * Start periodic flush interval
   */
  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Stop flush interval
   */
  stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Query audit logs
   */
  query(query: AuditLogQuery): AuditEvent[] {
    const results: AuditEvent[] = [];

    try {
      if (!fs.existsSync(this.logPath)) {
        return results;
      }

      const content = fs.readFileSync(this.logPath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event = JSON.parse(line) as AuditEvent;

          // Apply filters
          if (query.category && event.category !== query.category) continue;
          if (query.severity && event.severity !== query.severity) continue;
          if (query.status && event.status !== query.status) continue;
          if (query.toolName && event.toolName !== query.toolName) continue;
          if (query.sessionId && event.sessionId !== query.sessionId) continue;
          if (query.user && event.user !== query.user) continue;
          if (query.startTime && event.timestamp < query.startTime) continue;
          if (query.endTime && event.timestamp > query.endTime) continue;
          if (query.search && !event.message.toLowerCase().includes(query.search.toLowerCase())) continue;

          // Tag filter
          if (query.tags && query.tags.length > 0) {
            const eventTags = event.tags || [];
            if (!query.tags.some((t) => eventTags.includes(t))) continue;
          }

          results.push(event);
        } catch {
          // Skip malformed lines
        }
      }

      // Sort
      if (query.sortOrder === 'asc') {
        results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      } else {
        results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || results.length;

      return results.slice(offset, offset + limit);
    } catch (error) {
      debugLogger.error('Failed to query audit logs:', error);
      return results;
    }
  }

  /**
   * Get statistics
   */
  getStats(): AuditLogStats {
    // Update file size
    try {
      if (fs.existsSync(this.logPath)) {
        const stats = fs.statSync(this.logPath);
        this.stats.logFileSize = stats.size;
      }
    } catch {
      // Ignore
    }

    return { ...this.stats };
  }

  /**
   * Export logs to JSON
   */
  export(format: 'json' | 'csv' = 'json'): string {
    const events = this.query({ sortOrder: 'asc' });

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }

    // CSV format
    const headers = [
      'id',
      'timestamp',
      'category',
      'type',
      'severity',
      'message',
      'status',
      'toolName',
      'duration',
      'error',
    ];
    const rows = events.map((e) =>
      headers.map((h) => String((e as unknown as Record<string, unknown>)[h] || '')).join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Clear all logs
   */
  clear(): void {
    try {
      if (fs.existsSync(this.logPath)) {
        fs.unlinkSync(this.logPath);
      }

      // Reset stats
      this.stats = {
        totalEvents: 0,
        eventsByCategory: {} as Record<AuditCategory, number>,
        eventsBySeverity: {} as Record<AuditSeverity, number>,
        eventsByStatus: {},
        oldestEvent: null,
        newestEvent: null,
        logFileSize: 0,
        logFileCount: 1,
      };

      debugLogger.info('Cleared all audit logs');
    } catch (error) {
      debugLogger.error('Failed to clear audit logs:', error);
    }
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    this.stopFlushInterval();
    this.flush();
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
