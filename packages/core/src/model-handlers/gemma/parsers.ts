/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IToolCallTextParser, ToolCallParseResult } from '../types.js';

/**
 * Gemma-specific tool call parsers.
 *
 * Gemma models don't have a native tool call format, but they can
 * output tool calls in JSON format when prompted correctly.
 */

/**
 * Parser for Gemma's JSON code block format.
 * Gemma often outputs tool calls inside ```json blocks.
 */
export class GemmaJsonBlockParser implements IToolCallTextParser {
  readonly name = 'gemma-json-block';
  readonly priority = 90;

  canParse(content: string): boolean {
    return /```json\s*\n[\s\S]*?```/i.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> =
      [];
    let cleanedContent = content;

    const blockRegex = /```json\s*\n([\s\S]*?)```/gi;
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
      try {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);

        // Handle various JSON formats
        if (parsed.name && parsed.arguments) {
          toolCalls.push({ name: parsed.name, args: parsed.arguments });
        } else if (parsed.function && parsed.arguments) {
          toolCalls.push({ name: parsed.function, args: parsed.arguments });
        } else if (parsed.tool_call) {
          toolCalls.push({
            name: parsed.tool_call.name || parsed.tool_call.function,
            args: parsed.tool_call.arguments || parsed.tool_call.args || {},
          });
        }

        cleanedContent = cleanedContent.replace(match[0], '');
      } catch {
        // Invalid JSON, skip
      }
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * Parser for Gemma's function call format.
 * Sometimes outputs: function_name(args)
 */
export class GemmaFunctionCallParser implements IToolCallTextParser {
  readonly name = 'gemma-function-call';
  readonly priority = 91;

  canParse(content: string): boolean {
    return /\b\w+\s*\(\s*\{[\s\S]*?\}\s*\)/.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> =
      [];
    let cleanedContent = content;

    // Match function_name({...})
    const funcRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*(\{[\s\S]*?\})\s*\)/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1];
      const argsStr = match[2];

      // Skip common non-tool patterns
      const skipNames = [
        'function',
        'if',
        'for',
        'while',
        'switch',
        'catch',
        'print',
        'console',
      ];
      if (skipNames.includes(name.toLowerCase())) continue;

      try {
        const args = JSON.parse(argsStr);
        toolCalls.push({ name, args });
        cleanedContent = cleanedContent.replace(match[0], '');
      } catch {
        // Invalid JSON args
      }
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

export const gemmaParsers: IToolCallTextParser[] = [
  new GemmaJsonBlockParser(),
  new GemmaFunctionCallParser(),
];
