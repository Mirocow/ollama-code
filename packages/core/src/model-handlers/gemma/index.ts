/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createModelHandler,
  type ModelHandlerConfig,
} from '../baseModelHandler.js';

/**
 * Gemma model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const gemmaConfig: ModelHandlerConfig = {
  modelPattern: /gemma/i,
  displayName: 'Gemma',
  description: 'Google Gemma models (gemma-2, gemma-3, codegemma)',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: true,
  maxContextLength: 8192,
};

/**
 * Gemma model handler.
 *
 * Supports Google Gemma models:
 * - gemma (gemma-2-2b, gemma-2-9b, gemma-2-27b)
 * - gemma-3 (latest generation)
 * - codegemma (code-focused variant)
 *
 * Gemma models have limited tool calling support:
 * - Gemma 2: No native tool calling (but can follow JSON format)
 * - Gemma 3: Added tool calling support
 * - CodeGemma: Limited tool calling for code tasks
 */
export const GemmaModelHandler = createModelHandler('gemma', gemmaConfig);
