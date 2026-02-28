/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IToolCallTextParser, ToolCallParseResult } from '../types.js';

/**
 * Phi-specific tool call parsers.
 *
 * Phi models typically return tool calls in structured format when using
 * Ollama's tools API, but may also output in text format.
 */

/**
 * Parser for Phi's special function call format.
 * Phi may output: <function_call>{"name": "...", "arguments": {...}}</function_call>
 */
export class PhiFunctionCallTagParser implements IToolCallTextParser {
  readonly name = 'phi-function-call-tag';
  readonly priority = 85;

  canParse(content: string): boolean {
    return /<function_call>[\s\S]*?<\/function_call>/i.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> =
      [];
    let cleanedContent = content;

    const tagRegex = /<function_call>([\s\S]*?)<\/function_call>/gi;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      try {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);

        if (parsed.name && parsed.arguments) {
          toolCalls.push({ name: parsed.name, args: parsed.arguments });
        } else if (parsed.function) {
          toolCalls.push({
            name: parsed.function,
            args: parsed.arguments || parsed.args || {},
          });
        }

        cleanedContent = cleanedContent.replace(match[0], '');
      } catch {
        // Invalid JSON
      }
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * Parser for Phi's assistant format.
 * May output: assistant<|tool_calls|>[...]
 */
export class PhiToolCallsTagParser implements IToolCallTextParser {
  readonly name = 'phi-tool-calls-tag';
  readonly priority = 86;

  canParse(content: string): boolean {
    return /<\|tool_calls\|>[\s\S]*?\]/.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> =
      [];
    let cleanedContent = content;

    const tagRegex = /<\|tool_calls\|>([\s\S]*?\])/gi;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      try {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.function) {
              toolCalls.push({
                name: item.function.name,
                args:
                  typeof item.function.arguments === 'string'
                    ? JSON.parse(item.function.arguments)
                    : item.function.arguments,
              });
            }
          }
        }

        cleanedContent = cleanedContent.replace(match[0], '');
      } catch {
        // Invalid JSON
      }
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

export const phiParsers: IToolCallTextParser[] = [
  new PhiFunctionCallTagParser(),
  new PhiToolCallsTagParser(),
];
