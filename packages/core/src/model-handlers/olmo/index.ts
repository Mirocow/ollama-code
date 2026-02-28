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
 * OLMo model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const olmoConfig: ModelHandlerConfig = {
  modelPattern: /olmo/i,
  displayName: 'OLMo',
  description: 'AllenAI OLMo open language models',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: true,
  maxContextLength: 4096,
};

/**
 * OLMo model handler.
 *
 * Supports AllenAI OLMo models:
 * - olmo, olmo-2, olmo-instruct
 *
 * OLMo (Open Language Model) is a fully open-source LLM from AllenAI,
 * designed for research and transparency in AI.
 */
export const OlmoModelHandler = createModelHandler('olmo', olmoConfig);
