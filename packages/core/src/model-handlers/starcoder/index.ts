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
 * StarCoder model handler configuration.
 */
const starcoderConfig: ModelHandlerConfig = {
  modelPattern: /starcoder|stable[-_]?code/i,
  displayName: 'StarCoder',
  description: 'Code generation models (starcoder, starcoder2, stable-code)',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: true,
  supportsTools: false, // Code models typically don't support tools
  maxContextLength: 16384,
};

/**
 * StarCoder model handler.
 *
 * Supports code generation models:
 * - starcoder (starcoder-1, starcoder-2)
 * - starcoder2
 * - stable-code
 * - codeqwen (redirected to Qwen handler)
 * - codellama (redirected to Llama handler)
 *
 * Code models have limited tool calling support - mainly focused on code generation.
 */
export const StarCoderModelHandler = createModelHandler(
  'starcoder',
  starcoderConfig,
);
