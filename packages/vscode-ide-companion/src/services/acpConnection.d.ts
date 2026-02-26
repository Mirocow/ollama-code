/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AcpPermissionRequest, AcpResponse, AcpSessionUpdate, AuthenticateUpdateNotification } from '../types/acpTypes.js';
import type { ApprovalModeValue } from '../types/approvalModeValueTypes.js';
/**
 * ACP Connection Handler for VSCode Extension
 *
 * This class implements the client side of the ACP (Agent Communication Protocol).
 */
export declare class AcpConnection {
    private child;
    private pendingRequests;
    private nextRequestId;
    private workingDir;
    private messageHandler;
    private sessionManager;
    onSessionUpdate: (data: AcpSessionUpdate) => void;
    onPermissionRequest: (data: AcpPermissionRequest) => Promise<{
        optionId: string;
    }>;
    onAuthenticateUpdate: (data: AuthenticateUpdateNotification) => void;
    onEndTurn: () => void;
    onInitialized: (init: unknown) => void;
    constructor();
    /**
     * Connect to Ollama ACP
     *
     * @param cliEntryPath - Path to the bundled CLI entrypoint (cli.js)
     * @param workingDir - Working directory
     * @param extraArgs - Extra command line arguments
     */
    connect(cliEntryPath: string, workingDir?: string, extraArgs?: string[]): Promise<void>;
    /**
     * Set up child process handlers
     */
    private setupChildProcessHandlers;
    /**
     * Handle received messages
     *
     * @param message - ACP message
     */
    private handleMessage;
    /**
     * Authenticate
     *
     * @param methodId - Authentication method ID
     * @returns Authentication response
     */
    authenticate(methodId?: string): Promise<AcpResponse>;
    /**
     * Create new session
     *
     * @param cwd - Working directory
     * @returns New session response
     */
    newSession(cwd?: string): Promise<AcpResponse>;
    /**
     * Send prompt message
     *
     * @param prompt - Prompt content
     * @returns Response
     */
    sendPrompt(prompt: string): Promise<AcpResponse>;
    /**
     * Load existing session
     *
     * @param sessionId - Session ID
     * @returns Load response
     */
    loadSession(sessionId: string, cwdOverride?: string): Promise<AcpResponse>;
    /**
     * Get session list
     *
     * @returns Session list response
     */
    listSessions(options?: {
        cursor?: number;
        size?: number;
    }): Promise<AcpResponse>;
    /**
     * Switch to specified session
     *
     * @param sessionId - Session ID
     * @returns Switch response
     */
    switchSession(sessionId: string): Promise<AcpResponse>;
    /**
     * Cancel current session prompt generation
     */
    cancelSession(): Promise<void>;
    /**
     * Save current session
     *
     * @param tag - Save tag
     * @returns Save response
     */
    saveSession(tag: string): Promise<AcpResponse>;
    /**
     * Set approval mode
     */
    setMode(modeId: ApprovalModeValue): Promise<AcpResponse>;
    /**
     * Set model for current session
     *
     * @param modelId - Model ID
     * @returns Set model response
     */
    setModel(modelId: string): Promise<AcpResponse>;
    /**
     * Disconnect
     */
    disconnect(): void;
    /**
     * Check if connected
     */
    get isConnected(): boolean;
    /**
     * Check if there is an active session
     */
    get hasActiveSession(): boolean;
    /**
     * Get current session ID
     */
    get currentSessionId(): string | null;
}
