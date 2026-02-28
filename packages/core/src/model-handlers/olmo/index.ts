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
 */
const olmoConfig: ModelHandlerConfig = {
  modelPattern: /olmo/i,
  displayName: 'OLMo',
  description: 'AllenAI OLMo open language models',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 4096,
};

/**
 * Check if OLMo model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();
  // OLMo 2 has improved tool support
  if (/olmo[-_]?2/i.test(name)) return true;
  // OLMo Instruct variants support tools
  if (/olmo.*instruct/i.test(name)) return true;
  return false;
}

/**
 * OLMo model handler.
 *
 * Supports AllenAI OLMo models:
 * - olmo, olmo-2, olmo-instruct
 *
 * OLMo (Open Language Model) is a fully open-source LLM from AllenAI,
 * designed for research and transparency in AI.
 */
export const OlmoModelHandler = createModelHandler('olmo', olmoConfig, {
  supportsToolsFn: supportsTools,
});
