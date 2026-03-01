/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ToolLearningManager,
  getToolLearningManager,
  type ToolCallError,
  type ToolLearningStats,
  type DynamicAlias,
  type LearningFeedback,
} from './tool-learning.js';

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

// Mock tool-names
vi.mock('../tools/tool-names.js', () => ({
  ToolNames: {
    SHELL: 'run_shell_command',
    PYTHON: 'run_python',
    NODEJS: 'run_nodejs',
    GOLANG: 'run_golang',
    EDIT: 'edit_file',
    READ_FILE: 'read_file',
    READ_MANY_FILES: 'read_many_files',
    WRITE_FILE: 'write_file',
    GREP: 'grep',
    LS: 'list_directory',
    WEB_FETCH: 'web_fetch',
    WEB_SEARCH: 'web_search',
    TODO_WRITE: 'todo_write',
    TASK: 'task',
    SKILL: 'skill',
    MEMORY: 'memory',
    EXIT_PLAN_MODE: 'exit_plan_mode',
  },
  ToolAliases: {
    bash: 'run_shell_command',
    shell: 'run_shell_command',
  },
  DynamicAliases: {},
  type ToolName: {} as string,
}));

describe('ToolLearningManager', () => {
  let manager: ToolLearningManager;

  beforeEach(() => {
    // Reset singleton for each test
    vi.clearAllMocks();
    // Access private static instance to reset it
    (ToolLearningManager as unknown as { instance: ToolLearningManager | null }).instance = null;
    manager = ToolLearningManager.getInstance();
  });

  afterEach(async () => {
    if (manager) {
      await manager.shutdown();
    }
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ToolLearningManager.getInstance();
      const instance2 = ToolLearningManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getToolLearningManager', () => {
    it('should return the ToolLearningManager instance', () => {
      const manager = getToolLearningManager();
      expect(manager).toBeInstanceOf(ToolLearningManager);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await manager.initialize();
      // Should not throw
    });
  });

  describe('recordToolError', () => {
    it('should record a tool error', () => {
      const error = manager.recordToolError(
        'git_dev',
        'run_shell_command',
        0.95,
      );

      expect(error.requestedTool).toBe('git_dev');
      expect(error.suggestedTool).toBe('run_shell_command');
      expect(error.confidence).toBe(0.95);
      expect(error.resolved).toBe(false);
    });

    it('should record error with context', () => {
      const error = manager.recordToolError(
        'unknown_tool',
        'run_shell_command',
        0.8,
        {
          modelId: 'llama3',
          userMessage: 'test message',
        },
      );

      expect(error.context.modelId).toBe('llama3');
      expect(error.context.userMessage).toBe('test message');
    });

    it('should update stats after recording error', () => {
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);

      const summary = manager.getStatsSummary();
      expect(summary).toContain('run_shell_command');
    });
  });

  describe('findBestMatch', () => {
    it('should find match for known patterns', () => {
      const match = manager.findBestMatch('git_dev');
      expect(match).not.toBeNull();
      expect(match!.name).toBe('run_shell_command');
      expect(match!.confidence).toBe(0.9);
    });

    it('should return null for unknown tools with no similar matches', () => {
      const match = manager.findBestMatch('xyz123_unknown_tool');
      expect(match).toBeNull();
    });

    it('should return exact match for valid tool', () => {
      const match = manager.findBestMatch('run_shell_command');
      expect(match).not.toBeNull();
      expect(match!.confidence).toBe(1);
    });
  });

  describe('resolveError', () => {
    it('should mark error as resolved', () => {
      const error = manager.recordToolError('git_dev', 'run_shell_command', 0.9);

      manager.resolveError(error.id);

      const summary = manager.getStatsSummary();
      expect(summary).toContain('Resolved errors: 1');
    });

    it('should handle non-existent error id', () => {
      manager.resolveError('non-existent-id');
      // Should not throw
    });
  });

  describe('generateLearningFeedback', () => {
    it('should return empty array when no errors', () => {
      const feedback = manager.generateLearningFeedback();
      expect(feedback).toHaveLength(0);
    });

    it('should generate feedback for unresolved errors', () => {
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);

      const feedback = manager.generateLearningFeedback();
      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback[0].incorrectTool).toBe('git_dev');
      expect(feedback[0].correctTool).toBe('run_shell_command');
    });
  });

  describe('generateLearningContext', () => {
    it('should generate context string', () => {
      const context = manager.generateLearningContext();
      expect(context).toContain('Available Tools');
    });

    it('should include learning feedback when errors exist', () => {
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);

      const context = manager.generateLearningContext();
      expect(context).toContain('Tool Learning Feedback');
    });
  });

  describe('getCommonMistakes', () => {
    it('should return empty array when no mistakes', () => {
      const mistakes = manager.getCommonMistakes();
      expect(mistakes).toHaveLength(0);
    });

    it('should return common mistakes', () => {
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);

      const mistakes = manager.getCommonMistakes();
      expect(mistakes.length).toBeGreaterThan(0);
      expect(mistakes[0].wrongName).toBe('git_dev');
    });

    it('should respect limit parameter', () => {
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);
      manager.recordToolError('bash_dev', 'run_shell_command', 0.9);
      manager.recordToolError('shell_dev', 'run_shell_command', 0.9);

      const mistakes = manager.getCommonMistakes(2);
      expect(mistakes.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getStatsSummary', () => {
    it('should return summary string', () => {
      const summary = manager.getStatsSummary();
      expect(summary).toContain('Tool Learning Statistics');
    });

    it('should include error counts', () => {
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);

      const summary = manager.getStatsSummary();
      expect(summary).toContain('Total tool errors recorded');
    });
  });

  describe('addDynamicAlias', () => {
    it('should add dynamic alias', () => {
      const result = manager.addDynamicAlias(
        'my_custom_tool',
        'run_shell_command',
        'manual',
      );

      expect(result).toBe(true);
      const aliases = manager.getDynamicAliases();
      expect(aliases.some((a) => a.alias === 'my_custom_tool')).toBe(true);
    });

    it('should not overwrite static aliases', () => {
      const result = manager.addDynamicAlias('bash', 'run_shell_command');
      expect(result).toBe(false);
    });
  });

  describe('removeDynamicAlias', () => {
    it('should remove existing alias', () => {
      manager.addDynamicAlias('test_alias', 'run_shell_command');
      const result = manager.removeDynamicAlias('test_alias');
      expect(result).toBe(true);
    });

    it('should return false for non-existent alias', () => {
      const result = manager.removeDynamicAlias('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('getDynamicAliases', () => {
    it('should return empty array when no aliases', () => {
      const aliases = manager.getDynamicAliases();
      expect(aliases).toHaveLength(0);
    });

    it('should return all dynamic aliases', () => {
      manager.addDynamicAlias('alias1', 'run_shell_command');
      manager.addDynamicAlias('alias2', 'read_file');

      const aliases = manager.getDynamicAliases();
      expect(aliases.length).toBe(2);
    });
  });

  describe('export', () => {
    it('should export data as JSON string', async () => {
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);

      const exported = await manager.export();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe('1.0');
      expect(parsed.errors).toBeDefined();
      expect(parsed.dynamicAliases).toBeDefined();
    });
  });

  describe('import', () => {
    it('should import data from JSON string', async () => {
      const data = JSON.stringify({
        version: '1.0',
        errors: [
          {
            id: 'err-1',
            timestamp: new Date().toISOString(),
            requestedTool: 'git_dev',
            suggestedTool: 'run_shell_command',
            confidence: 0.9,
            context: {},
            resolved: false,
            resolutionAttempts: 0,
          },
        ],
        dynamicAliases: [],
        stats: {},
      });

      await manager.import(data);

      const summary = manager.getStatsSummary();
      expect(summary).toContain('Total tool errors recorded: 1');
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      manager.recordToolError('git_dev', 'run_shell_command', 0.9);

      await manager.clear();

      const summary = manager.getStatsSummary();
      expect(summary).toContain('Total tool errors recorded: 0');
    });
  });

  describe('save', () => {
    it('should save successfully', async () => {
      await manager.save();
      // Should not throw
    });
  });

  describe('shutdown', () => {
    it('should shutdown without error', async () => {
      await manager.initialize();
      await manager.shutdown();
      // Should not throw
    });
  });
});

describe('ToolCallError type', () => {
  it('should have correct structure', () => {
    const error: ToolCallError = {
      id: 'err-123',
      timestamp: new Date().toISOString(),
      requestedTool: 'git_dev',
      suggestedTool: 'run_shell_command',
      confidence: 0.9,
      context: {},
      resolved: false,
      resolutionAttempts: 0,
    };

    expect(error.requestedTool).toBe('git_dev');
    expect(error.confidence).toBe(0.9);
  });
});

describe('ToolLearningStats type', () => {
  it('should have correct structure', () => {
    const stats: ToolLearningStats = {
      toolName: 'run_shell_command',
      totalErrors: 10,
      resolvedErrors: 8,
      commonMistakes: [{ wrongName: 'git_dev', count: 5 }],
    };

    expect(stats.toolName).toBe('run_shell_command');
    expect(stats.totalErrors).toBe(10);
  });
});

describe('DynamicAlias type', () => {
  it('should have correct structure', () => {
    const alias: DynamicAlias = {
      alias: 'my_tool',
      canonicalName: 'run_shell_command',
      createdAt: new Date().toISOString(),
      source: 'manual',
      errorCount: 3,
    };

    expect(alias.alias).toBe('my_tool');
    expect(alias.source).toBe('manual');
  });
});

describe('LearningFeedback type', () => {
  it('should have correct structure', () => {
    const feedback: LearningFeedback = {
      incorrectTool: 'git_dev',
      correctTool: 'run_shell_command',
      explanation: 'Use run_shell_command for shell commands',
      example: 'run_shell_command: {"command": "git status"}',
    };

    expect(feedback.incorrectTool).toBe('git_dev');
    expect(feedback.correctTool).toBe('run_shell_command');
    expect(feedback.explanation).toBeDefined();
    expect(feedback.example).toBeDefined();
  });
});
