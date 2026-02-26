/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Type definitions for Ollama Code.
 * These types are compatible with Ollama API and replace @google/genai types.
 */

// Re-export Ollama API types from ollamaNativeClient
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

// Export content types
export type {
  TextPart,
  InlineDataPart,
  FunctionCallPart,
  FunctionResponsePart,
  Part,
  UserPart,
  ModelPart,
  FunctionCall,
  FunctionResponse,
  Schema,
  FunctionDeclaration,
  Tool,
  Role,
  Content,
  UserContent,
  ModelContent,
  SystemContent,
  ToolContent,
  GenerateContentConfig,
  GenerateContentParameters,
  ToolConfig,
  SafetySetting,
  UsageMetadata,
  ContentCandidate,
  Candidate,
  SafetyRating,
  CitationMetadata,
  CitationSource,
  Citation,
  GenerateContentResponse,
  GenerateContentResponseUsageMetadata,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  PartListUnion,
  PartUnion,
  ContentUnion,
  ContentListUnion,
  CallableTool,
} from './content.js';

export {
  FinishReason,
  Type,
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
} from './content.js';
