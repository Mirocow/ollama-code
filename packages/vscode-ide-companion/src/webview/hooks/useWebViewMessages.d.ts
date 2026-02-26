/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PermissionOption, PermissionToolCall } from '@ollama-code/webui';
import type { ToolCallUpdate, UsageStatsPayload } from '../../types/chatTypes.js';
import type { ApprovalModeValue } from '../../types/approvalModeValueTypes.js';
import type { PlanEntry } from '../../types/chatTypes.js';
import type { ModelInfo, AvailableCommand } from '../../types/acpTypes.js';
interface UseWebViewMessagesProps {
    sessionManagement: {
        currentSessionId: string | null;
        setQwenSessions: (sessions: Array<Record<string, unknown>> | ((prev: Array<Record<string, unknown>>) => Array<Record<string, unknown>>)) => void;
        setCurrentSessionId: (id: string | null) => void;
        setCurrentSessionTitle: (title: string) => void;
        setShowSessionSelector: (show: boolean) => void;
        setNextCursor: (cursor: number | undefined) => void;
        setHasMore: (hasMore: boolean) => void;
        setIsLoading: (loading: boolean) => void;
        handleSaveSessionResponse: (response: {
            success: boolean;
            message?: string;
        }) => void;
    };
    fileContext: {
        setActiveFileName: (name: string | null) => void;
        setActiveFilePath: (path: string | null) => void;
        setActiveSelection: (selection: {
            startLine: number;
            endLine: number;
        } | null) => void;
        setWorkspaceFilesFromResponse: (files: Array<{
            id: string;
            label: string;
            description: string;
            path: string;
        }>, requestId?: number) => void;
        addFileReference: (name: string, path: string) => void;
    };
    messageHandling: {
        setMessages: (messages: Array<{
            role: 'user' | 'assistant' | 'thinking';
            content: string;
            timestamp: number;
            fileContext?: {
                fileName: string;
                filePath: string;
                startLine?: number;
                endLine?: number;
            };
        }>) => void;
        addMessage: (message: {
            role: 'user' | 'assistant' | 'thinking';
            content: string;
            timestamp: number;
        }) => void;
        clearMessages: () => void;
        startStreaming: (timestamp?: number) => void;
        appendStreamChunk: (chunk: string) => void;
        endStreaming: () => void;
        breakAssistantSegment: () => void;
        appendThinkingChunk: (chunk: string) => void;
        clearThinking: () => void;
        setWaitingForResponse: (message: string) => void;
        clearWaitingForResponse: () => void;
    };
    handleToolCallUpdate: (update: ToolCallUpdate) => void;
    clearToolCalls: () => void;
    setPlanEntries: (entries: PlanEntry[]) => void;
    handlePermissionRequest: (request: {
        options: PermissionOption[];
        toolCall: PermissionToolCall;
    } | null) => void;
    inputFieldRef: React.RefObject<HTMLDivElement>;
    setInputText: (text: string) => void;
    setEditMode?: (mode: ApprovalModeValue) => void;
    setIsAuthenticated?: (authenticated: boolean | null) => void;
    setUsageStats?: (stats: UsageStatsPayload | undefined) => void;
    setModelInfo?: (info: ModelInfo | null) => void;
    setAvailableCommands?: (commands: AvailableCommand[]) => void;
    setAvailableModels?: (models: ModelInfo[]) => void;
}
/**
 * WebView message handling Hook
 * Handles all messages from VSCode Extension uniformly
 */
export declare const useWebViewMessages: ({ sessionManagement, fileContext, messageHandling, handleToolCallUpdate, clearToolCalls, setPlanEntries, handlePermissionRequest, inputFieldRef, setInputText, setEditMode, setIsAuthenticated, setUsageStats, setModelInfo, setAvailableCommands, setAvailableModels, }: UseWebViewMessagesProps) => void;
export {};
