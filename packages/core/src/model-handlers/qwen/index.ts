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
 */
const qwenConfig: ModelHandlerConfig = {
  modelPattern: /qwen|qwq/i,
  displayName: 'Qwen',
  description: 'Alibaba Qwen models (qwen2.5, qwen3, qwq)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 128000,
};

/**
 * Check if Qwen model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Qwen2.5-Coder: all versions support tools
  if (/qwen[-_]?2\.?5[-_]?coder/i.test(name)) return true;

  // Qwen3-Coder: all versions support tools
  if (/qwen[-_]?3[-_]?coder/i.test(name)) return true;

  // Qwen3 with explicit tools tag
  if (/qwen[-_]?3[-_]?tools/i.test(name)) return true;

  // QwQ (reasoning models) - support tools
  if (/qwq/i.test(name)) return true;

  // Qwen2.5 base (not all support tools, need instruct variant)
  if (/qwen[-_]?2\.?5/i.test(name)) {
    return /instruct/i.test(name);
  }

  // Qwen3 base - most support tools
  if (/qwen[-_]?3/i.test(name)) return true;

  // Default: assume Qwen models with instruct or tools tags support tools
  return /instruct|tools/i.test(name);
}

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
export const QwenModelHandler = createModelHandler('qwen', qwenConfig, {
  supportsToolsFn: supportsTools,
});
