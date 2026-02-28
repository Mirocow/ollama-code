/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Model Definitions - Unified module for model capabilities.
 *
 * This module provides a single source of truth for model capabilities
 * and replaces the split between `models/` and `model-handlers/`.
 *
 * @example
 * ```typescript
 * import { getModelCapabilities, supportsTools } from './model-definitions';
 *
 * const caps = getModelCapabilities('qwen3-coder:30b');
 * // { tools: true, vision: false, thinking: false, structuredOutput: true }
 *
 * if (supportsTools('qwen3-coder:30b')) {
 *   // Enable tool calling
 * }
 * ```
 */

// Types
export type {
  ModelCapabilities,
  ModelDefinition,
  ModelFamilyDefinition,
  OutputFormat,
} from './types.js';

// Registry
export {
  MODEL_FAMILIES,
  findModelFamily,
  getModelCapabilities,
  getModelDefinition,
  getOutputFormat,
  supportsThinking,
  supportsTools,
  supportsVision,
} from './registry.js';
