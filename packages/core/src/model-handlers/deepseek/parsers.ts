/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DeepSeek-specific tool call parsers.
 *
 * DeepSeek models (especially R1) may use:
 * - <think...> tags for reasoning
 * - Standard JSON formats for tool calls
 */

import type { IToolCallTextParser, ToolCallParseResult, ParsedToolCall } from '../types.js';

/**
 * Parser for DeepSeek R1's thinking tags.
 *
 * DeepSeek R1 outputs reasoning inside <think...</think Tags.
 * Tool calls may appear after or during thinking.
 */
export class DeepSeekThinkParser implements IToolCallTextParser {
  readonly name = 'deepseek-think';
  readonly priority = 5;

  canParse(content: string): boolean {
    return /<think\b[^>]*>[\s\S]*?<\/think>/i.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    const pattern = /<think\b[^>]*>([\s\S]*?)<\/think>/gi;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const thinkContent = match[1].trim();

      // Try to find tool calls inside think block
      const jsonMatch = thinkContent.match(/\{[\s\S]*"name"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed['name'] && typeof parsed['name'] === 'string') {
            toolCalls.push({
              name: parsed['name'],
              args: (parsed['arguments'] || parsed['args'] || {}) as Record<string, unknown>,
            });
          }
        } catch { /* not a valid JSON tool call */ }
      }

      // Remove think block from content
      cleanedContent = cleanedContent.replace(match[0], '');
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * All DeepSeek-specific parsers.
 */
export const deepseekParsers: IToolCallTextParser[] = [
  new DeepSeekThinkParser(),
];
