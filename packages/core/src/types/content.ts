/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Content types for Ollama Code.
 * These types replace the @google/genai types and are compatible with Ollama API.
 */

// ============================================================================
// Part Types - Components of a message
// ============================================================================

/**
 * A text part of a message.
 */
export interface TextPart {
  text: string;
  thought?: boolean; // For thinking/reasoning models
}

/**
 * An inline data part (images, files).
 */
export interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string; // base64 encoded
  };
}

/**
 * A function call part - when the model wants to call a tool.
 */
export interface FunctionCallPart {
  functionCall: FunctionCall;
}

/**
 * A function response part - the result of a tool call.
 */
export interface FunctionResponsePart {
  functionResponse: FunctionResponse;
}

/**
 * Union type for all possible parts of a message.
 */
export type Part =
  | TextPart
  | InlineDataPart
  | FunctionCallPart
  | FunctionResponsePart;

/**
 * Union type for parts that can be used in user messages.
 */
export type UserPart = TextPart | InlineDataPart;

/**
 * Union type for parts that can be used in model responses.
 */
export type ModelPart = TextPart | FunctionCallPart;

// ============================================================================
// Function/Tool Types
// ============================================================================

/**
 * A function call from the model.
 */
export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
  id?: string; // Optional ID for tool call matching
}

/**
 * A function response to send back to the model.
 */
export interface FunctionResponse {
  name: string;
  response: Record<string, unknown>;
  id?: string; // Optional ID for tool call matching
}

/**
 * Parameter schema for function declarations.
 */
export interface Schema {
  type:
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'array'
    | 'object'
    | 'null';
  description?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: string[];
  default?: unknown;
  nullable?: boolean;
  anyOf?: Schema[];
  allOf?: Schema[];
  oneOf?: Schema[];
}

/**
 * Declaration of a function/tool that the model can call.
 */
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters?: Schema;
  response?: Schema;
}

/**
 * A tool definition containing function declarations.
 */
export interface Tool {
  functionDeclarations: FunctionDeclaration[];
}

// ============================================================================
// Content Types - Messages in a conversation
// ============================================================================

/**
 * Role of a message in a conversation.
 */
export type Role = 'user' | 'model' | 'system' | 'tool';

/**
 * A message in a conversation.
 * This is the main type used throughout the codebase.
 */
export interface Content {
  role: Role;
  parts: Part[];
}

/**
 * A user message.
 */
export interface UserContent extends Content {
  role: 'user';
  parts: Array<TextPart | InlineDataPart>;
}

/**
 * A model/assistant message.
 */
export interface ModelContent extends Content {
  role: 'model';
  parts: Array<TextPart | FunctionCallPart>;
}

/**
 * A system message.
 */
export interface SystemContent extends Content {
  role: 'system';
  parts: TextPart[];
}

/**
 * A tool response message.
 */
export interface ToolContent extends Content {
  role: 'tool';
  parts: FunctionResponsePart[];
}

// ============================================================================
// Generation Types - Request/Response for generation
// ============================================================================

/**
 * Configuration for content generation.
 */
export interface GenerateContentConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  responseMimeType?: string;
  responseSchema?: Schema;
  seed?: number;
}

/**
 * Parameters for generateContent request.
 */
export interface GenerateContentParameters {
  model?: string;
  contents: Content[];
  tools?: Tool[];
  toolConfig?: ToolConfig;
  systemInstruction?: Content;
  generationConfig?: GenerateContentConfig;
  safetySettings?: SafetySetting[];
}

/**
 * Configuration for tool usage.
 */
export interface ToolConfig {
  functionCallingConfig?: {
    mode?: 'AUTO' | 'ANY' | 'NONE';
    allowedFunctionNames?: string[];
  };
}

/**
 * Safety setting (kept for API compatibility).
 */
export interface SafetySetting {
  category: string;
  threshold: string;
}

/**
 * Reason for finishing generation.
 */
export enum FinishReason {
  STOP = 'STOP',
  MAX_TOKENS = 'MAX_TOKENS',
  SAFETY = 'SAFETY',
  RECITATION = 'RECITATION',
  TOOL_CALLS = 'TOOL_CALLS',
  ERROR = 'ERROR',
  OTHER = 'OTHER',
}

/**
 * Usage metadata for a generation.
 */
export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  cachedContentTokenCount?: number;
}

/**
 * A candidate response from the model.
 */
export interface ContentCandidate {
  index: number;
  content: Content;
  finishReason?: FinishReason;
  finishMessage?: string;
  safetyRatings?: SafetyRating[];
  citationMetadata?: CitationMetadata;
}

/**
 * Safety rating for content.
 */
export interface SafetyRating {
  category: string;
  probability: string;
}

/**
 * Citation metadata for content.
 */
export interface CitationMetadata {
  citationSources: CitationSource[];
}

/**
 * A citation source.
 */
export interface CitationSource {
  uri?: string;
  startIndex?: number;
  endIndex?: number;
  license?: string;
}

/**
 * Response from generateContent.
 * This is a class to support creating new instances.
 */
export class GenerateContentResponse {
  candidates: ContentCandidate[] = [];
  usageMetadata?: UsageMetadata;
  modelVersion?: string;
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: SafetyRating[];
  };

  // Additional properties used by the converter
  responseId?: string;
  createTime?: string;

  constructor(init?: Partial<GenerateContentResponse>) {
    if (init) {
      this.candidates = init.candidates ?? [];
      this.usageMetadata = init.usageMetadata;
      this.modelVersion = init.modelVersion;
      this.promptFeedback = init.promptFeedback;
      this.responseId = init.responseId;
      this.createTime = init.createTime;
    }
  }
}

// ============================================================================
// Token Counting Types
// ============================================================================

/**
 * Parameters for counting tokens.
 */
export interface CountTokensParameters {
  model?: string;
  contents: Content[];
  tools?: Tool[];
  systemInstruction?: Content;
  generationConfig?: GenerateContentConfig;
}

/**
 * Response from counting tokens.
 */
export interface CountTokensResponse {
  totalTokens: number;
  cachedContentTokenCount?: number;
}

// ============================================================================
// Embedding Types
// ============================================================================

/**
 * Parameters for embedding content.
 */
export interface EmbedContentParameters {
  model?: string;
  content: Content;
  taskType?:
    | 'RETRIEVAL_QUERY'
    | 'RETRIEVAL_DOCUMENT'
    | 'SEMANTIC_SIMILARITY'
    | 'CLASSIFICATION'
    | 'CLUSTERING';
  title?: string;
}

/**
 * Response from embedding content.
 */
export interface EmbedContentResponse {
  embedding: {
    values: number[];
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a part is a text part.
 */
export function isTextPart(part: Part): part is TextPart {
  return 'text' in part;
}

/**
 * Check if a part is a function call part.
 */
export function isFunctionCallPart(part: Part): part is FunctionCallPart {
  return 'functionCall' in part;
}

/**
 * Check if a part is a function response part.
 */
export function isFunctionResponsePart(
  part: Part,
): part is FunctionResponsePart {
  return 'functionResponse' in part;
}

/**
 * Check if a part is an inline data part (image/file).
 */
export function isInlineDataPart(part: Part): part is InlineDataPart {
  return 'inlineData' in part;
}

/**
 * Create a text content.
 */
export function textContent(role: Role, text: string): Content {
  return { role, parts: [{ text }] };
}

/**
 * Create a user content.
 */
export function userContent(
  text: string,
  ...additionalParts: UserPart[]
): UserContent {
  return {
    role: 'user',
    parts: [{ text }, ...additionalParts],
  };
}

/**
 * Create a model content.
 */
export function modelContent(
  text: string,
  ...functionCalls: FunctionCall[]
): ModelContent {
  const parts: Array<TextPart | FunctionCallPart> = [{ text }];
  for (const fc of functionCalls) {
    parts.push({ functionCall: fc });
  }
  return { role: 'model', parts };
}

/**
 * Create a system content.
 */
export function systemContent(text: string): SystemContent {
  return { role: 'system', parts: [{ text }] };
}

/**
 * Create a tool response content.
 */
export function toolContent(
  name: string,
  response: Record<string, unknown>,
  id?: string,
): ToolContent {
  return {
    role: 'tool',
    parts: [{ functionResponse: { name, response, id } }],
  };
}

// ============================================================================
// Part List Union Types (for compatibility)
// ============================================================================

/**
 * Union type for parts that can be in a list.
 */
export type PartListUnion = Part | Part[] | string | string[];

/**
 * Normalize a part list union to an array of parts.
 */
export function normalizeParts(parts: PartListUnion): Part[] {
  if (typeof parts === 'string') {
    return [{ text: parts }];
  }
  if (Array.isArray(parts)) {
    return parts.flatMap((p) => {
      if (typeof p === 'string') {
        return [{ text: p }] as TextPart[];
      }
      return [p];
    });
  }
  return [parts];
}

/**
 * Union type for parts in user content.
 */
export type PartUnion = UserPart | string;

// ============================================================================
// Additional Compatibility Types (for @google/genai compatibility)
// ============================================================================

/**
 * Alias for ContentCandidate (for @google/genai compatibility)
 */
export type Candidate = ContentCandidate;

/**
 * Alias for CitationSource (for @google/genai compatibility)
 */
export type Citation = CitationSource;

/**
 * Union type for content.
 */
export type ContentUnion = Content | Part | string;

/**
 * Union type for content list.
 */
export type ContentListUnion =
  | Content
  | Content[]
  | Part
  | Part[]
  | string
  | string[];

/**
 * Usage metadata with additional fields (for @google/genai compatibility)
 */
export interface GenerateContentResponseUsageMetadata extends UsageMetadata {
  cachedContentTokenCount?: number;
}

/**
 * CallableTool interface for tools that need to be resolved asynchronously.
 */
export interface CallableTool {
  tool(): Promise<Tool>;
}

/**
 * Schema type enum (for @google/genai compatibility)
 */
export const Type = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  NULL: 'null',
} as const;

/**
 * Helper function to convert MCP tools to Tool format.
 * This is a placeholder for compatibility with @google/genai.
 */
export function mcpToTool(
  mcpTool: unknown,
  _options?: { timeout?: number },
): CallableTool {
  // MCP tools are already in a compatible format
  const tool: Tool =
    mcpTool && typeof mcpTool === 'object' && 'functionDeclarations' in mcpTool
      ? (mcpTool as Tool)
      : { functionDeclarations: [] };

  return {
    tool: async () => tool,
  };
}

/**
 * Create a user content from a part list union.
 */
export function createUserContent(parts: PartListUnion): UserContent {
  const normalizedParts = normalizeParts(parts);
  return {
    role: 'user',
    parts: normalizedParts as Array<TextPart | InlineDataPart>,
  };
}

/**
 * Create a model content from a part list union.
 */
export function createModelContent(parts: PartListUnion): ModelContent {
  const normalizedParts = normalizeParts(parts);
  return {
    role: 'model',
    parts: normalizedParts as Array<TextPart | FunctionCallPart>,
  };
}
