/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { OllamaAgentManager } from '../services/ollamaAgentManager.js';
import type { ConversationStore } from '../services/conversationStore.js';
import type { PermissionResponseMessage } from '../types/webviewMessageTypes.js';
/**
 * MessageHandler (Refactored Version)
 * This is a lightweight wrapper class that internally uses MessageRouter and various sub-handlers
 * Maintains interface compatibility with the original code
 */
export declare class MessageHandler {
    private router;
    constructor(agentManager: OllamaAgentManager, conversationStore: ConversationStore, currentConversationId: string | null, sendToWebView: (message: unknown) => void);
    /**
     * Route messages to the corresponding handler
     */
    route(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Set current session ID
     */
    setCurrentConversationId(id: string | null): void;
    /**
     * Get current session ID
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
