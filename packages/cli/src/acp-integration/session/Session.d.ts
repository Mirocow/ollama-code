/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, Part } from '@google/genai';
import type { Config, ChatRecord, StreamEvent } from '@ollama-code/ollama-code-core';
import * as acp from '../acp.js';
import type { LoadedSettings } from '../../config/settings.js';
import type { SetModeRequest, SetModeResponse, SetModelRequest, SetModelResponse } from '../schema.js';
import type { SessionContext } from './types.js';
interface ChatInterface {
    addHistory(message: Content): void;
    sendMessageStream(model: string, options: {
        message: Part[];
        config: {
            abortSignal: AbortSignal;
        };
    }, promptId: string): AsyncIterable<StreamEvent>;
}
/**
 * Session represents an active conversation session with the AI model.
 * It uses modular components for consistent event emission:
 * - HistoryReplayer for replaying past conversations
 * - ToolCallEmitter for tool-related session updates
 * - PlanEmitter for todo/plan updates
 * - SubAgentTracker for tracking sub-agent tool calls
 */
export declare class Session implements SessionContext {
    #private;
    private readonly chat;
    readonly config: Config;
    private readonly client;
    private readonly settings;
    private pendingPrompt;
    private turn;
    private readonly historyReplayer;
    private readonly toolCallEmitter;
    private readonly planEmitter;
    private readonly messageEmitter;
    readonly sessionId: string;
    constructor(id: string, chat: ChatInterface, config: Config, client: acp.Client, settings: LoadedSettings);
    getId(): string;
    getConfig(): Config;
    /**
     * Replays conversation history to the client using modular components.
     * Delegates to HistoryReplayer for consistent event emission.
     */
    replayHistory(records: ChatRecord[]): Promise<void>;
    cancelPendingPrompt(): Promise<void>;
    prompt(params: acp.PromptRequest): Promise<acp.PromptResponse>;
    sendUpdate(update: acp.SessionUpdate): Promise<void>;
    sendAvailableCommandsUpdate(): Promise<void>;
    /**
     * Requests permission from the client for a tool call.
     * Used by SubAgentTracker for sub-agent approval requests.
     */
    requestPermission(params: acp.RequestPermissionRequest): Promise<acp.RequestPermissionResponse>;
    /**
     * Sets the approval mode for the current session.
     * Maps ACP approval mode values to core ApprovalMode enum.
     */
    setMode(params: SetModeRequest): Promise<SetModeResponse>;
    /**
     * Sets the model for the current session.
     * Validates the model ID and switches the model via Config.
     */
    setModel(params: SetModelRequest): Promise<SetModelResponse>;
    /**
     * Sends a current_mode_update notification to the client.
     * Called after the agent switches modes (e.g., from exit_plan_mode tool).
     */
    private sendCurrentModeUpdateNotification;
    private runTool;
    debug(msg: string): void;
}
export {};
