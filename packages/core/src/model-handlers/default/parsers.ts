/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Default tool call parsers.
 *
 * These parsers handle the most common formats used by various models.
 * They can be reused by specific model handlers.
 */

import type { IToolCallTextParser, ToolCallParseResult, ParsedToolCall } from '../types.js';

/**
 * Utility functions for parsers.
 */
function findMatchingBrace(str: string, start: number): number {
  if (str[start] !== '{') return -1;
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < str.length; i++) {
    const char = str[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (char === '\\' && inString) { escapeNext = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') { depth--; if (depth === 0) return i; }
    }
  }
  return -1;
}

function tryParseJsonAt(str: string, start: number): { json: unknown; end: number } | null {
  if (str[start] !== '{') return null;
  const end = findMatchingBrace(str, start);
  if (end === -1) return null;
  try {
    return { json: JSON.parse(str.slice(start, end + 1)), end };
  } catch { return null; }
}

function extractToolCall(parsed: unknown): ParsedToolCall | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  if (obj['name'] && typeof obj['name'] === 'string' && !obj['type']) {
    return { name: obj['name'], args: (obj['arguments'] || obj['args'] || {}) as Record<string, unknown> };
  }

  if (obj['type'] === 'function' && obj['function']) {
    const func = obj['function'] as Record<string, unknown>;
    if (func['name'] && typeof func['name'] === 'string') {
      let args = {};
      if (typeof func['arguments'] === 'string') {
        try { args = JSON.parse(func['arguments']); } catch { args = {}; }
      } else if (typeof func['arguments'] === 'object') {
        args = func['arguments'] as Record<string, unknown>;
      }
      return { name: func['name'] as string, args };
    }
  }
  return null;
}

function hasToolCall(toolCalls: ParsedToolCall[], name: string): boolean {
  return toolCalls.some((tc) => tc.name === name);
}

/**
 * Parser for <tool_call=...> format.
 * Used by Qwen and similar models.
 */
export class ToolCallTagParser implements IToolCallTextParser {
  readonly name = 'tool-call-tag';
  readonly priority = 10;

  canParse(content: string): boolean {
    return content.includes('<tool_call');
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    const pattern = /<tool_call\s*=\s*/gi;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const jsonStart = match.index + match[0].length;
      const result = tryParseJsonAt(content, jsonStart);
      if (result) {
        const toolCall = extractToolCall(result.json);
        if (toolCall) {
          toolCalls.push(toolCall);
          const closingAngle = content.indexOf('>', result.end);
          if (closingAngle !== -1) {
            cleanedContent = cleanedContent.replace(content.slice(match.index, closingAngle + 1), '');
          }
        }
      }
    }
    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * Parser for <tool_call_start>...<tool_call_end> format.
 */
export class ToolCallStartEndParser implements IToolCallTextParser {
  readonly name = 'tool-call-start-end';
  readonly priority = 10;

  canParse(content: string): boolean {
    return content.includes('<tool_call_start>');
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    const pattern = /<tool_call_start>([\s\S]*?)<tool_call_end>/gi;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const toolCall = extractToolCall(parsed);
        if (toolCall) {
          toolCalls.push(toolCall);
          cleanedContent = cleanedContent.replace(match[0], '');
        }
      } catch { /* skip */ }
    }
    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * Parser for tool calls in <think...>...</think format.
 * Used by Qwen3, DeepSeek R1, and other thinking models.
 */
export class ThinkTagParser implements IToolCallTextParser {
  readonly name = 'think-tag';
  readonly priority = 20;

  canParse(content: string): boolean {
    return /<think\b[^>]*>[\s\S]*?<\/think>/i.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    const pattern = /<think\b[^>]*>([\s\S]*?)<\/think>/gi;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const toolCall = extractToolCall(parsed);
        if (toolCall) {
          toolCalls.push(toolCall);
          cleanedContent = cleanedContent.replace(match[0], '');
        }
      } catch { /* not JSON, keep the think block */ }
    }
    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * Parser for standalone JSON objects with "name" field.
 */
export class StandaloneJsonParser implements IToolCallTextParser {
  readonly name = 'standalone-json';
  readonly priority = 30;

  canParse(content: string): boolean {
    return content.includes('{') && content.includes('"name"');
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    let searchPos = 0;

    while (searchPos < cleanedContent.length) {
      const jsonStart = cleanedContent.indexOf('{', searchPos);
      if (jsonStart === -1) break;

      const result = tryParseJsonAt(cleanedContent, jsonStart);
      if (result) {
        const parsed = result.json as Record<string, unknown>;
        if (parsed['name'] && typeof parsed['name'] === 'string' && !parsed['type']) {
          if (!hasToolCall(toolCalls, parsed['name'])) {
            toolCalls.push({
              name: parsed['name'],
              args: (parsed['arguments'] || parsed['args'] || {}) as Record<string, unknown>,
            });
          }
          cleanedContent = cleanedContent.slice(0, jsonStart) + cleanedContent.slice(result.end + 1);
          searchPos = jsonStart;
          continue;
        }
      }
      searchPos = jsonStart + 1;
    }
    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * Parser for OpenAI-compatible function call format.
 */
export class FunctionCallParser implements IToolCallTextParser {
  readonly name = 'function-call';
  readonly priority = 30;

  canParse(content: string): boolean {
    return content.includes('"type"') && content.includes('"function"');
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    let searchPos = 0;

    while (searchPos < cleanedContent.length) {
      const jsonStart = cleanedContent.indexOf('{', searchPos);
      if (jsonStart === -1) break;

      const result = tryParseJsonAt(cleanedContent, jsonStart);
      if (result) {
        const toolCall = extractToolCall(result.json);
        if (toolCall && !hasToolCall(toolCalls, toolCall.name)) {
          toolCalls.push(toolCall);
          cleanedContent = cleanedContent.slice(0, jsonStart) + cleanedContent.slice(result.end + 1);
          searchPos = jsonStart;
          continue;
        }
      }
      searchPos = jsonStart + 1;
    }
    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * All default parsers.
 */
export const defaultParsers: IToolCallTextParser[] = [
  new ToolCallTagParser(),
  new ToolCallStartEndParser(),
  new ThinkTagParser(),
  new StandaloneJsonParser(),
  new FunctionCallParser(),
];
