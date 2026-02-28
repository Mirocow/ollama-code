/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Llama-specific tool call parsers.
 *
 * Llama models typically use:
 * - Structured tool_calls when supported
 * - Various JSON formats when in text mode
 *
 * Note: Llama's function call format is already handled by
 * FunctionCallParser in defaultParsers.
 */

import type { IToolCallTextParser } from '../types.js';

/**
 * All Llama-specific parsers.
 *
 * Llama models may output tool calls in OpenAI-compatible format:
 * {"type": "function", "function": {"name": "...", "arguments": "..."}}
 *
 * This format is already handled by FunctionCallParser in defaultParsers.
 * No additional Llama-specific parsers are needed at this time.
 */
export const llamaParsers: IToolCallTextParser[] = [];
