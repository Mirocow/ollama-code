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
 * DeepSeek model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const deepseekConfig: ModelHandlerConfig = {
  modelPattern: /deepseek/i,
  displayName: 'DeepSeek',
  description: 'DeepSeek models (deepseek-coder, deepseek-r1)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 128000,
};

/**
 * DeepSeek model handler.
 *
 * Supports DeepSeek models:
 * - deepseek-coder
 * - deepseek-r1 (reasoning model with <think tags)
 *
 * DeepSeek R1 is a reasoning model that outputs thinking in <think...> tags.
 * Tool calls may be embedded in the thinking output.
 */
export const DeepSeekModelHandler = createModelHandler(
  'deepseek',
  deepseekConfig,
);
