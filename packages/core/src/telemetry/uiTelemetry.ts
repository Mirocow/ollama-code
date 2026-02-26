/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

// UI Telemetry - local session statistics (no external telemetry)

export interface ToolCallStats {
  count: number;
  success: number;
  fail: number;
  durationMs: number;
  decisions: Record<string, number>;
}

export interface ModelMetrics {
  name: string;
  tokens: {
    prompt: number;
    candidates: number;
    cached: number;
    total: number;
    thoughts: number;
    tool: number;
  };
  api: {
    totalLatencyMs: number;
    requestCount: number;
    totalRequests: number;
    totalErrors: number;
  };
}

export interface SessionMetrics {
  models: Record<string, ModelMetrics>;
  tools: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    totalDurationMs: number;
    totalDecisions: {
      accept: number;
      reject: number;
      modify: number;
      auto_accept: number;
    };
    byName: Record<string, ToolCallStats>;
  };
  files: {
    totalLinesAdded: number;
    totalLinesRemoved: number;
  };
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
  metrics: SessionMetrics;
  promptCount: number;
}

type EventCallback = (data: unknown) => void;

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

  on(_event: string, _callback: EventCallback): void {
    // Stub - event registration (no-op)
  }

  off(_event: string, _callback: EventCallback): void {
    // Stub - event unregistration (no-op)
  }

  getSessionMetrics(): SessionMetrics {
    return {
      models: {},
      tools: {
        totalCalls: 0,
        totalSuccess: 0,
        totalFail: 0,
        totalDurationMs: 0,
        totalDecisions: {
          accept: 0,
          reject: 0,
          modify: 0,
          auto_accept: 0,
        },
        byName: {},
      },
      files: {
        totalLinesAdded: 0,
        totalLinesRemoved: 0,
      },
    };
  }

  getModelMetrics(): Record<string, ModelMetrics> {
    return {};
  }

  getToolCallStats(): ToolCallStats {
    return {
      count: 0,
      success: 0,
      fail: 0,
      durationMs: 0,
      decisions: {},
    };
  }

  getToolDecisionMetrics(): ToolDecisionMetrics {
    return {
      decisions: {},
    };
  }

  getMetrics(): SessionMetrics {
    return this.getSessionMetrics();
  }
}

export const uiTelemetryService = new UiTelemetryService();
