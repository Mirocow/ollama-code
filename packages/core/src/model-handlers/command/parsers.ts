/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IToolCallTextParser, ToolCallParseResult } from '../types.js';

/**
 * Command-specific tool call parsers.
 *
 * Command-R models typically return structured tool calls via API,
 * but may also output in text format.
 */

/**
 * Parser for Cohere's tool call format.
 * Command-R may output: TOOL_CALL: name(args)
 */
export class CommandToolCallParser implements IToolCallTextParser {
  readonly name = 'command-tool-call';
  readonly priority = 85;

  canParse(content: string): boolean {
    return /TOOL_CALL:\s*\w+/i.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> =
      [];
    let cleanedContent = content;

    // Match TOOL_CALL: function_name({...})
    const regex =
      /TOOL_CALL:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)(?=\s*(?:TOOL_CALL:|$))/gi;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      const argsStr = match[2].trim();

      try {
        // Try parsing as JSON
        const args = argsStr ? JSON.parse(argsStr) : {};
        toolCalls.push({ name, args });
        cleanedContent = cleanedContent.replace(match[0], '');
      } catch {
        // Try parsing as key=value format
        const args: Record<string, string> = {};
        const kvRegex = /(\w+)\s*=\s*"([^"]*)"/g;
        let kvMatch;
        while ((kvMatch = kvRegex.exec(argsStr)) !== null) {
          args[kvMatch[1]] = kvMatch[2];
        }
        if (Object.keys(args).length > 0) {
          toolCalls.push({ name, args });
          cleanedContent = cleanedContent.replace(match[0], '');
        }
      }
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * Parser for Command's JSON results format.
 * May output: tool_results: {...}
 */
export class CommandToolResultsParser implements IToolCallTextParser {
  readonly name = 'command-tool-results';
  readonly priority = 86;

  canParse(content: string): boolean {
    return /tool_results\s*:/i.test(content);
  }

  parse(content: string): ToolCallParseResult {
    // This parser extracts tool results, not tool calls
    // For now, return empty (tool results are handled differently)
    return { toolCalls: [], cleanedContent: content };
  }
}

export const commandParsers: IToolCallTextParser[] = [
  new CommandToolCallParser(),
  new CommandToolResultsParser(),
];
