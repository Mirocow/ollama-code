/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Re-export types from local content types.
 * This module provides a single point for type imports, replacing @google/genai.
 */

// Core types
export type {
  Content,
  Part,
  PartUnion,
  PartListUnion,
  ContentUnion,
  ContentListUnion,
  UserContent,
  ModelContent,
  SystemContent,
  ToolContent,
  FunctionDeclaration,
  FunctionCall,
  FunctionResponse,
  Schema,
  Tool,
  ToolConfig,
  SafetySetting,
  SafetyRating,
  UsageMetadata,
  GenerateContentConfig,
  GenerateContentParameters,
  GenerateContentResponse,
  GenerateContentResponseUsageMetadata,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  ContentCandidate,
  Candidate,
  CitationMetadata,
  CitationSource,
  Citation,
  CallableTool,
} from '../types/content.js';

// Re-export types from types/index.ts for convenience
export type {
  TextPart,
  InlineDataPart,
  FunctionCallPart,
  FunctionResponsePart,
  UserPart,
  ModelPart,
  Role,
} from '../types/content.js';

// Enums and classes
export { FinishReason, Type } from '../types/content.js';

// Helper functions
export {
  isTextPart,
  isFunctionCallPart,
  isFunctionResponsePart,
  isInlineDataPart,
  textContent,
  userContent,
  modelContent,
  systemContent,
  toolContent,
  normalizeParts,
  mcpToTool,
} from '../types/content.js';

// Ollama API types
export type {
  OllamaModel,
  OllamaModelDetails,
  OllamaTagsResponse,
  OllamaRunningModel,
  OllamaPsResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaChatMessage,
  OllamaToolCall,
  OllamaTool,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaModelOptions,
  OllamaEmbedRequest,
  OllamaEmbedResponse,
  OllamaEmbeddingsRequest,
  OllamaEmbeddingsResponse,
  OllamaPullRequest,
  OllamaPullResponse,
  OllamaPushRequest,
  OllamaPushResponse,
  OllamaCopyRequest,
  OllamaDeleteRequest,
  OllamaShowRequest,
  OllamaShowResponse,
  OllamaVersionResponse,
  OllamaProgressEvent,
  StreamCallback,
  ProgressCallback,
} from '../core/ollamaNativeClient.js';

export {
  DEFAULT_OLLAMA_NATIVE_URL,
  DEFAULT_OLLAMA_TIMEOUT,
  OllamaNativeClient,
  createOllamaNativeClient,
} from '../core/ollamaNativeClient.js';
