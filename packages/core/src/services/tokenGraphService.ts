/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Token Graph Service
 *
 * Provides real-time token usage visualization with sparkline graphs.
 * Tracks token history for visual analysis of usage patterns.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Config } from '../config/config.js';

/**
 * Token usage record for a single message
 */
export interface TokenUsageRecord {
  /** Timestamp of the record */
  timestamp: number;
  /** Prompt tokens used */
  promptTokens: number;
  /** Generated tokens */
  generatedTokens: number;
  /** Cached tokens (if any) */
  cachedTokens: number;
  /** Model used */
  model: string;
  /** Message index in conversation */
  messageIndex: number;
}

/**
 * Token graph configuration
 */
export interface TokenGraphConfig {
  /** Maximum history records to keep */
  maxHistorySize: number;
  /** Sparkline width in characters */
  sparklineWidth: number;
  /** Enable auto-save to disk */
  autoSave: boolean;
  /** Save interval in milliseconds */
  saveInterval: number;
}

/**
 * Default configuration
 */
export const DEFAULT_TOKEN_GRAPH_CONFIG: TokenGraphConfig = {
  maxHistorySize: 100,
  sparklineWidth: 30,
  autoSave: true,
  saveInterval: 60000, // 1 minute
};

/**
 * Sparkline block characters for different heights
 */
const SPARKLINE_BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * Token Graph Service
 *
 * Manages token usage history and generates visual sparkline graphs.
 * Stores data in project directory for persistence.
 */
export class TokenGraphService {
  private history: TokenUsageRecord[] = [];
  private config: TokenGraphConfig;
  private savePath: string | null = null;
  private saveInterval: ReturnType<typeof setInterval> | null = null;
  private currentMessageIndex = 0;

  constructor(config: Partial<TokenGraphConfig> = {}) {
    this.config = { ...DEFAULT_TOKEN_GRAPH_CONFIG, ...config };
    // savePath will be set when setConfig is called
  }

  /**
   * Set the Config instance for project directory access
   */
  setConfig(appConfig: Config): void {
    // Use centralized project storage directory
    this.savePath = path.join(
      appConfig.storage.getProjectStorageDir(),
      'token-history.json',
    );
    this.loadFromDisk();
    this.startAutoSave();
  }

  /**
   * Record token usage for a message
   */
  recordUsage(
    promptTokens: number,
    generatedTokens: number,
    cachedTokens: number = 0,
    model: string = 'unknown',
  ): void {
    this.currentMessageIndex++;

    const record: TokenUsageRecord = {
      timestamp: Date.now(),
      promptTokens,
      generatedTokens,
      cachedTokens,
      model,
      messageIndex: this.currentMessageIndex,
    };

    this.history.push(record);

    // Trim history if needed
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize);
    }

    // Save immediately to prevent data loss on crash
    this.saveToDisk();
  }

  /**
   * Get all history records
   */
  getHistory(): TokenUsageRecord[] {
    return [...this.history];
  }

  /**
   * Import history from a previous session (for resume)
   */
  importHistory(history: TokenUsageRecord[]): void {
    if (history && history.length > 0) {
      this.history = history.map((record) => ({
        ...record,
        // Ensure all required fields exist
        timestamp: record.timestamp || Date.now(),
        promptTokens: record.promptTokens || 0,
        generatedTokens: record.generatedTokens || 0,
        cachedTokens: record.cachedTokens || 0,
        model: record.model || 'unknown',
        messageIndex: record.messageIndex || 0,
      }));
      // Update message index to continue from where we left off
      if (this.history.length > 0) {
        const maxIndex = Math.max(...this.history.map((r) => r.messageIndex));
        this.currentMessageIndex = maxIndex;
      }
      this.saveToDisk();
    }
  }

  /**
   * Get recent history
   */
  getRecentHistory(count: number = 20): TokenUsageRecord[] {
    return this.history.slice(-count);
  }

  /**
   * Generate sparkline for a series of values
   */
  generateSparkline(values: number[], width?: number): string {
    const w = width || this.config.sparklineWidth;
    if (values.length === 0) return '░'.repeat(w);

    // Calculate min and max
    const actualMax = Math.max(...values);
    const actualMin = Math.min(...values);

    // If all values are the same (including all zeros), show uniform minimum bars
    if (actualMax === actualMin) {
      // Use minimum block (▁) for uniform values - still shows activity
      return '▁'.repeat(w);
    }

    // Normalize values to fit sparkline
    const range = actualMax - actualMin;

    // Resample to fit width
    const result: string[] = [];
    const step = values.length / w;

    for (let i = 0; i < w; i++) {
      const index = Math.floor(i * step);
      const value = values[Math.min(index, values.length - 1)];
      const normalized = (value - actualMin) / range;
      // Ensure blockIndex is at least 1 (minimum bar) for non-zero values
      const blockIndex = Math.min(
        Math.max(1, Math.floor(normalized * (SPARKLINE_BLOCKS.length - 1))),
        SPARKLINE_BLOCKS.length - 1,
      );
      result.push(SPARKLINE_BLOCKS[blockIndex]);
    }

    return result.join('');
  }

  /**
   * Generate dual sparkline showing prompt and generated tokens
   */
  generateDualSparkline(width?: number): {
    prompt: string;
    generated: string;
    cached: string;
  } {
    const w = width || this.config.sparklineWidth;
    const promptValues = this.history.map((r) => r.promptTokens);
    const generatedValues = this.history.map((r) => r.generatedTokens);
    const cachedValues = this.history.map((r) => r.cachedTokens);

    return {
      prompt: this.generateSparkline(promptValues, w),
      generated: this.generateSparkline(generatedValues, w),
      cached: this.generateSparkline(cachedValues, w),
    };
  }

  /**
   * Generate combined sparkline (total tokens per message)
   */
  generateCombinedSparkline(width?: number): string {
    const w = width || this.config.sparklineWidth;
    const totalValues = this.history.map(
      (r) => r.promptTokens + r.generatedTokens,
    );
    return this.generateSparkline(totalValues, w);
  }

  /**
   * Generate rate sparkline (generated/prompt ratio)
   */
  generateRateSparkline(width?: number): string {
    const w = width || this.config.sparklineWidth;
    const rates = this.history.map((r) =>
      r.promptTokens > 0 ? r.generatedTokens / r.promptTokens : 0,
    );
    return this.generateSparkline(rates, w);
  }

  /**
   * Get statistics summary
   */
  getStatistics(): {
    totalPrompt: number;
    totalGenerated: number;
    totalCached: number;
    avgPrompt: number;
    avgGenerated: number;
    avgRate: number;
    maxPrompt: number;
    maxGenerated: number;
    peakRate: number;
    messageCount: number;
  } {
    if (this.history.length === 0) {
      return {
        totalPrompt: 0,
        totalGenerated: 0,
        totalCached: 0,
        avgPrompt: 0,
        avgGenerated: 0,
        avgRate: 0,
        maxPrompt: 0,
        maxGenerated: 0,
        peakRate: 0,
        messageCount: 0,
      };
    }

    const totalPrompt = this.history.reduce(
      (sum, r) => sum + r.promptTokens,
      0,
    );
    const totalGenerated = this.history.reduce(
      (sum, r) => sum + r.generatedTokens,
      0,
    );
    const totalCached = this.history.reduce(
      (sum, r) => sum + r.cachedTokens,
      0,
    );

    const avgPrompt = totalPrompt / this.history.length;
    const avgGenerated = totalGenerated / this.history.length;
    const avgRate = totalPrompt > 0 ? totalGenerated / totalPrompt : 0;

    const maxPrompt = Math.max(...this.history.map((r) => r.promptTokens));
    const maxGenerated = Math.max(
      ...this.history.map((r) => r.generatedTokens),
    );

    const rates = this.history.map((r) =>
      r.promptTokens > 0 ? r.generatedTokens / r.promptTokens : 0,
    );
    const peakRate = Math.max(...rates);

    return {
      totalPrompt,
      totalGenerated,
      totalCached,
      avgPrompt,
      avgGenerated,
      avgRate,
      maxPrompt,
      maxGenerated,
      peakRate,
      messageCount: this.history.length,
    };
  }

  /**
   * Generate formatted graph output
   */
  generateGraphOutput(): string {
    const stats = this.getStatistics();
    const sparklines = this.generateDualSparkline(40);

    const lines: string[] = [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                    Token Usage Graph                          ║',
      '╠══════════════════════════════════════════════════════════════╣',
    ];

    // Prompt sparkline
    lines.push(`║ Prompt:     ${sparklines.prompt} ║`);
    lines.push(`║             ${this.formatSparklineScale(stats.maxPrompt)} ║`);

    // Generated sparkline
    lines.push(`║ Generated:  ${sparklines.generated} ║`);
    lines.push(
      `║             ${this.formatSparklineScale(stats.maxGenerated)} ║`,
    );

    // Cached sparkline
    if (stats.totalCached > 0) {
      lines.push(`║ Cached:     ${sparklines.cached} ║`);
    }

    lines.push(
      '╠══════════════════════════════════════════════════════════════╣',
    );

    // Statistics
    lines.push(
      `║ Messages: ${stats.messageCount.toString().padEnd(10)} Total: ${this.formatTokens(stats.totalPrompt + stats.totalGenerated).padEnd(20)} ║`,
    );
    lines.push(
      `║ Avg Rate: ${stats.avgRate.toFixed(2).padEnd(9)} Peak: ${stats.peakRate.toFixed(2).padEnd(23)} ║`,
    );
    lines.push(
      '╚══════════════════════════════════════════════════════════════╝',
    );

    // Legend
    lines.push('');
    lines.push('Legend: ▁▂▃▄▅▆▇█ (low → high usage)');

    return lines.join('\n');
  }

  /**
   * Generate mini graph for inline display
   */
  generateMiniGraph(): string {
    const sparkline = this.generateCombinedSparkline(20);
    const stats = this.getStatistics();
    const total = stats.totalPrompt + stats.totalGenerated;

    return `Tokens: ${sparkline} ${this.formatTokens(total)}`;
  }

  /**
   * Format sparkline scale
   */
  private formatSparklineScale(max: number): string {
    const left = this.formatTokens(0);
    const right = this.formatTokens(max);
    const dots = '.'.repeat(40 - left.length - right.length);
    return `${left}${dots}${right}`;
  }

  /**
   * Format token count
   */
  private formatTokens(count: number): string {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentMessageIndex = 0;
  }

  /**
   * Load history from disk
   */
  private loadFromDisk(): void {
    if (!this.savePath) return;

    try {
      if (fs.existsSync(this.savePath)) {
        const content = fs.readFileSync(this.savePath, 'utf-8');
        const data = JSON.parse(content);
        this.history = data.history || [];
        this.currentMessageIndex = data.currentMessageIndex || 0;
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Save history to disk
   */
  saveToDisk(): void {
    if (!this.savePath) return;

    try {
      const dir = path.dirname(this.savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.savePath,
        JSON.stringify({
          history: this.history,
          currentMessageIndex: this.currentMessageIndex,
        }),
        'utf-8',
      );
    } catch {
      // Ignore errors
    }
  }

  /**
   * Start auto-save
   */
  startAutoSave(): void {
    if (this.config.autoSave && !this.saveInterval) {
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
   * Export history as JSON
   */
  exportJson(): string {
    return JSON.stringify(
      {
        history: this.history,
        statistics: this.getStatistics(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  /**
   * Export history as CSV
   */
  exportCsv(): string {
    const headers = [
      'timestamp',
      'messageIndex',
      'promptTokens',
      'generatedTokens',
      'cachedTokens',
      'model',
    ];
    const rows = this.history.map((r) =>
      [
        r.timestamp,
        r.messageIndex,
        r.promptTokens,
        r.generatedTokens,
        r.cachedTokens,
        r.model,
      ].join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Get usage by model
   */
  getByModel(): Record<
    string,
    { count: number; promptTokens: number; generatedTokens: number }
  > {
    const byModel: Record<
      string,
      { count: number; promptTokens: number; generatedTokens: number }
    > = {};

    for (const record of this.history) {
      if (!byModel[record.model]) {
        byModel[record.model] = {
          count: 0,
          promptTokens: 0,
          generatedTokens: 0,
        };
      }
      byModel[record.model].count++;
      byModel[record.model].promptTokens += record.promptTokens;
      byModel[record.model].generatedTokens += record.generatedTokens;
    }

    return byModel;
  }
}

/**
 * Singleton instance
 */
let tokenGraphServiceInstance: TokenGraphService | null = null;

/**
 * Get or create the TokenGraphService instance
 */
export function getTokenGraphService(config?: Config): TokenGraphService {
  if (!tokenGraphServiceInstance) {
    tokenGraphServiceInstance = new TokenGraphService();
  }
  if (config) {
    tokenGraphServiceInstance.setConfig(config);
  }
  return tokenGraphServiceInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetTokenGraphService(): void {
  if (tokenGraphServiceInstance) {
    tokenGraphServiceInstance.stopAutoSave();
  }
  tokenGraphServiceInstance = null;
}
