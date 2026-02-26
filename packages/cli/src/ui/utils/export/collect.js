/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
import { HistoryReplayer } from '../../../acp-integration/session/HistoryReplayer.js';
/**
 * Export session context that captures session updates into export messages.
 * Implements SessionContext to work with HistoryReplayer.
 */
class ExportSessionContext {
    sessionId;
    config;
    messages = [];
    currentMessage = null;
    activeRecordId = null;
    activeRecordTimestamp = null;
    toolCallMap = new Map();
    constructor(sessionId, config) {
        this.sessionId = sessionId;
        this.config = config;
    }
    async sendUpdate(update) {
        switch (update.sessionUpdate) {
            case 'user_message_chunk':
                this.handleMessageChunk('user', update.content);
                break;
            case 'agent_message_chunk':
                this.handleMessageChunk('assistant', update.content);
                break;
            case 'agent_thought_chunk':
                this.handleMessageChunk('assistant', update.content, 'thinking');
                break;
            case 'tool_call':
                this.flushCurrentMessage();
                this.handleToolCallStart(update);
                break;
            case 'tool_call_update':
                this.handleToolCallUpdate(update);
                break;
            case 'plan':
                this.flushCurrentMessage();
                this.handlePlanUpdate(update);
                break;
            default:
                // Ignore other update types
                break;
        }
    }
    setActiveRecordId(recordId, timestamp) {
        this.activeRecordId = recordId;
        this.activeRecordTimestamp = timestamp ?? null;
    }
    getMessageTimestamp() {
        return this.activeRecordTimestamp ?? new Date().toISOString();
    }
    getMessageUuid() {
        return this.activeRecordId ?? randomUUID();
    }
    handleMessageChunk(role, content, messageRole = role) {
        if (content.type !== 'text' || !content.text)
            return;
        // If we're starting a new message type, flush the previous one
        if (this.currentMessage &&
            (this.currentMessage.type !== role ||
                this.currentMessage.role !== messageRole)) {
            this.flushCurrentMessage();
        }
        // Add to current message or create new one
        if (this.currentMessage &&
            this.currentMessage.type === role &&
            this.currentMessage.role === messageRole) {
            this.currentMessage.parts.push({ text: content.text });
        }
        else {
            this.currentMessage = {
                type: role,
                role: messageRole,
                parts: [{ text: content.text }],
                timestamp: Date.now(),
            };
        }
    }
    handleToolCallStart(update) {
        const toolCall = {
            toolCallId: update.toolCallId,
            kind: update.kind || 'other',
            title: typeof update.title === 'string' ? update.title : update.title || '',
            status: update.status || 'pending',
            rawInput: update.rawInput,
            locations: update.locations,
            timestamp: Date.now(),
        };
        this.toolCallMap.set(update.toolCallId, toolCall);
        // Immediately add tool call to messages to preserve order
        const uuid = this.getMessageUuid();
        this.messages.push({
            uuid,
            sessionId: this.sessionId,
            timestamp: this.getMessageTimestamp(),
            type: 'tool_call',
            toolCall,
        });
    }
    handleToolCallUpdate(update) {
        const toolCall = this.toolCallMap.get(update.toolCallId);
        if (toolCall) {
            // Update the tool call in place
            if (update.status)
                toolCall.status = update.status;
            if (update.content)
                toolCall.content = update.content;
            if (update.title)
                toolCall.title = typeof update.title === 'string' ? update.title : '';
        }
    }
    handlePlanUpdate(update) {
        // Create a tool_call message for plan updates (TodoWriteTool)
        // This ensures todos appear at the correct position in the chat
        const uuid = this.getMessageUuid();
        const timestamp = this.getMessageTimestamp();
        // Format entries as markdown checklist text for UpdatedPlanToolCall.parsePlanEntries
        const todoText = update.entries
            .map((entry) => {
            const checkbox = entry.status === 'completed'
                ? '[x]'
                : entry.status === 'in_progress'
                    ? '[-]'
                    : '[ ]';
            return `- ${checkbox} ${entry.content}`;
        })
            .join('\n');
        const todoContent = [
            {
                type: 'content',
                content: {
                    type: 'text',
                    text: todoText,
                },
            },
        ];
        this.messages.push({
            uuid,
            sessionId: this.sessionId,
            timestamp,
            type: 'tool_call',
            toolCall: {
                toolCallId: uuid, // Use the same uuid as toolCallId for plan updates
                kind: 'todowrite',
                title: 'TodoWrite',
                status: 'completed',
                content: todoContent,
                timestamp: Date.parse(timestamp),
            },
        });
    }
    flushCurrentMessage() {
        if (!this.currentMessage)
            return;
        const uuid = this.getMessageUuid();
        this.messages.push({
            uuid,
            sessionId: this.sessionId,
            timestamp: this.getMessageTimestamp(),
            type: this.currentMessage.type,
            message: {
                role: this.currentMessage.role,
                parts: this.currentMessage.parts,
            },
        });
        this.currentMessage = null;
    }
    flushMessages() {
        this.flushCurrentMessage();
    }
    getMessages() {
        return this.messages;
    }
}
/**
 * Collects session data from ChatRecord[] using HistoryReplayer.
 * Returns the raw ExportSessionData (SSOT) without normalization.
 */
export async function collectSessionData(conversation, config) {
    // Create export session context
    const exportContext = new ExportSessionContext(conversation.sessionId, config);
    // Create history replayer with export context
    const replayer = new HistoryReplayer(exportContext);
    // Replay chat records to build export messages
    await replayer.replay(conversation.messages);
    // Flush any buffered messages
    exportContext.flushMessages();
    // Get the export messages
    const messages = exportContext.getMessages();
    return {
        sessionId: conversation.sessionId,
        startTime: conversation.startTime,
        messages,
    };
}
//# sourceMappingURL=collect.js.map