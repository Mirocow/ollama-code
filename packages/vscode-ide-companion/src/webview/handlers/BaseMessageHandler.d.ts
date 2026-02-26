/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { OllamaAgentManager } from '../../services/ollamaAgentManager.js';
import type { ConversationStore } from '../../services/conversationStore.js';
/**
 * Base message handler interface
 * All sub-handlers should implement this interface
 */
export interface IMessageHandler {
    /**
     * Handle message
     * @param message - Message object
     * @returns Promise<void>
     */
    handle(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Check if this handler can handle the message type
     * @param messageType - Message type
     * @returns boolean
     */
    canHandle(messageType: string): boolean;
}
/**
 * Base message handler class
 * Provides common dependency injection and helper methods
 */
export declare abstract class BaseMessageHandler implements IMessageHandler {
    protected agentManager: OllamaAgentManager;
    protected conversationStore: ConversationStore;
    protected currentConversationId: string | null;
    protected sendToWebView: (message: unknown) => void;
    constructor(agentManager: OllamaAgentManager, conversationStore: ConversationStore, currentConversationId: string | null, sendToWebView: (message: unknown) => void);
    abstract handle(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    abstract canHandle(messageType: string): boolean;
    /**
     * Update current conversation ID
     */
    setCurrentConversationId(id: string | null): void;
    /**
     * Get current conversation ID
     */
    getCurrentConversationId(): string | null;
}
