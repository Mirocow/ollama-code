import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect, } from 'react';
import { useVSCode } from './hooks/useVSCode.js';
import { useSessionManagement } from './hooks/session/useSessionManagement.js';
import { useFileContext } from './hooks/file/useFileContext.js';
import { useMessageHandling } from './hooks/message/useMessageHandling.js';
import { useToolCalls } from './hooks/useToolCalls.js';
import { useWebViewMessages } from './hooks/useWebViewMessages.js';
import { useMessageSubmit } from './hooks/useMessageSubmit.js';
import { ToolCall } from './components/messages/toolcalls/ToolCall.js';
import { hasToolCallOutput } from './utils/utils.js';
import { Onboarding } from './components/layout/Onboarding.js';
import { useCompletionTrigger } from './hooks/useCompletionTrigger.js';
import { AssistantMessage, UserMessage, ThinkingMessage, WaitingMessage, InterruptedMessage, FileIcon, PermissionDrawer, 
// Layout components imported directly from webui
EmptyState, ChatHeader, SessionSelector, } from '@ollama-code/webui';
import { InputForm } from './components/layout/InputForm.js';
import { ApprovalMode, NEXT_APPROVAL_MODE } from '../types/acpTypes.js';
import { DEFAULT_TOKEN_LIMIT, tokenLimit, } from '@ollama-code/ollama-code-core/src/core/tokenLimits.js';
export const App = () => {
    const vscode = useVSCode();
    // Core hooks
    const sessionManagement = useSessionManagement(vscode);
    const fileContext = useFileContext(vscode);
    const messageHandling = useMessageHandling();
    const { inProgressToolCalls, completedToolCalls, handleToolCallUpdate, clearToolCalls, } = useToolCalls();
    // UI state
    const [inputText, setInputText] = useState('');
    const [permissionRequest, setPermissionRequest] = useState(null);
    const [planEntries, setPlanEntries] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Track if we're still initializing/loading
    const [modelInfo, setModelInfo] = useState(null);
    const [usageStats, setUsageStats] = useState(null);
    const [availableCommands, setAvailableCommands] = useState([]);
    const [availableModels, setAvailableModels] = useState([]);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const messagesEndRef = useRef(null);
    // Scroll container for message list; used to keep the view anchored to the latest content
    const messagesContainerRef = useRef(null);
    const inputFieldRef = useRef(null);
    const [editMode, setEditMode] = useState(ApprovalMode.DEFAULT);
    const [thinkingEnabled, setThinkingEnabled] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    // When true, do NOT auto-attach the active editor file/selection to message context
    const [skipAutoActiveContext, setSkipAutoActiveContext] = useState(false);
    // Completion system
    const getCompletionItems = React.useCallback(async (trigger, query) => {
        if (trigger === '@') {
            console.log('[App] getCompletionItems @ called', {
                query,
                requested: fileContext.hasRequestedFiles,
                workspaceFiles: fileContext.workspaceFiles.length,
            });
            // Always trigger request based on current query, let the hook decide if an actual request is needed
            fileContext.requestWorkspaceFiles(query);
            const fileIcon = _jsx(FileIcon, {});
            const allItems = fileContext.workspaceFiles.map((file) => ({
                id: file.id,
                label: file.label,
                description: file.description,
                type: 'file',
                icon: fileIcon,
                // Insert filename after @, keep path for mapping
                value: file.label,
                path: file.path,
            }));
            if (query && query.length >= 1) {
                const lowerQuery = query.toLowerCase();
                return allItems.filter((item) => item.label.toLowerCase().includes(lowerQuery) ||
                    (item.description &&
                        item.description.toLowerCase().includes(lowerQuery)));
            }
            // If first time and still loading, show a placeholder
            if (allItems.length === 0) {
                return [
                    {
                        id: 'loading-files',
                        label: 'Searching files…',
                        description: 'Type to filter, or wait a moment…',
                        type: 'info',
                    },
                ];
            }
            return allItems;
        }
        else {
            // Handle slash commands with grouping
            // Model group - special items without / prefix
            const modelGroupItems = [
                {
                    id: 'model',
                    label: 'Switch model...',
                    description: modelInfo?.name || 'Default',
                    type: 'command',
                    group: 'Model',
                },
            ];
            // Account group
            const accountGroupItems = [
                {
                    id: 'login',
                    label: 'Login',
                    description: 'Login to Qwen Code',
                    type: 'command',
                    group: 'Account',
                },
            ];
            // Slash Commands group - commands from server (available_commands_update)
            const slashCommandItems = availableCommands.map((cmd) => ({
                id: cmd.name,
                label: `/${cmd.name}`,
                description: cmd.description,
                type: 'command',
                group: 'Slash Commands',
            }));
            // Combine all commands
            const allCommands = [
                ...modelGroupItems,
                ...accountGroupItems,
                ...slashCommandItems,
            ];
            // Filter by query
            const lowerQuery = query.toLowerCase();
            return allCommands.filter((cmd) => cmd.label.toLowerCase().includes(lowerQuery) ||
                (cmd.description &&
                    cmd.description.toLowerCase().includes(lowerQuery)));
        }
    }, [fileContext, availableCommands, modelInfo?.name]);
    const completion = useCompletionTrigger(inputFieldRef, getCompletionItems);
    const contextUsage = useMemo(() => {
        if (!usageStats && !modelInfo) {
            return null;
        }
        const modelName = modelInfo?.modelId && typeof modelInfo.modelId === 'string'
            ? modelInfo.modelId
            : modelInfo?.name && typeof modelInfo.name === 'string'
                ? modelInfo.name
                : undefined;
        // Note: In the webview context, the contextWindowSize is already reflected in
        // modelInfo._meta.contextLimit which is computed on the extension side with the proper config.
        // We only use tokenLimit as a fallback if metaLimit is not available.
        const derivedLimit = modelName && modelName.length > 0
            ? tokenLimit(modelName, 'input')
            : undefined;
        const metaLimitRaw = modelInfo?._meta?.['contextLimit'];
        const metaLimit = typeof metaLimitRaw === 'number' || metaLimitRaw === null
            ? metaLimitRaw
            : undefined;
        const limit = usageStats?.tokenLimit ??
            metaLimit ??
            derivedLimit ??
            DEFAULT_TOKEN_LIMIT;
        const used = usageStats?.usage?.promptTokens ?? 0;
        if (typeof limit !== 'number' || limit <= 0 || used < 0) {
            return null;
        }
        const percentLeft = Math.max(0, Math.min(100, Math.round(((limit - used) / limit) * 100)));
        return {
            percentLeft,
            usedTokens: used,
            tokenLimit: limit,
        };
    }, [usageStats, modelInfo]);
    // Track a lightweight signature of workspace files to detect content changes even when length is unchanged
    const workspaceFilesSignature = useMemo(() => fileContext.workspaceFiles
        .map((file) => `${file.id}|${file.label}|${file.description ?? ''}|${file.path}`)
        .join('||'), [fileContext.workspaceFiles]);
    // When workspace files update while menu open for @, refresh items to reflect latest search results.
    // Note: Avoid depending on the entire `completion` object here, since its identity
    // changes on every render which would retrigger this effect and can cause a refresh loop.
    useEffect(() => {
        if (completion.isOpen && completion.triggerChar === '@') {
            // Only refresh items; do not change other completion state to avoid re-renders loops
            completion.refreshCompletion();
        }
        // Only re-run when the actual data source changes, not on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        workspaceFilesSignature,
        completion.isOpen,
        completion.triggerChar,
        completion.query,
    ]);
    // Message submission
    const { handleSubmit: submitMessage } = useMessageSubmit({
        inputText,
        setInputText,
        messageHandling,
        fileContext,
        skipAutoActiveContext,
        vscode,
        inputFieldRef,
        isStreaming: messageHandling.isStreaming,
        isWaitingForResponse: messageHandling.isWaitingForResponse,
    });
    // Handle cancel/stop from the input bar
    // Emit a cancel to the extension and immediately reflect interruption locally.
    const handleCancel = useCallback(() => {
        if (messageHandling.isStreaming || messageHandling.isWaitingForResponse) {
            // Proactively end local states and add an 'Interrupted' line
            try {
                messageHandling.endStreaming?.();
            }
            catch {
                /* no-op */
            }
            try {
                messageHandling.clearWaitingForResponse?.();
            }
            catch {
                /* no-op */
            }
            messageHandling.addMessage({
                role: 'assistant',
                content: 'Interrupted',
                timestamp: Date.now(),
            });
        }
        // Notify extension/agent to cancel server-side work
        vscode.postMessage({
            type: 'cancelStreaming',
            data: {},
        });
    }, [messageHandling, vscode]);
    // Message handling
    useWebViewMessages({
        sessionManagement,
        fileContext,
        messageHandling,
        handleToolCallUpdate,
        clearToolCalls,
        setPlanEntries,
        handlePermissionRequest: setPermissionRequest,
        inputFieldRef,
        setInputText,
        setEditMode,
        setIsAuthenticated,
        setUsageStats: (stats) => setUsageStats(stats ?? null),
        setModelInfo: (info) => {
            setModelInfo(info);
        },
        setAvailableCommands: (commands) => {
            setAvailableCommands(commands);
        },
        setAvailableModels: (models) => {
            setAvailableModels(models);
        },
    });
    // Auto-scroll handling: keep the view pinned to bottom when new content arrives,
    // but don't interrupt the user if they scrolled up.
    // We track whether the user is currently "pinned" to the bottom (near the end).
    const [pinnedToBottom, setPinnedToBottom] = useState(true);
    const prevCountsRef = useRef({ msgLen: 0, inProgLen: 0, doneLen: 0 });
    // Observe scroll position to know if user has scrolled away from the bottom.
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) {
            return;
        }
        const onScroll = () => {
            // Use a small threshold so slight deltas don't flip the state.
            // Note: there's extra bottom padding for the input area, so keep this a bit generous.
            const threshold = 80; // px tolerance
            const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
            setPinnedToBottom(distanceFromBottom <= threshold);
        };
        // Initialize once mounted so first render is correct
        onScroll();
        container.addEventListener('scroll', onScroll, { passive: true });
        return () => container.removeEventListener('scroll', onScroll);
    }, []);
    // When content changes, if the user is pinned to bottom, keep it anchored there.
    // Only smooth-scroll when new items are appended; do not smooth for streaming chunk updates.
    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) {
            return;
        }
        // Detect whether new items were appended (vs. streaming chunk updates)
        const prev = prevCountsRef.current;
        const newMsg = messageHandling.messages.length > prev.msgLen;
        const newInProg = inProgressToolCalls.length > prev.inProgLen;
        const newDone = completedToolCalls.length > prev.doneLen;
        prevCountsRef.current = {
            msgLen: messageHandling.messages.length,
            inProgLen: inProgressToolCalls.length,
            doneLen: completedToolCalls.length,
        };
        if (!pinnedToBottom) {
            // Do nothing if user scrolled away; avoid stealing scroll.
            return;
        }
        const smooth = newMsg || newInProg || newDone; // avoid smooth on streaming chunks
        // Anchor to the bottom on next frame to avoid layout thrash.
        const raf = requestAnimationFrame(() => {
            const top = container.scrollHeight - container.clientHeight;
            // Use scrollTo to avoid cross-context issues with scrollIntoView.
            container.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
        });
        return () => cancelAnimationFrame(raf);
    }, [
        pinnedToBottom,
        messageHandling.messages,
        inProgressToolCalls,
        completedToolCalls,
        messageHandling.isWaitingForResponse,
        messageHandling.loadingMessage,
        messageHandling.isStreaming,
        planEntries,
    ]);
    // When the last rendered item resizes (e.g., images/code blocks load/expand),
    // if we're pinned to bottom, keep it anchored there.
    useEffect(() => {
        const container = messagesContainerRef.current;
        const endEl = messagesEndRef.current;
        if (!container || !endEl) {
            return;
        }
        const lastItem = endEl.previousElementSibling;
        if (!lastItem) {
            return;
        }
        let frame = 0;
        const ro = new ResizeObserver(() => {
            if (!pinnedToBottom) {
                return;
            }
            // Defer to next frame to avoid thrash during rapid size changes
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const top = container.scrollHeight - container.clientHeight;
                container.scrollTo({ top });
            });
        });
        ro.observe(lastItem);
        return () => {
            cancelAnimationFrame(frame);
            ro.disconnect();
        };
    }, [
        pinnedToBottom,
        messageHandling.messages,
        inProgressToolCalls,
        completedToolCalls,
    ]);
    // Set loading state to false after initial mount and when we have authentication info
    useEffect(() => {
        // If we have determined authentication status, we're done loading
        if (isAuthenticated !== null) {
            setIsLoading(false);
        }
    }, [isAuthenticated]);
    // Handle permission response
    const handlePermissionResponse = useCallback((optionId) => {
        // Forward the selected optionId directly to extension as ACP permission response
        // Expected values include: 'proceed_once', 'proceed_always', 'cancel', 'proceed_always_server', etc.
        vscode.postMessage({
            type: 'permissionResponse',
            data: { optionId },
        });
        setPermissionRequest(null);
    }, [vscode]);
    // Handle completion selection
    const handleCompletionSelect = useCallback((item) => {
        // Handle completion selection by inserting the value into the input field
        const inputElement = inputFieldRef.current;
        if (!inputElement) {
            return;
        }
        // Ignore info items (placeholders like "Searching files…")
        if (item.type === 'info') {
            completion.closeCompletion();
            return;
        }
        // Commands can execute immediately
        if (item.type === 'command') {
            const itemId = item.id;
            // Helper to clear trigger text from input
            const clearTriggerText = () => {
                const text = inputElement.textContent || '';
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    // Fallback: just clear everything
                    inputElement.textContent = '';
                    setInputText('');
                    return;
                }
                // Find and remove the slash command trigger
                const range = selection.getRangeAt(0);
                let cursorPos = text.length;
                if (range.startContainer === inputElement) {
                    const childIndex = range.startOffset;
                    let offset = 0;
                    for (let i = 0; i < childIndex && i < inputElement.childNodes.length; i++) {
                        offset += inputElement.childNodes[i].textContent?.length || 0;
                    }
                    cursorPos = offset || text.length;
                }
                else if (range.startContainer.nodeType === Node.TEXT_NODE) {
                    const walker = document.createTreeWalker(inputElement, NodeFilter.SHOW_TEXT, null);
                    let offset = 0;
                    let found = false;
                    let node = walker.nextNode();
                    while (node) {
                        if (node === range.startContainer) {
                            offset += range.startOffset;
                            found = true;
                            break;
                        }
                        offset += node.textContent?.length || 0;
                        node = walker.nextNode();
                    }
                    cursorPos = found ? offset : text.length;
                }
                const textBeforeCursor = text.substring(0, cursorPos);
                const slashPos = textBeforeCursor.lastIndexOf('/');
                if (slashPos >= 0) {
                    const newText = text.substring(0, slashPos) + text.substring(cursorPos);
                    inputElement.textContent = newText;
                    setInputText(newText);
                }
            };
            // Handle special commands by id
            if (itemId === 'login') {
                clearTriggerText();
                vscode.postMessage({ type: 'login', data: {} });
                completion.closeCompletion();
                return;
            }
            if (itemId === 'model') {
                clearTriggerText();
                setShowModelSelector(true);
                completion.closeCompletion();
                return;
            }
            // Handle server-provided slash commands by sending them as messages
            // CLI will detect slash commands in session/prompt and execute them
            const serverCmd = availableCommands.find((c) => c.name === itemId);
            if (serverCmd) {
                // Clear the trigger text since we're sending the command
                clearTriggerText();
                // Send the slash command as a user message
                vscode.postMessage({
                    type: 'sendMessage',
                    data: { text: `/${serverCmd.name}` },
                });
                completion.closeCompletion();
                return;
            }
        }
        // If selecting a file, add @filename -> fullpath mapping
        if (item.type === 'file' && item.value && item.path) {
            try {
                fileContext.addFileReference(item.value, item.path);
            }
            catch (err) {
                console.warn('[App] addFileReference failed:', err);
            }
        }
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }
        // Current text and cursor
        const text = inputElement.textContent || '';
        const range = selection.getRangeAt(0);
        // Compute total text offset for contentEditable
        let cursorPos = text.length;
        if (range.startContainer === inputElement) {
            const childIndex = range.startOffset;
            let offset = 0;
            for (let i = 0; i < childIndex && i < inputElement.childNodes.length; i++) {
                offset += inputElement.childNodes[i].textContent?.length || 0;
            }
            cursorPos = offset || text.length;
        }
        else if (range.startContainer.nodeType === Node.TEXT_NODE) {
            const walker = document.createTreeWalker(inputElement, NodeFilter.SHOW_TEXT, null);
            let offset = 0;
            let found = false;
            let node = walker.nextNode();
            while (node) {
                if (node === range.startContainer) {
                    offset += range.startOffset;
                    found = true;
                    break;
                }
                offset += node.textContent?.length || 0;
                node = walker.nextNode();
            }
            cursorPos = found ? offset : text.length;
        }
        // Replace from trigger to cursor with selected value
        const textBeforeCursor = text.substring(0, cursorPos);
        const atPos = textBeforeCursor.lastIndexOf('@');
        const slashPos = textBeforeCursor.lastIndexOf('/');
        const triggerPos = Math.max(atPos, slashPos);
        if (triggerPos >= 0) {
            const insertValue = typeof item.value === 'string' ? item.value : String(item.label);
            const newText = text.substring(0, triggerPos + 1) + // keep the trigger symbol
                insertValue +
                ' ' +
                text.substring(cursorPos);
            // Update DOM and state, and move caret to end
            inputElement.textContent = newText;
            setInputText(newText);
            const newRange = document.createRange();
            const sel = window.getSelection();
            newRange.selectNodeContents(inputElement);
            newRange.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(newRange);
        }
        // Close the completion menu
        completion.closeCompletion();
    }, [
        completion,
        inputFieldRef,
        setInputText,
        fileContext,
        vscode,
        availableCommands,
    ]);
    // Handle model selection
    const handleModelSelect = useCallback((modelId) => {
        vscode.postMessage({
            type: 'setModel',
            data: { modelId },
        });
    }, [vscode]);
    // Handle attach context click
    const handleAttachContextClick = useCallback(() => {
        // Open native file picker (different from '@' completion which searches workspace files)
        vscode.postMessage({
            type: 'attachFile',
            data: {},
        });
    }, [vscode]);
    // Handle toggle edit mode (Default -> Auto-edit -> YOLO -> Default)
    const handleToggleEditMode = useCallback(() => {
        setEditMode((prev) => {
            const next = NEXT_APPROVAL_MODE[prev];
            // Notify extension to set approval mode via ACP
            try {
                vscode.postMessage({
                    type: 'setApprovalMode',
                    data: { modeId: next },
                });
            }
            catch {
                /* no-op */
            }
            return next;
        });
    }, [vscode]);
    // Handle toggle thinking
    const handleToggleThinking = () => {
        setThinkingEnabled((prev) => !prev);
    };
    // When user sends a message after scrolling up, re-pin and jump to the bottom
    const handleSubmitWithScroll = useCallback((e) => {
        setPinnedToBottom(true);
        const container = messagesContainerRef.current;
        if (container) {
            const top = container.scrollHeight - container.clientHeight;
            container.scrollTo({ top });
        }
        submitMessage(e);
    }, [submitMessage]);
    // Create unified message array containing all types of messages and tool calls
    const allMessages = useMemo(() => {
        // Regular messages
        const regularMessages = messageHandling.messages.map((msg) => ({
            type: 'message',
            data: msg,
            timestamp: msg.timestamp,
        }));
        // In-progress tool calls
        const inProgressTools = inProgressToolCalls.map((toolCall) => ({
            type: 'in-progress-tool-call',
            data: toolCall,
            timestamp: toolCall.timestamp ?? 0,
        }));
        // Completed tool calls
        const completedTools = completedToolCalls
            .filter(hasToolCallOutput)
            .map((toolCall) => ({
            type: 'completed-tool-call',
            data: toolCall,
            timestamp: toolCall.timestamp ?? 0,
        }));
        // Merge and sort by timestamp to ensure messages and tool calls are interleaved
        return [...regularMessages, ...inProgressTools, ...completedTools].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }, [messageHandling.messages, inProgressToolCalls, completedToolCalls]);
    console.log('[App] Rendering messages:', allMessages);
    // Render all messages and tool calls
    const renderMessages = useCallback(() => allMessages.map((item, index) => {
        switch (item.type) {
            case 'message': {
                const msg = item.data;
                const handleFileClick = (path) => {
                    vscode.postMessage({
                        type: 'openFile',
                        data: { path },
                    });
                };
                if (msg.role === 'thinking') {
                    return (_jsx(ThinkingMessage, { content: msg.content || '', timestamp: msg.timestamp || 0, onFileClick: handleFileClick }, `message-${index}`));
                }
                if (msg.role === 'user') {
                    return (_jsx(UserMessage, { content: msg.content || '', timestamp: msg.timestamp || 0, onFileClick: handleFileClick, fileContext: msg.fileContext }, `message-${index}`));
                }
                {
                    const content = (msg.content || '').trim();
                    if (content === 'Interrupted' || content === 'Tool interrupted') {
                        return (_jsx(InterruptedMessage, { text: content }, `message-${index}`));
                    }
                    return (_jsx(AssistantMessage, { content: content, timestamp: msg.timestamp || 0, onFileClick: handleFileClick }, `message-${index}`));
                }
            }
            case 'in-progress-tool-call':
            case 'completed-tool-call': {
                return (_jsx(ToolCall, { toolCall: item.data }, `toolcall-${item.data.toolCallId}-${item.type}`));
            }
            default:
                return null;
        }
    }), [allMessages, vscode]);
    const hasContent = messageHandling.messages.length > 0 ||
        messageHandling.isStreaming ||
        inProgressToolCalls.length > 0 ||
        completedToolCalls.length > 0 ||
        planEntries.length > 0 ||
        allMessages.length > 0;
    return (_jsxs("div", { className: "chat-container relative", children: [isLoading && (_jsx("div", { className: "bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Preparing Qwen Code..." })] }) })), _jsx(SessionSelector, { visible: sessionManagement.showSessionSelector, sessions: sessionManagement.filteredSessions, currentSessionId: sessionManagement.currentSessionId, searchQuery: sessionManagement.sessionSearchQuery, onSearchChange: sessionManagement.setSessionSearchQuery, onSelectSession: (sessionId) => {
                    sessionManagement.handleSwitchSession(sessionId);
                    sessionManagement.setSessionSearchQuery('');
                }, onClose: () => sessionManagement.setShowSessionSelector(false), hasMore: sessionManagement.hasMore, isLoading: sessionManagement.isLoading, onLoadMore: sessionManagement.handleLoadMoreSessions }), _jsx(ChatHeader, { currentSessionTitle: sessionManagement.currentSessionTitle, onLoadSessions: sessionManagement.handleLoadQwenSessions, onNewSession: sessionManagement.handleNewQwenSession }), _jsx("div", { ref: messagesContainerRef, className: "chat-messages messages-container flex-1 overflow-y-auto overflow-x-hidden pt-5 pr-5 pl-5 pb-[140px] flex flex-col relative min-w-0 focus:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:hover:bg-white/30 [&>*]:flex [&>*]:gap-0 [&>*]:items-start [&>*]:text-left [&>*]:py-2 [&>*:not(:last-child)]:pb-[8px] [&>*]:flex-col [&>*]:relative [&>*]:animate-[fadeIn_0.2s_ease-in]", children: !hasContent && !isLoading ? (isAuthenticated === false ? (_jsx(Onboarding, { onLogin: () => {
                        vscode.postMessage({ type: 'login', data: {} });
                        messageHandling.setWaitingForResponse('Logging in to Qwen Code...');
                    } })) : isAuthenticated === null ? (_jsx(EmptyState, { loadingMessage: "Checking login status\u2026" })) : (_jsx(EmptyState, { isAuthenticated: true }))) : (_jsxs(_Fragment, { children: [renderMessages(), messageHandling.isWaitingForResponse &&
                            messageHandling.loadingMessage && (_jsx("div", { className: "waiting-message-slot min-h-[28px]", children: _jsx(WaitingMessage, { loadingMessage: messageHandling.loadingMessage }) })), _jsx("div", { ref: messagesEndRef })] })) }), isAuthenticated && (_jsx(InputForm, { inputText: inputText, inputFieldRef: inputFieldRef, isStreaming: messageHandling.isStreaming, isWaitingForResponse: messageHandling.isWaitingForResponse, isComposing: isComposing, editMode: editMode, thinkingEnabled: thinkingEnabled, activeFileName: fileContext.activeFileName, activeSelection: fileContext.activeSelection, skipAutoActiveContext: skipAutoActiveContext, contextUsage: contextUsage, onInputChange: setInputText, onCompositionStart: () => setIsComposing(true), onCompositionEnd: () => setIsComposing(false), onKeyDown: () => { }, onSubmit: handleSubmitWithScroll, onCancel: handleCancel, onToggleEditMode: handleToggleEditMode, onToggleThinking: handleToggleThinking, onFocusActiveEditor: fileContext.focusActiveEditor, onToggleSkipAutoActiveContext: () => setSkipAutoActiveContext((v) => !v), onShowCommandMenu: async () => {
                    if (inputFieldRef.current) {
                        inputFieldRef.current.focus();
                        const selection = window.getSelection();
                        let position = { top: 0, left: 0 };
                        if (selection && selection.rangeCount > 0) {
                            try {
                                const range = selection.getRangeAt(0);
                                const rangeRect = range.getBoundingClientRect();
                                if (rangeRect.top > 0 && rangeRect.left > 0) {
                                    position = {
                                        top: rangeRect.top,
                                        left: rangeRect.left,
                                    };
                                }
                                else {
                                    const inputRect = inputFieldRef.current.getBoundingClientRect();
                                    position = { top: inputRect.top, left: inputRect.left };
                                }
                            }
                            catch (error) {
                                console.error('[App] Error getting cursor position:', error);
                                const inputRect = inputFieldRef.current.getBoundingClientRect();
                                position = { top: inputRect.top, left: inputRect.left };
                            }
                        }
                        else {
                            const inputRect = inputFieldRef.current.getBoundingClientRect();
                            position = { top: inputRect.top, left: inputRect.left };
                        }
                        await completion.openCompletion('/', '', position);
                    }
                }, onAttachContext: handleAttachContextClick, completionIsOpen: completion.isOpen, completionItems: completion.items, onCompletionSelect: handleCompletionSelect, onCompletionClose: completion.closeCompletion, showModelSelector: showModelSelector, availableModels: availableModels, currentModelId: modelInfo?.modelId, onSelectModel: handleModelSelect, onCloseModelSelector: () => setShowModelSelector(false) })), isAuthenticated && permissionRequest && (_jsx(PermissionDrawer, { isOpen: !!permissionRequest, options: permissionRequest.options, toolCall: permissionRequest.toolCall, onResponse: handlePermissionResponse, onClose: () => setPermissionRequest(null) }))] }));
};
//# sourceMappingURL=App.js.map