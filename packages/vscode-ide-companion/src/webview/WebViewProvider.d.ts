/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import { type ApprovalModeValue } from '../types/approvalModeValueTypes.js';
export declare class WebViewProvider {
    private context;
    private extensionUri;
    private panelManager;
    private messageHandler;
    private agentManager;
    private conversationStore;
    private disposables;
    private agentInitialized;
    private pendingPermissionRequest;
    private pendingPermissionResolve;
    private currentModeId;
    private authState;
    /** Cached available models for re-sending on webview ready */
    private cachedAvailableModels;
    constructor(context: vscode.ExtensionContext, extensionUri: vscode.Uri);
    show(): Promise<void>;
    /**
     * Attempt to restore authentication state and initialize connection
     * This is called when the webview is first shown
     */
    private attemptAuthStateRestoration;
    /**
     * Initialize agent connection and session
     * Can be called from show() or via /login command
     */
    initializeAgentConnection(options?: {
        autoAuthenticate?: boolean;
    }): Promise<void>;
    /**
     * Internal: perform actual connection/initialization (no auth locking).
     */
    private doInitializeAgentConnection;
    /**
     * Force re-login by clearing auth cache and reconnecting
     * Called when user explicitly uses /login command
     */
    forceReLogin(): Promise<void>;
    /**
     * Refresh connection without clearing auth cache
     * Called when restoring WebView after VSCode restart
     */
    refreshConnection(): Promise<void>;
    /**
     * Load messages from current Qwen session
     * Skips session restoration and creates a new session directly
     */
    private loadCurrentSessionMessages;
    /**
     * Initialize an empty conversation
     * Creates a new conversation and notifies WebView
     */
    private initializeEmptyConversation;
    /**
     * Track authentication state based on outbound messages to the webview.
     */
    private updateAuthStateFromMessage;
    /**
     * Sync important initialization state when the webview signals readiness.
     */
    private handleWebviewReady;
    /**
     * Send message to WebView
     */
    private sendMessageToWebView;
    /**
     * Whether there is a pending permission decision awaiting an option.
     */
    hasPendingPermission(): boolean;
    /** Get current ACP mode id (if known). */
    getCurrentModeId(): ApprovalModeValue | null;
    /** True if diffs/permissions should be auto-handled without prompting. */
    isAutoMode(): boolean;
    /** Used by extension to decide if diffs should be suppressed. */
    shouldSuppressDiff(): boolean;
    /**
     * Simulate selecting a permission option while a request drawer is open.
     * The choice can be a concrete optionId or a shorthand intent.
     */
    respondToPendingPermission(choice: {
        optionId: string;
    } | 'accept' | 'allow' | 'reject' | 'cancel'): void;
    /**
     * Reset agent initialization state
     * Call this when auth cache is cleared to force re-authentication
     */
    resetAgentState(): void;
    /**
     * Restore an existing WebView panel (called during VSCode restart)
     * This sets up the panel with all event listeners
     */
    restorePanel(panel: vscode.WebviewPanel): Promise<void>;
    /**
     * Get the current state for serialization
     * This is used when VSCode restarts to restore the WebView
     */
    getState(): {
        conversationId: string | null;
        agentInitialized: boolean;
    };
    /**
     * Get the current panel
     */
    getPanel(): vscode.WebviewPanel | null;
    /**
     * Restore state after VSCode restart
     */
    restoreState(state: {
        conversationId: string | null;
        agentInitialized: boolean;
    }): void;
    /**
     * Create a new session in the current panel
     * This is called when the user clicks the "New Session" button
     */
    createNewSession(): Promise<void>;
    /**
     * Dispose the WebView provider and clean up resources
     */
    dispose(): void;
}
