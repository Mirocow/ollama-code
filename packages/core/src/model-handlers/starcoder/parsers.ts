/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IToolCallTextParser } from '../types.js';

/**
 * StarCoder-specific tool call parsers.
 * Code models may output structured code blocks.
 */

export const starcoderParsers: IToolCallTextParser[] = [];
