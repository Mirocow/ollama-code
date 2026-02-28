/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DeepSeek-specific tool call parsers.
 *
 * DeepSeek models (especially R1) may use:
 * - <think...> tags for reasoning (handled by ThinkTagParser in defaultParsers)
 * - Standard JSON formats for tool calls (handled by default parsers)
 *
 * No additional DeepSeek-specific parsers are needed at this time.
 */

import type { IToolCallTextParser } from '../types.js';

/**
 * All DeepSeek-specific parsers.
 *
 * DeepSeek R1 outputs reasoning inside <think...</think Tags.
 * Tool calls may appear after or during thinking.
 * These formats are already handled by defaultParsers.
 */
export const deepseekParsers: IToolCallTextParser[] = [];
