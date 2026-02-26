/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { MessageRouter } from './handlers/MessageRouter.js';
/**
 * MessageHandler (Refactored Version)
 * This is a lightweight wrapper class that internally uses MessageRouter and various sub-handlers
 * Maintains interface compatibility with the original code
 */
export class MessageHandler {
    router;
    constructor(agentManager, conversationStore, currentConversationId, sendToWebView) {
        this.router = new MessageRouter(agentManager, conversationStore, currentConversationId, sendToWebView);
    }
    /**
     * Route messages to the corresponding handler
     */
    async route(message) {
        await this.router.route(message);
    }
    /**
     * Set current session ID
     */
    setCurrentConversationId(id) {
        this.router.setCurrentConversationId(id);
    }
    /**
     * Get current session ID
     */
    getCurrentConversationId() {
        return this.router.getCurrentConversationId();
    }
    /**
     * Set permission handler
     */
    setPermissionHandler(handler) {
        this.router.setPermissionHandler(handler);
    }
    /**
     * Set login handler
     */
    setLoginHandler(handler) {
        this.router.setLoginHandler(handler);
    }
    /**
     * Append stream content
     */
    appendStreamContent(chunk) {
        this.router.appendStreamContent(chunk);
    }
}
//# sourceMappingURL=MessageHandler.js.map