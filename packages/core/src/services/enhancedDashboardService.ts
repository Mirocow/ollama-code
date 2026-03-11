/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enhanced Performance Dashboard Service
 *
 * Provides comprehensive session analytics including:
 * - Real-time speed metrics (tokens/second)
 * - Thinking time tracking
 * - File operations statistics
 * - Enhanced visualization with charts
 * - Session history with detailed metrics
 */

import type { Storage } from '../config/storage.js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { getOllamaDir } from '../utils/paths.js';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('performance-dashboard');

/**
 * Speed metrics for real-time tracking
 */
export interface SpeedMetrics {
  /** Tokens per second (average) */
  averageTps: number;
  /** Peak tokens per second */
  peakTps: number;
  /** Current tokens per second (last measurement) */
  currentTps: number;
  /** Time spent thinking (processing) in ms */
  thinkingTimeMs: number;
  /** Time spent generating in ms */
  generatingTimeMs: number;
  /** Total session time in ms */
  totalSessionTimeMs: number;
}

/**
 * File operation record
 */
export interface FileOperationRecord {
  /** File path */
  path: string;
  /** Operation type */
  operation: 'read' | 'write' | 'edit' | 'delete' | 'create';
  /** Timestamp */
  timestamp: number;
  /** Lines affected */
  linesAffected?: number;
  /** Bytes affected */
  bytesAffected?: number;
}

/**
 * Tool execution record
 */
export interface ToolExecutionRecord {
  /** Tool name */
  toolName: string;
  /** Timestamp */
  timestamp: number;
  /** Duration in ms */
  duration: number;
  /** Success status */
  success: boolean;
  /** Decision (if user was asked) */
  decision?: 'accept' | 'reject' | 'auto';
}

/**
 * Enhanced session record
 */
export interface EnhancedSessionRecord {
  sessionId: string;
  startTime: number;
  endTime?: number;
  model: string;

  // Token metrics
  promptTokens: number;
  generatedTokens: number;
  cachedTokens: number;

  // Speed metrics
  speedMetrics: SpeedMetrics;

  // Tool metrics
  toolCalls: number;
  toolExecutions: ToolExecutionRecord[];

  // File metrics
  fileOperations: FileOperationRecord[];
  filesRead: number;
  filesWritten: number;
  filesEdited: number;
  linesEdited: number;

  // Git metrics
  gitOperations: number;

  // Error tracking
  errors: number;
  errorDetails: Array<{ timestamp: number; message: string }>;

  // Cost
  cost: number;

  // Message count
  messagesCount: number;
}

/**
 * Enhanced dashboard statistics
 */
export interface EnhancedDashboardStats {
  // Current session
  currentSession: {
    duration: number;
    promptTokens: number;
    generatedTokens: number;
    cachedTokens: number;
    speedMetrics: SpeedMetrics;
    toolCalls: number;
    toolsUsed: string[];
    filesRead: number;
    filesWritten: number;
    filesEdited: number;
    linesEdited: number;
    cost: number;
    messagesCount: number;
    errors: number;
  };

  // Aggregated stats
  aggregated: {
    totalSessions: number;
    totalPromptTokens: number;
    totalGeneratedTokens: number;
    totalCachedTokens: number;
    totalToolCalls: number;
    totalCost: number;
    totalFilesRead: number;
    totalFilesWritten: number;
    totalLinesEdited: number;
    averageSessionDuration: number;
    averageTps: number;
    mostUsedModel: string;
    mostUsedTools: Array<{ name: string; count: number; avgDuration: number }>;
    bestPerformingModel: { model: string; avgTps: number };
  };

  // Time-based stats
  daily: Array<{
    date: string;
    sessions: number;
    tokens: number;
    cost: number;
    avgTps: number;
  }>;

  // Model usage
  modelUsage: Array<{
    model: string;
    sessions: number;
    tokens: number;
    cost: number;
    avgTps: number;
    avgCachedRate: number;
  }>;

  // Performance trends
  trends: {
    tpsHistory: number[];
    tokenHistory: number[];
    timestamps: number[];
  };
}

/**
 * Enhanced Performance Dashboard Service
 */
export class EnhancedDashboardService {
  private sessionStart: number;
  private currentSessionId: string;
  private metricsFile: string;

  // Real-time tracking
  private tokenEvents: Array<{
    timestamp: number;
    tokens: number;
    type: 'prompt' | 'generated';
  }> = [];
  private toolExecutions: ToolExecutionRecord[] = [];
  private fileOperations: FileOperationRecord[] = [];
  private messagesCount = 0;
  private errors: Array<{ timestamp: number; message: string }> = [];
  private lastGenerationStart: number | null = null;
  private totalThinkingTime = 0;
  private totalGeneratingTime = 0;

  constructor(_storage: Storage, sessionId: string) {
    this.sessionStart = Date.now();
    this.currentSessionId = sessionId;
    this.metricsFile = path.join(
      getOllamaDir(),
      'enhanced-dashboard-metrics.json',
    );
    this.ensureMetricsFile();
    logger.info('Enhanced dashboard service initialized', { sessionId });
  }

  private ensureMetricsFile(): void {
    const dir = path.dirname(this.metricsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.metricsFile)) {
      fs.writeFileSync(this.metricsFile, JSON.stringify({ sessions: [] }));
    }
  }

  /**
   * Record token generation event
   */
  recordTokenEvent(tokens: number, type: 'prompt' | 'generated'): void {
    this.tokenEvents.push({
      timestamp: Date.now(),
      tokens,
      type,
    });
  }

  /**
   * Start thinking (processing) timer
   */
  startThinking(): void {
    this.lastGenerationStart = Date.now();
  }

  /**
   * End thinking timer
   */
  endThinking(): void {
    if (this.lastGenerationStart) {
      this.totalThinkingTime += Date.now() - this.lastGenerationStart;
      this.lastGenerationStart = null;
    }
  }

  /**
   * Record generation time
   */
  recordGenerationTime(durationMs: number): void {
    this.totalGeneratingTime += durationMs;
  }

  /**
   * Record tool execution
   */
  recordToolExecution(
    toolName: string,
    duration: number,
    success: boolean,
    decision?: 'accept' | 'reject' | 'auto',
  ): void {
    this.toolExecutions.push({
      toolName,
      timestamp: Date.now(),
      duration,
      success,
      decision,
    });
  }

  /**
   * Record file operation
   */
  recordFileOperation(
    filePath: string,
    operation: FileOperationRecord['operation'],
    linesAffected?: number,
    bytesAffected?: number,
  ): void {
    this.fileOperations.push({
      path: filePath,
      operation,
      timestamp: Date.now(),
      linesAffected,
      bytesAffected,
    });
  }

  /**
   * Increment message count
   */
  incrementMessageCount(): void {
    this.messagesCount++;
  }

  /**
   * Record error
   */
  recordError(message: string): void {
    this.errors.push({
      timestamp: Date.now(),
      message: message.slice(0, 200), // Truncate long messages
    });
  }

  /**
   * Calculate speed metrics
   */
  calculateSpeedMetrics(): SpeedMetrics {
    const generatedEvents = this.tokenEvents.filter(
      (e) => e.type === 'generated',
    );

    if (generatedEvents.length === 0 || this.totalGeneratingTime === 0) {
      return {
        averageTps: 0,
        peakTps: 0,
        currentTps: 0,
        thinkingTimeMs: this.totalThinkingTime,
        generatingTimeMs: this.totalGeneratingTime,
        totalSessionTimeMs: Date.now() - this.sessionStart,
      };
    }

    const totalGenerated = generatedEvents.reduce(
      (sum, e) => sum + e.tokens,
      0,
    );
    const averageTps = (totalGenerated / this.totalGeneratingTime) * 1000;

    // Calculate peak TPS (sliding window)
    let peakTps = 0;
    const windowSize = 5000; // 5 second window
    const now = Date.now();

    for (let i = 0; i < generatedEvents.length; i++) {
      const windowEvents = generatedEvents.filter(
        (e) =>
          e.timestamp >= generatedEvents[i].timestamp &&
          e.timestamp <= generatedEvents[i].timestamp + windowSize,
      );
      const windowTokens = windowEvents.reduce((sum, e) => sum + e.tokens, 0);
      const windowTps = (windowTokens / windowSize) * 1000;
      peakTps = Math.max(peakTps, windowTps);
    }

    // Current TPS (last 2 seconds)
    const recentEvents = generatedEvents.filter(
      (e) => e.timestamp >= now - 2000,
    );
    const recentTokens = recentEvents.reduce((sum, e) => sum + e.tokens, 0);
    const currentTps = (recentTokens / 2000) * 1000;

    return {
      averageTps: Math.round(averageTps * 10) / 10,
      peakTps: Math.round(peakTps * 10) / 10,
      currentTps: Math.round(currentTps * 10) / 10,
      thinkingTimeMs: this.totalThinkingTime,
      generatingTimeMs: this.totalGeneratingTime,
      totalSessionTimeMs: Date.now() - this.sessionStart,
    };
  }

  /**
   * Save current session
   */
  saveSession(metrics: Partial<EnhancedSessionRecord>): void {
    const data = this.readMetricsData();
    const speedMetrics = this.calculateSpeedMetrics();

    const session: EnhancedSessionRecord = {
      sessionId: this.currentSessionId,
      startTime: this.sessionStart,
      model: metrics.model || 'unknown',
      promptTokens: metrics.promptTokens || 0,
      generatedTokens: metrics.generatedTokens || 0,
      cachedTokens: metrics.cachedTokens || 0,
      speedMetrics,
      toolCalls: this.toolExecutions.length,
      toolExecutions: this.toolExecutions.slice(-50), // Keep last 50
      fileOperations: this.fileOperations.slice(-100), // Keep last 100
      filesRead: this.fileOperations.filter((f) => f.operation === 'read')
        .length,
      filesWritten: this.fileOperations.filter(
        (f) => f.operation === 'write' || f.operation === 'create',
      ).length,
      filesEdited: this.fileOperations.filter((f) => f.operation === 'edit')
        .length,
      linesEdited: this.fileOperations
        .filter((f) => f.operation === 'edit')
        .reduce((sum, f) => sum + (f.linesAffected || 0), 0),
      gitOperations: 0,
      errors: this.errors.length,
      errorDetails: this.errors.slice(-10),
      cost: metrics.cost || 0,
      messagesCount: this.messagesCount,
    };

    // Update or add session
    const existingIndex = data.sessions.findIndex(
      (s: EnhancedSessionRecord) => s.sessionId === this.currentSessionId,
    );
    if (existingIndex >= 0) {
      data.sessions[existingIndex] = session;
    } else {
      data.sessions.push(session);
    }

    // Keep only last 500 sessions
    if (data.sessions.length > 500) {
      data.sessions = data.sessions.slice(-500);
    }

    this.writeMetricsData(data);
    logger.debug('Session saved', { sessionId: this.currentSessionId });
  }

  /**
   * End session
   */
  endSession(): void {
    const data = this.readMetricsData();
    const session = data.sessions.find(
      (s: EnhancedSessionRecord) => s.sessionId === this.currentSessionId,
    );
    if (session) {
      session.endTime = Date.now();
      this.writeMetricsData(data);
    }
    logger.info('Session ended', { sessionId: this.currentSessionId });
  }

  /**
   * Get enhanced statistics
   */
  getStats(): EnhancedDashboardStats {
    const data = this.readMetricsData();
    const sessions = data.sessions as EnhancedSessionRecord[];

    // Current session
    const currentSessionRecord = sessions.find(
      (s: EnhancedSessionRecord) => s.sessionId === this.currentSessionId,
    );

    const currentSession = {
      duration: Date.now() - this.sessionStart,
      promptTokens: currentSessionRecord?.promptTokens || 0,
      generatedTokens: currentSessionRecord?.generatedTokens || 0,
      cachedTokens: currentSessionRecord?.cachedTokens || 0,
      speedMetrics:
        currentSessionRecord?.speedMetrics || this.calculateSpeedMetrics(),
      toolCalls: currentSessionRecord?.toolCalls || 0,
      toolsUsed: [...new Set(this.toolExecutions.map((t) => t.toolName))],
      filesRead: currentSessionRecord?.filesRead || 0,
      filesWritten: currentSessionRecord?.filesWritten || 0,
      filesEdited: currentSessionRecord?.filesEdited || 0,
      linesEdited: currentSessionRecord?.linesEdited || 0,
      cost: currentSessionRecord?.cost || 0,
      messagesCount: currentSessionRecord?.messagesCount || 0,
      errors: currentSessionRecord?.errors || 0,
    };

    // Aggregated stats
    const totalPromptTokens = sessions.reduce(
      (sum, s) => sum + s.promptTokens,
      0,
    );
    const totalGeneratedTokens = sessions.reduce(
      (sum, s) => sum + s.generatedTokens,
      0,
    );
    const totalCachedTokens = sessions.reduce(
      (sum, s) => sum + (s.cachedTokens || 0),
      0,
    );
    const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
    const totalToolCalls = sessions.reduce((sum, s) => sum + s.toolCalls, 0);
    const totalFilesRead = sessions.reduce(
      (sum, s) => sum + (s.filesRead || 0),
      0,
    );
    const totalFilesWritten = sessions.reduce(
      (sum, s) => sum + (s.filesWritten || 0),
      0,
    );
    const totalLinesEdited = sessions.reduce(
      (sum, s) => sum + (s.linesEdited || 0),
      0,
    );

    // Average session duration
    const completedSessions = sessions.filter((s) => s.endTime);
    const averageSessionDuration =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (sum, s) => sum + (s.endTime! - s.startTime),
            0,
          ) / completedSessions.length
        : 0;

    // Average TPS across all sessions
    const sessionsWithTps = sessions.filter(
      (s) => s.speedMetrics?.averageTps > 0,
    );
    const averageTps =
      sessionsWithTps.length > 0
        ? sessionsWithTps.reduce(
            (sum, s) => sum + s.speedMetrics.averageTps,
            0,
          ) / sessionsWithTps.length
        : 0;

    // Most used model
    const modelCounts = new Map<string, number>();
    sessions.forEach((s) => {
      modelCounts.set(s.model, (modelCounts.get(s.model) || 0) + 1);
    });
    const mostUsedModel =
      [...modelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'unknown';

    // Most used tools
    const toolCounts = new Map<
      string,
      { count: number; totalDuration: number }
    >();
    sessions.forEach((s) => {
      s.toolExecutions?.forEach((t) => {
        const existing = toolCounts.get(t.toolName) || {
          count: 0,
          totalDuration: 0,
        };
        existing.count++;
        existing.totalDuration += t.duration;
        toolCounts.set(t.toolName, existing);
      });
    });
    const mostUsedTools = [...toolCounts.entries()]
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        avgDuration: Math.round(stats.totalDuration / stats.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Best performing model (by avg TPS)
    const modelTps = new Map<string, { totalTps: number; count: number }>();
    sessionsWithTps.forEach((s) => {
      const existing = modelTps.get(s.model) || { totalTps: 0, count: 0 };
      existing.totalTps += s.speedMetrics.averageTps;
      existing.count++;
      modelTps.set(s.model, existing);
    });
    const bestPerformingModel = {
      model:
        [...modelTps.entries()]
          .map(([model, stats]) => ({
            model,
            avgTps: stats.totalTps / stats.count,
          }))
          .sort((a, b) => b.avgTps - a.avgTps)[0]?.model || 'unknown',
      avgTps:
        [...modelTps.entries()]
          .map(([, stats]) => stats.totalTps / stats.count)
          .sort((a, b) => b - a)[0] || 0,
    };

    // Daily stats
    const daily = this.getDailyStats(sessions);

    // Model usage
    const modelUsage = this.getModelUsage(sessions);

    // Trends
    const trends = this.getTrends(sessions);

    return {
      currentSession,
      aggregated: {
        totalSessions: sessions.length,
        totalPromptTokens,
        totalGeneratedTokens,
        totalCachedTokens,
        totalToolCalls,
        totalCost,
        totalFilesRead,
        totalFilesWritten,
        totalLinesEdited,
        averageSessionDuration,
        averageTps: Math.round(averageTps * 10) / 10,
        mostUsedModel,
        mostUsedTools,
        bestPerformingModel,
      },
      daily,
      modelUsage,
      trends,
    };
  }

  private getDailyStats(
    sessions: EnhancedSessionRecord[],
  ): EnhancedDashboardStats['daily'] {
    const dailyMap = new Map<
      string,
      {
        sessions: number;
        tokens: number;
        cost: number;
        totalTps: number;
        tpsCount: number;
      }
    >();
    const now = new Date();

    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        sessions: 0,
        tokens: 0,
        cost: 0,
        totalTps: 0,
        tpsCount: 0,
      });
    }

    // Aggregate sessions by date
    sessions.forEach((s) => {
      const dateStr = new Date(s.startTime).toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr);
      if (existing) {
        existing.sessions++;
        existing.tokens += s.promptTokens + s.generatedTokens;
        existing.cost += s.cost;
        if (s.speedMetrics?.averageTps > 0) {
          existing.totalTps += s.speedMetrics.averageTps;
          existing.tpsCount++;
        }
      }
    });

    return [...dailyMap.entries()]
      .map(([date, stats]) => ({
        date,
        sessions: stats.sessions,
        tokens: stats.tokens,
        cost: stats.cost,
        avgTps:
          stats.tpsCount > 0
            ? Math.round((stats.totalTps / stats.tpsCount) * 10) / 10
            : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getModelUsage(
    sessions: EnhancedSessionRecord[],
  ): EnhancedDashboardStats['modelUsage'] {
    const modelMap = new Map<
      string,
      {
        sessions: number;
        tokens: number;
        cost: number;
        totalTps: number;
        tpsCount: number;
        totalCached: number;
      }
    >();

    sessions.forEach((s) => {
      const existing = modelMap.get(s.model) || {
        sessions: 0,
        tokens: 0,
        cost: 0,
        totalTps: 0,
        tpsCount: 0,
        totalCached: 0,
      };
      existing.sessions++;
      existing.tokens += s.promptTokens + s.generatedTokens;
      existing.cost += s.cost;
      if (s.speedMetrics?.averageTps > 0) {
        existing.totalTps += s.speedMetrics.averageTps;
        existing.tpsCount++;
      }
      existing.totalCached += s.cachedTokens || 0;
      modelMap.set(s.model, existing);
    });

    return [...modelMap.entries()]
      .map(([model, stats]) => ({
        model,
        sessions: stats.sessions,
        tokens: stats.tokens,
        cost: stats.cost,
        avgTps:
          stats.tpsCount > 0
            ? Math.round((stats.totalTps / stats.tpsCount) * 10) / 10
            : 0,
        avgCachedRate:
          stats.tokens > 0
            ? Math.round((stats.totalCached / stats.tokens) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);
  }

  private getTrends(
    sessions: EnhancedSessionRecord[],
  ): EnhancedDashboardStats['trends'] {
    // Get last 20 sessions for trends
    const recentSessions = sessions.slice(-20);

    return {
      tpsHistory: recentSessions.map((s) => s.speedMetrics?.averageTps || 0),
      tokenHistory: recentSessions.map(
        (s) => s.promptTokens + s.generatedTokens,
      ),
      timestamps: recentSessions.map((s) => s.startTime),
    };
  }

  private readMetricsData(): { sessions: EnhancedSessionRecord[] } {
    try {
      const content = fs.readFileSync(this.metricsFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { sessions: [] };
    }
  }

  private writeMetricsData(data: { sessions: EnhancedSessionRecord[] }): void {
    fs.writeFileSync(this.metricsFile, JSON.stringify(data, null, 2));
  }

  /**
   * Clear all metrics data
   */
  clearAllData(): void {
    this.writeMetricsData({ sessions: [] });
    this.tokenEvents = [];
    this.toolExecutions = [];
    this.fileOperations = [];
    this.messagesCount = 0;
    this.errors = [];
    logger.info('All metrics data cleared');
  }

  /**
   * Export to file
   */
  exportToFile(outputPath: string): void {
    const data = this.readMetricsData();
    const exportData = {
      exportedAt: new Date().toISOString(),
      sessions: data.sessions,
      stats: this.getStats(),
    };
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    logger.info('Metrics exported', { outputPath });
  }

  /**
   * Generate formatted dashboard output
   */
  generateFormattedOutput(): string {
    const stats = this.getStats();
    const lines: string[] = [];

    lines.push(
      '┌─────────────────────────────────────────────────────────────┐',
    );
    lines.push(
      '│              Session Performance Dashboard                   │',
    );
    lines.push(
      '├─────────────────────────────────────────────────────────────┤',
    );

    // Current session
    const cs = stats.currentSession;
    lines.push(
      '│ CURRENT SESSION                                             │',
    );
    lines.push(
      '├─────────────────────────────────────────────────────────────┤',
    );
    lines.push(
      `│ Duration: ${EnhancedDashboardService.formatDuration(cs.duration).padEnd(20)} Messages: ${String(cs.messagesCount).padEnd(14)} │`,
    );
    lines.push(
      `│ Tokens:  ${(cs.promptTokens + cs.generatedTokens).toLocaleString().padEnd(19)} Speed: ${String(cs.speedMetrics.averageTps).padEnd(15)} │`,
    );
    lines.push(`│ Prompt:  ${cs.promptTokens.toLocaleString().padEnd(48)} │`);
    lines.push(
      `│ Generated: ${cs.generatedTokens.toLocaleString().padEnd(46)} │`,
    );
    if (cs.cachedTokens > 0) {
      const cacheRate = ((cs.cachedTokens / cs.promptTokens) * 100).toFixed(1);
      lines.push(
        `│ Cached:  ${cs.cachedTokens.toLocaleString().padEnd(20)} (${cacheRate}%)                    │`,
      );
    }

    // Speed metrics
    lines.push(
      '├─────────────────────────────────────────────────────────────┤',
    );
    lines.push(
      '│ SPEED METRICS                                               │',
    );
    lines.push(
      '├─────────────────────────────────────────────────────────────┤',
    );
    lines.push(
      `│ Average: ${String(cs.speedMetrics.averageTps).padEnd(20)} Peak: ${String(cs.speedMetrics.peakTps).padEnd(17)} │`,
    );
    lines.push(
      `│ Thinking: ${EnhancedDashboardService.formatDuration(cs.speedMetrics.thinkingTimeMs).padEnd(19)} Generating: ${EnhancedDashboardService.formatDuration(cs.speedMetrics.generatingTimeMs).padEnd(13)} │`,
    );

    // Tool metrics
    lines.push(
      '├─────────────────────────────────────────────────────────────┤',
    );
    lines.push(
      '│ TOOLS & FILES                                               │',
    );
    lines.push(
      '├─────────────────────────────────────────────────────────────┤',
    );
    lines.push(
      `│ Tool Calls: ${String(cs.toolCalls).padEnd(18)} Tools Used: ${String(cs.toolsUsed.length).padEnd(13)} │`,
    );
    lines.push(
      `│ Files Read: ${String(cs.filesRead).padEnd(18)} Written: ${String(cs.filesWritten).padEnd(17)} │`,
    );
    lines.push(
      `│ Files Edited: ${String(cs.filesEdited).padEnd(16)} Lines: ${String(cs.linesEdited).padEnd(19)} │`,
    );

    // Aggregated
    const agg = stats.aggregated;
    lines.push(
      '├─────────────────────────────────────────────────────────────┤',
    );
    lines.push(
      '│ AGGREGATED STATISTICS                                       │',
    );
    lines.push(
      '├─────────────────────────────────────────────────────────────┤',
    );
    lines.push(
      `│ Sessions: ${String(agg.totalSessions).padEnd(19)} Total Cost: ${EnhancedDashboardService.formatCost(agg.totalCost).padEnd(14)} │`,
    );
    lines.push(
      `│ Total Tokens: ${(agg.totalPromptTokens + agg.totalGeneratedTokens).toLocaleString().padEnd(43)} │`,
    );
    lines.push(
      `│ Avg Session: ${EnhancedDashboardService.formatDuration(agg.averageSessionDuration).padEnd(17)} Avg Speed: ${String(agg.averageTps).padEnd(12)} │`,
    );

    // Most used tools
    if (agg.mostUsedTools.length > 0) {
      lines.push(
        '├─────────────────────────────────────────────────────────────┤',
      );
      lines.push(
        '│ TOP TOOLS                                                   │',
      );
      lines.push(
        '├─────────────────────────────────────────────────────────────┤',
      );
      for (const tool of agg.mostUsedTools.slice(0, 5)) {
        lines.push(
          `│ ${tool.name.padEnd(20)} ${String(tool.count).padEnd(10)} avg ${tool.avgDuration}ms                │`,
        );
      }
    }

    lines.push(
      '└─────────────────────────────────────────────────────────────┘',
    );

    return lines.join('\n');
  }

  /**
   * Format duration
   */
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Format cost
   */
  static formatCost(cost: number): string {
    if (cost < 0.01) {
      return '<$0.01';
    }
    return `$${cost.toFixed(2)}`;
  }

  /**
   * Format number
   */
  static formatNumber(n: number): string {
    return n.toLocaleString();
  }
}

let enhancedDashboardServiceInstance: EnhancedDashboardService | null = null;

export function getEnhancedDashboardService(
  storage: Storage,
  sessionId: string,
): EnhancedDashboardService {
  if (!enhancedDashboardServiceInstance) {
    enhancedDashboardServiceInstance = new EnhancedDashboardService(
      storage,
      sessionId,
    );
  }
  return enhancedDashboardServiceInstance;
}

export function resetEnhancedDashboardService(): void {
  enhancedDashboardServiceInstance = null;
}
