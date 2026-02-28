/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParsedToolCall } from '../types.js';

/**
 * Utility functions for tool call parsing.
 * Shared across all model handlers and parsers.
 */

/**
 * Find the matching closing brace for a JSON object.
 * Respects string boundaries and escape sequences.
 *
 * @param str - String to search in
 * @param start - Starting position (should be at '{')
 * @returns Position of matching '}' or -1 if not found
 */
export function findMatchingBrace(str: string, start: number): number {
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

    if (char === '"') {
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
 * Find the matching closing bracket for a JSON array.
 *
 * @param str - String to search in
 * @param start - Starting position (should be at '[')
 * @returns Position of matching ']' or -1 if not found
 */
export function findMatchingBracket(str: string, start: number): number {
  if (str[start] !== '[') return -1;

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

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '[') depth++;
      else if (char === ']') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }

  return -1;
}

/**
 * Try to parse a JSON object at a specific position.
 *
 * @param str - String containing JSON
 * @param start - Starting position (should be at '{')
 * @returns Parsed JSON and end position, or null if parsing failed
 */
export function tryParseJsonAt(
  str: string,
  start: number,
): { json: unknown; end: number } | null {
  if (str[start] !== '{') return null;

  const end = findMatchingBrace(str, start);
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
 * Try to parse a JSON array at a specific position.
 *
 * @param str - String containing JSON array
 * @param start - Starting position (should be at '[')
 * @returns Parsed array and end position, or null if parsing failed
 */
export function tryParseArrayAt(
  str: string,
  start: number,
): { array: unknown[]; end: number } | null {
  if (str[start] !== '[') return null;

  const end = findMatchingBracket(str, start);
  if (end === -1) return null;

  try {
    const jsonStr = str.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return null;
    return { array: parsed, end };
  } catch {
    return null;
  }
}

/**
 * Extract a tool call from a parsed JSON object.
 *
 * Supports multiple formats:
 * 1. { name: "...", arguments: {...} } - Direct format
 * 2. { name: "...", args: {...} } - Alternative direct format
 * 3. { type: "function", function: { name: "...", arguments: "..." } } - OpenAI format
 *
 * @param parsed - Parsed JSON object
 * @returns Extracted tool call or null
 */
export function extractToolCall(parsed: unknown): ParsedToolCall | null {
  if (typeof parsed !== 'object' || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;

  // Format 1 & 2: Direct format { name: "...", arguments/args: {...} }
  if (obj['name'] && typeof obj['name'] === 'string' && !obj['type']) {
    return {
      name: obj['name'],
      args: (obj['arguments'] || obj['args'] || {}) as Record<string, unknown>,
    };
  }

  // Format 3: OpenAI format { type: "function", function: {...} }
  if (obj['type'] === 'function' && obj['function']) {
    const func = obj['function'] as Record<string, unknown>;
    if (func['name'] && typeof func['name'] === 'string') {
      let args: Record<string, unknown> = {};

      const funcArgs = func['arguments'];
      if (typeof funcArgs === 'string') {
        try {
          args = JSON.parse(funcArgs);
        } catch {
          args = {};
        }
      } else if (typeof funcArgs === 'object' && funcArgs !== null) {
        args = funcArgs as Record<string, unknown>;
      }

      return { name: func['name'] as string, args };
    }
  }

  return null;
}

/**
 * Check if a tool call with the given name already exists.
 *
 * @param toolCalls - Existing tool calls
 * @param name - Tool name to check
 * @returns true if tool call exists
 */
export function hasToolCall(toolCalls: ParsedToolCall[], name: string): boolean {
  return toolCalls.some((tc) => tc.name === name);
}
