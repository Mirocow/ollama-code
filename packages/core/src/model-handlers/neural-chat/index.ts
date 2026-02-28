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
 * Neural Chat model handler configuration.
 */
const neuralChatConfig: ModelHandlerConfig = {
  modelPattern: /neural[-_]?chat/i,
  displayName: 'Neural Chat',
  description: 'Intel Neural Chat models',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 8192,
};

/**
 * Check if Neural Chat model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();
  // Neural Chat v3+ supports tools
  if (/neural[-_]?chat.*v[-_]?3/i.test(name)) return true;
  return false;
}

/**
 * Neural Chat model handler.
 *
 * Supports Intel Neural Chat models:
 * - neural-chat, neural-chat-7b, neural-chat-v3
 *
 * Neural Chat is a fine-tuned model from Intel optimized for
 * conversational AI and chat applications.
 */
export const NeuralChatModelHandler = createModelHandler(
  'neural-chat',
  neuralChatConfig,
  {
    supportsToolsFn: supportsTools,
  },
);
