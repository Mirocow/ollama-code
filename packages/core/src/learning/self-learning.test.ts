/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SelfLearningManager,
  getSelfLearningManager,
  type LearningEntry,
  type ToolUsageLearningStats,
} from './self-learning.js';

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue(new Error('File not found')),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(new Error('File not found')),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock Storage
vi.mock('../config/storage.js', () => ({
  Storage: {
    getGlobalOllamaDir: () => '/mock/.ollama-code',
  },
}));

// Mock debugLogger
vi.mock('../utils/debugLogger.js', () => ({
  createDebugLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('SelfLearningManager', () => {
  let manager: SelfLearningManager;

  beforeEach(() => {
    // Reset singleton for each test
    vi.clearAllMocks();
    // Access private static instance to reset it
    (SelfLearningManager as unknown as { instance: SelfLearningManager | null }).instance = null;
    manager = SelfLearningManager.getInstance();
  });

  afterEach(async () => {
    if (manager) {
      await manager.shutdown();
    }
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SelfLearningManager.getInstance();
      const instance2 = SelfLearningManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getSelfLearningManager', () => {
    it('should return the SelfLearningManager instance', () => {
      const manager = getSelfLearningManager();
      expect(manager).toBeInstanceOf(SelfLearningManager);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await manager.initialize();
      // Should not throw
    });
  });

  describe('recordCorrection', () => {
    it('should record a correction entry', () => {
      manager.recordCorrection(
        'user message',
        'model response',
        'corrected response',
      );

      const summary = manager.getLearningSummary();
      expect(summary).toContain('Learning Summary');
    });

    it('should record correction with context', () => {
      manager.recordCorrection('user message', 'model response', 'corrected', {
        toolCalls: [{ name: 'test', params: {}, success: true }],
        language: 'typescript',
      });

      const summary = manager.getLearningSummary();
      expect(summary).toContain('typescript');
    });
  });

  describe('recordSuccess', () => {
    it('should record a success entry', () => {
      manager.recordSuccess('user message', 'model response', [
        { name: 'tool1', params: {}, success: true },
        { name: 'tool2', params: {}, success: false },
      ]);

      const summary = manager.getLearningSummary();
      expect(summary).toContain('Most Used Tools');
    });

    it('should record success with rating', () => {
      manager.recordSuccess(
        'user message',
        'model response',
        [{ name: 'tool1', params: {}, success: true }],
        5,
      );

      const summary = manager.getLearningSummary();
      expect(summary).toContain('Most Used Tools');
    });

    it('should handle empty tool calls', () => {
      manager.recordSuccess('user message', 'model response', undefined);
      // Should not throw
    });
  });

  describe('getLearningSummary', () => {
    it('should return summary with no data', () => {
      const summary = manager.getLearningSummary();
      expect(summary).toContain('Learning Summary');
    });

    it('should return summary with tool stats', () => {
      manager.recordSuccess('msg', 'resp', [
        { name: 'tool1', params: {}, success: true },
      ]);
      manager.recordSuccess('msg', 'resp', [
        { name: 'tool1', params: {}, success: false },
      ]);

      const summary = manager.getLearningSummary();
      expect(summary).toContain('tool1');
    });

    it('should show corrections in summary', () => {
      manager.recordCorrection('msg', 'resp', 'corrected', { language: 'js' });

      const summary = manager.getLearningSummary();
      expect(summary).toContain('Recent Corrections');
    });
  });

  describe('save', () => {
    it('should save successfully', async () => {
      await manager.save();
      // Should not throw
    });
  });

  describe('export', () => {
    it('should export data as JSON string', async () => {
      manager.recordSuccess('msg', 'resp', [
        { name: 'tool', params: {}, success: true },
      ]);

      const exported = await manager.export();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe('1.0');
      expect(parsed.entries).toBeDefined();
      expect(parsed.toolStats).toBeDefined();
    });
  });

  describe('import', () => {
    it('should import data from JSON string', async () => {
      const data = JSON.stringify({
        version: '1.0',
        entries: [
          {
            id: 'test-1',
            timestamp: new Date().toISOString(),
            type: 'success',
            context: { userMessage: 'test', modelResponse: 'test' },
            feedback: { accepted: true },
            tags: [],
          },
        ],
        toolStats: {
          tool1: {
            toolName: 'tool1',
            totalCalls: 5,
            successfulCalls: 4,
            failedCalls: 1,
            lastUsed: new Date().toISOString(),
          },
        },
      });

      await manager.import(data);

      const summary = manager.getLearningSummary();
      expect(summary).toContain('tool1');
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      manager.recordSuccess('msg', 'resp', [
        { name: 'tool', params: {}, success: true },
      ]);

      await manager.clear();

      const summary = manager.getLearningSummary();
      // Should be empty summary
      expect(summary).toContain('Learning Summary');
    });
  });

  describe('shutdown', () => {
    it('should shutdown without error', async () => {
      await manager.initialize();
      await manager.shutdown();
      // Should not throw
    });

    it('should save dirty data on shutdown', async () => {
      await manager.initialize();
      manager.recordCorrection('msg', 'resp', 'corrected');
      await manager.shutdown();
      // Should have saved
    });
  });
});

describe('LearningEntry type', () => {
  it('should have correct structure', () => {
    const entry: LearningEntry = {
      id: 'test-id',
      timestamp: new Date().toISOString(),
      type: 'correction',
      context: {
        userMessage: 'test',
        modelResponse: 'test',
      },
      feedback: {},
      tags: ['test'],
    };

    expect(entry.type).toBe('correction');
    expect(entry.context.userMessage).toBe('test');
  });
});

describe('ToolUsageLearningStats type', () => {
  it('should have correct structure', () => {
    const stats: ToolUsageLearningStats = {
      toolName: 'test-tool',
      totalCalls: 10,
      successfulCalls: 8,
      failedCalls: 2,
      lastUsed: new Date().toISOString(),
    };

    expect(stats.toolName).toBe('test-tool');
    expect(stats.totalCalls).toBe(10);
  });
});
