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
 */
const mistralConfig: ModelHandlerConfig = {
  modelPattern: /mistral|mixtral|codestral/i,
  displayName: 'Mistral',
  description: 'Mistral AI models (mistral, mixtral, codestral)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 128000, // mistral-large
};

/**
 * Check if Mistral model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Codestral - code focused, supports tools
  if (/codestral/i.test(name)) return true;

  // Mistral Small/Medium/Large - all support tools
  if (/mistral[-_]?small|mistral[-_]?medium|mistral[-_]?large/i.test(name))
    return true;

  // Mixtral 8x7B, 8x22B - support tools
  if (/mixtral/i.test(name)) return true;

  // Mistral 7B - base model, instruct variant supports tools
  if (/mistral[-_]?7b/i.test(name)) {
    return /instruct/i.test(name);
  }

  // Mistral Nemo - supports tools
  if (/mistral[-_]?nemo/i.test(name)) return true;

  // Generic mistral - check for instruct tag
  if (/mistral/i.test(name)) {
    return /instruct/i.test(name);
  }

  return false;
}

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
    supportsToolsFn: supportsTools,
  },
);
