/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { computeUsageFromMetrics } from './nonInteractiveHelpers.js';
import type { SessionMetrics } from '@ollama-code/ollama-code-core';

describe('computeUsageFromMetrics', () => {
  const createMockMetrics = (
    models: Partial<SessionMetrics['models']>,
  ): SessionMetrics => ({
    models: {
      tokens: models.tokens ?? {
        prompt: 0,
        generated: 0,
        cached: 0,
        total: 0,
        thoughts: 0,
        tool: 0,
        candidates: 0,
      },
      api: models.api ?? {
        time: 0,
        calls: 0,
        totalRequests: 0,
        totalErrors: 0,
        totalLatencyMs: 0,
      },
      totalPromptTokens: models.totalPromptTokens ?? 0,
      totalGeneratedTokens: models.totalGeneratedTokens ?? 0,
      totalCachedTokens: models.totalCachedTokens ?? 0,
      totalApiTime: models.totalApiTime ?? 0,
      byModel: models.byModel ?? {},
    } as SessionMetrics['models'],
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
  });

  it('should handle models.tokens being undefined', () => {
    const metrics = createMockMetrics({
      tokens: undefined as unknown as SessionMetrics['models']['tokens'],
    });

    const usage = computeUsageFromMetrics(metrics);

    expect(usage.output_tokens).toBe(0);
    expect(usage.total_tokens).toBeUndefined();
  });

  it('should handle models being undefined', () => {
    const metrics = {
      models: undefined as unknown as SessionMetrics['models'],
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
    } as SessionMetrics;

    const usage = computeUsageFromMetrics(metrics);

    expect(usage.output_tokens).toBe(0);
    expect(usage.total_tokens).toBeUndefined();
  });

  it('should correctly compute usage with valid tokens', () => {
    const metrics = createMockMetrics({
      tokens: {
        prompt: 100,
        generated: 30,
        candidates: 50,
        total: 150,
        cached: 20,
        thoughts: 0,
        tool: 0,
      },
    });

    const usage = computeUsageFromMetrics(metrics);

    expect(usage.output_tokens).toBe(50);
    expect(usage.total_tokens).toBe(150);
    expect(usage.input_tokens).toBe(100);
    expect(usage.cache_read_input_tokens).toBe(20);
  });

  it('should handle partial tokens data', () => {
    const metrics = createMockMetrics({
      tokens: {
        prompt: 100,
        generated: 0,
        candidates: 0,
        total: 0,
        cached: 0,
        thoughts: 0,
        tool: 0,
      },
    });

    const usage = computeUsageFromMetrics(metrics);

    expect(usage.output_tokens).toBe(0);
    // total_tokens is only included if > 0
    expect(usage.total_tokens).toBeUndefined();
  });
});
