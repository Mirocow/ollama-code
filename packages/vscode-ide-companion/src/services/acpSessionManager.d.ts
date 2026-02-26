/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AcpResponse } from '../types/acpTypes.js';
import type { ApprovalModeValue } from '../types/approvalModeValueTypes.js';
import type { PendingRequest } from '../types/connectionTypes.js';
import type { ChildProcess } from 'child_process';
/**
 * ACP Session Manager Class
 * Provides session initialization, authentication, creation, loading, and switching functionality
 */
export declare class AcpSessionManager {
    private sessionId;
    private isInitialized;
    /**
     * Send request to ACP server
     *
     * @param method - Request method name
     * @param params - Request parameters
     * @param child - Child process instance
     * @param pendingRequests - Pending requests map
     * @param nextRequestId - Request ID counter
     * @returns Request response
     */
    private sendRequest;
    /**
     * Send message to child process
     *
     * @param message - Request or notification message
     * @param child - Child process instance
     */
    private sendMessage;
    /**
     * Initialize ACP protocol connection
     *
     * @param child - Child process instance
     * @param pendingRequests - Pending requests map
     * @param nextRequestId - Request ID counter
     * @returns Initialization response
     */
    initialize(child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }): Promise<AcpResponse>;
    /**
     * Perform authentication
     *
     * @param methodId - Authentication method ID
     * @param child - Child process instance
     * @param pendingRequests - Pending requests map
     * @param nextRequestId - Request ID counter
     * @returns Authentication response
     */
    authenticate(methodId: string | undefined, child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }): Promise<AcpResponse>;
    /**
     * Create new session
     *
     * @param cwd - Working directory
     * @param child - Child process instance
     * @param pendingRequests - Pending requests map
     * @param nextRequestId - Request ID counter
     * @returns New session response
     */
    newSession(cwd: string, child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }): Promise<AcpResponse>;
    /**
     * Send prompt message
     *
     * @param prompt - Prompt content
     * @param child - Child process instance
     * @param pendingRequests - Pending requests map
     * @param nextRequestId - Request ID counter
     * @returns Response
     * @throws Error when there is no active session
     */
    sendPrompt(prompt: string, child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }): Promise<AcpResponse>;
    /**
     * Load existing session
     *
     * @param sessionId - Session ID
     * @param child - Child process instance
     * @param pendingRequests - Pending requests map
     * @param nextRequestId - Request ID counter
     * @returns Load response
     */
    loadSession(sessionId: string, child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }, cwd?: string): Promise<AcpResponse>;
    /**
     * Get session list
     *
     * @param child - Child process instance
     * @param pendingRequests - Pending requests map
     * @param nextRequestId - Request ID counter
     * @returns Session list response
     */
    listSessions(child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }, cwd?: string, options?: {
        cursor?: number;
        size?: number;
    }): Promise<AcpResponse>;
    /**
     * Set approval mode for current session (ACP session/set_mode)
     *
     * @param modeId - Approval mode value
     */
    setMode(modeId: ApprovalModeValue, child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }): Promise<AcpResponse>;
    /**
     * Set model for current session (ACP session/set_model)
     *
     * @param modelId - Model ID
     */
    setModel(modelId: string, child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }): Promise<AcpResponse>;
    /**
     * Switch to specified session
     *
     * @param sessionId - Session ID
     * @param nextRequestId - Request ID counter
     * @returns Switch response
     */
    switchSession(sessionId: string, nextRequestId: {
        value: number;
    }): Promise<AcpResponse>;
    /**
     * Cancel prompt generation for current session
     *
     * @param child - Child process instance
     */
    cancelSession(child: ChildProcess | null): Promise<void>;
    /**
     * Save current session
     *
     * @param tag - Save tag
     * @param child - Child process instance
     * @param pendingRequests - Pending requests map
     * @param nextRequestId - Request ID counter
     * @returns Save response
     */
    saveSession(tag: string, child: ChildProcess | null, pendingRequests: Map<number, PendingRequest<unknown>>, nextRequestId: {
        value: number;
    }): Promise<AcpResponse>;
    /**
     * Reset session manager state
     */
    reset(): void;
    /**
     * Get current session ID
     */
    getCurrentSessionId(): string | null;
    /**
     * Check if initialized
     */
    getIsInitialized(): boolean;
}
