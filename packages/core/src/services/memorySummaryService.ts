/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory Summary Service
 *
 * Provides automatic summarization of model activities and context preservation
 * across sessions. This helps remind the model what it was doing in previous
 * interactions.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * A single activity record
 */
export interface ActivityRecord {
  /** Timestamp of the activity */
  timestamp: number;
  /** Type of activity */
  type: 'tool_call' | 'file_edit' | 'command' | 'thinking' | 'user_request' | 'response';
  /** Brief description of the activity */
  description: string;
  /** Additional context (file paths, command names, etc.) */
  context?: Record<string, string>;
  /** Importance weight (1-10) */
  importance: number;
}

/**
 * Memory summary configuration
 */
export interface MemorySummaryConfig {
  /** Maximum characters for the summary */
  maxSummaryLength: number;
  /** Maximum number of activities to keep */
  maxActivities: number;
  /** Enable auto-summarization */
  autoSummarize: boolean;
  /** Interval for auto-summarization (in activities) */
  summarizeInterval: number;
  /** Save interval in milliseconds */
  saveInterval: number;
}

/**
 * Default configuration
 */
export const DEFAULT_MEMORY_SUMMARY_CONFIG: MemorySummaryConfig = {
  maxSummaryLength: 2000,
  maxActivities: 100,
  autoSummarize: true,
  summarizeInterval: 10,
  saveInterval: 30000, // 30 seconds
};

/**
 * Memory state
 */
export interface MemoryState {
  /** Current compressed summary */
  summary: string;
  /** Recent activities */
  activities: ActivityRecord[];
  /** Last update timestamp */
  lastUpdated: number;
  /** Session start timestamp */
  sessionStart: number;
  /** Current goal/task (if any) */
  currentGoal?: string;
}

/**
 * Memory Summary Service
 *
 * Manages activity tracking and summary generation for context preservation.
 */
export class MemorySummaryService {
  private state: MemoryState;
  private config: MemorySummaryConfig;
  private savePath: string;
  private saveInterval: ReturnType<typeof setInterval> | null = null;
  private activityCount = 0;

  constructor(config: Partial<MemorySummaryConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_SUMMARY_CONFIG, ...config };
    this.savePath = path.join(os.homedir(), '.ollama-code', 'memory-summary.json');
    this.state = {
      summary: '',
      activities: [],
      lastUpdated: Date.now(),
      sessionStart: Date.now(),
    };
    this.loadFromDisk();
    this.startAutoSave();
  }

  /**
   * Record an activity
   */
  recordActivity(
    type: ActivityRecord['type'],
    description: string,
    context?: Record<string, string>,
    importance: number = 5,
  ): void {
    const record: ActivityRecord = {
      timestamp: Date.now(),
      type,
      description,
      context,
      importance,
    };

    this.state.activities.push(record);
    this.activityCount++;

    // Trim activities if needed
    if (this.state.activities.length > this.config.maxActivities) {
      this.state.activities = this.state.activities.slice(-this.config.maxActivities);
    }

    // Auto-summarize if interval reached
    if (
      this.config.autoSummarize &&
      this.activityCount >= this.config.summarizeInterval
    ) {
      this.compressSummary();
      this.activityCount = 0;
    }

    this.state.lastUpdated = Date.now();
  }

  /**
   * Set current goal/task
   */
  setCurrentGoal(goal: string): void {
    this.state.currentGoal = goal;
    this.state.lastUpdated = Date.now();
    this.saveToDisk();
  }

  /**
   * Get current goal
   */
  getCurrentGoal(): string | undefined {
    return this.state.currentGoal;
  }

  /**
   * Clear current goal
   */
  clearCurrentGoal(): void {
    this.state.currentGoal = undefined;
    this.state.lastUpdated = Date.now();
    this.saveToDisk();
  }

  /**
   * Compress activities into a summary
   */
  compressSummary(): string {
    if (this.state.activities.length === 0) {
      return this.state.summary;
    }

    // Group activities by type
    const grouped = new Map<string, ActivityRecord[]>();
    for (const activity of this.state.activities) {
      const existing = grouped.get(activity.type) || [];
      existing.push(activity);
      grouped.set(activity.type, existing);
    }

    // Build summary parts
    const parts: string[] = [];

    // Keep existing summary if any
    if (this.state.summary) {
      parts.push(this.state.summary);
    }

    // Add recent high-importance activities
    const recentImportant = this.state.activities
      .filter(a => a.importance >= 7)
      .slice(-5);

    if (recentImportant.length > 0) {
      parts.push('\n## Recent Important Actions:');
      for (const activity of recentImportant) {
        parts.push(`- [${activity.type}] ${activity.description}`);
        if (activity.context) {
          for (const [key, value] of Object.entries(activity.context)) {
            parts.push(`  ${key}: ${value}`);
          }
        }
      }
    }

    // Summarize by type
    for (const [type, activities] of grouped) {
      const count = activities.length;
      const descriptions = [...new Set(activities.map(a => a.description))];
      
      if (count > 3 && descriptions.length > 3) {
        parts.push(`\n## ${type} Summary:`);
        parts.push(`Total: ${count} activities`);
        parts.push(`Recent: ${descriptions.slice(-3).join(', ')}`);
      }
    }

    // Combine and trim
    let newSummary = parts.join('\n');
    
    // Trim to max length, keeping the end (more recent)
    if (newSummary.length > this.config.maxSummaryLength) {
      const excess = newSummary.length - this.config.maxSummaryLength;
      newSummary = '...[earlier context trimmed]...\n' + newSummary.slice(excess);
    }

    this.state.summary = newSummary;
    this.saveToDisk();

    return newSummary;
  }

  /**
   * Get full memory context for injection into prompts
   */
  getMemoryContext(): string {
    const parts: string[] = [];

    if (this.state.currentGoal) {
      parts.push(`## Current Goal:\n${this.state.currentGoal}`);
    }

    if (this.state.summary) {
      parts.push(`## Context Summary:\n${this.state.summary}`);
    }

    // Add recent activities (last 10)
    const recent = this.state.activities.slice(-10);
    if (recent.length > 0) {
      parts.push('## Recent Activities:');
      for (const activity of recent) {
        const time = new Date(activity.timestamp).toLocaleTimeString();
        parts.push(`- [${time}] ${activity.type}: ${activity.description}`);
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Get summary statistics
   */
  getStatistics(): {
    totalActivities: number;
    summaryLength: number;
    hasGoal: boolean;
    sessionDuration: number;
  } {
    return {
      totalActivities: this.state.activities.length,
      summaryLength: this.state.summary.length,
      hasGoal: !!this.state.currentGoal,
      sessionDuration: Date.now() - this.state.sessionStart,
    };
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.state = {
      summary: '',
      activities: [],
      lastUpdated: Date.now(),
      sessionStart: Date.now(),
    };
    this.activityCount = 0;
    this.saveToDisk();
  }

  /**
   * Reset for new session (keep summary, clear activities)
   */
  resetForNewSession(): void {
    // Keep the summary but clear activities for new session
    this.state.activities = [];
    this.state.sessionStart = Date.now();
    this.activityCount = 0;
    this.saveToDisk();
  }

  /**
   * Load state from disk
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.savePath)) {
        const content = fs.readFileSync(this.savePath, 'utf-8');
        const data = JSON.parse(content);
        this.state = {
          summary: data.summary || '',
          activities: data.activities || [],
          lastUpdated: data.lastUpdated || Date.now(),
          sessionStart: Date.now(), // Always start fresh session
          currentGoal: data.currentGoal,
        };
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Save state to disk
   */
  saveToDisk(): void {
    try {
      const dir = path.dirname(this.savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.savePath,
        JSON.stringify(this.state, null, 2),
        'utf-8',
      );
    } catch {
      // Ignore errors
    }
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(): void {
    if (this.config.saveInterval > 0 && !this.saveInterval) {
      this.saveInterval = setInterval(() => {
        this.saveToDisk();
      }, this.config.saveInterval);

      if (this.saveInterval.unref) {
        this.saveInterval.unref();
      }
    }
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
  }

  /**
   * Export as JSON
   */
  exportJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJson(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.state = {
        summary: data.summary || '',
        activities: data.activities || [],
        lastUpdated: data.lastUpdated || Date.now(),
        sessionStart: Date.now(),
        currentGoal: data.currentGoal,
      };
      this.saveToDisk();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const memorySummaryService = new MemorySummaryService();
