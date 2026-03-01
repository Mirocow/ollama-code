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
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const yiConfig: ModelHandlerConfig = {
  modelPattern: /\byi\b/i,
  displayName: 'Yi',
  description: '01.ai Yi models (yi, yi-chat, yi-coder, yi-large)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 200000,
};

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
export const YiModelHandler = createModelHandler('yi', yiConfig);
