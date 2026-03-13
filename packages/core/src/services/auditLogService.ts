/**
 * Audit Log Service (Debug Mode Only)
 *
 * Lightweight audit logging that only activates when debugMode is enabled.
 * Uses the existing debugLogger for output.
 */

import type { DebugLogger } from '../utils/debugLogger.js';

/**
 * Audit event categories (simplified)
 */
export type AuditCategory = 'tool' | 'shell' | 'file' | 'git' | 'network';

/**
 * Audit event structure
 */
export interface AuditEvent {
  timestamp: string;
  category: AuditCategory;
  action: string;
  status: 'start' | 'success' | 'failure' | 'cancelled';
  duration?: number;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Audit Log Service - lightweight wrapper around debugLogger
 */
export class AuditLogService {
  private enabled: boolean = false;
  private logger: DebugLogger | null = null;

  /**
   * Enable audit logging (called when debugMode is active)
   */
  enable(logger?: DebugLogger): void {
    this.enabled = true;
    if (logger) {
      this.logger = logger;
    }
  }

  /**
   * Disable audit logging
   */
  disable(): void {
    this.enabled = false;
    this.logger = null;
  }

  /**
   * Check if audit logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.logger !== null;
  }

  /**
   * Log an audit event
   */
  log(event: Omit<AuditEvent, 'timestamp'>): void {
    if (!this.isEnabled() || !this.logger) {
      return;
    }

    const prefix = `[AUDIT][${event.category.toUpperCase()}]`;
    const statusIcon =
      event.status === 'success'
        ? '✓'
        : event.status === 'failure'
          ? '✗'
          : event.status === 'cancelled'
            ? '⊘'
            : '→';

    const msg = `${prefix} ${statusIcon} ${event.action}: ${event.message}${
      event.duration ? ` (${event.duration}ms)` : ''
    }`;

    if (event.status === 'failure') {
      this.logger.warn(msg);
      if (event.details) {
        this.logger.debug('Details:', event.details);
      }
    } else {
      this.logger.debug(msg);
    }
  }

  /**
   * Log tool execution
   */
  logTool(
    toolName: string,
    action: 'start' | 'success' | 'failure',
    details?: Record<string, unknown>,
    duration?: number,
  ): void {
    this.log({
      category: 'tool',
      action: toolName,
      status: action,
      message: details?.['error'] ? String(details['error']) : '',
      details,
      duration,
    });
  }

  /**
   * Log shell command execution
   */
  logShell(
    command: string,
    status: 'success' | 'failure' | 'cancelled',
    exitCode?: number,
    duration?: number,
  ): void {
    this.log({
      category: 'shell',
      action: 'execute',
      status,
      message:
        command.length > 100 ? command.substring(0, 100) + '...' : command,
      details: exitCode !== undefined ? { exitCode } : undefined,
      duration,
    });
  }

  /**
   * Log file operation
   */
  logFile(
    operation: 'read' | 'write' | 'edit' | 'delete' | 'glob' | 'grep',
    path: string,
    status: 'success' | 'failure',
    duration?: number,
  ): void {
    this.log({
      category: 'file',
      action: operation,
      status,
      message: path,
      duration,
    });
  }

  /**
   * Log git operation
   */
  logGit(
    operation: string,
    status: 'success' | 'failure',
    details?: Record<string, unknown>,
  ): void {
    this.log({
      category: 'git',
      action: operation,
      status,
      message: '',
      details,
    });
  }

  /**
   * Log network operation
   */
  logNetwork(
    operation: string,
    url: string,
    status: 'success' | 'failure',
    duration?: number,
  ): void {
    this.log({
      category: 'network',
      action: operation,
      status,
      message: url,
      duration,
    });
  }
}

// Singleton instance
export const auditLogService = new AuditLogService();
