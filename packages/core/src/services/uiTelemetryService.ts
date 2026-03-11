/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

// UI Telemetry - local session statistics (no external telemetry)

import { getTokenGraphService } from './tokenGraphService.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('TELEMETRY');

// Get token graph service instance
const tokenGraphService = getTokenGraphService();

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

export interface StorageMetrics {
  recordCount: number;
  keys: string[];
  totalSize: number; // Estimated size in bytes
}

export interface PluginMetrics {
  loadedPlugins: number;
  enabledPlugins: number;
  toolCount: number;
  skillCount: number;
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
  storage: StorageMetrics;
  plugins: PluginMetrics;
  totalPromptTokens: number;
  totalCachedTokens: number;
  totalGeneratedTokens: number;
  totalApiTime: number;
}

type MetricsListener = (event: {
  metrics: SessionMetrics;
  lastPromptTokenCount: number;
}) => void;

/**
 * Serializable state for persistence across sessions.
 * Contains all data needed to restore telemetry on resume.
 */
export interface TelemetrySerializableState {
  metrics: SessionMetrics;
  lastPromptTokenCount: number;
  accumulatedPromptTokens: number;
  gitOperations: Record<string, number>;
  /** Token history for sparkline graph */
  tokenHistory?: Array<{
    timestamp: number;
    promptTokens: number;
    generatedTokens: number;
    cachedTokens: number;
    model: string;
    messageIndex: number;
  }>;
}

class UiTelemetryService {
  private metrics: SessionMetrics;
  private listeners: Set<MetricsListener> = new Set();
  private lastPromptTokenCount: number = 0;
  /** Accumulated prompt tokens for the current session (estimated when Ollama doesn't return them) */
  private accumulatedPromptTokens: number = 0;
  /** Git operations counter */
  private gitOperations: Map<string, number> = new Map();

  constructor() {
    this.metrics = this.createEmptyMetrics();
  }

  /**
   * Export current state for persistence.
   * Call this at the end of each assistant turn to save telemetry.
   */
  exportState(): TelemetrySerializableState {
    return {
      metrics: this.getMetrics(),
      lastPromptTokenCount: this.lastPromptTokenCount,
      accumulatedPromptTokens: this.accumulatedPromptTokens,
      gitOperations: Object.fromEntries(this.gitOperations),
      tokenHistory: tokenGraphService.getHistory(),
    };
  }

  /**
   * Import state from a previous session.
   * Call this when resuming a session to restore telemetry.
   */
  importState(state: TelemetrySerializableState): void {
    // Validate state before importing
    if (!state || !state.metrics) {
      debugLogger.warn('Invalid telemetry state received, using empty metrics');
      this.metrics = this.createEmptyMetrics();
      this.notifyListeners();
      return;
    }
    
    // Deep merge to ensure all nested objects exist
    const emptyMetrics = this.createEmptyMetrics();
    this.metrics = {
      models: {
        tokens: { ...emptyMetrics.models.tokens, ...state.metrics.models?.tokens },
        api: { ...emptyMetrics.models.api, ...state.metrics.models?.api },
        totalPromptTokens: state.metrics.models?.totalPromptTokens ?? 0,
        totalGeneratedTokens: state.metrics.models?.totalGeneratedTokens ?? 0,
        totalCachedTokens: state.metrics.models?.totalCachedTokens ?? 0,
        totalApiTime: state.metrics.models?.totalApiTime ?? 0,
        byModel: state.metrics.models?.byModel ?? {},
      },
      tools: {
        ...emptyMetrics.tools,
        ...state.metrics.tools,
        totalDecisions: {
          ...emptyMetrics.tools.totalDecisions,
          ...state.metrics.tools?.totalDecisions,
        },
        byName: state.metrics.tools?.byName ?? {},
      },
      files: { ...emptyMetrics.files, ...state.metrics.files },
      storage: { ...emptyMetrics.storage, ...state.metrics.storage },
      plugins: { ...emptyMetrics.plugins, ...state.metrics.plugins },
      totalPromptTokens: state.metrics.totalPromptTokens ?? 0,
      totalCachedTokens: state.metrics.totalCachedTokens ?? 0,
      totalGeneratedTokens: state.metrics.totalGeneratedTokens ?? 0,
      totalApiTime: state.metrics.totalApiTime ?? 0,
    };
    this.lastPromptTokenCount = state.lastPromptTokenCount ?? 0;
    this.accumulatedPromptTokens = state.accumulatedPromptTokens ?? 0;
    this.gitOperations = new Map(Object.entries(state.gitOperations || {}));
    
    // Restore token history for sparkline
    if (state.tokenHistory && state.tokenHistory.length > 0) {
      tokenGraphService.importHistory(state.tokenHistory);
    }
    
    this.notifyListeners();
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
      storage: {
        recordCount: 0,
        keys: [],
        totalSize: 0,
      },
      plugins: {
        loadedPlugins: 0,
        enabledPlugins: 0,
        toolCount: 0,
        skillCount: 0,
      },
      totalPromptTokens: 0,
      totalCachedTokens: 0,
      totalGeneratedTokens: 0,
      totalApiTime: 0,
    };
  }

  getMetrics(): SessionMetrics {
    // Deep clone to ensure React detects changes in nested objects
    return structuredClone(this.metrics);
  }

  getLastPromptTokenCount(): number {
    return this.lastPromptTokenCount;
  }

  reset(): void {
    this.metrics = this.createEmptyMetrics();
    this.lastPromptTokenCount = 0;
    this.accumulatedPromptTokens = 0;
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

    // Only update lastPromptTokenCount if we received a non-zero value
    // This ensures we keep the last known context size even if Ollama doesn't return it
    if (promptTokens > 0) {
      this.lastPromptTokenCount = promptTokens;
      this.accumulatedPromptTokens = promptTokens;
    }

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

    // Record in token graph service for sparkline visualization
    if (promptTokens > 0 || generatedTokens > 0) {
      tokenGraphService.recordUsage(promptTokens, generatedTokens, cachedTokens, model);
    }

    this.notifyListeners();
  }

  /**
   * Update token count with fallback estimation.
   * Called when Ollama doesn't return prompt_eval_count in streaming response.
   * Uses estimated tokens if provided, otherwise increments from previous value.
   */
  recordTokenUsageWithFallback(
    model: string,
    promptTokens: number | undefined,
    generatedTokens: number,
    estimatedPromptTokens?: number,
  ): void {
    const actualPromptTokens = promptTokens ?? 0;
    
    // If we have actual tokens from Ollama, use them
    if (actualPromptTokens > 0) {
      this.recordTokenUsage(model, actualPromptTokens, 0, generatedTokens);
      return;
    }

    // Fallback: use estimated tokens if provided
    if (estimatedPromptTokens && estimatedPromptTokens > 0) {
      // Update the accumulated tokens with the new estimate
      this.accumulatedPromptTokens = estimatedPromptTokens;
      this.lastPromptTokenCount = estimatedPromptTokens;
      
      // Still record the generated tokens
      this.metrics.totalGeneratedTokens += generatedTokens;
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
      this.metrics.models.byModel[model].generatedTokens += generatedTokens;
      this.metrics.models.totalGeneratedTokens += generatedTokens;
      
      this.notifyListeners();
      return;
    }

    // Last resort: just record generated tokens and keep previous prompt token count
    if (generatedTokens > 0) {
      this.metrics.totalGeneratedTokens += generatedTokens;
      this.metrics.models.tokens.generated += generatedTokens;
      
      if (!this.metrics.models.byModel[model]) {
        this.metrics.models.byModel[model] = {
          promptTokens: 0,
          generatedTokens: 0,
          cachedTokens: 0,
          apiTime: 0,
        };
      }
      this.metrics.models.byModel[model].generatedTokens += generatedTokens;
      this.metrics.models.totalGeneratedTokens += generatedTokens;
      
      this.notifyListeners();
    }
  }

  /**
   * Get the accumulated prompt tokens for the session.
   * This represents the total context size being sent to the model.
   */
  getAccumulatedPromptTokens(): number {
    return this.accumulatedPromptTokens;
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

  // Storage operation tracking
  updateStorageMetrics(metrics: Partial<StorageMetrics>): void {
    this.metrics.storage = {
      ...this.metrics.storage,
      ...metrics,
    };
    this.notifyListeners();
  }

  recordStorageOperation(key: string, size?: number): void {
    if (!this.metrics.storage.keys.includes(key)) {
      this.metrics.storage.keys.push(key);
      this.metrics.storage.recordCount++;
    }
    if (size) {
      this.metrics.storage.totalSize += size;
    }
    this.notifyListeners();
  }

  // Git operation tracking (simple counter)
  recordGitOperation(operation: string, success: boolean = true): void {
    const count = this.gitOperations.get(operation) || 0;
    this.gitOperations.set(operation, count + 1);
    // Also track as tool call for unified metrics
    this.recordToolCall(`git_${operation}`, 0, success);
  }

  getGitOperations(): Record<string, number> {
    return Object.fromEntries(this.gitOperations);
  }

  // Plugin metrics tracking
  updatePluginMetrics(metrics: Partial<PluginMetrics>): void {
    this.metrics.plugins = {
      ...this.metrics.plugins,
      ...metrics,
    };
    this.notifyListeners();
  }

  setToolCount(count: number): void {
    this.metrics.plugins.toolCount = count;
    this.notifyListeners();
  }

  setSkillCount(count: number): void {
    this.metrics.plugins.skillCount = count;
    this.notifyListeners();
  }

  setPluginCounts(loadedPlugins: number, enabledPlugins: number): void {
    this.metrics.plugins.loadedPlugins = loadedPlugins;
    this.metrics.plugins.enabledPlugins = enabledPlugins;
    this.notifyListeners();
  }
}

export const uiTelemetryService = new UiTelemetryService();
