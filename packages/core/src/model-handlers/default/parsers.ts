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
import {
  tryParseJsonAt,
  extractToolCall,
  hasToolCall,
} from '../utils/parserUtils.js';

/**
 * Parser for <tool_call=...> format.
 * Used by Qwen and similar models.
 *
 * Example: <tool_call={"name": "list_directory", "arguments": {"path": "/home"}}>
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
            cleanedContent = cleanedContent.replace(
              content.slice(match.index, closingAngle + 1),
              '',
            );
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
    // Check for JSON object with "name" field, but not a function call format
    return content.includes('{') && content.includes('"name"') && !content.includes('"type"');
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
