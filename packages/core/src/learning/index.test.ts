/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  // Self-learning exports
  SelfLearningManager,
  getSelfLearningManager,
  type LearningEntry,
  type ToolUsageLearningStats,
  type ProjectPattern,
  // Tool-learning exports
  ToolLearningManager,
  getToolLearningManager,
  type ToolCallError,
  type ToolLearningStats,
  type DynamicAlias,
  type LearningFeedback,
} from './index.js';

describe('Learning Module Index', () => {
  describe('Self-learning exports', () => {
    it('should export SelfLearningManager', () => {
      expect(SelfLearningManager).toBeDefined();
    });

    it('should export getSelfLearningManager function', () => {
      expect(typeof getSelfLearningManager).toBe('function');
    });

    it('should return SelfLearningManager instance from getSelfLearningManager', () => {
      const manager = getSelfLearningManager();
      expect(manager).toBeInstanceOf(SelfLearningManager);
    });
  });

  describe('Tool-learning exports', () => {
    it('should export ToolLearningManager', () => {
      expect(ToolLearningManager).toBeDefined();
    });

    it('should export getToolLearningManager function', () => {
      expect(typeof getToolLearningManager).toBe('function');
    });

    it('should return ToolLearningManager instance from getToolLearningManager', () => {
      const manager = getToolLearningManager();
      expect(manager).toBeInstanceOf(ToolLearningManager);
    });
  });

  describe('Type exports', () => {
    it('should have LearningEntry type', () => {
      const entry: LearningEntry = {
        id: 'test',
        timestamp: new Date().toISOString(),
        type: 'success',
        context: {
          userMessage: 'test',
          modelResponse: 'test',
        },
        feedback: {},
        tags: [],
      };
      expect(entry.id).toBe('test');
    });

    it('should have ToolUsageLearningStats type', () => {
      const stats: ToolUsageLearningStats = {
        toolName: 'test',
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        lastUsed: new Date().toISOString(),
      };
      expect(stats.toolName).toBe('test');
    });

    it('should have ProjectPattern type', () => {
      const pattern: ProjectPattern = {
        projectType: 'node',
        languages: ['typescript'],
        frameworks: ['express'],
        buildTools: ['npm'],
      };
      expect(pattern.projectType).toBe('node');
    });

    it('should have ToolCallError type', () => {
      const error: ToolCallError = {
        id: 'err-1',
        timestamp: new Date().toISOString(),
        requestedTool: 'unknown',
        suggestedTool: 'known',
        confidence: 0.9,
        context: {},
        resolved: false,
        resolutionAttempts: 0,
      };
      expect(error.requestedTool).toBe('unknown');
    });

    it('should have ToolLearningStats type', () => {
      const stats: ToolLearningStats = {
        toolName: 'test',
        totalErrors: 0,
        resolvedErrors: 0,
        commonMistakes: [],
      };
      expect(stats.toolName).toBe('test');
    });

    it('should have DynamicAlias type', () => {
      const alias: DynamicAlias = {
        alias: 'test',
        canonicalName: 'run_shell_command',
        createdAt: new Date().toISOString(),
        source: 'manual',
        errorCount: 0,
      };
      expect(alias.alias).toBe('test');
    });

    it('should have LearningFeedback type', () => {
      const feedback: LearningFeedback = {
        incorrectTool: 'wrong',
        correctTool: 'right',
        explanation: 'test',
        example: 'test',
      };
      expect(feedback.incorrectTool).toBe('wrong');
    });
  });
});
