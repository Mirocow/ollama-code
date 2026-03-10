/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration tests for stream saving flow
 *
 * Tests the complete flow:
 * 1. StreamingContentAccumulator accumulates chunks
 * 2. handleFinishedEvent extracts full content
 * 3. ChatRecordingService saves to JSONL
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createStreamingContentAccumulator,
  ensureString,
  hasSignificantContent,
  type TurnFinishedEvent,
} from '../useStreamingContentAccumulator.js';

// ============================================================================
// Mock Types
// ============================================================================

interface MockFinishedEvent {
  value: {
    reason: string | undefined;
    usageMetadata: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    } | undefined;
  };
}

interface MockChatRecordingService {
  recordUserMessage: ReturnType<typeof vi.fn>;
  recordAssistantTurn: ReturnType<typeof vi.fn>;
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Simulates the handleFinishedEvent logic from useOllamaStream
 */
function processFinishedEvent(
  accumulator: ReturnType<typeof createStreamingContentAccumulator>,
  event: MockFinishedEvent,
  recordingService: MockChatRecordingService,
  model: string = 'test-model',
  userUuid?: string,
): TurnFinishedEvent | null {
  const fullContent = accumulator.getText();
  const fullThought = accumulator.getThought();
  const uuid = accumulator.getUuid();

  const hasValidContent = hasSignificantContent(fullContent);
  const hasValidThought = hasSignificantContent(fullThought);

  if (recordingService && (hasValidContent || hasValidThought)) {
    recordingService.recordAssistantTurn({
      model,
      message: [{ text: fullContent }],
      tokens: event.value.usageMetadata,
      uuid,
      requestUuid: userUuid,
    });
  }

  const turnFinishedEvent = accumulator.finishTurn();
  accumulator.reset('finished', true);

  return turnFinishedEvent;
}

// ============================================================================
// Tests
// ============================================================================

describe('Stream Saving Integration', () => {
  let accumulator: ReturnType<typeof createStreamingContentAccumulator>;
  let mockRecordingService: MockChatRecordingService;

  beforeEach(() => {
    accumulator = createStreamingContentAccumulator({
      enableEventBus: false,
      debug: false,
    });

    mockRecordingService = {
      recordUserMessage: vi.fn(),
      recordAssistantTurn: vi.fn(),
    };
  });

  describe('Complete flow simulation', () => {
    it('accumulates and saves simple response', () => {
      // Start turn
      accumulator.startTurn('turn-123');

      // Simulate streaming chunks
      const chunks = ['Hello', ', ', 'world', '!'];
      chunks.forEach((chunk) => accumulator.appendText(chunk));

      // Simulate finished event
      const finishedEvent: MockFinishedEvent = {
        value: {
          reason: 'STOP',
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 4,
            totalTokenCount: 14,
          },
        },
      };

      // Process
      const turnEvent = processFinishedEvent(
        accumulator,
        finishedEvent,
        mockRecordingService,
      );

      // Verify
      expect(turnEvent).not.toBeNull();
      expect(turnEvent?.textLength).toBe(13);
      expect(turnEvent?.hasSignificantContent).toBe(true);

      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledTimes(1);
      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledWith({
        model: 'test-model',
        message: [{ text: 'Hello, world!' }],
        tokens: finishedEvent.value.usageMetadata,
        uuid: 'turn-123',
        requestUuid: undefined,
      });
    });

    it('handles response with thought', () => {
      accumulator.startTurn('turn-with-thought');

      // Model thinks first
      accumulator.appendThought('Let me analyze this...');
      accumulator.appendThought(' I need to check the files.');

      // Then responds
      accumulator.appendText('Based on my analysis...');

      const finishedEvent: MockFinishedEvent = {
        value: {
          reason: 'STOP',
          usageMetadata: undefined,
        },
      };

      processFinishedEvent(accumulator, finishedEvent, mockRecordingService);

      // Verify both thought and content were processed
      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: [{ text: 'Based on my analysis...' }],
        }),
      );
    });

    it('handles empty response correctly', () => {
      accumulator.startTurn('empty-turn');

      // Only whitespace
      accumulator.appendText('   \n\t   ');

      const finishedEvent: MockFinishedEvent = {
        value: {
          reason: undefined,
          usageMetadata: undefined,
        },
      };

      processFinishedEvent(accumulator, finishedEvent, mockRecordingService);

      // Should NOT record empty content
      expect(mockRecordingService.recordAssistantTurn).not.toHaveBeenCalled();
    });

    it('handles multiple turns in sequence', () => {
      // Turn 1
      accumulator.startTurn('turn-1');
      accumulator.appendText('First response');
      processFinishedEvent(
        accumulator,
        { value: { reason: 'STOP', usageMetadata: undefined } },
        mockRecordingService,
      );

      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledTimes(1);

      // Turn 2
      accumulator.startTurn('turn-2');
      accumulator.appendText('Second response');
      processFinishedEvent(
        accumulator,
        { value: { reason: 'STOP', usageMetadata: undefined } },
        mockRecordingService,
      );

      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledTimes(2);

      // Verify history
      const history = accumulator.getTurnHistory();
      expect(history.length).toBe(2);
      expect(history[0].turnUuid).toBe('turn-1');
      expect(history[1].turnUuid).toBe('turn-2');
    });
  });

  describe('Chunk accumulation patterns', () => {
    it('handles character-by-character streaming', () => {
      accumulator.startTurn();

      // Character by character
      'Hello, world!'.split('').forEach((char) => accumulator.appendText(char));

      expect(accumulator.getText()).toBe('Hello, world!');
    });

    it('handles word-by-word streaming', () => {
      accumulator.startTurn();

      const words = ['I', ' will', ' help', ' you', ' with', ' that', '.'];
      words.forEach((word) => accumulator.appendText(word));

      expect(accumulator.getText()).toBe('I will help you with that.');
    });

    it('handles sentence streaming', () => {
      accumulator.startTurn();

      const sentences = [
        'First sentence. ',
        'Second sentence. ',
        'Third sentence.',
      ];
      sentences.forEach((s) => accumulator.appendText(s));

      expect(accumulator.getText()).toBe(
        'First sentence. Second sentence. Third sentence.',
      );
    });

    it('handles code block streaming', () => {
      accumulator.startTurn();

      const codeChunks = [
        '```javascript\n',
        'const x = 1;\n',
        'const y = 2;\n',
        'console.log(x + y);\n',
        '```',
      ];
      codeChunks.forEach((chunk) => accumulator.appendText(chunk));

      const expected = '```javascript\nconst x = 1;\nconst y = 2;\nconsole.log(x + y);\n```';
      expect(accumulator.getText()).toBe(expected);
    });
  });

  describe('Content validation', () => {
    it('correctly identifies significant content', () => {
      accumulator.startTurn();

      // Accumulate whitespace then content
      accumulator.appendText('   ');
      expect(accumulator.hasSignificantContent()).toBe(false);

      accumulator.appendText('hello');
      expect(accumulator.hasSignificantContent()).toBe(true);
    });

    it('validates mixed content', () => {
      accumulator.startTurn();
      accumulator.appendText('  text  ');
      accumulator.appendThought('\n  thought  \n');

      const validation = accumulator.validate();
      expect(validation.text.isValid).toBe(true);
      expect(validation.text.trimmedLength).toBe(4);
      expect(validation.thought.isValid).toBe(true);
      expect(validation.thought.trimmedLength).toBe(7);
    });
  });

  describe('Event emission during streaming', () => {
    it('emits chunk events in order', () => {
      const handler = vi.fn();
      accumulator.onContentChunk(handler);

      accumulator.startTurn();
      accumulator.appendText('a');
      accumulator.appendText('b');
      accumulator.appendText('c');

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler.mock.calls[0][0].text).toBe('a');
      expect(handler.mock.calls[1][0].text).toBe('b');
      expect(handler.mock.calls[2][0].text).toBe('c');
    });

    it('tracks chunk index correctly', () => {
      const handler = vi.fn();
      accumulator.onContentChunk(handler);

      accumulator.startTurn();
      accumulator.appendText('first');
      accumulator.appendText('second');
      accumulator.appendText('third');

      expect(handler.mock.calls[0][0].chunkIndex).toBe(0);
      expect(handler.mock.calls[1][0].chunkIndex).toBe(1);
      expect(handler.mock.calls[2][0].chunkIndex).toBe(2);
    });

    it('tracks total length correctly', () => {
      const handler = vi.fn();
      accumulator.onContentChunk(handler);

      accumulator.startTurn();
      accumulator.appendText('aaa');
      accumulator.appendText('bb');
      accumulator.appendText('c');

      expect(handler.mock.calls[0][0].totalLength).toBe(3);
      expect(handler.mock.calls[1][0].totalLength).toBe(5);
      expect(handler.mock.calls[2][0].totalLength).toBe(6);
    });
  });

  describe('Error scenarios', () => {
    it('handles null chunks gracefully', () => {
      accumulator.startTurn();
      accumulator.appendText(null);
      accumulator.appendText('valid');

      expect(accumulator.getText()).toBe('valid');
    });

    it('handles undefined chunks gracefully', () => {
      accumulator.startTurn();
      accumulator.appendText(undefined);
      accumulator.appendText('valid');

      expect(accumulator.getText()).toBe('valid');
    });

    it('handles object chunks correctly', () => {
      accumulator.startTurn();
      accumulator.appendText({ text: 'from object' });
      accumulator.appendText({ description: 'from description' });

      expect(accumulator.getText()).toBe('from objectfrom description');
    });

    it('handles mixed chunk types', () => {
      accumulator.startTurn();
      accumulator.appendText('string');
      accumulator.appendText(123);
      accumulator.appendText(true);
      accumulator.appendText(['a', 'b']);
      accumulator.appendText({ text: 'obj' });

      expect(accumulator.getText()).toBe('string123trueabobj');
    });
  });

  describe('User message recording', () => {
    it('records user message before assistant response', () => {
      // Record user message
      mockRecordingService.recordUserMessage('User prompt', 'user-uuid-123');

      // Start assistant turn
      accumulator.startTurn('assistant-uuid-456');
      accumulator.appendText('Assistant response');

      processFinishedEvent(
        accumulator,
        { value: { reason: 'STOP', usageMetadata: undefined } },
        mockRecordingService,
      );

      // Verify both recorded
      expect(mockRecordingService.recordUserMessage).toHaveBeenCalledWith(
        'User prompt',
        'user-uuid-123',
      );
      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          uuid: 'assistant-uuid-456',
        }),
      );
    });

    it('links assistant response to user request via requestUuid', () => {
      const userUuid = 'user-msg-uuid-789';
      
      // Record user message
      mockRecordingService.recordUserMessage('What is 2+2?', userUuid);

      // Start assistant turn linked to user message
      accumulator.startTurn('assistant-uuid-101');
      accumulator.appendText('The answer is 4.');

      // Process with userUuid to create the link
      processFinishedEvent(
        accumulator,
        { value: { reason: 'STOP', usageMetadata: undefined } },
        mockRecordingService,
        'test-model',
        userUuid,
      );

      // Verify the assistant response is linked to the user request
      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledWith({
        model: 'test-model',
        message: [{ text: 'The answer is 4.' }],
        tokens: undefined,
        uuid: 'assistant-uuid-101',
        requestUuid: userUuid,
      });
    });
  });

  describe('Token usage tracking', () => {
    it('records token usage when available', () => {
      accumulator.startTurn();
      accumulator.appendText('Response');

      const usageMetadata = {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      };

      processFinishedEvent(
        accumulator,
        { value: { reason: 'STOP', usageMetadata } },
        mockRecordingService,
      );

      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: usageMetadata,
        }),
      );
    });

    it('handles missing token usage', () => {
      accumulator.startTurn();
      accumulator.appendText('Response');

      processFinishedEvent(
        accumulator,
        { value: { reason: 'STOP', usageMetadata: undefined } },
        mockRecordingService,
      );

      expect(mockRecordingService.recordAssistantTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: undefined,
        }),
      );
    });
  });
});

describe('ensureString in streaming context', () => {
  it('handles API response objects', () => {
    // Simulate various API response formats
    expect(ensureString({ text: 'response text' })).toBe('response text');
    expect(ensureString({ value: 'other' })).toBe('{"value":"other"}');
  });

  it('handles chunk arrays', () => {
    const chunks = [
      { text: 'Hello' },
      { text: ' ' },
      { text: 'world' },
    ];
    expect(ensureString(chunks)).toBe('Hello world');
  });

  it('handles nested content', () => {
    const nested = {
      parts: [
        { text: 'First ' },
        { text: 'Second' },
      ],
    };
    // Should JSON stringify since no 'text' at root
    expect(ensureString(nested)).toContain('parts');
  });
});

describe('Stream flow with Ollama-style events', () => {
  it('simulates realistic Ollama streaming', () => {
    const acc = createStreamingContentAccumulator({ enableEventBus: false });
    const recordedContent: string[] = [];
    const recordedThoughts: string[] = [];

    acc.onContentChunk((event) => {
      recordedContent.push(event.text);
    });

    acc.onThoughtChunk((event) => {
      recordedThoughts.push(event.text);
    });

    // Simulate Ollama streaming with thought
    acc.startTurn('ollama-turn-1');

    // Thought phase
    acc.appendThought('Analyzing the request...');
    acc.appendThought(' Checking available tools...');

    // Response phase
    const responseChunks = [
      "I'll help you with that.",
      " Let me",
      ' read the file',
      ' for you.',
    ];
    responseChunks.forEach((chunk) => acc.appendText(chunk));

    // Verify accumulated content
    expect(acc.getText()).toBe(
      "I'll help you with that. Let me read the file for you.",
    );
    expect(acc.getThought()).toBe(
      'Analyzing the request... Checking available tools...',
    );

    // Verify event recording
    expect(recordedContent.length).toBe(4);
    expect(recordedThoughts.length).toBe(2);

    // Finish turn
    const turnEvent = acc.finishTurn();
    expect(turnEvent?.textLength).toBe(54);
    expect(turnEvent?.thoughtLength).toBe(52);
    expect(turnEvent?.hasSignificantContent).toBe(true);
  });
});
