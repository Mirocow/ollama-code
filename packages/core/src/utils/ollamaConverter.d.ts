/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Converter utilities for transforming between Ollama Code types and Ollama API types.
 */
import type { Content, Part, FunctionDeclaration, Tool, GenerateContentResponse } from '../types/index.js';
import type { OllamaChatMessage, OllamaChatRequest, OllamaChatResponse, OllamaTool } from '../types/index.js';
/**
 * Convert Content[] to OllamaChatMessage[].
 * This is the main conversion function for chat requests.
 */
export declare function contentsToOllamaMessages(contents: Content[]): OllamaChatMessage[];
/**
 * Convert OllamaChatResponse to GenerateContentResponse.
 */
export declare function ollamaResponseToGenerateContentResponse(response: OllamaChatResponse): GenerateContentResponse;
/**
 * Convert Tool[] to OllamaTool[].
 */
export declare function toolsToOllamaTools(tools: Tool[]): OllamaTool[];
/**
 * Convert FunctionDeclaration to OllamaTool.
 */
export declare function functionDeclarationToOllamaTool(func: FunctionDeclaration): OllamaTool;
/**
 * Aggregator for streaming responses.
 * Collects chunks and builds the final response.
 */
export declare class StreamingResponseAggregator {
    private content;
    private toolCalls;
    private promptEvalCount;
    private evalCount;
    private totalDuration;
    private model;
    private done;
    addChunk(chunk: OllamaChatResponse): void;
    buildResponse(): OllamaChatResponse;
    buildGenerateContentResponse(): GenerateContentResponse;
}
/**
 * Convert GenerateContentParameters to OllamaChatRequest.
 */
export declare function generateParamsToOllamaRequest(params: import('../types/content.js').GenerateContentParameters, defaultModel: string): OllamaChatRequest;
/**
 * Extract all text from content parts.
 */
export declare function extractTextFromParts(parts: Part[]): string;
/**
 * Extract all text from contents.
 */
export declare function extractTextFromContents(contents: Content[]): string;
/**
 * Check if content contains function calls.
 */
export declare function hasFunctionCalls(content: Content): boolean;
/**
 * Get all function calls from content.
 */
export declare function getFunctionCalls(content: Content): import('../types/content.js').FunctionCall[];
