/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Re-export types from @google/genai for backward compatibility.
 * This module provides a single point for type imports that can be replaced later.
 */

// Core types
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

// Enums and classes
export { FinishReason, Type } from '@google/genai';

// Utility functions
export { mcpToTool } from '@google/genai';
