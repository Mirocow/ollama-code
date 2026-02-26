/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

// UI Telemetry stubs - telemetry has been removed

export interface SessionMetrics {
  totalTurns: number;
  totalTokens: number;
  promptTokens: number;
  candidatesTokens: number;
  cachedTokens: number;
  totalApiTime: number;
  toolCalls: number;
}

export interface ModelMetrics {
  name: string;
  tokens: {
    prompt: number;
    candidates: number;
    cached: number;
    total: number;
  };
  api: {
    totalLatencyMs: number;
    requestCount: number;
  };
}

export interface ToolCallStats {
  accepted: number;
  rejected: number;
  modified: number;
  total: number;
}

export interface ToolDecisionMetrics {
  decisions: Record<string, number>;
}

export interface UiEvent {
  type: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface SessionStatsState {
  sessionId: string;
  sessionStartTime: Date;
  lastPromptTokenCount: number;
  metrics: {
    models: Map<string, ModelMetrics>;
    tools: ToolCallStats;
    files: { read: number; written: number };
  };
  promptCount: number;
}

class UiTelemetryService {
  private lastPromptTokenCount: number = 0;

  getLastPromptTokenCount(): number {
    return this.lastPromptTokenCount;
  }

  setLastPromptTokenCount(count: number): void {
    this.lastPromptTokenCount = count;
  }

  reset(): void {
    this.lastPromptTokenCount = 0;
  }

  getSessionMetrics(): SessionMetrics {
    return {
      totalTurns: 0,
      totalTokens: 0,
      promptTokens: 0,
      candidatesTokens: 0,
      cachedTokens: 0,
      totalApiTime: 0,
      toolCalls: 0,
    };
  }

  getModelMetrics(): Map<string, ModelMetrics> {
    return new Map();
  }

  getToolCallStats(): ToolCallStats {
    return {
      accepted: 0,
      rejected: 0,
      modified: 0,
      total: 0,
    };
  }

  getToolDecisionMetrics(): ToolDecisionMetrics {
    return {
      decisions: {},
    };
  }

  getMetrics(): SessionStatsState {
    return {
      sessionId: '',
      sessionStartTime: new Date(),
      lastPromptTokenCount: this.lastPromptTokenCount,
      metrics: {
        models: new Map(),
        tools: this.getToolCallStats(),
        files: { read: 0, written: 0 },
      },
      promptCount: 0,
    };
  }
}

export const uiTelemetryService = new UiTelemetryService();
