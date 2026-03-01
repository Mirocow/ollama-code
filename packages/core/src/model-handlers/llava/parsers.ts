/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IToolCallTextParser } from '../types.js';

/**
 * LLaVA parsers - vision models typically don't output tool calls.
 * This file is kept for consistency and future extensibility.
 */

export const llavaParsers: IToolCallTextParser[] = [];
