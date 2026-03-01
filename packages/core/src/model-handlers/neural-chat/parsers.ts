/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Neural Chat-specific tool call parsers.
 * Neural Chat uses standard JSON format for tool calls.
 */

import type { IToolCallTextParser } from '../types.js';

/**
 * All Neural Chat-specific parsers.
 *
 * Neural Chat models use standard JSON format for tool calls,
 * which is already handled by defaultParsers.
 */
export const neuralChatParsers: IToolCallTextParser[] = [];
