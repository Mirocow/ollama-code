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

import type {
  IToolCallTextParser,
  ToolCallParseResult,
  ParsedToolCall,
} from '../types.js';
import { tryParseJsonAt, extractToolCall } from '../utils/parserUtils.js';
import { createDebugLogger } from '../../utils/debugLogger.js';

const debugLogger = createDebugLogger('QWEN_PARSER');

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
      const result = tryParseJsonAt(content, jsonStart);
      if (result) {
        const toolCall = extractToolCall(result.json);
        if (toolCall) {
          debugLogger.debug('Parsed tool_call tag', {
            name: toolCall.name,
            args: toolCall.args,
          });
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
    if (toolCalls.length > 0) {
      debugLogger.info('QwenToolCallTagParser result', {
        count: toolCalls.length,
        toolCalls: toolCalls.map((tc) => ({ name: tc.name, args: tc.args })),
      });
    }
    return { toolCalls, cleanedContent: cleanedContent.trim() };
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
        const toolCall = extractToolCall(parsed);
        if (toolCall) {
          debugLogger.debug('Parsed think tag tool call', {
            name: toolCall.name,
            args: toolCall.args,
          });
          toolCalls.push(toolCall);
          cleanedContent = cleanedContent.replace(match[0], '');
        }
      } catch {
        /* not a JSON tool call */
      }
    }
    if (toolCalls.length > 0) {
      debugLogger.info('QwenThinkTagParser result', {
        count: toolCalls.length,
        toolCalls: toolCalls.map((tc) => ({ name: tc.name, args: tc.args })),
      });
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
