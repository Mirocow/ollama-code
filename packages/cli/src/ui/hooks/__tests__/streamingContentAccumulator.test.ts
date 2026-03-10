/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type StreamingContentAccumulator,
  createStreamingContentAccumulator,
  ensureString,
  hasSignificantContent,
  validateContent,
  type ContentChunkEvent,
  type ThoughtChunkEvent,
} from '../useStreamingContentAccumulator.js';

describe('ensureString', () => {
  it('converts null to empty string', () => {
    expect(ensureString(null)).toBe('');
  });

  it('converts undefined to empty string', () => {
    expect(ensureString(undefined)).toBe('');
  });

  it('returns string as-is', () => {
    expect(ensureString('hello')).toBe('hello');
  });

  it('converts number to string', () => {
    expect(ensureString(42)).toBe('42');
  });

  it('converts boolean to string', () => {
    expect(ensureString(true)).toBe('true');
    expect(ensureString(false)).toBe('false');
  });

  it('joins arrays recursively', () => {
    expect(ensureString(['a', 'b', 'c'])).toBe('abc');
  });

  it('extracts text from object with text property', () => {
    expect(ensureString({ text: 'hello' })).toBe('hello');
  });

  it('extracts description from object with description property', () => {
    expect(ensureString({ description: 'a description' })).toBe(
      'a description',
    );
  });

  it('stringifies other objects', () => {
    expect(ensureString({ key: 'value' })).toBe('{"key":"value"}');
  });

  it('handles nested objects with text', () => {
    expect(ensureString({ text: { text: 'nested' } })).toBe('nested');
  });

  it('handles arrays with objects', () => {
    expect(ensureString([{ text: 'a' }, { text: 'b' }])).toBe('ab');
  });
});

describe('hasSignificantContent', () => {
  it('returns false for null', () => {
    expect(hasSignificantContent(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(hasSignificantContent(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasSignificantContent('')).toBe(false);
  });

  it('returns false for whitespace only', () => {
    expect(hasSignificantContent('   \n\t  ')).toBe(false);
  });

  it('returns true for text content', () => {
    expect(hasSignificantContent('hello')).toBe(true);
  });

  it('returns true for text with surrounding whitespace', () => {
    expect(hasSignificantContent('  hello  ')).toBe(true);
  });

  it('returns true for single character', () => {
    expect(hasSignificantContent('a')).toBe(true);
  });

  it('returns true for unicode content', () => {
    expect(hasSignificantContent('Привет мир')).toBe(true);
  });
});

describe('validateContent', () => {
  it('validates null content', () => {
    const result = validateContent(null);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Content is null or undefined');
  });

  it('validates undefined content', () => {
    const result = validateContent(undefined);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Content is null or undefined');
  });

  it('validates whitespace content', () => {
    const result = validateContent('   ');
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Content contains only whitespace');
    expect(result.originalLength).toBe(3);
    expect(result.trimmedLength).toBe(0);
  });

  it('validates valid content', () => {
    const result = validateContent('hello world');
    expect(result.isValid).toBe(true);
    expect(result.originalLength).toBe(11);
    expect(result.trimmedLength).toBe(11);
  });

  it('reports correct trimmed length', () => {
    const result = validateContent('  hello  ');
    expect(result.isValid).toBe(true);
    expect(result.originalLength).toBe(9);
    expect(result.trimmedLength).toBe(5);
  });
});

describe('StreamingContentAccumulator', () => {
  let accumulator: StreamingContentAccumulator;

  beforeEach(() => {
    accumulator = createStreamingContentAccumulator({
      enableEventBus: false,
      debug: false,
    });
  });

  describe('lifecycle', () => {
    it('starts inactive', () => {
      expect(accumulator.isActive()).toBe(false);
    });

    it('becomes active after startTurn', () => {
      accumulator.startTurn('test-uuid');
      expect(accumulator.isActive()).toBe(true);
    });

    it('becomes inactive after reset', () => {
      accumulator.startTurn();
      accumulator.appendText('test');
      accumulator.reset();
      expect(accumulator.isActive()).toBe(false);
    });

    it('preserves UUID', () => {
      accumulator.startTurn('my-uuid-123');
      expect(accumulator.getUuid()).toBe('my-uuid-123');
    });

    it('allows UUID update via setUuid', () => {
      accumulator.startTurn();
      accumulator.setUuid('new-uuid');
      expect(accumulator.getUuid()).toBe('new-uuid');
    });

    it('auto-initializes on appendText', () => {
      accumulator.appendText('hello');
      expect(accumulator.isActive()).toBe(true);
      expect(accumulator.getText()).toBe('hello');
    });
  });

  describe('text accumulation', () => {
    it('accumulates single chunk', () => {
      accumulator.startTurn();
      accumulator.appendText('hello');
      expect(accumulator.getText()).toBe('hello');
    });

    it('accumulates multiple chunks', () => {
      accumulator.startTurn();
      accumulator.appendText('Hello');
      accumulator.appendText(' ');
      accumulator.appendText('World');
      expect(accumulator.getText()).toBe('Hello World');
    });

    it('handles streaming scenario', () => {
      accumulator.startTurn();
      const chunks = ['I', ' will', ' help', ' you', '.'];
      chunks.forEach((c) => accumulator.appendText(c));
      expect(accumulator.getText()).toBe('I will help you.');
    });

    it('skips empty chunks', () => {
      accumulator.startTurn();
      accumulator.appendText('a');
      accumulator.appendText('');
      accumulator.appendText('b');
      expect(accumulator.getText()).toBe('ab');
    });

    it('handles various input types', () => {
      accumulator.startTurn();
      accumulator.appendText('str');
      accumulator.appendText(42);
      accumulator.appendText({ text: 'obj' });
      accumulator.appendText(['a', 'b']);
      expect(accumulator.getText()).toBe('str42objab');
    });
  });

  describe('thought accumulation', () => {
    it('accumulates thought content', () => {
      accumulator.startTurn();
      accumulator.appendThought('thinking...');
      expect(accumulator.getThought()).toBe('thinking...');
    });

    it('separates text and thought', () => {
      accumulator.startTurn();
      accumulator.appendText('text content');
      accumulator.appendThought('thought content');
      expect(accumulator.getText()).toBe('text content');
      expect(accumulator.getThought()).toBe('thought content');
    });
  });

  describe('hasSignificantContent', () => {
    it('returns false when empty', () => {
      accumulator.startTurn();
      expect(accumulator.hasSignificantContent()).toBe(false);
    });

    it('returns true with text content', () => {
      accumulator.startTurn();
      accumulator.appendText('hello');
      expect(accumulator.hasSignificantContent()).toBe(true);
    });

    it('returns true with thought content only', () => {
      accumulator.startTurn();
      accumulator.appendThought('thinking...');
      expect(accumulator.hasSignificantContent()).toBe(true);
    });

    it('returns false with whitespace only', () => {
      accumulator.startTurn();
      accumulator.appendText('   ');
      accumulator.appendThought('\n\n');
      expect(accumulator.hasSignificantContent()).toBe(false);
    });
  });

  describe('validate', () => {
    it('validates both text and thought', () => {
      accumulator.startTurn();
      accumulator.appendText('hello');
      accumulator.appendThought('thinking');

      const validation = accumulator.validate();
      expect(validation.text.isValid).toBe(true);
      expect(validation.thought.isValid).toBe(true);
      expect(validation.hasAnyValidContent).toBe(true);
    });

    it('detects invalid content', () => {
      accumulator.startTurn();
      accumulator.appendText('   ');

      const validation = accumulator.validate();
      expect(validation.text.isValid).toBe(false);
      expect(validation.hasAnyValidContent).toBe(false);
    });
  });

  describe('events', () => {
    it('emits turn:started event', () => {
      const handler = vi.fn();
      accumulator.onTurnStarted(handler);
      accumulator.startTurn('test-uuid');

      expect(handler).toHaveBeenCalledWith({
        turnUuid: 'test-uuid',
        timestamp: expect.any(Number),
      });
    });

    it('emits turn:finished event', () => {
      const handler = vi.fn();
      accumulator.onTurnFinished(handler);
      accumulator.startTurn('test-uuid');
      accumulator.appendText('hello');
      const event = accumulator.finishTurn();

      expect(handler).toHaveBeenCalledWith(event);
      expect(event?.turnUuid).toBe('test-uuid');
      expect(event?.textLength).toBe(5);
    });

    it('emits content:chunk events', () => {
      const handler = vi.fn();
      accumulator.onContentChunk(handler);
      accumulator.startTurn();
      accumulator.appendText('hello');

      expect(handler).toHaveBeenCalledTimes(1);
      const event: ContentChunkEvent = handler.mock.calls[0][0];
      expect(event.text).toBe('hello');
      expect(event.chunkIndex).toBe(0);
      expect(event.totalLength).toBe(5);
    });

    it('emits thought:chunk events', () => {
      const handler = vi.fn();
      accumulator.onThoughtChunk(handler);
      accumulator.startTurn();
      accumulator.appendThought('thinking');

      expect(handler).toHaveBeenCalledTimes(1);
      const event: ThoughtChunkEvent = handler.mock.calls[0][0];
      expect(event.text).toBe('thinking');
    });

    it('emits accumulator:reset event', () => {
      const handler = vi.fn();
      accumulator.on('accumulator:reset', handler);
      accumulator.startTurn('test-uuid');
      accumulator.reset('test-reason');

      expect(handler).toHaveBeenCalledWith({
        turnUuid: 'test-uuid',
        reason: 'test-reason',
      });
    });

    it('unsubscribes correctly', () => {
      const handler = vi.fn();
      const unsubscribe = accumulator.onContentChunk(handler);
      accumulator.startTurn();
      accumulator.appendText('first');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      accumulator.appendText('second');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('finishTurn', () => {
    it('returns null when no content', () => {
      expect(accumulator.finishTurn()).toBeNull();
    });

    it('returns event with correct data', () => {
      accumulator.startTurn('uuid-123');
      accumulator.appendText('hello');
      accumulator.appendThought('thinking');

      const event = accumulator.finishTurn();
      expect(event).not.toBeNull();
      expect(event?.turnUuid).toBe('uuid-123');
      expect(event?.textLength).toBe(5);
      expect(event?.thoughtLength).toBe(8);
      expect(event?.hasSignificantContent).toBe(true);
    });

    it('calculates duration', async () => {
      accumulator.startTurn();
      await new Promise((r) => setTimeout(r, 10));
      const event = accumulator.finishTurn();
      expect(event?.duration).toBeGreaterThanOrEqual(10);
    });
  });

  describe('reset with skipFinish', () => {
    it('calls finishTurn by default', () => {
      const handler = vi.fn();
      accumulator.onTurnFinished(handler);
      accumulator.startTurn();
      accumulator.appendText('test');
      accumulator.reset('complete');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('skips finishTurn when skipFinish=true', () => {
      const handler = vi.fn();
      accumulator.onTurnFinished(handler);
      accumulator.startTurn();
      accumulator.appendText('test');
      accumulator.finishTurn(); // Call it explicitly
      accumulator.reset('complete', true); // Skip finish

      expect(handler).toHaveBeenCalledTimes(1); // Only once
    });
  });

  describe('statistics', () => {
    it('tracks total text chunks', () => {
      accumulator.startTurn();
      accumulator.appendText('a');
      accumulator.appendText('b');
      accumulator.appendText('c');

      const stats = accumulator.getStats();
      expect(stats.totalTextChunks).toBe(3);
    });

    it('tracks total thought chunks', () => {
      accumulator.startTurn();
      accumulator.appendThought('a');
      accumulator.appendThought('b');

      const stats = accumulator.getStats();
      expect(stats.totalThoughtChunks).toBe(2);
    });

    it('tracks total turns', () => {
      accumulator.startTurn();
      accumulator.appendText('a');
      accumulator.finishTurn();

      accumulator.startTurn();
      accumulator.appendText('b');
      accumulator.finishTurn();

      const stats = accumulator.getStats();
      expect(stats.totalTurns).toBe(2);
    });

    it('tracks total bytes', () => {
      accumulator.startTurn();
      accumulator.appendText('hello'); // 5 bytes
      accumulator.appendThought('world'); // 5 bytes
      accumulator.finishTurn();

      const stats = accumulator.getStats();
      expect(stats.totalBytes).toBe(10);
    });
  });

  describe('turn history', () => {
    it('stores finished turns in history', () => {
      accumulator.startTurn('turn-1');
      accumulator.appendText('a');
      accumulator.finishTurn();

      accumulator.startTurn('turn-2');
      accumulator.appendText('b');
      accumulator.finishTurn();

      const history = accumulator.getTurnHistory();
      expect(history.length).toBe(2);
      expect(history[0].turnUuid).toBe('turn-1');
      expect(history[1].turnUuid).toBe('turn-2');
    });

    it('limits history size', () => {
      const smallAcc = createStreamingContentAccumulator({
        enableEventBus: false,
        maxTurnHistory: 2,
      });

      for (let i = 0; i < 5; i++) {
        smallAcc.startTurn(`turn-${i}`);
        smallAcc.appendText('x');
        smallAcc.finishTurn();
      }

      const history = smallAcc.getTurnHistory();
      expect(history.length).toBe(2);
      expect(history[0].turnUuid).toBe('turn-3');
      expect(history[1].turnUuid).toBe('turn-4');
    });
  });

  describe('debug snapshot', () => {
    it('returns correct snapshot', () => {
      accumulator.startTurn('test-uuid');
      accumulator.appendText('hello');
      accumulator.appendThought('thinking');

      const snapshot = accumulator.getDebugSnapshot();
      expect(snapshot.isActive).toBe(true);
      expect(snapshot.textLength).toBe(5);
      expect(snapshot.thoughtLength).toBe(8);
      expect(snapshot.uuid).toBe('test-uuid');
      expect(snapshot.hasToolCalls).toBe(false);
    });

    it('returns empty snapshot when inactive', () => {
      const snapshot = accumulator.getDebugSnapshot();
      expect(snapshot.isActive).toBe(false);
      expect(snapshot.textLength).toBe(0);
      expect(snapshot.uuid).toBe('');
    });
  });

  describe('tool calls tracking', () => {
    it('tracks hasToolCalls flag', () => {
      accumulator.startTurn();
      accumulator.setHasToolCalls(true);

      const snapshot = accumulator.getDebugSnapshot();
      expect(snapshot.hasToolCalls).toBe(true);
    });
  });
});

describe('Integration: Full Turn Lifecycle', () => {
  it('simulates complete streaming response', () => {
    const acc = createStreamingContentAccumulator({ enableEventBus: false });

    // Start turn
    acc.startTurn('response-123');

    // Simulate streaming
    const chunks = ['I', ' will', ' help', ' you', ' with', ' that', '.'];

    chunks.forEach((chunk) => acc.appendText(chunk));

    // Verify content
    expect(acc.getText()).toBe('I will help you with that.');
    expect(acc.hasSignificantContent()).toBe(true);

    // Finish turn
    const event = acc.finishTurn();
    expect(event?.textLength).toBe(26);
    expect(event?.hasSignificantContent).toBe(true);

    // Reset
    acc.reset('complete');
    expect(acc.isActive()).toBe(false);
  });

  it('handles thought then content transition', () => {
    const acc = createStreamingContentAccumulator({ enableEventBus: false });
    acc.startTurn();

    // Model thinks first
    acc.appendThought('Let me analyze this...');
    acc.appendThought(' I should check the files.');

    // Then responds
    acc.appendText('Based on my analysis...');

    expect(acc.getThought()).toBe(
      'Let me analyze this... I should check the files.',
    );
    expect(acc.getText()).toBe('Based on my analysis...');
    expect(acc.hasSignificantContent()).toBe(true);
  });

  it('handles empty response correctly', () => {
    const acc = createStreamingContentAccumulator({ enableEventBus: false });
    acc.startTurn();

    // Only whitespace
    acc.appendText('   \n\t   ');

    expect(acc.hasSignificantContent()).toBe(false);

    const validation = acc.validate();
    expect(validation.hasAnyValidContent).toBe(false);
  });

  it('handles multiple turns in sequence', () => {
    const acc = createStreamingContentAccumulator({ enableEventBus: false });

    // Turn 1
    acc.startTurn('turn-1');
    acc.appendText('First response');
    acc.finishTurn();
    expect(acc.getTurnHistory().length).toBe(1);

    // Turn 2
    acc.startTurn('turn-2');
    acc.appendText('Second response');
    acc.finishTurn();
    expect(acc.getTurnHistory().length).toBe(2);

    // Verify history
    const history = acc.getTurnHistory();
    expect(history[0].turnUuid).toBe('turn-1');
    expect(history[1].turnUuid).toBe('turn-2');
  });
});
