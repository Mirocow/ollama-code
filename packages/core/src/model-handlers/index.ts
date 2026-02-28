/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Model Handlers
 *
 * This module provides a pluggable architecture for handling different AI models.
 * Each model family (Qwen, Llama, DeepSeek, etc.) has its own handler that knows
 * how to parse tool calls from text output.
 *
 * For model capabilities (tools, vision, thinking), use model-definitions module.
 *
 * @example Basic usage
 * ```typescript
 * import { getModelHandlerFactory } from './model-handlers';
 * import { getModelCapabilities } from './model-definitions';
 *
 * const factory = getModelHandlerFactory();
 * const handler = factory.getHandler('qwen3-coder:30b');
 * const result = handler.parseToolCalls(content);
 *
 * const caps = getModelCapabilities('qwen3-coder:30b');
 * console.log(caps.tools, caps.thinking);
 * ```
 *
 * @see ./README.md for detailed documentation
 */

// Types
export type {
  IModelHandler,
  IToolCallTextParser,
  ToolCallParseResult,
  ParsedToolCall,
  ModelHandlerConfig,
} from './types.js';

// Base classes
export {
  BaseModelHandler,
  BaseToolCallParser,
  createModelHandler,
} from './baseModelHandler.js';

// Utility functions for custom parsers
export {
  findMatchingBrace,
  findMatchingBracket,
  tryParseJsonAt,
  tryParseArrayAt,
  extractToolCall,
  hasToolCall,
} from './utils/parserUtils.js';

// Factory
export {
  ModelHandlerFactory,
  getModelHandlerFactory,
  resetModelHandlerFactory,
} from './modelHandlerFactory.js';

// Default handler
export { DefaultModelHandler } from './default/index.js';
export { defaultParsers } from './default/parsers.js';

// Model-specific handlers
export { QwenModelHandler } from './qwen/index.js';
export { qwenParsers } from './qwen/parsers.js';

export { LlamaModelHandler } from './llama/index.js';
export { llamaParsers } from './llama/parsers.js';

export { DeepSeekModelHandler } from './deepseek/index.js';
export { deepseekParsers } from './deepseek/parsers.js';

export { MistralModelHandler } from './mistral/index.js';
export { mistralParsers } from './mistral/parsers.js';

export { GemmaModelHandler } from './gemma/index.js';
export { gemmaParsers } from './gemma/parsers.js';

export { PhiModelHandler } from './phi/index.js';
export { phiParsers } from './phi/parsers.js';

export { CommandModelHandler } from './command/index.js';
export { commandParsers } from './command/parsers.js';

export { YiModelHandler } from './yi/index.js';
export { yiParsers } from './yi/parsers.js';

export { LlavaModelHandler } from './llava/index.js';
export { llavaParsers } from './llava/parsers.js';

export { SolarModelHandler } from './solar/index.js';
export { solarParsers } from './solar/parsers.js';

export { StarCoderModelHandler } from './starcoder/index.js';
export { starcoderParsers } from './starcoder/parsers.js';

export { DbrxModelHandler } from './dbrx/index.js';
export { dbrxParsers } from './dbrx/parsers.js';

export { GraniteModelHandler } from './granite/index.js';
export { graniteParsers } from './granite/parsers.js';

export { OlmoModelHandler } from './olmo/index.js';
export { olmoParsers } from './olmo/parsers.js';

export { NeuralChatModelHandler } from './neural-chat/index.js';
export { neuralChatParsers } from './neural-chat/parsers.js';
