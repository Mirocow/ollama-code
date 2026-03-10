/**
 * Dashboard Service - Session analytics and metrics visualization
 *
 * Provides comprehensive session analytics including:
 * - Token usage trends
 * - Tool call statistics
 * - Cost estimation
 * - Performance metrics
 * - Session history
 */

import { Storage } from '../config/storage.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export interface DashboardSessionRecord {
  sessionId: string;
  startTime: number;
  endTime?: number;
  model: string;
  promptTokens: number;
  generatedTokens: number;
  toolCalls: number;
  fileOperations: number;
  gitOperations: number;
  errors: number;
  cost: number;
}

export interface DashboardStats {
  // Current session
  currentSession: {
    duration: number; // milliseconds
    promptTokens: number;
    generatedTokens: number;
    toolCalls: number;
    toolsUsed: string[];
    cost: number;
    messagesCount: number;
  };

  // Aggregated stats
  aggregated: {
    totalSessions: number;
    totalPromptTokens: number;
    totalGeneratedTokens: number;
    totalToolCalls: number;
    totalCost: number;
    averageSessionDuration: number;
    mostUsedModel: string;
    mostUsedTools: { name: string; count: number }[];
  };

  // Time-based stats
  daily: {
    date: string;
    sessions: number;
    tokens: number;
    cost: number;
  }[];

  // Model usage
  modelUsage: {
    model: string;
    sessions: number;
    tokens: number;
    cost: number;
  }[];
}

export class DashboardService {
  private sessionStart: number;
  private currentSessionId: string;
  private metricsFile: string;

  constructor(_storage: Storage, sessionId: string) {
    this.sessionStart = Date.now();
    this.currentSessionId = sessionId;
    this.metricsFile = path.join(
      Storage.getGlobalOllamaDir(),
      'dashboard-metrics.json'
    );
    this.ensureMetricsFile();
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
   * Record current session metrics
   */
  recordSession(metrics: Partial<DashboardSessionRecord>): void {
    const data = this.readMetricsData();
    const session: DashboardSessionRecord = {
      sessionId: this.currentSessionId,
      startTime: this.sessionStart,
      model: metrics.model || 'unknown',
      promptTokens: metrics.promptTokens || 0,
      generatedTokens: metrics.generatedTokens || 0,
      toolCalls: metrics.toolCalls || 0,
      fileOperations: metrics.fileOperations || 0,
      gitOperations: metrics.gitOperations || 0,
      errors: metrics.errors || 0,
      cost: metrics.cost || 0,
    };

    // Update or add session
    const existingIndex = data.sessions.findIndex(
      (s: DashboardSessionRecord) => s.sessionId === this.currentSessionId
    );
    if (existingIndex >= 0) {
      data.sessions[existingIndex] = session;
    } else {
      data.sessions.push(session);
    }

    // Keep only last 1000 sessions
    if (data.sessions.length > 1000) {
      data.sessions = data.sessions.slice(-1000);
    }

    this.writeMetricsData(data);
  }

  /**
   * End current session
   */
  endSession(): void {
    const data = this.readMetricsData();
    const session = data.sessions.find(
      (s: DashboardSessionRecord) => s.sessionId === this.currentSessionId
    );
    if (session) {
      session.endTime = Date.now();
      this.writeMetricsData(data);
    }
  }

  /**
   * Get dashboard statistics
   */
  getStats(): DashboardStats {
    const data = this.readMetricsData();

    // Current session from saved data
    const currentSessionRecord = data.sessions.find(
      (s: DashboardSessionRecord) => s.sessionId === this.currentSessionId
    );

    const currentSession = {
      duration: Date.now() - this.sessionStart,
      promptTokens: currentSessionRecord?.promptTokens || 0,
      generatedTokens: currentSessionRecord?.generatedTokens || 0,
      toolCalls: currentSessionRecord?.toolCalls || 0,
      toolsUsed: [],
      cost: currentSessionRecord?.cost || 0,
      messagesCount: 0,
    };

    // Aggregate stats
    const sessions = data.sessions as DashboardSessionRecord[];
    const totalPromptTokens = sessions.reduce((sum, s) => sum + s.promptTokens, 0);
    const totalGeneratedTokens = sessions.reduce((sum, s) => sum + s.generatedTokens, 0);
    const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
    const totalToolCalls = sessions.reduce((sum, s) => sum + s.toolCalls, 0);

    // Average session duration
    const completedSessions = sessions.filter(s => s.endTime);
    const averageSessionDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.endTime! - s.startTime), 0) / completedSessions.length
      : 0;

    // Most used model
    const modelCounts = new Map<string, number>();
    sessions.forEach(s => {
      modelCounts.set(s.model, (modelCounts.get(s.model) || 0) + 1);
    });
    const mostUsedModel = [...modelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // Daily stats (last 7 days)
    const daily = this.getDailyStats(sessions);

    // Model usage
    const modelUsage = this.getModelUsage(sessions);

    return {
      currentSession,
      aggregated: {
        totalSessions: sessions.length,
        totalPromptTokens,
        totalGeneratedTokens,
        totalToolCalls,
        totalCost,
        averageSessionDuration,
        mostUsedModel,
        mostUsedTools: [],
      },
      daily,
      modelUsage,
    };
  }

  private getDailyStats(sessions: DashboardSessionRecord[]): DashboardStats['daily'] {
    const dailyMap = new Map<string, { sessions: number; tokens: number; cost: number }>();
    const now = new Date();

    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, { sessions: 0, tokens: 0, cost: 0 });
    }

    // Aggregate sessions by date
    sessions.forEach(s => {
      const dateStr = new Date(s.startTime).toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr);
      if (existing) {
        existing.sessions++;
        existing.tokens += s.promptTokens + s.generatedTokens;
        existing.cost += s.cost;
      }
    });

    return [...dailyMap.entries()]
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getModelUsage(sessions: DashboardSessionRecord[]): DashboardStats['modelUsage'] {
    const modelMap = new Map<string, { sessions: number; tokens: number; cost: number }>();

    sessions.forEach(s => {
      const existing = modelMap.get(s.model) || { sessions: 0, tokens: 0, cost: 0 };
      existing.sessions++;
      existing.tokens += s.promptTokens + s.generatedTokens;
      existing.cost += s.cost;
      modelMap.set(s.model, existing);
    });

    return [...modelMap.entries()]
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);
  }

  private readMetricsData(): { sessions: DashboardSessionRecord[] } {
    try {
      const content = fs.readFileSync(this.metricsFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { sessions: [] };
    }
  }

  private writeMetricsData(data: { sessions: DashboardSessionRecord[] }): void {
    fs.writeFileSync(this.metricsFile, JSON.stringify(data, null, 2));
  }

  /**
   * Clear all metrics data
   */
  clearAllData(): void {
    this.writeMetricsData({ sessions: [] });
  }

  /**
   * Export metrics to file
   */
  exportToFile(outputPath: string): void {
    const data = this.readMetricsData();
    const exportData = {
      exportedAt: new Date().toISOString(),
      sessions: data.sessions,
      stats: this.getStats(),
    };
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  }

  /**
   * Format duration for display
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
   * Format number with commas
   */
  static formatNumber(n: number): string {
    return n.toLocaleString();
  }

  /**
   * Format cost for display
   */
  static formatCost(cost: number): string {
    if (cost < 0.01) {
      return '<$0.01';
    }
    return `$${cost.toFixed(2)}`;
  }

  /**
   * Create a bar chart string
   */
  static createBarChart(values: number[], width: number = 20): string[] {
    const max = Math.max(...values, 1);
    return values.map(v => {
      const filled = Math.round((v / max) * width);
      return '█'.repeat(filled) + '░'.repeat(width - filled);
    });
  }
}

let dashboardServiceInstance: DashboardService | null = null;

export function getDashboardService(storage: Storage, sessionId: string): DashboardService {
  if (!dashboardServiceInstance) {
    dashboardServiceInstance = new DashboardService(storage, sessionId);
  }
  return dashboardServiceInstance;
}

export function resetDashboardService(): void {
  dashboardServiceInstance = null;
}
