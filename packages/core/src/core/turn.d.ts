/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part, PartListUnion, GenerateContentResponse, FunctionDeclaration, FinishReason, GenerateContentResponseUsageMetadata } from '@google/genai';
import type { ToolCallConfirmationDetails, ToolResult, ToolResultDisplay } from '../tools/tools.js';
import type { ToolErrorType } from '../tools/tool-error.js';
import type { OllamaChat } from './ollamaChat.js';
import type { RetryInfo } from '../utils/rateLimit.js';
import { type ThoughtSummary } from '../utils/thoughtUtils.js';
export interface ServerTool {
    name: string;
    schema: FunctionDeclaration;
    execute(params: Record<string, unknown>, signal?: AbortSignal): Promise<ToolResult>;
    shouldConfirmExecute(params: Record<string, unknown>, abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails | false>;
}
export declare enum OllamaEventType {
    Content = "content",
    ToolCallRequest = "tool_call_request",
    ToolCallResponse = "tool_call_response",
    ToolCallConfirmation = "tool_call_confirmation",
    UserCancelled = "user_cancelled",
    Error = "error",
    ChatCompressed = "chat_compressed",
    Thought = "thought",
    MaxSessionTurns = "max_session_turns",
    SessionTokenLimitExceeded = "session_token_limit_exceeded",
    Finished = "finished",
    LoopDetected = "loop_detected",
    Citation = "citation",
    Retry = "retry"
}
export type ServerOllamaRetryEvent = {
    type: OllamaEventType.Retry;
    retryInfo?: RetryInfo;
};
export interface StructuredError {
    message: string;
    status?: number;
}
export interface OllamaErrorEventValue {
    error: StructuredError;
}
export interface SessionTokenLimitExceededValue {
    currentTokens: number;
    limit: number;
    message: string;
}
export interface OllamaFinishedEventValue {
    reason: FinishReason | undefined;
    usageMetadata: GenerateContentResponseUsageMetadata | undefined;
}
export interface ToolCallRequestInfo {
    callId: string;
    name: string;
    args: Record<string, unknown>;
    isClientInitiated: boolean;
    prompt_id: string;
    response_id?: string;
}
export interface ToolCallResponseInfo {
    callId: string;
    responseParts: Part[];
    resultDisplay: ToolResultDisplay | undefined;
    error: Error | undefined;
    errorType: ToolErrorType | undefined;
    outputFile?: string | undefined;
    contentLength?: number;
}
export interface ServerToolCallConfirmationDetails {
    request: ToolCallRequestInfo;
    details: ToolCallConfirmationDetails;
}
export type ServerOllamaContentEvent = {
    type: OllamaEventType.Content;
    value: string;
};
export type ServerOllamaThoughtEvent = {
    type: OllamaEventType.Thought;
    value: ThoughtSummary;
};
export type ServerOllamaToolCallRequestEvent = {
    type: OllamaEventType.ToolCallRequest;
    value: ToolCallRequestInfo;
};
export type ServerOllamaToolCallResponseEvent = {
    type: OllamaEventType.ToolCallResponse;
    value: ToolCallResponseInfo;
};
export type ServerOllamaToolCallConfirmationEvent = {
    type: OllamaEventType.ToolCallConfirmation;
    value: ServerToolCallConfirmationDetails;
};
export type ServerOllamaUserCancelledEvent = {
    type: OllamaEventType.UserCancelled;
};
export type ServerOllamaErrorEvent = {
    type: OllamaEventType.Error;
    value: OllamaErrorEventValue;
};
export declare enum CompressionStatus {
    /** The compression was successful */
    COMPRESSED = 1,
    /** The compression failed due to the compression inflating the token count */
    COMPRESSION_FAILED_INFLATED_TOKEN_COUNT = 2,
    /** The compression failed due to an error counting tokens */
    COMPRESSION_FAILED_TOKEN_COUNT_ERROR = 3,
    /** The compression failed due to receiving an empty or null summary */
    COMPRESSION_FAILED_EMPTY_SUMMARY = 4,
    /** The compression was not necessary and no action was taken */
    NOOP = 5
}
export interface ChatCompressionInfo {
    originalTokenCount: number;
    newTokenCount: number;
    compressionStatus: CompressionStatus;
}
export type ServerOllamaChatCompressedEvent = {
    type: OllamaEventType.ChatCompressed;
    value: ChatCompressionInfo | null;
};
export type ServerOllamaMaxSessionTurnsEvent = {
    type: OllamaEventType.MaxSessionTurns;
};
export type ServerOllamaSessionTokenLimitExceededEvent = {
    type: OllamaEventType.SessionTokenLimitExceeded;
    value: SessionTokenLimitExceededValue;
};
export type ServerOllamaFinishedEvent = {
    type: OllamaEventType.Finished;
    value: OllamaFinishedEventValue;
};
export type ServerOllamaLoopDetectedEvent = {
    type: OllamaEventType.LoopDetected;
};
export type ServerOllamaCitationEvent = {
    type: OllamaEventType.Citation;
    value: string;
};
export type ServerOllamaStreamEvent = ServerOllamaChatCompressedEvent | ServerOllamaCitationEvent | ServerOllamaContentEvent | ServerOllamaErrorEvent | ServerOllamaFinishedEvent | ServerOllamaLoopDetectedEvent | ServerOllamaMaxSessionTurnsEvent | ServerOllamaThoughtEvent | ServerOllamaToolCallConfirmationEvent | ServerOllamaToolCallRequestEvent | ServerOllamaToolCallResponseEvent | ServerOllamaUserCancelledEvent | ServerOllamaSessionTokenLimitExceededEvent | ServerOllamaRetryEvent;
export declare class Turn {
    private readonly chat;
    private readonly prompt_id;
    readonly pendingToolCalls: ToolCallRequestInfo[];
    private debugResponses;
    private pendingCitations;
    finishReason: FinishReason | undefined;
    private currentResponseId?;
    constructor(chat: OllamaChat, prompt_id: string);
    run(model: string, req: PartListUnion, signal: AbortSignal): AsyncGenerator<ServerOllamaStreamEvent>;
    private handlePendingFunctionCall;
    getDebugResponses(): GenerateContentResponse[];
}
