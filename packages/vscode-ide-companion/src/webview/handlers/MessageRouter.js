/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SessionMessageHandler } from './SessionMessageHandler.js';
import { FileMessageHandler } from './FileMessageHandler.js';
import { EditorMessageHandler } from './EditorMessageHandler.js';
import { AuthMessageHandler } from './AuthMessageHandler.js';
/**
 * Message Router
 * Routes messages to appropriate handlers
 */
export class MessageRouter {
    handlers = [];
    sessionHandler;
    authHandler;
    currentConversationId = null;
    permissionHandler = null;
    constructor(agentManager, conversationStore, currentConversationId, sendToWebView) {
        this.currentConversationId = currentConversationId;
        // Initialize all handlers
        this.sessionHandler = new SessionMessageHandler(agentManager, conversationStore, currentConversationId, sendToWebView);
        const fileHandler = new FileMessageHandler(agentManager, conversationStore, currentConversationId, sendToWebView);
        const editorHandler = new EditorMessageHandler(agentManager, conversationStore, currentConversationId, sendToWebView);
        this.authHandler = new AuthMessageHandler(agentManager, conversationStore, currentConversationId, sendToWebView);
        // Register handlers in order of priority
        this.handlers = [
            this.sessionHandler,
            fileHandler,
            editorHandler,
            this.authHandler,
        ];
    }
    /**
     * Route message to appropriate handler
     */
    async route(message) {
        console.log('[MessageRouter] Routing message:', message.type);
        // Handle permission response specially
        if (message.type === 'permissionResponse') {
            if (this.permissionHandler) {
                this.permissionHandler(message);
            }
            return;
        }
        // Find appropriate handler
        const handler = this.handlers.find((h) => h.canHandle(message.type));
        if (handler) {
            try {
                await handler.handle(message);
            }
            catch (error) {
                console.error('[MessageRouter] Handler error:', error);
                throw error;
            }
        }
        else {
            console.warn('[MessageRouter] No handler found for message type:', message.type);
        }
    }
    /**
     * Set current conversation ID
     */
    setCurrentConversationId(id) {
        this.currentConversationId = id;
        // Update all handlers
        this.handlers.forEach((handler) => {
            if ('setCurrentConversationId' in handler) {
                handler.setCurrentConversationId(id);
            }
        });
    }
    /**
     * Get current conversation ID
     */
    getCurrentConversationId() {
        return this.currentConversationId;
    }
    /**
     * Set permission handler
     */
    setPermissionHandler(handler) {
        this.permissionHandler = handler;
    }
    /**
     * Set login handler
     */
    setLoginHandler(handler) {
        this.authHandler.setLoginHandler(handler);
        this.sessionHandler?.setLoginHandler?.(handler);
    }
    /**
     * Append stream content
     */
    appendStreamContent(chunk) {
        this.sessionHandler.appendStreamContent(chunk);
    }
}
//# sourceMappingURL=MessageRouter.js.map