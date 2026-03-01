/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Qwen-specific tool call parsers.
 *
 * Note: Qwen's main formats are already handled by default parsers:
 * - <tool_call=...> format -> ToolCallTagParser (default)
 * - <think...> tags -> ThinkTagParser (default)
 *
 * This file re-exports default parsers with Qwen-specific logging.
 * Only truly Qwen-unique formats should be added here.
 */

import type { IToolCallTextParser } from '../types.js';

/**
 * All Qwen-specific parsers.
 *
 * Qwen models (qwen2.5, qwen3, qwen3-coder) use standard formats
 * that are already handled by defaultParsers:
 * - <tool_call={"name": "...", "arguments": {...}}>
 * - <think...>{"name": "...", "arguments": {...}</think...> (Qwen3)
 *
 * No additional Qwen-specific parsers are needed at this time.
 */
export const qwenParsers: IToolCallTextParser[] = [];
