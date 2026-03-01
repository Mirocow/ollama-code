/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

// UI Telemetry - local session statistics (no external telemetry)

export interface ToolCallStats {
  toolName: string;
  count: number;
  success: number;
  fail: number;
  durationMs: number;
  decisions: {
    accept: number;
    reject: number;
    modify: number;
    auto_accept: number;
  };
}

export interface ModelMetrics {
  tokens: {
    prompt: number;
    generated: number;
    cached: number;
    total: number;
    thoughts: number;
    tool: number;
    candidates: number;
  };
  api: {
    time: number;
    calls: number;
    totalRequests: number;
    totalErrors: number;
    totalLatencyMs: number;
  };
  totalPromptTokens: number;
  totalGeneratedTokens: number;
  totalCachedTokens: number;
  totalApiTime: number;
  byModel: Record<
    string,
    {
      promptTokens: number;
      generatedTokens: number;
      cachedTokens: number;
      apiTime: number;
    }
  >;
}

export interface FileMetrics {
  read: number;
  write: number;
  edit: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
}

export interface SessionMetrics {
  models: ModelMetrics;
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
  files: FileMetrics;
  totalPromptTokens: number;
  totalCachedTokens: number;
  totalGeneratedTokens: number;
  totalApiTime: number;
}

type MetricsListener = (event: {
  metrics: SessionMetrics;
  lastPromptTokenCount: number;
}) => void;

class UiTelemetryService {
  private metrics: SessionMetrics;
  private listeners: Set<MetricsListener> = new Set();
  private lastPromptTokenCount: number = 0;

  constructor() {
    this.metrics = this.createEmptyMetrics();
  }

  private createEmptyMetrics(): SessionMetrics {
    return {
      models: {
        tokens: {
          prompt: 0,
          generated: 0,
          cached: 0,
          total: 0,
          thoughts: 0,
          tool: 0,
          candidates: 0,
        },
        api: {
          time: 0,
          calls: 0,
          totalRequests: 0,
          totalErrors: 0,
          totalLatencyMs: 0,
        },
        totalPromptTokens: 0,
        totalGeneratedTokens: 0,
        totalCachedTokens: 0,
        totalApiTime: 0,
        byModel: {},
      },
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
        read: 0,
        write: 0,
        edit: 0,
        totalLinesAdded: 0,
        totalLinesRemoved: 0,
      },
      totalPromptTokens: 0,
      totalCachedTokens: 0,
      totalGeneratedTokens: 0,
      totalApiTime: 0,
    };
  }

  getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  getLastPromptTokenCount(): number {
    return this.lastPromptTokenCount;
  }

  reset(): void {
    this.metrics = this.createEmptyMetrics();
    this.lastPromptTokenCount = 0;
    this.notifyListeners();
  }

  on(_event: string, listener: MetricsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  off(_event: string, listener: MetricsListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const snapshot = this.getMetrics();
    const event = {
      metrics: snapshot,
      lastPromptTokenCount: this.lastPromptTokenCount,
    };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  // Tool call tracking
  recordToolCall(
    toolName: string,
    duration: number,
    success: boolean,
    decision?: 'accept' | 'reject' | 'modify' | 'auto_accept',
  ): void {
    this.metrics.tools.totalCalls++;
    this.metrics.tools.totalDurationMs += duration;

    if (success) {
      this.metrics.tools.totalSuccess++;
    } else {
      this.metrics.tools.totalFail++;
    }

    if (decision) {
      this.metrics.tools.totalDecisions[decision]++;
    }

    // Track by tool name
    if (!this.metrics.tools.byName[toolName]) {
      this.metrics.tools.byName[toolName] = {
        toolName,
        count: 0,
        success: 0,
        fail: 0,
        durationMs: 0,
        decisions: {
          accept: 0,
          reject: 0,
          modify: 0,
          auto_accept: 0,
        },
      };
    }

    const toolStats = this.metrics.tools.byName[toolName];
    toolStats.count++;
    toolStats.durationMs += duration;
    if (success) {
      toolStats.success++;
    } else {
      toolStats.fail++;
    }
    if (decision) {
      toolStats.decisions[decision]++;
    }

    this.notifyListeners();
  }

  // Token tracking
  recordTokenUsage(
    model: string,
    promptTokens: number,
    cachedTokens: number,
    generatedTokens: number,
  ): void {
    this.metrics.totalPromptTokens += promptTokens;
    this.metrics.totalCachedTokens += cachedTokens;
    this.metrics.totalGeneratedTokens += generatedTokens;
    this.lastPromptTokenCount = promptTokens;

    // Update nested metrics
    this.metrics.models.tokens.prompt += promptTokens;
    this.metrics.models.tokens.cached += cachedTokens;
    this.metrics.models.tokens.generated += generatedTokens;

    // Track by model
    if (!this.metrics.models.byModel[model]) {
      this.metrics.models.byModel[model] = {
        promptTokens: 0,
        generatedTokens: 0,
        cachedTokens: 0,
        apiTime: 0,
      };
    }

    const modelStats = this.metrics.models.byModel[model];
    modelStats.promptTokens += promptTokens;
    modelStats.cachedTokens += cachedTokens;
    modelStats.generatedTokens += generatedTokens;
    this.metrics.models.totalPromptTokens += promptTokens;
    this.metrics.models.totalCachedTokens += cachedTokens;
    this.metrics.models.totalGeneratedTokens += generatedTokens;

    this.notifyListeners();
  }

  // API time tracking
  recordApiTime(model: string, duration: number): void {
    this.metrics.totalApiTime += duration;
    this.metrics.models.totalApiTime += duration;
    this.metrics.models.api.time += duration;
    this.metrics.models.api.calls++;

    if (this.metrics.models.byModel[model]) {
      this.metrics.models.byModel[model].apiTime += duration;
    }

    this.notifyListeners();
  }

  // File operation tracking
  recordFileOperation(
    operation: 'read' | 'write' | 'edit',
    linesAdded?: number,
    linesRemoved?: number,
  ): void {
    this.metrics.files[operation]++;
    if (linesAdded) this.metrics.files.totalLinesAdded += linesAdded;
    if (linesRemoved) this.metrics.files.totalLinesRemoved += linesRemoved;
    this.notifyListeners();
  }
}

export const uiTelemetryService = new UiTelemetryService();
