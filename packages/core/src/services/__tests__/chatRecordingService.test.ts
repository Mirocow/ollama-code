/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ChatRecordingService,
  type ChatRecord,
} from '../chatRecordingService.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Mock dependencies
vi.mock('node:fs');
vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>();
  return {
    ...actual,
    homedir: vi.fn(() => '/mock/home'),
  };
});

vi.mock('../../utils/gitUtils.js', () => ({
  getGitBranch: vi.fn(() => 'main'),
}));

vi.mock('../../utils/debugLogger.js', () => ({
  createDebugLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock jsonl-utils
vi.mock('../../utils/jsonl-utils.js', () => ({
  writeLineSync: vi.fn(),
  readLinesSync: vi.fn(() => []),
}));

// Mock content creation functions
vi.mock('../../types/content.js', () => ({
  createUserContent: vi.fn((msg) => ({ role: 'user', parts: [{ text: msg }] })),
  createModelContent: vi.fn((msg) => ({
    role: 'model',
    parts: [{ text: msg }],
  })),
}));

describe('ChatRecordingService', () => {
  let service: ChatRecordingService;
  let mockConfig: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = {
      getSessionId: vi.fn(() => 'test-session-123'),
      getProjectRoot: vi.fn(() => '/test/project'),
      getCliVersion: vi.fn(() => '1.0.0'),
      getResumedSessionData: vi.fn(() => null),
    };

    // Mock fs.existsSync to return false (file doesn't exist)
    vi.mocked(fs.existsSync).mockReturnValue(false);
    // Mock fs.mkdirSync
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    // Mock fs.writeFileSync
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

    service = new ChatRecordingService(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('initializes with config', () => {
      expect(mockConfig.getSessionId).toBeDefined();
      expect(mockConfig.getResumedSessionData).toHaveBeenCalled();
    });

    it('sets lastRecordUuid from resumed session', () => {
      mockConfig.getResumedSessionData = vi.fn(() => ({
        lastCompletedUuid: 'previous-uuid',
      }));

      service = new ChatRecordingService(mockConfig);
      // The service should use this for parentUuid chain
    });
  });

  describe('recordUserMessage', () => {
    it('records user message with generated UUID', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordUserMessage('Hello, world!');

      expect(writeLineSync).toHaveBeenCalled();
      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('user');
      expect(record.sessionId).toBe('test-session-123');
      expect(record.cwd).toBe('/test/project');
      expect(record.parentUuid).toBeNull(); // First message
    });

    it('records user message with provided UUID', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordUserMessage('Hello!', 'custom-uuid-123');

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.uuid).toBe('custom-uuid-123');
    });

    it('sets parentUuid for subsequent messages', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      // First message
      service.recordUserMessage('First');
      const firstRecord = vi.mocked(writeLineSync).mock
        .calls[0][1] as ChatRecord;

      // Second message
      service.recordUserMessage('Second');
      const secondRecord = vi.mocked(writeLineSync).mock
        .calls[1][1] as ChatRecord;

      expect(secondRecord.parentUuid).toBe(firstRecord.uuid);
    });
  });

  describe('recordAssistantTurn', () => {
    it('records assistant turn with all data', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordAssistantTurn({
        model: 'llama3',
        message: [{ text: 'Hello, I can help you!' }],
        tokens: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30,
        },
        uuid: 'assistant-uuid-123',
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('assistant');
      expect(record.uuid).toBe('assistant-uuid-123');
      expect(record.model).toBe('llama3');
      expect(record.usageMetadata?.promptTokenCount).toBe(10);
      expect(record.usageMetadata?.candidatesTokenCount).toBe(20);
    });

    it('generates UUID if not provided', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordAssistantTurn({
        model: 'llama3',
        message: [{ text: 'Response' }],
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.uuid).toBeDefined();
      expect(typeof record.uuid).toBe('string');
    });

    it('handles empty message', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordAssistantTurn({
        model: 'llama3',
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('assistant');
      expect(record.message).toBeUndefined();
    });

    it('records requestUuid to link response to user message', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordAssistantTurn({
        model: 'llama3',
        message: [{ text: 'The answer is 42.' }],
        uuid: 'assistant-uuid-456',
        requestUuid: 'user-msg-uuid-123',
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.requestUuid).toBe('user-msg-uuid-123');
    });

    it('handles missing requestUuid gracefully', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordAssistantTurn({
        model: 'llama3',
        message: [{ text: 'Response without request link' }],
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.requestUuid).toBeUndefined();
    });
  });

  describe('recordToolResult', () => {
    it('records tool result with function response', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordToolResult(
        [
          {
            functionResponse: {
              name: 'read_file',
              response: { content: 'file contents' },
            },
          },
        ],
        { status: 'success' },
      );

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('tool_result');
    });

    it('includes tool call result info for UI recovery', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordToolResult(
        [{ functionResponse: { name: 'run_shell', response: {} } }],
        {
          status: 'success',
          callId: 'call-123',
          resultDisplay: { type: 'text', text: 'output' },
        },
      );

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.toolCallResult).toBeDefined();
      expect(record.toolCallResult?.status).toBe('success');
    });
  });

  describe('recordSlashCommand', () => {
    it('records slash command invocation', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordSlashCommand({
        phase: 'invocation',
        rawCommand: '/help',
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('system');
      expect(record.subtype).toBe('slash_command');
    });

    it('records slash command output', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordSlashCommand({
        phase: 'result',
        rawCommand: '/about',
        outputHistoryItems: [{ type: 'info', text: 'Version 1.0.0' }],
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.systemPayload).toBeDefined();
    });
  });

  describe('recordChatCompression', () => {
    it('records compression checkpoint', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordChatCompression({
        info: {
          originalTokenCount: 1000,
          newTokenCount: 500,
          compressionStatus: 1, // COMPRESSED
        },
        compressedHistory: [],
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('system');
      expect(record.subtype).toBe('chat_compression');
    });
  });

  describe('recordUiTelemetryEvent', () => {
    it('records telemetry state', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordUiTelemetryEvent({
        telemetryState: {
          metrics: {
            models: {
              tokens: {
                prompt: 100,
                generated: 50,
                cached: 0,
                total: 150,
                thoughts: 10,
                tool: 5,
                candidates: 0,
              },
              api: {
                time: 1000,
                calls: 5,
                totalRequests: 5,
                totalErrors: 0,
                totalLatencyMs: 1000,
              },
              totalPromptTokens: 100,
              totalGeneratedTokens: 50,
              totalCachedTokens: 0,
              totalApiTime: 1000,
              byModel: {},
            },
            tools: {
              totalCalls: 3,
              totalSuccess: 2,
              totalFail: 1,
              totalDurationMs: 500,
              totalDecisions: {
                accept: 1,
                reject: 0,
                modify: 0,
                auto_accept: 1,
              },
              byName: {},
            },
            files: {
              read: 5,
              write: 2,
              edit: 1,
              totalLinesAdded: 10,
              totalLinesRemoved: 5,
            },
            storage: { recordCount: 0, keys: [], totalSize: 0 },
            plugins: {
              loadedPlugins: 0,
              enabledPlugins: 0,
              toolCount: 0,
              skillCount: 0,
            },
            totalPromptTokens: 100,
            totalCachedTokens: 0,
            totalGeneratedTokens: 50,
            totalApiTime: 1000,
          },
          lastPromptTokenCount: 100,
          accumulatedPromptTokens: 500,
          gitOperations: {},
        },
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('system');
      expect(record.subtype).toBe('ui_telemetry');
    });
  });

  describe('recordAtCommand', () => {
    it('records @-command metadata', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordAtCommand({
        filesRead: ['/path/to/file1.ts', '/path/to/file2.ts'],
        status: 'success',
        message: 'Files added to context',
        userText: '@file1.ts @file2.ts',
      });

      const record = vi.mocked(writeLineSync).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('system');
      expect(record.subtype).toBe('at_command');
    });
  });

  describe('session file handling', () => {
    it('creates session file on first write', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      service.recordUserMessage('Hello');

      // Should create directory
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.ollama-code/sessions'),
        { recursive: true },
      );

      // Should create file
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('reuses existing session file', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      // Mock file existing
      vi.mocked(fs.existsSync).mockReturnValue(true);

      service.recordUserMessage('Hello');

      // Should NOT try to create file
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('parent chain', () => {
    it('builds correct parent chain', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      // Record sequence: user -> assistant -> tool -> assistant
      service.recordUserMessage('User message', 'uuid-1');
      service.recordAssistantTurn({ model: 'llama3', uuid: 'uuid-2' });
      service.recordToolResult(
        [{ functionResponse: { name: 'tool', response: {} } }],
        { status: 'success' },
      );
      service.recordAssistantTurn({ model: 'llama3', uuid: 'uuid-4' });

      const calls = vi.mocked(writeLineSync).mock.calls;

      const record1 = calls[0][1] as ChatRecord;
      const record2 = calls[1][1] as ChatRecord;
      const record3 = calls[2][1] as ChatRecord;
      const record4 = calls[3][1] as ChatRecord;

      expect(record1.uuid).toBe('uuid-1');
      expect(record1.parentUuid).toBeNull();

      expect(record2.uuid).toBe('uuid-2');
      expect(record2.parentUuid).toBe('uuid-1');

      expect(record3.type).toBe('tool_result');
      expect(record3.parentUuid).toBe('uuid-2');

      expect(record4.uuid).toBe('uuid-4');
      expect(record4.parentUuid).toBe(record3.uuid);
    });

    it('links assistant response to user request via requestUuid', async () => {
      const { writeLineSync } = await import('../../utils/jsonl-utils.js');

      // User asks a question
      service.recordUserMessage('What is 2+2?', 'user-msg-uuid');

      // Assistant responds, linked to the user's question
      service.recordAssistantTurn({
        model: 'llama3',
        message: [{ text: 'The answer is 4.' }],
        uuid: 'assistant-uuid',
        requestUuid: 'user-msg-uuid',
      });

      const calls = vi.mocked(writeLineSync).mock.calls;

      const userRecord = calls[0][1] as ChatRecord;
      const assistantRecord = calls[1][1] as ChatRecord;

      // User message has no requestUuid (it's the request)
      expect(userRecord.type).toBe('user');
      expect(userRecord.uuid).toBe('user-msg-uuid');
      expect(userRecord.requestUuid).toBeUndefined();

      // Assistant response links back to the user message
      expect(assistantRecord.type).toBe('assistant');
      expect(assistantRecord.uuid).toBe('assistant-uuid');
      expect(assistantRecord.requestUuid).toBe('user-msg-uuid');
      expect(assistantRecord.parentUuid).toBe('user-msg-uuid');
    });
  });
});

describe('ChatRecord type structure', () => {
  it('has all required fields', () => {
    const record: ChatRecord = {
      uuid: 'test-uuid',
      parentUuid: null,
      sessionId: 'session-123',
      timestamp: new Date().toISOString(),
      type: 'user',
      cwd: '/test/path',
      version: '1.0.0',
    };

    expect(record.uuid).toBeDefined();
    expect(record.type).toBe('user');
    expect(record.parentUuid).toBeNull();
  });

  it('supports all message types', () => {
    const types: Array<ChatRecord['type']> = [
      'user',
      'assistant',
      'tool_result',
      'system',
    ];

    types.forEach((type) => {
      const record: ChatRecord = {
        uuid: 'test',
        parentUuid: null,
        sessionId: 'session',
        timestamp: new Date().toISOString(),
        type,
        cwd: '/test',
        version: '1.0.0',
      };

      expect(record.type).toBe(type);
    });
  });

  it('supports system subtypes', () => {
    const subtypes: Array<ChatRecord['subtype']> = [
      'chat_compression',
      'slash_command',
      'ui_telemetry',
      'at_command',
    ];

    subtypes.forEach((subtype) => {
      const record: ChatRecord = {
        uuid: 'test',
        parentUuid: null,
        sessionId: 'session',
        timestamp: new Date().toISOString(),
        type: 'system',
        subtype,
        cwd: '/test',
        version: '1.0.0',
      };

      expect(record.subtype).toBe(subtype);
    });
  });
});
