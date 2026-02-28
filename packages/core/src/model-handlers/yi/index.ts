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
 * Yi model handler configuration.
 */
const yiConfig: ModelHandlerConfig = {
  modelPattern: /\byi\b/i, // Match yi but not yi- in other model names
  displayName: 'Yi',
  description: '01.ai Yi models (yi, yi-chat, yi-coder, yi-large)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: false, // Determined per model
  maxContextLength: 200000, // yi-large
};

/**
 * Check if Yi model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Yi-Coder - supports function calling
  if (/yi[-_]?coder/i.test(name)) return true;

  // Yi-Large - supports function calling
  if (/yi[-_]?large/i.test(name)) return true;

  // Yi-Chat variants - support tools
  if (/yi[-_]?chat/i.test(name)) return true;

  // Yi 1.5+ with instruct
  if (/yi[-_]?1\.?5/i.test(name)) {
    return /instruct|chat/i.test(name);
  }

  // Base Yi models - no native tools
  return false;
}

/**
 * Yi model handler.
 *
 * Supports 01.ai Yi models:
 * - yi (yi-6b, yi-9b, yi-34b)
 * - yi-chat
 * - yi-coder
 * - yi-large
 *
 * Yi models are known for strong reasoning and Chinese/English bilingual support.
 * Yi-Coder and Yi-Large support function calling.
 */
export const YiModelHandler = createModelHandler('yi', yiConfig, {
  supportsToolsFn: supportsTools,
});
