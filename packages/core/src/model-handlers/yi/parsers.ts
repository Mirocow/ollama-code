/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IToolCallTextParser } from '../types.js';

/**
 * Yi-specific tool call parsers.
 *
 * Yi models typically use standard JSON format for tool calls.
 */

/**
 * Parser for Yi's function call format.
 * Yi-Coder outputs: {"name": "...", "arguments": {...}}
 */
export class YiFunctionCallParser implements IToolCallTextParser {
  readonly name = 'yi-function-call';
  readonly priority = 85;

  canParse(content: string): boolean {
    return /"name"\s*:\s*"[a-zA-Z_]/.test(content) && /"arguments"\s*:/.test(content);
  }

  parse(content: string): { toolCalls: Array<{ name: string; args: Record<string, unknown> }>; cleanedContent: string } {
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
    let cleanedContent = content;

    // Match JSON objects with name and arguments
    const regex = /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{[^}]*\})\s*\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      try {
        const name = match[1];
        const args = JSON.parse(match[2]);
        toolCalls.push({ name, args });
        cleanedContent = cleanedContent.replace(match[0], '');
      } catch {
        // Invalid JSON
      }
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

export const yiParsers: IToolCallTextParser[] = [
  new YiFunctionCallParser(),
];
