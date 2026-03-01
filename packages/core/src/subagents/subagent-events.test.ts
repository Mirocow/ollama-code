/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import {
  SubAgentEventEmitter,
  SubAgentEventType,
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
} from './subagent-events.js';

describe('SubAgentEventType', () => {
  it('should have all expected event types', () => {
    expect(SubAgentEventType.START).toBe('start');
    expect(SubAgentEventType.ROUND_START).toBe('round_start');
    expect(SubAgentEventType.ROUND_END).toBe('round_end');
    expect(SubAgentEventType.STREAM_TEXT).toBe('stream_text');
    expect(SubAgentEventType.TOOL_CALL).toBe('tool_call');
    expect(SubAgentEventType.TOOL_RESULT).toBe('tool_result');
    expect(SubAgentEventType.TOOL_WAITING_APPROVAL).toBe('tool_waiting_approval');
    expect(SubAgentEventType.USAGE_METADATA).toBe('usage_metadata');
    expect(SubAgentEventType.FINISH).toBe('finish');
    expect(SubAgentEventType.ERROR).toBe('error');
  });

  it('should match SubAgentEvent type values', () => {
    const eventTypes: SubAgentEvent[] = [
      'start',
      'round_start',
      'round_end',
      'stream_text',
      'tool_call',
      'tool_result',
      'tool_waiting_approval',
      'usage_metadata',
      'finish',
      'error',
    ];

    expect(Object.values(SubAgentEventType)).toEqual(eventTypes);
  });
});

describe('SubAgentEventEmitter', () => {
  it('should register and emit events', () => {
    const emitter = new SubAgentEventEmitter();
    const listener = vi.fn();

    emitter.on('start', listener);
    emitter.emit('start', { test: 'data' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should support multiple listeners for same event', () => {
    const emitter = new SubAgentEventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    emitter.on('start', listener1);
    emitter.on('start', listener2);
    emitter.emit('start', { test: 'data' });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('should remove listeners with off', () => {
    const emitter = new SubAgentEventEmitter();
    const listener = vi.fn();

    emitter.on('start', listener);
    emitter.off('start', listener);
    emitter.emit('start', { test: 'data' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should emit different event types', () => {
    const emitter = new SubAgentEventEmitter();
    const startListener = vi.fn();
    const finishListener = vi.fn();

    emitter.on('start', startListener);
    emitter.on('finish', finishListener);

    emitter.emit('start', { type: 'start' });
    emitter.emit('finish', { type: 'finish' });

    expect(startListener).toHaveBeenCalledTimes(1);
    expect(finishListener).toHaveBeenCalledTimes(1);
  });

  it('should pass complex payloads', () => {
    const emitter = new SubAgentEventEmitter();
    const listener = vi.fn();

    emitter.on('tool_call', listener);

    const payload: SubAgentToolCallEvent = {
      subagentId: 'test-123',
      round: 1,
      callId: 'call-456',
      name: 'readFile',
      args: { path: '/test/file.ts' },
      description: 'Read a test file',
      timestamp: Date.now(),
    };

    emitter.emit('tool_call', payload);

    expect(listener).toHaveBeenCalledWith(payload);
  });

  it('should not fail when emitting to non-existent listeners', () => {
    const emitter = new SubAgentEventEmitter();

    expect(() => {
      emitter.emit('start', { test: 'data' });
    }).not.toThrow();
  });

  it('should only remove specific listener', () => {
    const emitter = new SubAgentEventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    emitter.on('start', listener1);
    emitter.on('start', listener2);
    emitter.off('start', listener1);
    emitter.emit('start', {});

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);
  });
});

describe('Event Types', () => {
  describe('SubAgentStartEvent', () => {
    it('should have all required properties', () => {
      const event: SubAgentStartEvent = {
        subagentId: 'test-123',
        name: 'test-agent',
        model: 'llama3.2',
        tools: ['readFile', 'writeFile'],
        timestamp: Date.now(),
      };

      expect(event.subagentId).toBe('test-123');
      expect(event.name).toBe('test-agent');
      expect(event.model).toBe('llama3.2');
      expect(event.tools).toEqual(['readFile', 'writeFile']);
    });

    it('should allow optional model', () => {
      const event: SubAgentStartEvent = {
        subagentId: 'test-123',
        name: 'test-agent',
        tools: [],
        timestamp: Date.now(),
      };

      expect(event.model).toBeUndefined();
    });
  });

  describe('SubAgentRoundEvent', () => {
    it('should have all required properties', () => {
      const event: SubAgentRoundEvent = {
        subagentId: 'test-123',
        round: 2,
        promptId: 'prompt-456',
        timestamp: Date.now(),
      };

      expect(event.round).toBe(2);
      expect(event.promptId).toBe('prompt-456');
    });
  });

  describe('SubAgentStreamTextEvent', () => {
    it('should have all required properties', () => {
      const event: SubAgentStreamTextEvent = {
        subagentId: 'test-123',
        round: 1,
        text: 'Hello, world!',
        timestamp: Date.now(),
      };

      expect(event.text).toBe('Hello, world!');
      expect(event.thought).toBeUndefined();
    });

    it('should support thought flag', () => {
      const event: SubAgentStreamTextEvent = {
        subagentId: 'test-123',
        round: 1,
        text: 'Thinking...',
        thought: true,
        timestamp: Date.now(),
      };

      expect(event.thought).toBe(true);
    });
  });

  describe('SubAgentUsageEvent', () => {
    it('should have all required properties', () => {
      const event: SubAgentUsageEvent = {
        subagentId: 'test-123',
        round: 1,
        usage: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
        timestamp: Date.now(),
      };

      expect(event.usage.promptTokenCount).toBe(100);
      expect(event.usage.candidatesTokenCount).toBe(50);
    });

    it('should support optional durationMs', () => {
      const event: SubAgentUsageEvent = {
        subagentId: 'test-123',
        round: 1,
        usage: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
        durationMs: 500,
        timestamp: Date.now(),
      };

      expect(event.durationMs).toBe(500);
    });
  });

  describe('SubAgentToolCallEvent', () => {
    it('should have all required properties', () => {
      const event: SubAgentToolCallEvent = {
        subagentId: 'test-123',
        round: 1,
        callId: 'call-456',
        name: 'readFile',
        args: { path: '/test/file.ts' },
        description: 'Read file',
        timestamp: Date.now(),
      };

      expect(event.callId).toBe('call-456');
      expect(event.name).toBe('readFile');
      expect(event.args).toEqual({ path: '/test/file.ts' });
    });
  });

  describe('SubAgentToolResultEvent', () => {
    it('should have all required properties for success', () => {
      const event: SubAgentToolResultEvent = {
        subagentId: 'test-123',
        round: 1,
        callId: 'call-456',
        name: 'readFile',
        success: true,
        timestamp: Date.now(),
      };

      expect(event.success).toBe(true);
      expect(event.error).toBeUndefined();
    });

    it('should have error for failure', () => {
      const event: SubAgentToolResultEvent = {
        subagentId: 'test-123',
        round: 1,
        callId: 'call-456',
        name: 'readFile',
        success: false,
        error: 'File not found',
        timestamp: Date.now(),
      };

      expect(event.success).toBe(false);
      expect(event.error).toBe('File not found');
    });

    it('should support optional fields', () => {
      const event: SubAgentToolResultEvent = {
        subagentId: 'test-123',
        round: 1,
        callId: 'call-456',
        name: 'readFile',
        success: true,
        responseParts: [{ text: 'file content' }],
        durationMs: 50,
        timestamp: Date.now(),
      };

      expect(event.responseParts).toEqual([{ text: 'file content' }]);
      expect(event.durationMs).toBe(50);
    });
  });

  describe('SubAgentFinishEvent', () => {
    it('should have required properties', () => {
      const event: SubAgentFinishEvent = {
        subagentId: 'test-123',
        terminateReason: 'GOAL',
        timestamp: Date.now(),
      };

      expect(event.terminateReason).toBe('GOAL');
    });

    it('should support all optional statistics', () => {
      const event: SubAgentFinishEvent = {
        subagentId: 'test-123',
        terminateReason: 'MAX_TURNS',
        timestamp: Date.now(),
        rounds: 10,
        totalDurationMs: 5000,
        totalToolCalls: 25,
        successfulToolCalls: 20,
        failedToolCalls: 5,
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
      };

      expect(event.rounds).toBe(10);
      expect(event.totalToolCalls).toBe(25);
      expect(event.inputTokens).toBe(1000);
    });
  });

  describe('SubAgentErrorEvent', () => {
    it('should have all required properties', () => {
      const event: SubAgentErrorEvent = {
        subagentId: 'test-123',
        error: 'Something went wrong',
        timestamp: Date.now(),
      };

      expect(event.error).toBe('Something went wrong');
    });
  });

  describe('SubAgentApprovalRequestEvent', () => {
    it('should have all required properties', () => {
      const respond = vi.fn();
      const event: SubAgentApprovalRequestEvent = {
        subagentId: 'test-123',
        round: 1,
        callId: 'call-456',
        name: 'shell',
        description: 'Execute command',
        confirmationDetails: {
          type: 'generic',
          message: 'Allow execution?',
        },
        respond,
        timestamp: Date.now(),
      };

      expect(event.name).toBe('shell');
      expect(event.confirmationDetails.type).toBe('generic');
      expect(typeof event.respond).toBe('function');
    });
  });
});
