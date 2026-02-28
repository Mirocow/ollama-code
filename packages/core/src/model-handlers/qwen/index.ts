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
 * Qwen model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const qwenConfig: ModelHandlerConfig = {
  modelPattern: /qwen|qwq/i,
  displayName: 'Qwen',
  description: 'Alibaba Qwen models (qwen2.5, qwen3, qwq)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 128000,
};

/**
 * Qwen model handler.
 *
 * Supports Qwen models from Alibaba:
 * - qwen2.5-coder
 * - qwen3-coder
 * - qwen3
 * - qwq
 *
 * Qwen models may return tool calls in:
 * - Structured format (tool_calls field)
 * - Text format: <tool_call=...>
 * - Text format inside <think...> tags (Qwen3)
 */
export const QwenModelHandler = createModelHandler('qwen', qwenConfig);
