/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  IModelHandler,
  IToolCallTextParser,
  ToolCallParseResult,
  ParsedToolCall,
  ModelHandlerConfig,
} from './types.js';

/**
 * Base class for model handlers.
 * Provides common utility methods for parsing and content manipulation.
 *
 * @example
 * ```typescript
 * class MyModelHandler extends BaseModelHandler {
 *   constructor() {
 *     super('my-model', {
 *       modelPattern: /my-model/i,
 *       displayName: 'My Model',
 *     });
 *   }
 *
 *   parseToolCalls(content: string): ToolCallParseResult {
 *     // Use this.parseWithParsers() with custom parsers
 *   }
 * }
 * ```
 */
export abstract class BaseModelHandler implements IModelHandler {
  abstract readonly name: string;
  abstract readonly config: ModelHandlerConfig;

  protected parsers: IToolCallTextParser[] = [];

  /**
   * Check if this handler can handle the given model.
   * Uses the modelPattern from config.
   */
  canHandle(modelName: string): boolean {
    const pattern = this.config.modelPattern;
    if (typeof pattern === 'string') {
      return modelName.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(modelName);
  }

  /**
   * Register a parser for tool call parsing.
   */
  protected registerParser(parser: IToolCallTextParser): void {
    this.parsers.push(parser);
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  /**
   * Parse tool calls using registered parsers.
   */
  protected parseWithParsers(content: string): ToolCallParseResult {
    const allToolCalls: ParsedToolCall[] = [];
    let currentContent = content;

    for (const parser of this.parsers) {
      if (parser.canParse(currentContent)) {
        const result = parser.parse(currentContent);
        if (result.toolCalls.length > 0) {
          allToolCalls.push(...result.toolCalls);
          currentContent = result.cleanedContent;
        }
      }
    }

    return {
      toolCalls: allToolCalls,
      cleanedContent: currentContent.trim(),
    };
  }

  /**
   * Abstract method - each handler must implement its own parsing logic.
   */
  abstract parseToolCalls(content: string): ToolCallParseResult;

  // ============ Utility methods for parsers ============

  /**
   * Find the matching closing brace for a JSON object.
   * Respects string boundaries and escape sequences.
   */
  protected findMatchingBrace(str: string, start: number): number {
    if (str[start] !== '{') return -1;

    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = start; i < str.length; i++) {
      const char = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) return i;
        }
      }
    }

    return -1;
  }

  /**
   * Try to parse a JSON object at a specific position.
   */
  protected tryParseJsonAt(
    str: string,
    start: number,
  ): { json: unknown; end: number } | null {
    if (str[start] !== '{') return null;

    const end = this.findMatchingBrace(str, start);
    if (end === -1) return null;

    try {
      const jsonStr = str.slice(start, end + 1);
      const parsed = JSON.parse(jsonStr);
      return { json: parsed, end };
    } catch {
      return null;
    }
  }

  /**
   * Extract tool call from a parsed JSON object.
   */
  protected extractToolCall(parsed: unknown): ParsedToolCall | null {
    if (typeof parsed !== 'object' || parsed === null) return null;

    const obj = parsed as Record<string, unknown>;

    // Format 1: { name: "...", arguments: {...} } or { name: "...", args: {...} }
    if (obj['name'] && typeof obj['name'] === 'string' && !obj['type']) {
      return {
        name: obj['name'],
        args: (obj['arguments'] || obj['args'] || {}) as Record<string, unknown>,
      };
    }

    // Format 2: { type: "function", function: { name: "...", arguments: "..." } }
    if (obj['type'] === 'function' && obj['function']) {
      const func = obj['function'] as Record<string, unknown>;
      if (func['name'] && typeof func['name'] === 'string') {
        let args: Record<string, unknown> = {};

        if (typeof func['arguments'] === 'string') {
          try {
            args = JSON.parse(func['arguments']);
          } catch {
            args = {};
          }
        } else if (typeof func['arguments'] === 'object') {
          args = func['arguments'] as Record<string, unknown>;
        }

        return { name: func['name'] as string, args };
      }
    }

    return null;
  }

  /**
   * Check if a tool call already exists (deduplication).
   */
  protected hasToolCall(toolCalls: ParsedToolCall[], name: string): boolean {
    return toolCalls.some((tc) => tc.name === name);
  }
}

/**
 * Base class for tool call text parsers.
 */
export abstract class BaseToolCallParser implements IToolCallTextParser {
  abstract readonly name: string;
  readonly priority?: number = 100;

  abstract canParse(content: string): boolean;
  abstract parse(content: string): ToolCallParseResult;

  protected findMatchingBrace(str: string, start: number): number {
    if (str[start] !== '{') return -1;

    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = start; i < str.length; i++) {
      const char = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) return i;
        }
      }
    }

    return -1;
  }

  protected tryParseJsonAt(
    str: string,
    start: number,
  ): { json: unknown; end: number } | null {
    if (str[start] !== '{') return null;

    const end = this.findMatchingBrace(str, start);
    if (end === -1) return null;

    try {
      const jsonStr = str.slice(start, end + 1);
      const parsed = JSON.parse(jsonStr);
      return { json: parsed, end };
    } catch {
      return null;
    }
  }

  protected extractToolCall(parsed: unknown): ParsedToolCall | null {
    if (typeof parsed !== 'object' || parsed === null) return null;

    const obj = parsed as Record<string, unknown>;

    if (obj['name'] && typeof obj['name'] === 'string' && !obj['type']) {
      return {
        name: obj['name'],
        args: (obj['arguments'] || obj['args'] || {}) as Record<string, unknown>,
      };
    }

    if (obj['type'] === 'function' && obj['function']) {
      const func = obj['function'] as Record<string, unknown>;
      if (func['name'] && typeof func['name'] === 'string') {
        let args: Record<string, unknown> = {};

        if (typeof func['arguments'] === 'string') {
          try {
            args = JSON.parse(func['arguments']);
          } catch {
            args = {};
          }
        } else if (typeof func['arguments'] === 'object') {
          args = func['arguments'] as Record<string, unknown>;
        }

        return { name: func['name'] as string, args };
      }
    }

    return null;
  }

  protected hasToolCall(toolCalls: ParsedToolCall[], name: string): boolean {
    return toolCalls.some((tc) => tc.name === name);
  }
}
