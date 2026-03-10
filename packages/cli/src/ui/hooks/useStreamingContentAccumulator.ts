/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Streaming Content Accumulator
 *
 * An event-driven content accumulator that provides real-time streaming
 * of accumulated content through events and async iterators.
 *
 * Key features:
 * - Event emission on every chunk (text, thought)
 * - Integration with eventBus for system-wide notifications
 * - Async iterator for consuming content as a stream
 * - Backpressure support for slow consumers
 * - Full backward compatibility with ContentAccumulator API
 *
 * Architecture (Option C - Streaming Accumulator):
 * - Source (Ollama API) → ContentChunk → Listeners (UI, Storage, EventBus)
 * - Subscribers can react to content in real-time
 * - Enables future features: live preview, partial processing, progress indicators
 */

import { createDebugLogger } from '@ollama-code/ollama-code-core';
import { EventEmitter } from 'node:events';
import type { EventBusEvents } from '../stores/eventBus.js';

const debugLogger = createDebugLogger('STREAMING_ACCUMULATOR');

// ============================================================================
// Types
// ============================================================================

/**
 * Content chunk event
 */
export interface ContentChunkEvent {
  /** The text content of this chunk */
  text: string;
  /** Turn UUID */
  turnUuid: string;
  /** Timestamp when chunk was received */
  timestamp: number;
  /** Total accumulated length so far */
  totalLength: number;
  /** Chunk sequence number (0-based) */
  chunkIndex: number;
}

/**
 * Thought chunk event
 */
export interface ThoughtChunkEvent {
  /** The thought content of this chunk */
  text: string;
  /** Turn UUID */
  turnUuid: string;
  /** Timestamp when chunk was received */
  timestamp: number;
  /** Total accumulated length so far */
  totalLength: number;
  /** Chunk sequence number (0-based) */
  chunkIndex: number;
}

/**
 * Turn lifecycle events
 */
export interface TurnStartedEvent {
  turnUuid: string;
  timestamp: number;
}

export interface TurnFinishedEvent {
  turnUuid: string;
  timestamp: number;
  textLength: number;
  thoughtLength: number;
  duration: number;
  hasSignificantContent: boolean;
}

/**
 * Event types for the streaming accumulator
 */
export interface StreamingAccumulatorEvents {
  'turn:started': TurnStartedEvent;
  'turn:finished': TurnFinishedEvent;
  'content:chunk': ContentChunkEvent;
  'thought:chunk': ThoughtChunkEvent;
  'accumulator:reset': { turnUuid: string; reason: string };
}

/**
 * Event type keys
 */
type AccumulatorEventType = keyof StreamingAccumulatorEvents;

/**
 * Accumulated content state
 */
export interface AccumulatedContent {
  /** Full text content accumulated during the turn */
  text: string;
  /** Full thought content accumulated during the turn */
  thought: string;
  /** UUID for this turn */
  uuid: string;
  /** Whether this turn has any tool calls */
  hasToolCalls: boolean;
  /** Timestamp when accumulation started */
  startedAt: number;
  /** Number of text chunks received */
  textChunkCount: number;
  /** Number of thought chunks received */
  thoughtChunkCount: number;
}

/**
 * Validation result
 */
export interface ContentValidationResult {
  isValid: boolean;
  originalLength: number;
  trimmedLength: number;
  reason?: string;
}

/**
 * Streaming accumulator statistics
 */
export interface StreamingAccumulatorStats {
  /** Total turns processed */
  totalTurns: number;
  /** Total text chunks processed */
  totalTextChunks: number;
  /** Total thought chunks processed */
  totalThoughtChunks: number;
  /** Total bytes processed */
  totalBytes: number;
  /** Average turn duration (ms) */
  averageTurnDuration: number;
  /** Current subscriber count */
  subscriberCount: number;
}

/**
 * Configuration options
 */
export interface StreamingAccumulatorConfig {
  /** Maximum event listeners (default: 50) */
  maxListeners?: number;
  /** Enable eventBus integration (default: true) */
  enableEventBus?: boolean;
  /** Maximum history of finished turns to keep (default: 10) */
  maxTurnHistory?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Ensures that any value is converted to a string.
 * This is CRITICAL to prevent [Object] from appearing in output.
 */
export function ensureString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => ensureString(item)).join('');
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    if ('text' in obj) {
      return ensureString(obj['text']);
    }

    if ('description' in obj) {
      return ensureString(obj['description']);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Validates if content has significant (non-whitespace) characters.
 */
export function hasSignificantContent(
  content: string | null | undefined,
): boolean {
  if (!content) {
    return false;
  }
  return content.trim().length > 0;
}

/**
 * Detailed validation with diagnostic information.
 */
export function validateContent(
  content: string | null | undefined,
): ContentValidationResult {
  if (!content) {
    return {
      isValid: false,
      originalLength: 0,
      trimmedLength: 0,
      reason: 'Content is null or undefined',
    };
  }

  const trimmed = content.trim();
  const trimmedLength = trimmed.length;

  if (trimmedLength === 0) {
    return {
      isValid: false,
      originalLength: content.length,
      trimmedLength: 0,
      reason: 'Content contains only whitespace',
    };
  }

  return {
    isValid: true,
    originalLength: content.length,
    trimmedLength,
  };
}

// ============================================================================
// StreamingContentAccumulator Class
// ============================================================================

/**
 * Event-driven content accumulator with streaming capabilities.
 *
 * This class provides:
 * 1. **Event emission** - emits events for every chunk and lifecycle change
 * 2. **Subscription API** - type-safe event subscription with automatic cleanup
 * 3. **Async iteration** - consume content as an async stream
 * 4. **EventBus integration** - broadcast events system-wide
 * 5. **Backward compatibility** - works as a drop-in replacement for ContentAccumulator
 *
 * @example
 * // Subscribe to content chunks
 * const unsubscribe = accumulator.onContentChunk((event) => {
 *   console.log('New chunk:', event.text);
 * });
 *
 * // Use as async iterator
 * for await (const chunk of accumulator.streamContent()) {
 *   processChunk(chunk);
 * }
 *
 * // Standard accumulation API (backward compatible)
 * accumulator.startTurn('uuid-123');
 * accumulator.appendText('Hello ');
 * accumulator.appendText('World');
 * console.log(accumulator.getText()); // "Hello World"
 */
export class StreamingContentAccumulator extends EventEmitter {
  private content: AccumulatedContent | null = null;
  private config: Required<StreamingAccumulatorConfig>;
  private turnHistory: TurnFinishedEvent[] = [];
  private stats: StreamingAccumulatorStats = {
    totalTurns: 0,
    totalTextChunks: 0,
    totalThoughtChunks: 0,
    totalBytes: 0,
    averageTurnDuration: 0,
    subscriberCount: 0,
  };

  // For async iteration
  private chunkQueue: Array<{
    type: 'text' | 'thought';
    data: ContentChunkEvent | ThoughtChunkEvent;
  }> = [];
  private chunkResolvers: Array<
    (
      value: IteratorResult<{
        type: 'text' | 'thought';
        data: ContentChunkEvent | ThoughtChunkEvent;
      }>,
    ) => void
  > = [];
  private iterationComplete = false;

  constructor(config: StreamingAccumulatorConfig = {}) {
    super();

    this.config = {
      maxListeners: config.maxListeners ?? 50,
      enableEventBus: config.enableEventBus ?? true,
      maxTurnHistory: config.maxTurnHistory ?? 10,
      debug: config.debug ?? false,
    };

    this.setMaxListeners(this.config.maxListeners);
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  /**
   * Initialize a new turn's accumulator.
   * Must be called at the start of each turn.
   */
  startTurn(uuid?: string): void {
    const turnUuid = uuid || '';

    this.content = {
      text: '',
      thought: '',
      uuid: turnUuid,
      hasToolCalls: false,
      startedAt: Date.now(),
      textChunkCount: 0,
      thoughtChunkCount: 0,
    };

    // Reset async iteration state
    this.chunkQueue = [];
    this.iterationComplete = false;

    // Emit turn started event
    const event: TurnStartedEvent = {
      turnUuid,
      timestamp: this.content.startedAt,
    };

    this.emit('turn:started', event);
    this.emitToEventBus('stream:started', { promptId: turnUuid, model: '' });

    if (this.config.debug) {
      debugLogger.info('Started new streaming accumulator', { turnUuid });
    }
  }

  /**
   * Finish the current turn.
   * Called automatically when recording is complete.
   */
  finishTurn(): TurnFinishedEvent | null {
    if (!this.content) {
      return null;
    }

    const duration = Date.now() - this.content.startedAt;
    const event: TurnFinishedEvent = {
      turnUuid: this.content.uuid,
      timestamp: Date.now(),
      textLength: this.content.text.length,
      thoughtLength: this.content.thought.length,
      duration,
      hasSignificantContent: this.hasSignificantContent(),
    };

    // Update statistics
    this.stats.totalTurns++;
    this.stats.totalBytes += event.textLength + event.thoughtLength;
    this.stats.averageTurnDuration =
      (this.stats.averageTurnDuration * (this.stats.totalTurns - 1) +
        duration) /
      this.stats.totalTurns;

    // Store in history
    this.turnHistory.push(event);
    if (this.turnHistory.length > this.config.maxTurnHistory) {
      this.turnHistory.shift();
    }

    // Signal end of async iteration
    this.iterationComplete = true;
    this.resolvePendingIterators();

    // Emit events
    this.emit('turn:finished', event);
    this.emitToEventBus('stream:finished', {
      promptId: this.content.uuid,
      tokenCount: event.textLength + event.thoughtLength,
    });

    if (this.config.debug) {
      debugLogger.info('Finished streaming turn', {
        turnUuid: event.turnUuid,
        textLength: event.textLength,
        thoughtLength: event.thoughtLength,
        duration,
      });
    }

    return event;
  }

  /**
   * Reset the accumulator for a new turn.
   * Called after recording is complete or on error/cancel.
   * @param reason - Reason for reset (for logging/events)
   * @param skipFinish - If true, don't call finishTurn() (use when already called)
   */
  reset(reason: string = 'complete', skipFinish: boolean = false): void {
    const previousUuid = this.content?.uuid || '';

    // Finish turn first if active and not already finished
    if (this.content && !skipFinish) {
      this.finishTurn();
    }

    // Clear state
    this.content = null;
    this.chunkQueue = [];
    this.iterationComplete = false;

    // Emit reset event
    this.emit('accumulator:reset', { turnUuid: previousUuid, reason });

    if (this.config.debug) {
      debugLogger.info('Reset streaming accumulator', { previousUuid, reason });
    }
  }

  // ============================================================================
  // Content Accumulation Methods
  // ============================================================================

  /**
   * Append text content to the accumulator.
   * Emits a content:chunk event for each append.
   */
  appendText(chunk: unknown): void {
    if (!this.content) {
      debugLogger.warn(
        'appendText called without startTurn - auto-initializing',
      );
      this.startTurn();
    }

    const textChunk = ensureString(chunk);
    if (!textChunk) {
      return; // Skip empty chunks
    }

    this.content!.text += textChunk;
    this.content!.textChunkCount++;
    this.stats.totalTextChunks++;

    // Create chunk event
    const event: ContentChunkEvent = {
      text: textChunk,
      turnUuid: this.content!.uuid,
      timestamp: Date.now(),
      totalLength: this.content!.text.length,
      chunkIndex: this.content!.textChunkCount - 1,
    };

    // Emit local event
    this.emit('content:chunk', event);

    // Emit to eventBus
    this.emitToEventBus('stream:chunk', {
      promptId: event.turnUuid,
      content: event.text,
    });

    // Queue for async iteration
    this.queueChunk('text', event);

    if (this.config.debug && event.chunkIndex % 10 === 0) {
      debugLogger.debug('Text chunk accumulated', {
        chunkIndex: event.chunkIndex,
        chunkLength: textChunk.length,
        totalLength: event.totalLength,
      });
    }
  }

  /**
   * Append thought content to the accumulator.
   * Emits a thought:chunk event for each append.
   */
  appendThought(chunk: unknown): void {
    if (!this.content) {
      debugLogger.warn(
        'appendThought called without startTurn - auto-initializing',
      );
      this.startTurn();
    }

    const thoughtChunk = ensureString(chunk);
    if (!thoughtChunk) {
      return; // Skip empty chunks
    }

    this.content!.thought += thoughtChunk;
    this.content!.thoughtChunkCount++;
    this.stats.totalThoughtChunks++;

    // Create chunk event
    const event: ThoughtChunkEvent = {
      text: thoughtChunk,
      turnUuid: this.content!.uuid,
      timestamp: Date.now(),
      totalLength: this.content!.thought.length,
      chunkIndex: this.content!.thoughtChunkCount - 1,
    };

    // Emit local event
    this.emit('thought:chunk', event);

    // Queue for async iteration
    this.queueChunk('thought', event);

    if (this.config.debug && event.chunkIndex % 10 === 0) {
      debugLogger.debug('Thought chunk accumulated', {
        chunkIndex: event.chunkIndex,
        chunkLength: thoughtChunk.length,
        totalLength: event.totalLength,
      });
    }
  }

  /**
   * Mark that this turn has tool calls.
   */
  setHasToolCalls(hasToolCalls: boolean): void {
    if (!this.content) {
      debugLogger.warn('setHasToolCalls called without startTurn');
      return;
    }
    this.content.hasToolCalls = hasToolCalls;
  }

  /**
   * Set the UUID for this turn.
   */
  setUuid(uuid: string): void {
    if (!this.content) {
      debugLogger.warn('setUuid called without startTurn');
      return;
    }
    this.content.uuid = uuid;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Get the accumulated text content.
   */
  getText(): string {
    return this.content?.text ?? '';
  }

  /**
   * Get the accumulated thought content.
   */
  getThought(): string {
    return this.content?.thought ?? '';
  }

  /**
   * Get the UUID for this turn.
   */
  getUuid(): string {
    return this.content?.uuid ?? '';
  }

  /**
   * Get complete accumulated content state.
   */
  getContent(): AccumulatedContent | null {
    return this.content;
  }

  /**
   * Check if there is any significant content to record.
   */
  hasSignificantContent(): boolean {
    if (!this.content) {
      return false;
    }
    return (
      hasSignificantContent(this.content.text) ||
      hasSignificantContent(this.content.thought)
    );
  }

  /**
   * Validate all accumulated content.
   */
  validate(): {
    text: ContentValidationResult;
    thought: ContentValidationResult;
    hasAnyValidContent: boolean;
  } {
    const textValidation = validateContent(this.content?.text);
    const thoughtValidation = validateContent(this.content?.thought);

    return {
      text: textValidation,
      thought: thoughtValidation,
      hasAnyValidContent: textValidation.isValid || thoughtValidation.isValid,
    };
  }

  /**
   * Check if accumulator is currently active (has content).
   */
  isActive(): boolean {
    return this.content !== null;
  }

  /**
   * Get accumulator statistics.
   */
  getStats(): StreamingAccumulatorStats {
    return {
      ...this.stats,
      subscriberCount:
        this.listenerCount('content:chunk') +
        this.listenerCount('thought:chunk'),
    };
  }

  /**
   * Get turn history.
   */
  getTurnHistory(): TurnFinishedEvent[] {
    return [...this.turnHistory];
  }

  /**
   * Get a snapshot of current state for debugging.
   */
  getDebugSnapshot(): {
    isActive: boolean;
    textLength: number;
    thoughtLength: number;
    uuid: string;
    hasToolCalls: boolean;
    textChunkCount: number;
    thoughtChunkCount: number;
  } {
    return {
      isActive: this.content !== null,
      textLength: this.content?.text.length ?? 0,
      thoughtLength: this.content?.thought.length ?? 0,
      uuid: this.content?.uuid ?? '',
      hasToolCalls: this.content?.hasToolCalls ?? false,
      textChunkCount: this.content?.textChunkCount ?? 0,
      thoughtChunkCount: this.content?.thoughtChunkCount ?? 0,
    };
  }

  // ============================================================================
  // Event Subscription API
  // ============================================================================

  /**
   * Subscribe to content chunk events.
   * Returns an unsubscribe function.
   */
  onContentChunk(callback: (event: ContentChunkEvent) => void): () => void {
    this.on('content:chunk', callback);
    return () => this.off('content:chunk', callback);
  }

  /**
   * Subscribe to thought chunk events.
   * Returns an unsubscribe function.
   */
  onThoughtChunk(callback: (event: ThoughtChunkEvent) => void): () => void {
    this.on('thought:chunk', callback);
    return () => this.off('thought:chunk', callback);
  }

  /**
   * Subscribe to turn started events.
   */
  onTurnStarted(callback: (event: TurnStartedEvent) => void): () => void {
    this.on('turn:started', callback);
    return () => this.off('turn:started', callback);
  }

  /**
   * Subscribe to turn finished events.
   */
  onTurnFinished(callback: (event: TurnFinishedEvent) => void): () => void {
    this.on('turn:finished', callback);
    return () => this.off('turn:finished', callback);
  }

  /**
   * Subscribe to all events with a single callback.
   */
  onAll<K extends AccumulatorEventType>(
    callback: (type: K, data: StreamingAccumulatorEvents[K]) => void,
  ): () => void {
    const types: AccumulatorEventType[] = [
      'turn:started',
      'turn:finished',
      'content:chunk',
      'thought:chunk',
      'accumulator:reset',
    ];

    const handlers = types.map((type) => {
      const handler = (data: unknown) =>
        callback(type as K, data as StreamingAccumulatorEvents[K]);
      this.on(type, handler);
      return { type, handler };
    });

    return () => {
      for (const { type, handler } of handlers) {
        this.off(type, handler);
      }
    };
  }

  // ============================================================================
  // Async Iteration API
  // ============================================================================

  /**
   * Stream content chunks as an async iterable.
   * This allows consuming the accumulator as a stream.
   *
   * @example
   * for await (const chunk of accumulator.streamContent()) {
   *   if (chunk.type === 'text') {
   *     console.log('Text:', chunk.data.text);
   *   } else {
   *     console.log('Thought:', chunk.data.text);
   *   }
   * }
   */
  async *streamContent(): AsyncGenerator<{
    type: 'text' | 'thought';
    data: ContentChunkEvent | ThoughtChunkEvent;
  }> {
    while (true) {
      // Return queued chunks first
      while (this.chunkQueue.length > 0) {
        const chunk = this.chunkQueue.shift()!;
        yield chunk;
      }

      // Check if iteration is complete
      if (this.iterationComplete) {
        return;
      }

      // Wait for next chunk
      const result = await this.waitForNextChunk();
      if (result.done) {
        return;
      }
      yield result.value;
    }
  }

  /**
   * Stream only text content.
   */
  async *streamText(): AsyncGenerator<ContentChunkEvent> {
    for await (const chunk of this.streamContent()) {
      if (chunk.type === 'text') {
        yield chunk.data as ContentChunkEvent;
      }
    }
  }

  /**
   * Stream only thought content.
   */
  async *streamThought(): AsyncGenerator<ThoughtChunkEvent> {
    for await (const chunk of this.streamContent()) {
      if (chunk.type === 'thought') {
        yield chunk.data as ThoughtChunkEvent;
      }
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Queue a chunk for async iteration.
   */
  private queueChunk(
    type: 'text' | 'thought',
    data: ContentChunkEvent | ThoughtChunkEvent,
  ): void {
    const chunk = { type, data };

    // If there are pending resolvers, resolve them immediately
    if (this.chunkResolvers.length > 0) {
      const resolver = this.chunkResolvers.shift()!;
      resolver({ done: false, value: chunk });
    } else {
      // Otherwise, queue the chunk
      this.chunkQueue.push(chunk);
    }
  }

  /**
   * Wait for the next chunk.
   */
  private waitForNextChunk(): Promise<
    IteratorResult<{
      type: 'text' | 'thought';
      data: ContentChunkEvent | ThoughtChunkEvent;
    }>
  > {
    return new Promise((resolve) => {
      this.chunkResolvers.push(resolve);
    });
  }

  /**
   * Resolve any pending iterators when iteration completes.
   */
  private resolvePendingIterators(): void {
    while (this.chunkResolvers.length > 0) {
      const resolver = this.chunkResolvers.shift()!;
      resolver({ done: true, value: undefined });
    }
  }

  /**
   * Emit to eventBus if enabled.
   */
  private emitToEventBus<K extends keyof EventBusEvents>(
    event: K,
    data: EventBusEvents[K],
  ): void {
    if (this.config.enableEventBus) {
      // Dynamic import to avoid circular dependency
      import('../stores/eventBus.js')
        .then(({ eventBus }) => {
          eventBus.getState().emit(event, data);
        })
        .catch(() => {
          // Ignore errors if eventBus is not available
        });
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new streaming content accumulator instance.
 * Each hook instance should have its own accumulator.
 */
export function createStreamingContentAccumulator(
  config?: StreamingAccumulatorConfig,
): StreamingContentAccumulator {
  return new StreamingContentAccumulator(config);
}

export default StreamingContentAccumulator;
