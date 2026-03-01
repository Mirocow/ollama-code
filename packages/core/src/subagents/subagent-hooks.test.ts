/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type {
  PreToolUsePayload,
  PostToolUsePayload,
  SubagentStopPayload,
  SubagentHooks,
} from './subagent-hooks.js';

describe('subagent-hooks types', () => {
  describe('PreToolUsePayload', () => {
    it('should have required properties', () => {
      const payload: PreToolUsePayload = {
        subagentId: 'test-subagent-123',
        name: 'test-subagent',
        toolName: 'readFile',
        args: { path: '/test/path' },
        timestamp: Date.now(),
      };

      expect(payload.subagentId).toBe('test-subagent-123');
      expect(payload.name).toBe('test-subagent');
      expect(payload.toolName).toBe('readFile');
      expect(payload.args).toEqual({ path: '/test/path' });
      expect(typeof payload.timestamp).toBe('number');
    });

    it('should allow empty args', () => {
      const payload: PreToolUsePayload = {
        subagentId: 'test-id',
        name: 'test',
        toolName: 'listFiles',
        args: {},
        timestamp: 1234567890,
      };

      expect(payload.args).toEqual({});
    });

    it('should allow complex args', () => {
      const payload: PreToolUsePayload = {
        subagentId: 'test-id',
        name: 'test',
        toolName: 'search',
        args: {
          query: 'test',
          options: { caseSensitive: true, maxResults: 10 },
          filters: ['*.ts', '*.js'],
        },
        timestamp: Date.now(),
      };

      expect(payload.args.options).toEqual({ caseSensitive: true, maxResults: 10 });
      expect(payload.args.filters).toEqual(['*.ts', '*.js']);
    });
  });

  describe('PostToolUsePayload', () => {
    it('should extend PreToolUsePayload with success info', () => {
      const payload: PostToolUsePayload = {
        subagentId: 'test-subagent-123',
        name: 'test-subagent',
        toolName: 'readFile',
        args: { path: '/test/path' },
        timestamp: Date.now(),
        success: true,
        durationMs: 150,
      };

      expect(payload.success).toBe(true);
      expect(payload.durationMs).toBe(150);
      expect(payload.errorMessage).toBeUndefined();
    });

    it('should include errorMessage on failure', () => {
      const payload: PostToolUsePayload = {
        subagentId: 'test-id',
        name: 'test',
        toolName: 'readFile',
        args: { path: '/nonexistent' },
        timestamp: Date.now(),
        success: false,
        durationMs: 10,
        errorMessage: 'File not found',
      };

      expect(payload.success).toBe(false);
      expect(payload.errorMessage).toBe('File not found');
    });

    it('should allow undefined errorMessage on success', () => {
      const payload: PostToolUsePayload = {
        subagentId: 'test-id',
        name: 'test',
        toolName: 'testTool',
        args: {},
        timestamp: Date.now(),
        success: true,
        durationMs: 0,
      };

      expect(payload.errorMessage).toBeUndefined();
    });
  });

  describe('SubagentStopPayload', () => {
    it('should have required properties', () => {
      const payload: SubagentStopPayload = {
        subagentId: 'test-subagent-123',
        name: 'test-subagent',
        terminateReason: 'GOAL',
        summary: {
          totalToolCalls: 5,
          successfulToolCalls: 4,
          failedToolCalls: 1,
          rounds: 3,
        },
        timestamp: Date.now(),
      };

      expect(payload.subagentId).toBe('test-subagent-123');
      expect(payload.name).toBe('test-subagent');
      expect(payload.terminateReason).toBe('GOAL');
      expect(payload.summary.totalToolCalls).toBe(5);
    });

    it('should allow empty summary', () => {
      const payload: SubagentStopPayload = {
        subagentId: 'test-id',
        name: 'test',
        terminateReason: 'ERROR',
        summary: {},
        timestamp: Date.now(),
      };

      expect(payload.summary).toEqual({});
    });

    it('should allow complex summary data', () => {
      const payload: SubagentStopPayload = {
        subagentId: 'test-id',
        name: 'test',
        terminateReason: 'MAX_TURNS',
        summary: {
          rounds: 10,
          totalToolCalls: 25,
          successfulToolCalls: 20,
          failedToolCalls: 5,
          totalDurationMs: 5000,
          inputTokens: 1000,
          outputTokens: 500,
          toolUsage: [
            { name: 'readFile', count: 10, success: 10 },
            { name: 'writeFile', count: 5, success: 3, failure: 2 },
          ],
        },
        timestamp: Date.now(),
      };

      expect(payload.summary.rounds).toBe(10);
      expect(payload.summary.toolUsage).toHaveLength(2);
    });
  });

  describe('SubagentHooks', () => {
    it('should allow all optional hooks', () => {
      const hooks: SubagentHooks = {
        preToolUse: async (payload: PreToolUsePayload) => {
          console.log('Pre-tool:', payload.toolName);
        },
        postToolUse: async (payload: PostToolUsePayload) => {
          console.log('Post-tool:', payload.success);
        },
        onStop: async (payload: SubagentStopPayload) => {
          console.log('Stopped:', payload.terminateReason);
        },
      };

      expect(hooks.preToolUse).toBeDefined();
      expect(hooks.postToolUse).toBeDefined();
      expect(hooks.onStop).toBeDefined();
    });

    it('should allow partial hooks', () => {
      const hooksOnlyPre: SubagentHooks = {
        preToolUse: () => {},
      };
      expect(hooksOnlyPre.preToolUse).toBeDefined();
      expect(hooksOnlyPre.postToolUse).toBeUndefined();

      const hooksOnlyPost: SubagentHooks = {
        postToolUse: () => {},
      };
      expect(hooksOnlyPost.postToolUse).toBeDefined();

      const hooksOnlyStop: SubagentHooks = {
        onStop: () => {},
      };
      expect(hooksOnlyStop.onStop).toBeDefined();
    });

    it('should allow empty hooks object', () => {
      const hooks: SubagentHooks = {};
      expect(hooks.preToolUse).toBeUndefined();
      expect(hooks.postToolUse).toBeUndefined();
      expect(hooks.onStop).toBeUndefined();
    });

    it('should support sync hooks', () => {
      const hooks: SubagentHooks = {
        preToolUse: (payload) => {
          // Sync function
          return;
        },
      };

      expect(typeof hooks.preToolUse).toBe('function');
    });

    it('should support async hooks', () => {
      const hooks: SubagentHooks = {
        preToolUse: async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 0));
        },
      };

      expect(typeof hooks.preToolUse).toBe('function');
    });
  });
});
