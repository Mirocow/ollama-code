/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
export class ConversationStore {
    context;
    currentConversationId = null;
    constructor(context) {
        this.context = context;
    }
    async createConversation(title = 'New Chat') {
        const conversation = {
            id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        const conversations = await this.getAllConversations();
        conversations.push(conversation);
        await this.context.globalState.update('conversations', conversations);
        this.currentConversationId = conversation.id;
        return conversation;
    }
    async getAllConversations() {
        return this.context.globalState.get('conversations', []);
    }
    async getConversation(id) {
        const conversations = await this.getAllConversations();
        return conversations.find((c) => c.id === id) || null;
    }
    async addMessage(conversationId, message) {
        const conversations = await this.getAllConversations();
        const conversation = conversations.find((c) => c.id === conversationId);
        if (conversation) {
            conversation.messages.push(message);
            conversation.updatedAt = Date.now();
            await this.context.globalState.update('conversations', conversations);
        }
    }
    async deleteConversation(id) {
        const conversations = await this.getAllConversations();
        const filtered = conversations.filter((c) => c.id !== id);
        await this.context.globalState.update('conversations', filtered);
        if (this.currentConversationId === id) {
            this.currentConversationId = null;
        }
    }
    getCurrentConversationId() {
        return this.currentConversationId;
    }
    setCurrentConversationId(id) {
        this.currentConversationId = id;
    }
}
//# sourceMappingURL=conversationStore.js.map