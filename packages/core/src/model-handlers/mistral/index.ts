/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createModelHandler,
  type ModelHandlerConfig,
} from '../baseModelHandler.js';
import { mistralParsers } from './parsers.js';

/**
 * Mistral model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const mistralConfig: ModelHandlerConfig = {
  modelPattern: /mistral|mixtral|codestral/i,
  displayName: 'Mistral',
  description: 'Mistral AI models (mistral, mixtral, codestral)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 128000,
};

/**
 * Mistral model handler.
 *
 * Supports Mistral AI models:
 * - mistral (mistral-small, mistral-medium, mistral-large)
 * - codestral (code-focused model)
 * - mixtral (mixture of experts)
 *
 * Mistral models typically return tool calls in structured format,
 * but may also output in [TOOL_CALLS] text format.
 */
export const MistralModelHandler = createModelHandler(
  'mistral',
  mistralConfig,
  {
    parsers: mistralParsers,
  },
);
