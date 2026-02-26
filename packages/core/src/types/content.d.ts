/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Content types for Ollama Code.
 * These types replace the @google/genai types and are compatible with Ollama API.
 */
/**
 * A text part of a message.
 */
export interface TextPart {
    text: string;
    thought?: boolean;
}
/**
 * An inline data part (images, files).
 */
export interface InlineDataPart {
    inlineData: {
        mimeType: string;
        data: string;
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
export type Part = TextPart | InlineDataPart | FunctionCallPart | FunctionResponsePart;
/**
 * Union type for parts that can be used in user messages.
 */
export type UserPart = TextPart | InlineDataPart;
/**
 * Union type for parts that can be used in model responses.
 */
export type ModelPart = TextPart | FunctionCallPart;
/**
 * A function call from the model.
 */
export interface FunctionCall {
    name: string;
    args: Record<string, unknown>;
    id?: string;
}
/**
 * A function response to send back to the model.
 */
export interface FunctionResponse {
    name: string;
    response: Record<string, unknown>;
    id?: string;
}
/**
 * Parameter schema for function declarations.
 */
export interface Schema {
    type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
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
    parts: (TextPart | InlineDataPart)[];
}
/**
 * A model/assistant message.
 */
export interface ModelContent extends Content {
    role: 'model';
    parts: (TextPart | FunctionCallPart)[];
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
export declare enum FinishReason {
    STOP = "STOP",
    MAX_TOKENS = "MAX_TOKENS",
    SAFETY = "SAFETY",
    RECITATION = "RECITATION",
    TOOL_CALLS = "TOOL_CALLS",
    ERROR = "ERROR",
    OTHER = "OTHER"
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
 */
export interface GenerateContentResponse {
    candidates: ContentCandidate[];
    usageMetadata?: UsageMetadata;
    modelVersion?: string;
    promptFeedback?: {
        blockReason?: string;
        safetyRatings?: SafetyRating[];
    };
}
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
/**
 * Parameters for embedding content.
 */
export interface EmbedContentParameters {
    model?: string;
    content: Content;
    taskType?: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING';
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
/**
 * Check if a part is a text part.
 */
export declare function isTextPart(part: Part): part is TextPart;
/**
 * Check if a part is a function call part.
 */
export declare function isFunctionCallPart(part: Part): part is FunctionCallPart;
/**
 * Check if a part is a function response part.
 */
export declare function isFunctionResponsePart(part: Part): part is FunctionResponsePart;
/**
 * Check if a part is an inline data part (image/file).
 */
export declare function isInlineDataPart(part: Part): part is InlineDataPart;
/**
 * Create a text content.
 */
export declare function textContent(role: Role, text: string): Content;
/**
 * Create a user content.
 */
export declare function userContent(text: string, ...additionalParts: UserPart[]): UserContent;
/**
 * Create a model content.
 */
export declare function modelContent(text: string, ...functionCalls: FunctionCall[]): ModelContent;
/**
 * Create a system content.
 */
export declare function systemContent(text: string): SystemContent;
/**
 * Create a tool response content.
 */
export declare function toolContent(name: string, response: Record<string, unknown>, id?: string): ToolContent;
/**
 * Union type for parts that can be in a list.
 */
export type PartListUnion = Part | Part[] | string | string[];
/**
 * Normalize a part list union to an array of parts.
 */
export declare function normalizeParts(parts: PartListUnion): Part[];
/**
 * Union type for parts in user content.
 */
export type PartUnion = UserPart | string;
