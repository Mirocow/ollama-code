/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Re-export types from @google/genai for backward compatibility.
 * This module provides a single point for type imports that can be replaced later.
 */
export type {
  Content,
  Part,
  PartUnion,
  PartListUnion,
  ContentUnion,
  ContentListUnion,
  FunctionDeclaration,
  FunctionCall,
  FunctionResponse,
  Schema,
  Tool,
  ToolConfig,
  SafetySetting,
  SafetyRating,
  Candidate,
  CitationMetadata,
  Citation,
  UsageMetadata,
  GenerateContentResponseUsageMetadata,
  CallableTool,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentConfig,
  GenerateContentParameters,
  GenerateContentResponse,
} from '@google/genai';
export { FinishReason, Type } from '@google/genai';
export { mcpToTool } from '@google/genai';
