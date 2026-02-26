/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { SubAgentEventType, ToolConfirmationOutcome, createDebugLogger, } from '@ollama-code/ollama-code-core';
import { z } from 'zod';
import { ToolCallEmitter } from './emitters/ToolCallEmitter.js';
import { MessageEmitter } from './emitters/MessageEmitter.js';
const debugLogger = createDebugLogger('ACP_SUBAGENT_TRACKER');
const basicPermissionOptions = [
    {
        optionId: ToolConfirmationOutcome.ProceedOnce,
        name: 'Allow',
        kind: 'allow_once',
    },
    {
        optionId: ToolConfirmationOutcome.Cancel,
        name: 'Reject',
        kind: 'reject_once',
    },
];
/**
 * Tracks and emits events for sub-agent tool calls within TaskTool execution.
 *
 * Uses the unified ToolCallEmitter for consistency with normal flow
 * and history replay. Also handles permission requests for tools that
 * require user approval.
 */
export class SubAgentTracker {
    ctx;
    client;
    parentToolCallId;
    subagentType;
    toolCallEmitter;
    messageEmitter;
    toolStates = new Map();
    constructor(ctx, client, parentToolCallId, subagentType) {
        this.ctx = ctx;
        this.client = client;
        this.parentToolCallId = parentToolCallId;
        this.subagentType = subagentType;
        this.toolCallEmitter = new ToolCallEmitter(ctx);
        this.messageEmitter = new MessageEmitter(ctx);
    }
    /**
     * Gets the subagent metadata to attach to all events.
     */
    getSubagentMeta() {
        return {
            parentToolCallId: this.parentToolCallId,
            subagentType: this.subagentType,
        };
    }
    /**
     * Sets up event listeners for a sub-agent's tool events.
     *
     * @param eventEmitter - The SubAgentEventEmitter from TaskTool
     * @param abortSignal - Signal to abort tracking if parent is cancelled
     * @returns Array of cleanup functions to remove listeners
     */
    setup(eventEmitter, abortSignal) {
        const onToolCall = this.createToolCallHandler(abortSignal);
        const onToolResult = this.createToolResultHandler(abortSignal);
        const onApproval = this.createApprovalHandler(abortSignal);
        const onUsageMetadata = this.createUsageMetadataHandler(abortSignal);
        const onStreamText = this.createStreamTextHandler(abortSignal);
        eventEmitter.on(SubAgentEventType.TOOL_CALL, onToolCall);
        eventEmitter.on(SubAgentEventType.TOOL_RESULT, onToolResult);
        eventEmitter.on(SubAgentEventType.TOOL_WAITING_APPROVAL, onApproval);
        eventEmitter.on(SubAgentEventType.USAGE_METADATA, onUsageMetadata);
        eventEmitter.on(SubAgentEventType.STREAM_TEXT, onStreamText);
        return [
            () => {
                eventEmitter.off(SubAgentEventType.TOOL_CALL, onToolCall);
                eventEmitter.off(SubAgentEventType.TOOL_RESULT, onToolResult);
                eventEmitter.off(SubAgentEventType.TOOL_WAITING_APPROVAL, onApproval);
                eventEmitter.off(SubAgentEventType.USAGE_METADATA, onUsageMetadata);
                eventEmitter.off(SubAgentEventType.STREAM_TEXT, onStreamText);
                // Clean up any remaining states
                this.toolStates.clear();
            },
        ];
    }
    /**
     * Creates a handler for tool call start events.
     */
    createToolCallHandler(abortSignal) {
        return (...args) => {
            const event = args[0];
            if (abortSignal.aborted)
                return;
            // Look up tool and build invocation for metadata
            const toolRegistry = this.ctx.config.getToolRegistry();
            const tool = toolRegistry.getTool(event.name);
            let invocation;
            if (tool) {
                try {
                    invocation = tool.build(event.args);
                }
                catch (e) {
                    // If building fails, continue with defaults
                    debugLogger.warn(`Failed to build subagent tool ${event.name}:`, e);
                }
            }
            // Store tool, invocation, and args for result handling
            this.toolStates.set(event.callId, {
                tool,
                invocation,
                args: event.args,
            });
            // Use unified emitter - handles TodoWriteTool skipping internally
            void this.toolCallEmitter.emitStart({
                toolName: event.name,
                callId: event.callId,
                args: event.args,
                subagentMeta: this.getSubagentMeta(),
            });
        };
    }
    /**
     * Creates a handler for tool result events.
     */
    createToolResultHandler(abortSignal) {
        return (...args) => {
            const event = args[0];
            if (abortSignal.aborted)
                return;
            const state = this.toolStates.get(event.callId);
            // Use unified emitter - handles TodoWriteTool plan updates internally
            void this.toolCallEmitter.emitResult({
                toolName: event.name,
                callId: event.callId,
                success: event.success,
                message: event.responseParts ?? [],
                resultDisplay: event.resultDisplay,
                args: state?.args,
                subagentMeta: this.getSubagentMeta(),
            });
            // Clean up state
            this.toolStates.delete(event.callId);
        };
    }
    /**
     * Creates a handler for tool approval request events.
     */
    createApprovalHandler(abortSignal) {
        return async (...args) => {
            const event = args[0];
            if (abortSignal.aborted)
                return;
            const state = this.toolStates.get(event.callId);
            const content = [];
            // Handle edit confirmation type - show diff
            if (event.confirmationDetails.type === 'edit') {
                const editDetails = event.confirmationDetails;
                content.push({
                    type: 'diff',
                    path: editDetails.fileName,
                    oldText: editDetails.originalContent ?? '',
                    newText: editDetails.newContent,
                });
            }
            // Build permission request
            const fullConfirmationDetails = {
                ...event.confirmationDetails,
                onConfirm: async () => {
                    // Placeholder - actual response handled via event.respond
                },
            };
            const { title, locations, kind } = this.toolCallEmitter.resolveToolMetadata(event.name, state?.args);
            const params = {
                sessionId: this.ctx.sessionId,
                options: this.toPermissionOptions(fullConfirmationDetails),
                toolCall: {
                    toolCallId: event.callId,
                    status: 'pending',
                    title,
                    content,
                    locations,
                    kind,
                    rawInput: state?.args,
                },
            };
            try {
                // Request permission from client
                const output = await this.client.requestPermission(params);
                const outcome = output.outcome.outcome === 'cancelled'
                    ? ToolConfirmationOutcome.Cancel
                    : z
                        .nativeEnum(ToolConfirmationOutcome)
                        .parse(output.outcome.optionId);
                // Respond to subagent with the outcome
                await event.respond(outcome);
            }
            catch (error) {
                // If permission request fails, cancel the tool call
                debugLogger.error(`Permission request failed for subagent tool ${event.name}:`, error);
                await event.respond(ToolConfirmationOutcome.Cancel);
            }
        };
    }
    /**
     * Creates a handler for usage metadata events.
     */
    createUsageMetadataHandler(abortSignal) {
        return (...args) => {
            const event = args[0];
            if (abortSignal.aborted)
                return;
            this.messageEmitter.emitUsageMetadata(event.usage, '', event.durationMs, this.getSubagentMeta());
        };
    }
    /**
     * Creates a handler for stream text events.
     * Emits agent message or thought chunks for text content from subagent model responses.
     */
    createStreamTextHandler(abortSignal) {
        return (...args) => {
            const event = args[0];
            if (abortSignal.aborted)
                return;
            // Emit streamed text as agent message or thought based on the flag
            void this.messageEmitter.emitMessage(event.text, 'assistant', event.thought ?? false);
        };
    }
    /**
     * Converts confirmation details to permission options for the client.
     */
    toPermissionOptions(confirmation) {
        switch (confirmation.type) {
            case 'edit':
                return [
                    {
                        optionId: ToolConfirmationOutcome.ProceedAlways,
                        name: 'Allow All Edits',
                        kind: 'allow_always',
                    },
                    ...basicPermissionOptions,
                ];
            case 'exec':
                return [
                    {
                        optionId: ToolConfirmationOutcome.ProceedAlways,
                        name: `Always Allow ${confirmation.rootCommand ?? 'command'}`,
                        kind: 'allow_always',
                    },
                    ...basicPermissionOptions,
                ];
            case 'mcp':
                return [
                    {
                        optionId: ToolConfirmationOutcome.ProceedAlwaysServer,
                        name: `Always Allow ${confirmation.serverName ?? 'server'}`,
                        kind: 'allow_always',
                    },
                    {
                        optionId: ToolConfirmationOutcome.ProceedAlwaysTool,
                        name: `Always Allow ${confirmation.toolName ?? 'tool'}`,
                        kind: 'allow_always',
                    },
                    ...basicPermissionOptions,
                ];
            case 'info':
                return [
                    {
                        optionId: ToolConfirmationOutcome.ProceedAlways,
                        name: 'Always Allow',
                        kind: 'allow_always',
                    },
                    ...basicPermissionOptions,
                ];
            case 'plan':
                return [
                    {
                        optionId: ToolConfirmationOutcome.ProceedAlways,
                        name: 'Always Allow Plans',
                        kind: 'allow_always',
                    },
                    ...basicPermissionOptions,
                ];
            default: {
                // Fallback for unknown types
                return [...basicPermissionOptions];
            }
        }
    }
}
//# sourceMappingURL=SubAgentTracker.js.map