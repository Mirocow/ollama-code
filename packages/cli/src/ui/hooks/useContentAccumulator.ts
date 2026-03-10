/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Content Accumulator for proper message recording.
 *
 * This module provides a dedicated accumulator for content that needs to be
 * recorded to storage, separate from UI display buffers.
 *
 * Problem solved:
 * - UI buffers can be split/modified for rendering performance
 * - Content was being lost when switching between message types (thought → content)
 * - Empty/whitespace-only messages were being recorded
 *
 * Solution:
 * - Separate accumulator for storage that never gets modified during a turn
 * - Validation before recording to skip empty/whitespace content
 * - Clear lifecycle management (init, accumulate, validate, record, reset)
 */

import { createDebugLogger } from '@ollama-code/ollama-code-core';

const debugLogger = createDebugLogger('CONTENT_ACCUMULATOR');

/**
 * Ensures that any value is converted to a string.
 * This is CRITICAL to prevent [Object] from appearing in output.
 *
 * @param value - Any value to convert to string
 * @returns A string representation of the value
 *
 * @example
 * ensureString(null)              // ""
 * ensureString(undefined)         // ""
 * ensureString("hello")           // "hello"
 * ensureString(123)               // "123"
 * ensureString({text: "hi"})      // "hi" (extracts text property)
 * ensureString({foo: "bar"})      // '{"foo":"bar"}'
 * ensureString([1, 2, 3])         // "123" (joins array)
 */
export function ensureString(value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // Already a string
  if (typeof value === 'string') {
    return value;
  }

  // Numbers, booleans - use String()
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // Arrays - recursively convert each element and join
  if (Array.isArray(value)) {
    return value.map((item) => ensureString(item)).join('');
  }

  // Objects - try to extract text property first
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    // Check for text property (common in Part types)
    if ('text' in obj) {
      return ensureString(obj['text']);
    }

    // Check for description property (common in ThoughtSummary)
    if ('description' in obj) {
      return ensureString(obj['description']);
    }

    // Fallback: JSON stringify (this prevents [Object] output)
    try {
      return JSON.stringify(value);
    } catch {
      // If JSON stringify fails, use String()
      return String(value);
    }
  }

  // Fallback for any other type
  return String(value);
}

/**
 * Validates if content has significant (non-whitespace) characters.
 *
 * @param content - The content to validate
 * @returns true if content contains significant characters, false otherwise
 *
 * @example
 * hasSignificantContent("Hello world") // true
 * hasSignificantContent("   ")         // false
 * hasSignificantContent("")            // false
 * hasSignificantContent("\n\t")        // false
 * hasSignificantContent("  Hello  ")   // true
 */
export function hasSignificantContent(
  content: string | null | undefined,
): boolean {
  if (!content) {
    return false;
  }

  // Trim removes all whitespace (spaces, tabs, newlines)
  const trimmed = content.trim();

  // Check if there's actual content after trimming
  return trimmed.length > 0;
}

/**
 * Result of content validation with details
 */
export interface ContentValidationResult {
  isValid: boolean;
  originalLength: number;
  trimmedLength: number;
  reason?: string;
}

/**
 * Detailed validation with diagnostic information.
 * Useful for debugging and logging.
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

/**
 * Accumulated content for a single turn.
 */
export interface AccumulatedContent {
  /** Full text content accumulated during the turn */
  text: string;
  /** Full thought content accumulated during the turn */
  thought: string;
  /** UUID for this turn (set once at start) */
  uuid: string;
  /** Whether this turn has any tool calls */
  hasToolCalls: boolean;
  /** Timestamp when accumulation started */
  startedAt: number;
}

/**
 * Manages content accumulation for a conversation turn.
 *
 * Key features:
 * - Separate accumulation for text content and thought content
 * - Never modifies accumulated content during a turn
 * - Provides validation before recording
 * - Thread-safe via single-threaded React model
 */
export class ContentAccumulator {
  private content: AccumulatedContent | null = null;

  /**
   * Initialize a new turn's accumulator.
   * Must be called at the start of each turn.
   */
  startTurn(uuid?: string): void {
    this.content = {
      text: '',
      thought: '',
      uuid: uuid || '',
      hasToolCalls: false,
      startedAt: Date.now(),
    };
    debugLogger.info('Started new content accumulator', {
      uuid: this.content.uuid,
    });
  }

  /**
   * Append text content to the accumulator.
   * Safe to call multiple times during streaming.
   * Handles various input types by converting them to strings.
   */
  appendText(chunk: unknown): void {
    if (!this.content) {
      debugLogger.warn(
        'appendText called without startTurn - auto-initializing',
      );
      this.startTurn();
    }
    // Convert chunk to string, handling various input types
    let textChunk: string;
    if (chunk === null || chunk === undefined) {
      textChunk = '';
    } else if (typeof chunk === 'string') {
      textChunk = chunk;
    } else if (Array.isArray(chunk)) {
      // Handle arrays by converting each element
      textChunk = chunk
        .map((item) =>
          typeof item === 'string'
            ? item
            : item && typeof item === 'object' && 'text' in item
              ? String((item as { text: string }).text)
              : String(item),
        )
        .join('');
    } else if (typeof chunk === 'object' && chunk !== null) {
      // Handle object with text property
      const obj = chunk as Record<string, unknown>;
      if ('text' in obj && typeof obj['text'] === 'string') {
        textChunk = obj['text'] as string;
      } else {
        // Log warning for unexpected object types
        debugLogger.warn(
          'appendText received unexpected object type, converting to JSON',
          {
            type: typeof chunk,
            keys: Object.keys(obj),
          },
        );
        textChunk = JSON.stringify(chunk);
      }
    } else {
      // Fallback: convert to string
      textChunk = String(chunk);
    }
    this.content!.text += textChunk;
  }

  /**
   * Append thought content to the accumulator.
   * Safe to call multiple times during streaming.
   * Handles various input types by converting them to strings.
   */
  appendThought(chunk: unknown): void {
    if (!this.content) {
      debugLogger.warn(
        'appendThought called without startTurn - auto-initializing',
      );
      this.startTurn();
    }
    // Convert chunk to string, handling various input types
    let textChunk: string;
    if (chunk === null || chunk === undefined) {
      textChunk = '';
    } else if (typeof chunk === 'string') {
      textChunk = chunk;
    } else if (Array.isArray(chunk)) {
      // Handle arrays by converting each element
      textChunk = chunk
        .map((item) =>
          typeof item === 'string'
            ? item
            : item && typeof item === 'object' && 'text' in item
              ? String((item as { text: string }).text)
              : String(item),
        )
        .join('');
    } else if (typeof chunk === 'object' && chunk !== null) {
      // Handle object with text property
      const obj = chunk as Record<string, unknown>;
      if ('text' in obj && typeof obj['text'] === 'string') {
        textChunk = obj['text'] as string;
      } else {
        // Log warning for unexpected object types
        debugLogger.warn(
          'appendThought received unexpected object type, converting to JSON',
          {
            type: typeof chunk,
            keys: Object.keys(obj),
          },
        );
        textChunk = JSON.stringify(chunk);
      }
    } else {
      // Fallback: convert to string
      textChunk = String(chunk);
    }
    this.content!.thought += textChunk;
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
   * Should be called once when the turn starts.
   */
  setUuid(uuid: string): void {
    if (!this.content) {
      debugLogger.warn('setUuid called without startTurn');
      return;
    }
    this.content.uuid = uuid;
  }

  /**
   * Get the accumulated text content.
   * Returns empty string if not initialized.
   */
  getText(): string {
    return this.content?.text ?? '';
  }

  /**
   * Get the accumulated thought content.
   * Returns empty string if not initialized.
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
   * This checks both text and thought content.
   */
  hasSignificantContent(): boolean {
    if (!this.content) {
      return false;
    }

    // Check if either text or thought has significant content
    return (
      hasSignificantContent(this.content.text) ||
      hasSignificantContent(this.content.thought)
    );
  }

  /**
   * Validate all accumulated content.
   * Returns validation results for both text and thought.
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
   * Reset the accumulator for a new turn.
   * Called after recording is complete or on error/cancel.
   */
  reset(): void {
    if (this.content) {
      debugLogger.info('Resetting content accumulator', {
        textLength: this.content.text.length,
        thoughtLength: this.content.thought.length,
        duration: Date.now() - this.content.startedAt,
      });
    }
    this.content = null;
  }

  /**
   * Check if accumulator is currently active (has content).
   */
  isActive(): boolean {
    return this.content !== null;
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
  } {
    return {
      isActive: this.content !== null,
      textLength: this.content?.text.length ?? 0,
      thoughtLength: this.content?.thought.length ?? 0,
      uuid: this.content?.uuid ?? '',
      hasToolCalls: this.content?.hasToolCalls ?? false,
    };
  }
}

/**
 * Create a new content accumulator instance.
 * Each hook instance should have its own accumulator.
 */
export function createContentAccumulator(): ContentAccumulator {
  return new ContentAccumulator();
}
