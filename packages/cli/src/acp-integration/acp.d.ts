/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as schema from './schema.js';
export * from './schema.js';
import type { WritableStream, ReadableStream } from 'node:stream/web';
export declare class AgentSideConnection implements Client {
    #private;
    constructor(toAgent: (conn: Client) => Agent, input: WritableStream<Uint8Array>, output: ReadableStream<Uint8Array>);
    /**
     * Streams new content to the client including text, tool calls, etc.
     */
    sessionUpdate(params: schema.SessionNotification): Promise<void>;
    /**
     * Streams authentication updates (e.g. Ollama configuration) to the client.
     */
    authenticateUpdate(params: schema.AuthenticateUpdate): Promise<void>;
    /**
     * Sends a custom notification to the client.
     * Used for extension-specific notifications that are not part of the core ACP protocol.
     */
    sendCustomNotification<T>(method: string, params: T): Promise<void>;
    /**
     * Request permission before running a tool
     *
     * The agent specifies a series of permission options with different granularity,
     * and the client returns the chosen one.
     */
    requestPermission(params: schema.RequestPermissionRequest): Promise<schema.RequestPermissionResponse>;
    readTextFile(params: schema.ReadTextFileRequest): Promise<schema.ReadTextFileResponse>;
    writeTextFile(params: schema.WriteTextFileRequest): Promise<schema.WriteTextFileResponse>;
}
type Result<T> = {
    result: T;
} | {
    error: ErrorResponse;
};
type ErrorResponse = {
    code: number;
    message: string;
    data?: unknown;
    authMethods?: schema.AuthMethod[];
};
export declare class RequestError extends Error {
    code: number;
    data?: {
        details?: string;
        authMethods?: schema.AuthMethod[];
    };
    constructor(code: number, message: string, details?: string, authMethods?: schema.AuthMethod[]);
    static parseError(details?: string): RequestError;
    static invalidRequest(details?: string): RequestError;
    static methodNotFound(details?: string): RequestError;
    static invalidParams(details?: string): RequestError;
    static internalError(details?: string): RequestError;
    static authRequired(details?: string, authMethods?: schema.AuthMethod[]): RequestError;
    toResult<T>(): Result<T>;
}
export interface Client {
    requestPermission(params: schema.RequestPermissionRequest): Promise<schema.RequestPermissionResponse>;
    sessionUpdate(params: schema.SessionNotification): Promise<void>;
    authenticateUpdate(params: schema.AuthenticateUpdate): Promise<void>;
    sendCustomNotification<T>(method: string, params: T): Promise<void>;
    writeTextFile(params: schema.WriteTextFileRequest): Promise<schema.WriteTextFileResponse>;
    readTextFile(params: schema.ReadTextFileRequest): Promise<schema.ReadTextFileResponse>;
}
export interface Agent {
    initialize(params: schema.InitializeRequest): Promise<schema.InitializeResponse>;
    newSession(params: schema.NewSessionRequest): Promise<schema.NewSessionResponse>;
    loadSession?(params: schema.LoadSessionRequest): Promise<schema.LoadSessionResponse>;
    listSessions?(params: schema.ListSessionsRequest): Promise<schema.ListSessionsResponse>;
    authenticate(params: schema.AuthenticateRequest): Promise<void>;
    prompt(params: schema.PromptRequest): Promise<schema.PromptResponse>;
    cancel(params: schema.CancelNotification): Promise<void>;
    setMode?(params: schema.SetModeRequest): Promise<schema.SetModeResponse>;
    setModel?(params: schema.SetModelRequest): Promise<schema.SetModelResponse>;
}
