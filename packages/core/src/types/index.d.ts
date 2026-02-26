/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Type definitions for Ollama Code.
 * These types are compatible with Ollama API and replace @google/genai types.
 */
export type { OllamaModel, OllamaModelDetails, OllamaTagsResponse, OllamaRunningModel, OllamaPsResponse, OllamaGenerateRequest, OllamaGenerateResponse, OllamaChatMessage, OllamaToolCall, OllamaTool, OllamaChatRequest, OllamaChatResponse, OllamaModelOptions, OllamaEmbedRequest, OllamaEmbedResponse, OllamaEmbeddingsRequest, OllamaEmbeddingsResponse, OllamaPullRequest, OllamaPullResponse, OllamaPushRequest, OllamaPushResponse, OllamaCopyRequest, OllamaDeleteRequest, OllamaShowRequest, OllamaShowResponse, OllamaVersionResponse, OllamaProgressEvent, StreamCallback, ProgressCallback, } from '../core/ollamaNativeClient.js';
export { DEFAULT_OLLAMA_NATIVE_URL, DEFAULT_OLLAMA_TIMEOUT, OllamaNativeClient, createOllamaNativeClient, } from '../core/ollamaNativeClient.js';
export type { TextPart, InlineDataPart, FunctionCallPart, FunctionResponsePart, Part, UserPart, ModelPart, FunctionCall, FunctionResponse, Schema, FunctionDeclaration, Tool, Role, Content, UserContent, ModelContent, SystemContent, ToolContent, GenerateContentConfig, GenerateContentParameters, ToolConfig, SafetySetting, UsageMetadata, ContentCandidate, SafetyRating, CitationMetadata, CitationSource, GenerateContentResponse, CountTokensParameters, CountTokensResponse, EmbedContentParameters, EmbedContentResponse, PartListUnion, PartUnion, } from './content.js';
export { FinishReason, isTextPart, isFunctionCallPart, isFunctionResponsePart, isInlineDataPart, textContent, userContent, modelContent, systemContent, toolContent, normalizeParts, } from './content.js';
