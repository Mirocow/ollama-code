/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolCallData } from '../components/messages/toolcalls/ToolCall.js';
import type { ToolCallUpdate } from '../../types/chatTypes.js';
/**
 * Tool call management Hook
 * Manages tool call states and updates
 */
export declare const useToolCalls: () => {
    toolCalls: Map<string, ToolCallData>;
    inProgressToolCalls: ToolCallData[];
    completedToolCalls: ToolCallData[];
    handleToolCallUpdate: (update: ToolCallUpdate) => void;
    clearToolCalls: () => void;
};
