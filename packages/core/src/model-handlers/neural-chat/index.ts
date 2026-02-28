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
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const neuralChatConfig: ModelHandlerConfig = {
  modelPattern: /neural[-_]?chat/i,
  displayName: 'Neural Chat',
  description: 'Intel Neural Chat models',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: true,
  maxContextLength: 8192,
};

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
);
