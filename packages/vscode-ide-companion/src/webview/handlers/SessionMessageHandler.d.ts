/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseMessageHandler } from './BaseMessageHandler.js';
/**
 * Session message handler
 * Handles all session-related messages
 */
export declare class SessionMessageHandler extends BaseMessageHandler {
    private currentStreamContent;
    private loginHandler;
    private isTitleSet;
    canHandle(messageType: string): boolean;
    /**
     * Set login handler
     */
    setLoginHandler(handler: () => Promise<void>): void;
    handle(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Get current stream content
     */
    getCurrentStreamContent(): string;
    /**
     * Append stream content
     */
    appendStreamContent(chunk: string): void;
    /**
     * Reset stream content
     */
    resetStreamContent(): void;
    /**
     * Notify the webview that streaming has finished.
     */
    private sendStreamEnd;
    /**
     * Prompt user to login and invoke the registered login handler/command.
     * Returns true if a login was initiated.
     */
    private promptLogin;
    /**
     * Prompt user to login or view offline. Returns 'login', 'offline', or 'dismiss'.
     * When login is chosen, it triggers the login handler/command.
     */
    private promptLoginOrOffline;
    /**
     * Handle send message request
     */
    private handleSendMessage;
    /**
     * Handle new Qwen session request
     */
    private handleNewQwenSession;
    /**
     * Handle switch Qwen session request
     */
    private handleSwitchQwenSession;
    /**
     * Handle get Qwen sessions request
     */
    private handleGetQwenSessions;
    /**
     * Handle save session request
     */
    private handleSaveSession;
    /**
     * Handle cancel streaming request
     */
    private handleCancelStreaming;
    /**
     * Handle resume session request
     */
    private handleResumeSession;
    /**
     * Set approval mode via agent (ACP session/set_mode)
     */
    private handleSetApprovalMode;
    /**
     * Set model via agent (ACP session/set_model)
     * Displays VSCode native notifications on success or failure.
     */
    private handleSetModel;
}
