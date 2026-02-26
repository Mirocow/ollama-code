/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as vscode from 'vscode';
import type { ChatMessage } from '../services/ollamaAgentManager.js';
export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}
export declare class ConversationStore {
    private context;
    private currentConversationId;
    constructor(context: vscode.ExtensionContext);
    createConversation(title?: string): Promise<Conversation>;
    getAllConversations(): Promise<Conversation[]>;
    getConversation(id: string): Promise<Conversation | null>;
    addMessage(conversationId: string, message: ChatMessage): Promise<void>;
    deleteConversation(id: string): Promise<void>;
    getCurrentConversationId(): string | null;
    setCurrentConversationId(id: string): void;
}
