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
 * Llama model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const llamaConfig: ModelHandlerConfig = {
  modelPattern: /llama|codellama/i,
  displayName: 'Llama',
  description: 'Meta Llama models (llama3.1, llama3.2, llama3.3, codellama)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 128000,
};

/**
 * Llama model handler.
 *
 * Supports Meta Llama models:
 * - llama3.1 (8B, 70B, 405B)
 * - llama3.2 (1B, 3B, 11B, 90B)
 * - llama3.3 (70B)
 * - codellama (7B, 13B, 34B)
 *
 * Llama 3.1+ models have native function calling support.
 */
export const LlamaModelHandler = createModelHandler('llama', llamaConfig);
