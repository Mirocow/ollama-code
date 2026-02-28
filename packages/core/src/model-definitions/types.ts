/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified model capabilities - single source of truth.
 */
export interface ModelCapabilities {
  /** Supports function calling / tools */
  tools: boolean;
  /** Supports vision / image inputs */
  vision: boolean;
  /** Supports thinking / reasoning (outputs <think...> tags) */
  thinking: boolean;
  /** Supports structured JSON output */
  structuredOutput: boolean;
}

/**
 * Output format for tool calls.
 */
export type OutputFormat =
  | 'native' // Native Ollama tool_calls format
  | 'qwen' // <tool_call=...>
  | 'mistral' // [TOOL_CALLS] [...]
  | 'phi' // <function_call>...</function_call>
  | 'deepseek' // <think...> + <tool_call=...>
  | 'auto'; // Auto-detect

/**
 * Model family definition - declarative configuration.
 */
export interface ModelFamilyDefinition {
  /** Family identifier (e.g., 'qwen', 'llama', 'deepseek') */
  id: string;

  /** Display name */
  displayName: string;

  /** Description */
  description?: string;

  /** Regex pattern to match model names */
  pattern: RegExp;

  /** Default capabilities for this family */
  defaultCapabilities: Partial<ModelCapabilities>;

  /** Default output format for this family */
  defaultOutputFormat: OutputFormat;

  /** Model-specific capability overrides */
  modelOverrides?: Array<{
    pattern: RegExp;
    capabilities: Partial<ModelCapabilities>;
  }>;

  /** Custom capability detection function */
  detectCapabilities?: (modelName: string) => Partial<ModelCapabilities> | null;
}

/**
 * Full model definition with resolved capabilities.
 */
export interface ModelDefinition {
  /** Model name as provided */
  modelName: string;

  /** Matched family */
  family: ModelFamilyDefinition;

  /** Resolved capabilities */
  capabilities: ModelCapabilities;

  /** Output format */
  outputFormat: OutputFormat;
}
