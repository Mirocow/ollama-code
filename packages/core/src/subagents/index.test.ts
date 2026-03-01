/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';

// Import all exports to verify they're properly re-exported
import {
  type SubagentConfig,
  type SubagentLevel,
  type SubagentRuntimeConfig,
  type ValidationResult,
  type ListSubagentsOptions,
  type CreateSubagentOptions,
  type SubagentErrorCode,
  SubagentError,
  BuiltinAgentRegistry,
  SubagentValidator,
  SubagentManager,
  type PromptConfig,
  type ModelConfig,
  type RunConfig,
  type ToolConfig,
  type SubagentTerminateMode,
  SubAgentScope,
  type SubAgentEvent,
  type SubAgentStartEvent,
  type SubAgentRoundEvent,
  type SubAgentStreamTextEvent,
  type SubAgentUsageEvent,
  type SubAgentToolCallEvent,
  type SubAgentToolResultEvent,
  type SubAgentFinishEvent,
  type SubAgentErrorEvent,
  type SubAgentApprovalRequestEvent,
  SubAgentEventEmitter,
  SubAgentEventType,
  type SubagentStatsSummary,
  type ToolUsageStats,
} from './index.js';

describe('subagents index', () => {
  describe('type exports', () => {
    it('should export SubagentConfig type', () => {
      const config: SubagentConfig = {
        name: 'test-agent',
        description: 'Test agent',
        systemPrompt: 'You are a test agent',
      };
      expect(config.name).toBe('test-agent');
    });

    it('should export SubagentLevel type', () => {
      const level: SubagentLevel = 'project';
      expect(level).toBe('project');
    });

    it('should export ValidationResult type', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };
      expect(result.valid).toBe(true);
    });

    it('should export PromptConfig type', () => {
      const config: PromptConfig = {
        systemPrompt: 'Test prompt',
      };
      expect(config.systemPrompt).toBe('Test prompt');
    });

    it('should export ModelConfig type', () => {
      const config: ModelConfig = {
        model: 'llama3.2',
        temp: 0.7,
      };
      expect(config.model).toBe('llama3.2');
    });

    it('should export RunConfig type', () => {
      const config: RunConfig = {
        max_turns: 10,
        max_time_minutes: 5,
      };
      expect(config.max_turns).toBe(10);
    });

    it('should export ToolConfig type', () => {
      const config: ToolConfig = {
        tools: ['readFile', 'writeFile'],
      };
      expect(config.tools).toEqual(['readFile', 'writeFile']);
    });
  });

  describe('class exports', () => {
    it('should export SubagentError', () => {
      const error = new SubagentError('Test error message', 'TEST_ERROR');
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
    });

    it('should export BuiltinAgentRegistry', () => {
      expect(BuiltinAgentRegistry).toBeDefined();
    });

    it('should export SubagentValidator', () => {
      expect(SubagentValidator).toBeDefined();
    });

    it('should export SubagentManager', () => {
      expect(SubagentManager).toBeDefined();
    });

    it('should export SubAgentScope', () => {
      expect(SubAgentScope).toBeDefined();
    });

    it('should export SubAgentEventEmitter', () => {
      const emitter = new SubAgentEventEmitter();
      expect(emitter).toBeDefined();
      expect(typeof emitter.on).toBe('function');
      expect(typeof emitter.off).toBe('function');
      expect(typeof emitter.emit).toBe('function');
    });
  });

  describe('enum exports', () => {
    it('should export SubAgentEventType', () => {
      expect(SubAgentEventType.START).toBe('start');
      expect(SubAgentEventType.FINISH).toBe('finish');
      expect(SubAgentEventType.ERROR).toBe('error');
    });
  });

  describe('event type exports', () => {
    it('should export SubAgentEvent type', () => {
      const event: SubAgentEvent = 'start';
      expect(event).toBe('start');
    });

    it('should export SubAgentStartEvent type', () => {
      const event: SubAgentStartEvent = {
        subagentId: 'test',
        name: 'test',
        tools: [],
        timestamp: Date.now(),
      };
      expect(event.subagentId).toBe('test');
    });

    it('should export SubAgentRoundEvent type', () => {
      const event: SubAgentRoundEvent = {
        subagentId: 'test',
        round: 1,
        promptId: 'test',
        timestamp: Date.now(),
      };
      expect(event.round).toBe(1);
    });

    it('should export SubAgentStreamTextEvent type', () => {
      const event: SubAgentStreamTextEvent = {
        subagentId: 'test',
        round: 1,
        text: 'test',
        timestamp: Date.now(),
      };
      expect(event.text).toBe('test');
    });

    it('should export SubAgentUsageEvent type', () => {
      const event: SubAgentUsageEvent = {
        subagentId: 'test',
        round: 1,
        usage: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
        timestamp: Date.now(),
      };
      expect(event.usage.totalTokenCount).toBe(150);
    });

    it('should export SubAgentToolCallEvent type', () => {
      const event: SubAgentToolCallEvent = {
        subagentId: 'test',
        round: 1,
        callId: 'call',
        name: 'test',
        args: {},
        description: 'test',
        timestamp: Date.now(),
      };
      expect(event.callId).toBe('call');
    });

    it('should export SubAgentToolResultEvent type', () => {
      const event: SubAgentToolResultEvent = {
        subagentId: 'test',
        round: 1,
        callId: 'call',
        name: 'test',
        success: true,
        timestamp: Date.now(),
      };
      expect(event.success).toBe(true);
    });

    it('should export SubAgentFinishEvent type', () => {
      const event: SubAgentFinishEvent = {
        subagentId: 'test',
        terminateReason: 'GOAL',
        timestamp: Date.now(),
      };
      expect(event.terminateReason).toBe('GOAL');
    });

    it('should export SubAgentErrorEvent type', () => {
      const event: SubAgentErrorEvent = {
        subagentId: 'test',
        error: 'test error',
        timestamp: Date.now(),
      };
      expect(event.error).toBe('test error');
    });

    it('should export SubAgentApprovalRequestEvent type', () => {
      const event: SubAgentApprovalRequestEvent = {
        subagentId: 'test',
        round: 1,
        callId: 'call',
        name: 'test',
        description: 'test',
        confirmationDetails: {
          type: 'generic',
          message: 'test',
        },
        respond: async () => {},
        timestamp: Date.now(),
      };
      expect(event.confirmationDetails.type).toBe('generic');
    });
  });

  describe('statistics type exports', () => {
    it('should export SubagentStatsSummary type', () => {
      const summary: SubagentStatsSummary = {
        rounds: 5,
        totalToolCalls: 10,
        successfulToolCalls: 8,
        failedToolCalls: 2,
        totalDurationMs: 1000,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
      };
      expect(summary.rounds).toBe(5);
    });

    it('should export ToolUsageStats type', () => {
      const stats: ToolUsageStats = {
        name: 'readFile',
        count: 5,
        success: 5,
        failure: 0,
        totalDurationMs: 100,
        averageDurationMs: 20,
      };
      expect(stats.name).toBe('readFile');
    });
  });
});
