/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Qwen-specific tool call parsers.
 *
 * Qwen models (qwen2.5, qwen3, qwen3-coder) use specific formats:
 * - <tool_call=...> format
 * - <think...> tags with tool calls (Qwen3)
 */

import type { IToolCallTextParser, ToolCallParseResult, ParsedToolCall } from '../types.js';

/**
 * Parser for Qwen's <tool_call=...> format.
 *
 * Example: <tool_call={"name": "list_directory", "arguments": {"path": "/home"}}>
 */
export class QwenToolCallTagParser implements IToolCallTextParser {
  readonly name = 'qwen-tool-call-tag';
  readonly priority = 5; // Higher priority than default

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
      const result = this.tryParseJsonAt(content, jsonStart);
      if (result) {
        const parsed = result.json as Record<string, unknown>;
        if (parsed['name'] && typeof parsed['name'] === 'string') {
          toolCalls.push({
            name: parsed['name'],
            args: (parsed['arguments'] || parsed['args'] || {}) as Record<string, unknown>,
          });
          const closingAngle = content.indexOf('>', result.end);
          if (closingAngle !== -1) {
            cleanedContent = cleanedContent.replace(content.slice(match.index, closingAngle + 1), '');
          }
        }
      }
    }
    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }

  private findMatchingBrace(str: string, start: number): number {
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

  private tryParseJsonAt(str: string, start: number): { json: unknown; end: number } | null {
    if (str[start] !== '{') return null;
    const end = this.findMatchingBrace(str, start);
    if (end === -1) return null;
    try {
      return { json: JSON.parse(str.slice(start, end + 1)), end };
    } catch { return null; }
  }
}

/**
 * Parser for Qwen3's <think...> tags with tool calls.
 *
 * Qwen3 may output tool calls inside thinking tags.
 * Example: <think {"name": "tool", "arguments": {...}} </think<tool_call_parser)
 */
export class QwenThinkTagParser implements IToolCallTextParser {
  readonly name = 'qwen-think-tag';
  readonly priority = 6;

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
        if (parsed['name'] && typeof parsed['name'] === 'string') {
          toolCalls.push({
            name: parsed['name'],
            args: (parsed['arguments'] || parsed['args'] || {}) as Record<string, unknown>,
          });
          cleanedContent = cleanedContent.replace(match[0], '');
        }
      } catch { /* not a JSON tool call */ }
    }
    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * All Qwen-specific parsers.
 */
export const qwenParsers: IToolCallTextParser[] = [
  new QwenToolCallTagParser(),
  new QwenThinkTagParser(),
];
