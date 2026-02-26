/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { OllamaAgentManager } from '../../services/ollamaAgentManager.js';
import type { ConversationStore } from '../../services/conversationStore.js';
import type { PermissionResponseMessage } from '../../types/webviewMessageTypes.js';
/**
 * Message Router
 * Routes messages to appropriate handlers
 */
export declare class MessageRouter {
    private handlers;
    private sessionHandler;
    private authHandler;
    private currentConversationId;
    private permissionHandler;
    constructor(agentManager: OllamaAgentManager, conversationStore: ConversationStore, currentConversationId: string | null, sendToWebView: (message: unknown) => void);
    /**
     * Route message to appropriate handler
     */
    route(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Set current conversation ID
     */
    setCurrentConversationId(id: string | null): void;
    /**
     * Get current conversation ID
     */
    getCurrentConversationId(): string | null;
    /**
     * Set permission handler
     */
    setPermissionHandler(handler: (message: PermissionResponseMessage) => void): void;
    /**
     * Set login handler
     */
    setLoginHandler(handler: () => Promise<void>): void;
    /**
     * Append stream content
     */
    appendStreamContent(chunk: string): void;
}
