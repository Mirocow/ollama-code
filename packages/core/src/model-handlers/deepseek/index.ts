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
 */
const deepseekConfig: ModelHandlerConfig = {
  modelPattern: /deepseek/i,
  displayName: 'DeepSeek',
  description: 'DeepSeek models (deepseek-coder, deepseek-r1)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: true,
  supportsThinking: true, // DeepSeek R1 supports thinking
  maxContextLength: 128000,
};

/**
 * Check if DeepSeek model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // DeepSeek Coder V2 - supports tools
  if (/deepseek[-_]?coder[-_]?v?2/i.test(name)) return true;

  // DeepSeek Coder (older) - limited tool support but works
  if (/deepseek[-_]?coder/i.test(name)) return true;

  // DeepSeek R1 - reasoning model, supports tools
  if (/deepseek[-_]?r1/i.test(name)) return true;

  // DeepSeek V3 - supports tools
  if (/deepseek[-_]?v?3/i.test(name)) return true;

  // DeepSeek V2.5 - supports tools
  if (/deepseek[-_]?v?2\.?5/i.test(name)) return true;

  // Generic DeepSeek - check for instruct/chat tags
  if (/deepseek/i.test(name)) {
    return /instruct|chat/i.test(name);
  }

  return false;
}

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
  {
    supportsToolsFn: supportsTools,
  },
);
