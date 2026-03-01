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
 * LLaVA model handler configuration.
 */
const llavaConfig: ModelHandlerConfig = {
  modelPattern: /llava|bakllava|moondream|minicpm-v/i,
  displayName: 'LLaVA',
  description: 'LLaVA multimodal vision-language models',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: false,
  supportsTools: false, // Vision models typically don't support tools
  maxContextLength: 8192,
};

/**
 * LLaVA model handler.
 *
 * Supports LLaVA multimodal vision-language models:
 * - llava (llava-7b, llava-13b)
 * - llava-v1.5
 * - llava-v1.6 (llava-next)
 * - llava-llama3
 * - bakllava
 * - moondream (related vision model)
 * - minicpm-v (vision model)
 *
 * Vision models focus on image understanding and typically don't support tool calling.
 */
export const LlavaModelHandler = createModelHandler('llava', llavaConfig);
