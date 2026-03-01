/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OLMo-specific tool call parsers.
 * OLMo uses standard JSON format for tool calls.
 */

import type { IToolCallTextParser } from '../types.js';

/**
 * All OLMo-specific parsers.
 *
 * OLMo models use standard JSON format for tool calls,
 * which is already handled by defaultParsers.
 */
export const olmoParsers: IToolCallTextParser[] = [];
