/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory Summary Service
 *
 * Aggregates activity logs and creates compressed summaries for session memory.
 * This service works with ChatRecordingService to provide context preservation
 * across sessions.
 */

import { createDebugLogger } from '../utils/debugLogger.js';
import type { Config, MemorySummarySettings } from '../config/config.js';
import type { ActivityType, ActivityLogRecordPayload } from '../types/activity.js';

const debugLogger = createDebugLogger('MEMORY_SUMMARY');

/**
 * Activity summary for a specific type
 */
export interface ActivitySummary {
  /** Type of activity */
  activityType: ActivityType;
  /** Total count of this activity type */
  count: number;
  /** Success count */
  successCount: number;
  /** Failure count */
  failureCount: number;
  /** Total duration in milliseconds */
  totalDurationMs: number;
  /** Average duration in milliseconds */
  avgDurationMs: number;
  /** Most recent activities (limited by maxSummaryLength) */
  recentActivities: ActivityLogRecordPayload[];
}

/**
 * Session memory summary
 */
export interface SessionMemorySummary {
  /** Session ID */
  sessionId: string;
  /** Timestamp when summary was created */
  timestamp: string;
  /** Total number of activities tracked */
  totalActivities: number;
  /** Summaries by activity type */
  byType: Record<ActivityType, ActivitySummary>;
  /** Files that were modified */
  modifiedFiles: string[];
  /** Tools that were used */
  toolsUsed: string[];
  /** Commands that were executed */
  commandsExecuted: string[];
  /** Human-readable summary text */
  summaryText: string;
  /** Key achievements/activities */
  keyHighlights: string[];
}

/**
 * Options for creating a memory summary
 */
export interface CreateSummaryOptions {
  /** Include all activities, not just recent ones */
  includeAll?: boolean;
  /** Custom max length override */
  maxLength?: number;
  /** Filter by activity types */
  filterTypes?: ActivityType[];
}

/**
 * Memory Summary Service class
 */
export class MemorySummaryService {
  private readonly config: Config;
  private readonly activities: ActivityLogRecordPayload[] = [];
  private lastSummaryTime: number = Date.now();
  private activityCountSinceSummary: number = 0;

  constructor(config: Config) {
    this.config = config;
    debugLogger.info('MemorySummaryService initialized');
  }

  /**
   * Get the configured settings
   */
  private getSettings(): MemorySummarySettings {
    return this.config.getMemorySummarySettings();
  }

  /**
   * Add an activity to the tracking buffer
   */
  addActivity(activity: ActivityLogRecordPayload): void {
    const settings = this.getSettings();
    const maxActivities = settings.maxActivities ?? 100;

    this.activities.push(activity);
    this.activityCountSinceSummary++;

    // Trim activities if exceeding max
    if (this.activities.length > maxActivities) {
      const excess = this.activities.length - maxActivities;
      this.activities.splice(0, excess);
      debugLogger.debug(`Trimmed ${excess} old activities`);
    }

    // Check if auto-summarize is enabled
    if (settings.autoSummarize !== false) {
      const interval = settings.summarizeInterval ?? 10;
      if (this.activityCountSinceSummary >= interval) {
        debugLogger.info('Auto-summarize triggered', {
          activityCount: this.activityCountSinceSummary,
          interval,
        });
        this.activityCountSinceSummary = 0;
      }
    }
  }

  /**
   * Get all tracked activities
   */
  getActivities(): ActivityLogRecordPayload[] {
    return [...this.activities];
  }

  /**
   * Get activities count
   */
  getActivityCount(): number {
    return this.activities.length;
  }

  /**
   * Create a summary of tracked activities
   */
  createSummary(options: CreateSummaryOptions = {}): SessionMemorySummary {
    const settings = this.getSettings();
    const maxLength = options.maxLength ?? settings.maxSummaryLength ?? 2000;
    const sessionId = this.config.getSessionId();

    debugLogger.info('Creating memory summary', {
      totalActivities: this.activities.length,
      maxLength,
    });

    // Filter activities if needed
    let activities = this.activities;
    if (options.filterTypes && options.filterTypes.length > 0) {
      activities = activities.filter(a => options.filterTypes!.includes(a.activityType));
    }

    // Build summaries by type
    const byType = this.buildTypeSummaries(activities, options.includeAll);

    // Extract key information
    const modifiedFiles = this.extractModifiedFiles(activities);
    const toolsUsed = this.extractToolsUsed(activities);
    const commandsExecuted = this.extractCommands(activities);

    // Generate human-readable summary
    const summaryText = this.generateSummaryText(activities, byType, maxLength);
    const keyHighlights = this.extractKeyHighlights(activities, byType);

    const summary: SessionMemorySummary = {
      sessionId,
      timestamp: new Date().toISOString(),
      totalActivities: activities.length,
      byType,
      modifiedFiles,
      toolsUsed,
      commandsExecuted,
      summaryText,
      keyHighlights,
    };

    debugLogger.info('Memory summary created', {
      totalActivities: summary.totalActivities,
      modifiedFiles: summary.modifiedFiles.length,
      toolsUsed: summary.toolsUsed.length,
    });

    return summary;
  }

  /**
   * Build activity summaries grouped by type
   */
  private buildTypeSummaries(
    activities: ActivityLogRecordPayload[],
    includeAll?: boolean,
  ): Record<ActivityType, ActivitySummary> {
    const settings = this.getSettings();
    const byType: Record<ActivityType, ActivitySummary> = {} as Record<ActivityType, ActivitySummary>;

    // Group activities by type
    const grouped = new Map<ActivityType, ActivityLogRecordPayload[]>();
    for (const activity of activities) {
      const list = grouped.get(activity.activityType) || [];
      list.push(activity);
      grouped.set(activity.activityType, list);
    }

    // Build summaries
    for (const [type, typeActivities] of grouped) {
      const successCount = typeActivities.filter(a => a.success).length;
      const failureCount = typeActivities.length - successCount;
      const durations = typeActivities
        .filter(a => a.durationMs !== undefined)
        .map(a => a.durationMs!);
      const totalDurationMs = durations.reduce((sum, d) => sum + d, 0);
      const avgDurationMs = durations.length > 0 ? totalDurationMs / durations.length : 0;

      // Get recent activities (limited)
      const maxRecent = Math.min(10, Math.floor((settings.maxSummaryLength ?? 2000) / 200));
      const recentActivities = includeAll
        ? typeActivities
        : typeActivities.slice(-maxRecent);

      byType[type] = {
        activityType: type,
        count: typeActivities.length,
        successCount,
        failureCount,
        totalDurationMs,
        avgDurationMs,
        recentActivities,
      };
    }

    return byType;
  }

  /**
   * Extract list of modified files
   */
  private extractModifiedFiles(activities: ActivityLogRecordPayload[]): string[] {
    const files = new Set<string>();

    for (const activity of activities) {
      if (activity.filePath && (activity.activityType === 'file_write' || activity.activityType === 'file_edit')) {
        files.add(activity.filePath);
      }
    }

    return Array.from(files);
  }

  /**
   * Extract list of tools used
   */
  private extractToolsUsed(activities: ActivityLogRecordPayload[]): string[] {
    const tools = new Set<string>();

    for (const activity of activities) {
      if (activity.toolName) {
        tools.add(activity.toolName);
      }
    }

    return Array.from(tools);
  }

  /**
   * Extract list of commands executed
   */
  private extractCommands(activities: ActivityLogRecordPayload[]): string[] {
    const commands: string[] = [];

    for (const activity of activities) {
      if (activity.command && activity.activityType === 'shell_command') {
        commands.push(activity.command);
      }
    }

    return commands;
  }

  /**
   * Generate human-readable summary text
   */
  private generateSummaryText(
    activities: ActivityLogRecordPayload[],
    byType: Record<ActivityType, ActivitySummary>,
    maxLength: number,
  ): string {
    const lines: string[] = [];

    // Overview
    const total = activities.length;
    const successCount = activities.filter(a => a.success).length;
    const failCount = total - successCount;

    lines.push(`Session Activity Summary (${total} activities)`);
    lines.push(`Success: ${successCount}, Failures: ${failCount}`);
    lines.push('');

    // By type breakdown
    for (const [type, summary] of Object.entries(byType)) {
      if (summary.count === 0) continue;

      const typeLabel = this.formatActivityType(type as ActivityType);
      lines.push(`### ${typeLabel}: ${summary.count} (${summary.successCount} success, ${summary.failureCount} failed)`);

      // Add recent activity descriptions
      const recentDesc = summary.recentActivities
        .slice(-3)
        .map(a => `  - ${a.description}${a.success ? '' : ' [FAILED]'}`)
        .join('\n');

      if (recentDesc) {
        lines.push(recentDesc);
      }
      lines.push('');
    }

    // Files modified
    const modifiedFiles = this.extractModifiedFiles(activities);
    if (modifiedFiles.length > 0) {
      lines.push(`### Modified Files (${modifiedFiles.length})`);
      modifiedFiles.slice(0, 10).forEach(f => lines.push(`  - ${f}`));
      if (modifiedFiles.length > 10) {
        lines.push(`  ... and ${modifiedFiles.length - 10} more`);
      }
      lines.push('');
    }

    // Tools used
    const toolsUsed = this.extractToolsUsed(activities);
    if (toolsUsed.length > 0) {
      lines.push(`### Tools Used (${toolsUsed.length})`);
      lines.push(`  ${toolsUsed.join(', ')}`);
    }

    let summary = lines.join('\n');

    // Truncate if needed
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }

    return summary;
  }

  /**
   * Extract key highlights from activities
   */
  private extractKeyHighlights(
    activities: ActivityLogRecordPayload[],
    byType: Record<ActivityType, ActivitySummary>,
  ): string[] {
    const highlights: string[] = [];

    // File operations
    const fileWrites = byType['file_write']?.count ?? 0;
    const fileEdits = byType['file_edit']?.count ?? 0;
    if (fileWrites > 0 || fileEdits > 0) {
      highlights.push(`Modified ${fileWrites + fileEdits} files`);
    }

    // Shell commands
    const shellCommands = byType['shell_command']?.count ?? 0;
    if (shellCommands > 0) {
      highlights.push(`Executed ${shellCommands} shell commands`);
    }

    // Tool calls
    const toolCalls = byType['tool_call']?.count ?? 0;
    if (toolCalls > 0) {
      highlights.push(`Made ${toolCalls} tool calls`);
    }

    // Model interactions
    const modelRequests = byType['model_request']?.count ?? 0;
    if (modelRequests > 0) {
      highlights.push(`${modelRequests} model requests`);
    }

    // Recent errors
    const errors = activities.filter(a => !a.success);
    if (errors.length > 0) {
      highlights.push(`${errors.length} errors encountered`);
    }

    return highlights;
  }

  /**
   * Format activity type for display
   */
  private formatActivityType(type: ActivityType): string {
    const labels: Record<ActivityType, string> = {
      tool_call: 'Tool Calls',
      file_read: 'File Reads',
      file_write: 'File Writes',
      file_edit: 'File Edits',
      shell_command: 'Shell Commands',
      model_request: 'Model Requests',
      model_response: 'Model Responses',
      user_action: 'User Actions',
    };
    return labels[type] || type;
  }

  /**
   * Clear all tracked activities
   */
  clearActivities(): void {
    this.activities.length = 0;
    this.activityCountSinceSummary = 0;
    debugLogger.info('Activities cleared');
  }

  /**
   * Reset the auto-summarize counter
   */
  resetAutoSummarizeCounter(): void {
    this.activityCountSinceSummary = 0;
    this.lastSummaryTime = Date.now();
  }

  /**
   * Get statistics about tracked activities
   */
  getStats(): {
    totalActivities: number;
    activitiesSinceSummary: number;
    lastSummaryTime: number;
    byTypeCount: Record<ActivityType, number>;
  } {
    const byTypeCount: Record<ActivityType, number> = {} as Record<ActivityType, number>;

    for (const activity of this.activities) {
      byTypeCount[activity.activityType] = (byTypeCount[activity.activityType] || 0) + 1;
    }

    return {
      totalActivities: this.activities.length,
      activitiesSinceSummary: this.activityCountSinceSummary,
      lastSummaryTime: this.lastSummaryTime,
      byTypeCount,
    };
  }
}

// Export singleton factory
let memorySummaryServiceInstance: MemorySummaryService | null = null;

/**
 * Get or create the MemorySummaryService instance
 */
export function getMemorySummaryService(config: Config): MemorySummaryService {
  if (!memorySummaryServiceInstance) {
    memorySummaryServiceInstance = new MemorySummaryService(config);
  }
  return memorySummaryServiceInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetMemorySummaryService(): void {
  memorySummaryServiceInstance = null;
}
