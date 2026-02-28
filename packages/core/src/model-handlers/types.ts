/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a parsed tool call from text content.
 */
export interface ParsedToolCall {
  /** Name of the tool/function to call */
  name: string;
  /** Arguments for the tool call */
  args: Record<string, unknown>;
}

/**
 * Result of parsing tool calls from text content.
 */
export interface ToolCallParseResult {
  /** Parsed tool calls */
  toolCalls: ParsedToolCall[];
  /** Content with tool calls removed (cleaned) */
  cleanedContent: string;
}

/**
 * Configuration for a model handler.
 */
export interface ModelHandlerConfig {
  /** Model name or pattern for matching */
  modelPattern: string | RegExp;

  /** Display name for the model family */
  displayName: string;

  /** Description of the model family */
  description?: string;

  /** Whether the model supports structured tool calls via API */
  supportsStructuredToolCalls?: boolean;

  /** Whether the model may return tool calls in text format */
  supportsTextToolCalls?: boolean;

  /** Maximum context length (if known) */
  maxContextLength?: number;

  /** Custom model options */
  customOptions?: Record<string, unknown>;
}

/**
 * Interface for model-specific handlers.
 *
 * Each model family (Qwen, Llama, DeepSeek, etc.) should implement this interface
 * to provide custom parsing, formatting, and processing logic.
 *
 * @example
 * ```typescript
 * class QwenModelHandler implements IModelHandler {
 *   readonly name = 'qwen';
 *   readonly config: ModelHandlerConfig = {
 *     modelPattern: /qwen/i,
 *     displayName: 'Qwen',
 *     supportsTextToolCalls: true,
 *   };
 *
 *   canHandle(modelName: string): boolean {
 *     return this.config.modelPattern.test(modelName);
 *   }
 *
 *   parseToolCalls(content: string): ToolCallParseResult {
 *     // Qwen-specific parsing
 *   }
 * }
 * ```
 */
export interface IModelHandler {
  /**
   * Unique name identifier for this handler.
   * Used for logging and debugging.
   */
  readonly name: string;

  /**
   * Configuration for this model handler.
   */
  readonly config: ModelHandlerConfig;

  /**
   * Check if this handler can handle the given model.
   *
   * @param modelName - The model name to check (e.g., 'qwen3-coder:30b')
   * @returns true if this handler can handle the model
   */
  canHandle(modelName: string): boolean;

  /**
   * Parse tool calls from text content.
   *
   * Different models return tool calls in different text formats.
   * This method extracts tool calls from the text content.
   *
   * @param content - The text content to parse
   * @returns Parsed tool calls and cleaned content
   */
  parseToolCalls(content: string): ToolCallParseResult;

  /**
   * Optional: Pre-process request before sending to model.
   * Use this to modify the request format for specific models.
   *
   * @param request - The request to process
   * @returns Processed request
   */
  preprocessRequest?(request: unknown): unknown;

  /**
   * Optional: Post-process response from model.
   * Use this to modify the response format from specific models.
   *
   * @param response - The response to process
   * @returns Processed response
   */
  postprocessResponse?(response: unknown): unknown;

  /**
   * Optional: Get model-specific options.
   * These options will be merged with the default options.
   *
   * @returns Model-specific options
   */
  getOptions?(): Record<string, unknown>;
}

/**
 * Interface for tool call text parsers (used within model handlers).
 */
export interface IToolCallTextParser {
  /**
   * Unique name identifier for this parser.
   */
  readonly name: string;

  /**
   * Priority determines the order in which parsers are tried.
   * Lower numbers are tried first.
   */
  readonly priority?: number;

  /**
   * Quick check if this parser might be able to parse the content.
   *
   * @param content - The text content to check
   * @returns true if this parser might find tool calls
   */
  canParse(content: string): boolean;

  /**
   * Parse tool calls from the text content.
   *
   * @param content - The text content to parse
   * @returns Parsed tool calls and cleaned content
   */
  parse(content: string): ToolCallParseResult;
}
