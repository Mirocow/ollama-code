/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AcpConnection } from './acpConnection.js';
import { OllamaSessionReader, } from './ollamaSessionReader.js';
import { OllamaSessionManager } from './ollamaSessionManager.js';
import { OllamaConnectionHandler, } from './ollamaConnectionHandler.js';
import { OllamaSessionUpdateHandler } from './ollamaSessionUpdateHandler.js';
import { authMethod } from '../types/acpTypes.js';
import { extractModelInfoFromNewSessionResult, extractSessionModelState, } from '../utils/acpModelInfo.js';
import { isAuthenticationRequiredError } from '../utils/authErrors.js';
import { handleAuthenticateUpdate } from '../utils/authNotificationHandler.js';
export class OllamaAgentManager {
    connection;
    sessionReader;
    sessionManager;
    connectionHandler;
    sessionUpdateHandler;
    currentWorkingDir = process.cwd();
    // When loading a past session via ACP, the CLI replays history through
    // session/update notifications. We set this flag to route message chunks
    // (user/assistant) as discrete chat messages instead of live streaming.
    rehydratingSessionId = null;
    // CLI is now the single source of truth for authentication state
    // Deduplicate concurrent session/new attempts
    sessionCreateInFlight = null;
    // Callback storage
    callbacks = {};
    constructor() {
        this.connection = new AcpConnection();
        this.sessionReader = new OllamaSessionReader();
        this.sessionManager = new OllamaSessionManager();
        this.connectionHandler = new OllamaConnectionHandler();
        this.sessionUpdateHandler = new OllamaSessionUpdateHandler({});
        // Set ACP connection callbacks
        this.connection.onSessionUpdate = (data) => {
            // If we are rehydrating a loaded session, map message chunks into
            // full messages for the UI, instead of streaming behavior.
            try {
                const targetId = this.rehydratingSessionId;
                if (targetId &&
                    typeof data === 'object' &&
                    data &&
                    'update' in data &&
                    data.sessionId === targetId) {
                    const update = data.update;
                    const text = update?.content?.text || '';
                    const timestamp = typeof update?._meta?.timestamp === 'number'
                        ? update._meta.timestamp
                        : Date.now();
                    if (update?.sessionUpdate === 'user_message_chunk' && text) {
                        console.log('[OllamaAgentManager] Rehydration: routing user message chunk');
                        this.callbacks.onMessage?.({
                            role: 'user',
                            content: text,
                            timestamp,
                        });
                        return;
                    }
                    if (update?.sessionUpdate === 'agent_message_chunk' && text) {
                        console.log('[OllamaAgentManager] Rehydration: routing agent message chunk');
                        this.callbacks.onMessage?.({
                            role: 'assistant',
                            content: text,
                            timestamp,
                        });
                        return;
                    }
                    // For other types during rehydration, fall through to normal handler
                    console.log('[OllamaAgentManager] Rehydration: non-text update, forwarding to handler');
                }
            }
            catch (err) {
                console.warn('[OllamaAgentManager] Rehydration routing failed:', err);
            }
            // Default handling path
            this.sessionUpdateHandler.handleSessionUpdate(data);
        };
        this.connection.onPermissionRequest = async (data) => {
            if (this.callbacks.onPermissionRequest) {
                const optionId = await this.callbacks.onPermissionRequest(data);
                return { optionId };
            }
            return { optionId: 'allow_once' };
        };
        this.connection.onEndTurn = (reason) => {
            try {
                if (this.callbacks.onEndTurn) {
                    this.callbacks.onEndTurn(reason);
                }
                else if (this.callbacks.onStreamChunk) {
                    // Fallback: send a zero-length chunk then rely on streamEnd elsewhere
                    this.callbacks.onStreamChunk('');
                }
            }
            catch (err) {
                console.warn('[OllamaAgentManager] onEndTurn callback error:', err);
            }
        };
        this.connection.onAuthenticateUpdate = (data) => {
            try {
                // Handle authentication update notifications by showing VS Code notification
                handleAuthenticateUpdate(data);
            }
            catch (err) {
                console.warn('[OllamaAgentManager] onAuthenticateUpdate callback error:', err);
            }
        };
        // Initialize callback to surface available modes and current mode to UI
        this.connection.onInitialized = (init) => {
            try {
                const obj = (init || {});
                const modes = obj['modes'];
                if (modes && this.callbacks.onModeInfo) {
                    this.callbacks.onModeInfo({
                        currentModeId: modes.currentModeId,
                        availableModes: modes.availableModes,
                    });
                }
            }
            catch (err) {
                console.warn('[OllamaAgentManager] onInitialized parse error:', err);
            }
        };
    }
    /**
     * Connect to Ollama service
     *
     * @param workingDir - Working directory
     * @param cliEntryPath - Path to bundled CLI entrypoint (cli.js)
     */
    async connect(workingDir, cliEntryPath, options) {
        this.currentWorkingDir = workingDir;
        const res = await this.connectionHandler.connect(this.connection, workingDir, cliEntryPath, options);
        if (res.modelInfo && this.callbacks.onModelInfo) {
            this.callbacks.onModelInfo(res.modelInfo);
        }
        // Emit available models from connect result
        if (res.availableModels && res.availableModels.length > 0) {
            console.log('[OllamaAgentManager] Emitting availableModels from connect():', res.availableModels.map((m) => m.modelId));
            if (this.callbacks.onAvailableModels) {
                this.callbacks.onAvailableModels(res.availableModels);
            }
        }
        return res;
    }
    /**
     * Send message
     *
     * @param message - Message content
     */
    async sendMessage(message) {
        await this.connection.sendPrompt(message);
    }
    /**
     * Set approval mode from UI
     */
    async setApprovalModeFromUi(mode) {
        const modeId = mode;
        try {
            const res = await this.connection.setMode(modeId);
            // Optimistically notify UI using response
            const result = (res?.result || {});
            const confirmed = result.modeId || modeId;
            this.callbacks.onModeChanged?.(confirmed);
            return confirmed;
        }
        catch (err) {
            console.error('[OllamaAgentManager] Failed to set mode:', err);
            throw err;
        }
    }
    /**
     * Set model from UI
     */
    async setModelFromUi(modelId) {
        try {
            const res = await this.connection.setModel(modelId);
            // Parse response and notify UI
            const result = (res?.result || {});
            const confirmedModelId = result.modelId || modelId;
            const modelInfo = {
                modelId: confirmedModelId,
                name: confirmedModelId,
            };
            this.callbacks.onModelChanged?.(modelInfo);
            return modelInfo;
        }
        catch (err) {
            console.error('[OllamaAgentManager] Failed to set model:', err);
            throw err;
        }
    }
    /**
     * Validate if current session is still active
     * This is a lightweight check to verify session validity
     *
     * @returns True if session is valid, false otherwise
     */
    async validateCurrentSession() {
        try {
            // If we don't have a current session, it's definitely not valid
            if (!this.connection.currentSessionId) {
                return false;
            }
            // Try to get session list to verify our session still exists
            const sessions = await this.getSessionList();
            const currentSessionId = this.connection.currentSessionId;
            // Check if our current session exists in the session list
            const sessionExists = sessions.some((session) => session.id === currentSessionId ||
                session.sessionId === currentSessionId);
            return sessionExists;
        }
        catch (error) {
            console.warn('[OllamaAgentManager] Session validation failed:', error);
            // If we can't validate, assume session is invalid
            return false;
        }
    }
    /**
     * Get session list with version-aware strategy
     * First tries ACP method if CLI version supports it, falls back to file system method
     *
     * @returns Session list
     */
    async getSessionList() {
        console.log('[OllamaAgentManager] Getting session list with version-aware strategy');
        try {
            console.log('[OllamaAgentManager] Attempting to get session list via ACP method');
            const response = await this.connection.listSessions();
            console.log('[OllamaAgentManager] ACP session list response:', response);
            // sendRequest resolves with the JSON-RPC "result" directly
            // Newer CLI returns an object: { items: [...], nextCursor?, hasMore }
            // Older prototypes might return an array. Support both.
            const res = response;
            let items = [];
            // Note: AcpSessionManager resolves `sendRequest` with the JSON-RPC
            // "result" directly (not the full AcpResponse). Treat it as unknown
            // and carefully narrow before accessing `items` to satisfy strict TS.
            if (res && typeof res === 'object' && 'items' in res) {
                const itemsValue = res.items;
                items = Array.isArray(itemsValue)
                    ? itemsValue
                    : [];
            }
            console.log('[OllamaAgentManager] Sessions retrieved via ACP:', res, items.length);
            if (items.length > 0) {
                const sessions = items.map((item) => ({
                    id: item.sessionId || item.id,
                    sessionId: item.sessionId || item.id,
                    title: item.title || item.name || item.prompt || 'Untitled Session',
                    name: item.title || item.name || item.prompt || 'Untitled Session',
                    startTime: item.startTime,
                    lastUpdated: item.mtime || item.lastUpdated,
                    messageCount: item.messageCount || 0,
                    projectHash: item.projectHash,
                    filePath: item.filePath,
                    cwd: item.cwd,
                }));
                console.log('[OllamaAgentManager] Sessions retrieved via ACP:', sessions.length);
                return sessions;
            }
        }
        catch (error) {
            console.warn('[OllamaAgentManager] ACP session list failed, falling back to file system method:', error);
        }
        // Always fall back to file system method
        try {
            console.log('[OllamaAgentManager] Getting session list from file system');
            const sessions = await this.sessionReader.getAllSessions(undefined, true);
            console.log('[OllamaAgentManager] Session list from file system (all projects):', sessions.length);
            const result = sessions.map((session) => ({
                id: session.sessionId,
                sessionId: session.sessionId,
                title: this.sessionReader.getSessionTitle(session),
                name: this.sessionReader.getSessionTitle(session),
                startTime: session.startTime,
                lastUpdated: session.lastUpdated,
                messageCount: session.messageCount ?? session.messages.length,
                projectHash: session.projectHash,
                filePath: session.filePath,
                cwd: session.cwd,
            }));
            console.log('[OllamaAgentManager] Sessions retrieved from file system:', result.length);
            return result;
        }
        catch (error) {
            console.error('[OllamaAgentManager] Failed to get session list from file system:', error);
            return [];
        }
    }
    /**
     * Get session list (paged)
     * Uses ACP session/list with cursor-based pagination when available.
     * Falls back to file system scan with equivalent pagination semantics.
     */
    async getSessionListPaged(params) {
        const size = params?.size ?? 20;
        const cursor = params?.cursor;
        try {
            const response = await this.connection.listSessions({
                size,
                ...(cursor !== undefined ? { cursor } : {}),
            });
            // sendRequest resolves with the JSON-RPC "result" directly
            const res = response;
            let items = [];
            if (Array.isArray(res)) {
                items = res;
            }
            else if (typeof res === 'object' && res !== null && 'items' in res) {
                const responseObject = res;
                items = Array.isArray(responseObject.items) ? responseObject.items : [];
            }
            const mapped = items.map((item) => ({
                id: item.sessionId || item.id,
                sessionId: item.sessionId || item.id,
                title: item.title || item.name || item.prompt || 'Untitled Session',
                name: item.title || item.name || item.prompt || 'Untitled Session',
                startTime: item.startTime,
                lastUpdated: item.mtime || item.lastUpdated,
                messageCount: item.messageCount || 0,
                projectHash: item.projectHash,
                filePath: item.filePath,
                cwd: item.cwd,
            }));
            const nextCursor = typeof res === 'object' && res !== null && 'nextCursor' in res
                ? typeof res.nextCursor === 'number'
                    ? res.nextCursor
                    : undefined
                : undefined;
            const hasMore = typeof res === 'object' && res !== null && 'hasMore' in res
                ? Boolean(res.hasMore)
                : false;
            return { sessions: mapped, nextCursor, hasMore };
        }
        catch (error) {
            console.warn('[OllamaAgentManager] Paged ACP session list failed:', error);
            // fall through to file system
        }
        // Fallback: file system for current project only (to match ACP semantics)
        try {
            const all = await this.sessionReader.getAllSessions(this.currentWorkingDir, false);
            // Sorted by lastUpdated desc already per reader
            const allWithMtime = all.map((s) => ({
                raw: s,
                mtime: new Date(s.lastUpdated).getTime(),
            }));
            const filtered = cursor !== undefined
                ? allWithMtime.filter((x) => x.mtime < cursor)
                : allWithMtime;
            const page = filtered.slice(0, size);
            const sessions = page.map((x) => ({
                id: x.raw.sessionId,
                sessionId: x.raw.sessionId,
                title: this.sessionReader.getSessionTitle(x.raw),
                name: this.sessionReader.getSessionTitle(x.raw),
                startTime: x.raw.startTime,
                lastUpdated: x.raw.lastUpdated,
                messageCount: x.raw.messageCount ?? x.raw.messages.length,
                projectHash: x.raw.projectHash,
                filePath: x.raw.filePath,
                cwd: x.raw.cwd,
            }));
            const nextCursorVal = page.length > 0 ? page[page.length - 1].mtime : undefined;
            const hasMore = filtered.length > size;
            return { sessions, nextCursor: nextCursorVal, hasMore };
        }
        catch (error) {
            console.error('[OllamaAgentManager] File system paged list failed:', error);
            return { sessions: [], hasMore: false };
        }
    }
    /**
     * Get session messages (read from disk)
     *
     * @param sessionId - Session ID
     * @returns Message list
     */
    async getSessionMessages(sessionId) {
        try {
            try {
                const list = await this.getSessionList();
                const item = list.find((s) => s.sessionId === sessionId || s.id === sessionId);
                console.log('[OllamaAgentManager] Session list item for filePath lookup:', item);
                if (typeof item === 'object' &&
                    item !== null &&
                    'filePath' in item &&
                    typeof item.filePath === 'string') {
                    const messages = await this.readJsonlMessages(item.filePath);
                    // Even if messages array is empty, we should return it rather than falling back
                    // This ensures we don't accidentally show messages from a different session format
                    return messages;
                }
            }
            catch (e) {
                console.warn('[OllamaAgentManager] JSONL read path lookup failed:', e);
            }
            // Fallback: legacy JSON session files
            const session = await this.sessionReader.getSession(sessionId, this.currentWorkingDir);
            if (!session) {
                return [];
            }
            return session.messages.map((msg) => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content,
                timestamp: new Date(msg.timestamp).getTime(),
            }));
        }
        catch (error) {
            console.error('[OllamaAgentManager] Failed to get session messages:', error);
            return [];
        }
    }
    // Read CLI JSONL session file and convert to ChatMessage[] for UI
    async readJsonlMessages(filePath) {
        const fs = await import('fs');
        const readline = await import('readline');
        try {
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity,
            });
            const records = [];
            for await (const line of rl) {
                const trimmed = line.trim();
                if (!trimmed) {
                    continue;
                }
                try {
                    const obj = JSON.parse(trimmed);
                    records.push(obj);
                }
                catch {
                    /* ignore */
                }
            }
            // Simple linear reconstruction: filter user/assistant and sort by timestamp
            console.log('[OllamaAgentManager] JSONL records read:', records.length, filePath);
            const isJsonlRecord = (x) => typeof x === 'object' &&
                x !== null &&
                typeof x.type === 'string' &&
                typeof x.timestamp === 'string';
            const allRecords = records
                .filter(isJsonlRecord)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const msgs = [];
            for (const r of allRecords) {
                // Handle user and assistant messages
                if ((r.type === 'user' || r.type === 'assistant') && r.message) {
                    msgs.push({
                        role: r.type === 'user' ? 'user' : 'assistant',
                        content: this.contentToText(r.message),
                        timestamp: new Date(r.timestamp).getTime(),
                    });
                }
                // Handle tool call records that might have content we want to show
                else if (r.type === 'tool_call' || r.type === 'tool_call_update') {
                    // Convert tool calls to messages if they have relevant content
                    const toolContent = this.extractToolCallContent(r);
                    if (toolContent) {
                        msgs.push({
                            role: 'assistant',
                            content: toolContent,
                            timestamp: new Date(r.timestamp).getTime(),
                        });
                    }
                }
                // Handle tool result records
                else if (r.type === 'tool_result' &&
                    r.toolCallResult &&
                    typeof r.toolCallResult === 'object') {
                    const toolResult = r.toolCallResult;
                    const callId = toolResult.callId ?? 'unknown';
                    const status = toolResult.status ?? 'unknown';
                    const resultText = `Tool Result (${callId}): ${status}`;
                    msgs.push({
                        role: 'assistant',
                        content: resultText,
                        timestamp: new Date(r.timestamp).getTime(),
                    });
                }
                // Handle system telemetry records
                else if (r.type === 'system' &&
                    r.subtype === 'ui_telemetry' &&
                    r.systemPayload &&
                    typeof r.systemPayload === 'object' &&
                    'uiEvent' in r.systemPayload &&
                    r.systemPayload.uiEvent) {
                    const uiEvent = r.systemPayload.uiEvent;
                    let telemetryText = '';
                    if (typeof uiEvent['event.name'] === 'string' &&
                        uiEvent['event.name'].includes('tool_call')) {
                        const functionName = uiEvent['function_name'] ||
                            'Unknown tool';
                        const status = uiEvent['status'] || 'unknown';
                        const duration = typeof uiEvent['duration_ms'] === 'number'
                            ? ` (${uiEvent['duration_ms']}ms)`
                            : '';
                        telemetryText = `Tool Call: ${functionName} - ${status}${duration}`;
                    }
                    else if (typeof uiEvent['event.name'] === 'string' &&
                        uiEvent['event.name'].includes('api_response')) {
                        const statusCode = uiEvent['status_code'] ||
                            'unknown';
                        const duration = typeof uiEvent['duration_ms'] === 'number'
                            ? ` (${uiEvent['duration_ms']}ms)`
                            : '';
                        telemetryText = `API Response: Status ${statusCode}${duration}`;
                    }
                    else {
                        // Generic system telemetry
                        const eventName = uiEvent['event.name'] || 'Unknown event';
                        telemetryText = `System Event: ${eventName}`;
                    }
                    if (telemetryText) {
                        msgs.push({
                            role: 'assistant',
                            content: telemetryText,
                            timestamp: new Date(r.timestamp).getTime(),
                        });
                    }
                }
                // Handle plan entries
                else if (r.type === 'plan' &&
                    r.plan &&
                    typeof r.plan === 'object' &&
                    'entries' in r.plan) {
                    const planEntries = r.plan
                        .entries || [];
                    if (planEntries.length > 0) {
                        const planText = planEntries
                            .map((entry, index) => `${index + 1}. ${entry.description || entry.title || 'Unnamed step'}`)
                            .join('\n');
                        msgs.push({
                            role: 'assistant',
                            content: `Plan:\n${planText}`,
                            timestamp: new Date(r.timestamp).getTime(),
                        });
                    }
                }
                // Handle other types if needed
            }
            console.log('[OllamaAgentManager] JSONL messages reconstructed:', msgs.length);
            return msgs;
        }
        catch (err) {
            console.warn('[OllamaAgentManager] Failed to read JSONL messages:', err);
            return [];
        }
    }
    // Extract meaningful content from tool call records
    extractToolCallContent(record) {
        try {
            // Type guard for record
            if (typeof record !== 'object' || record === null) {
                return null;
            }
            // Cast to a more specific type for easier handling
            const typedRecord = record;
            // If the tool call has a result or output, include it
            if ('toolCallResult' in typedRecord && typedRecord.toolCallResult) {
                return `Tool result: ${this.formatValue(typedRecord.toolCallResult)}`;
            }
            // If the tool call has content, include it
            if ('content' in typedRecord && typedRecord.content) {
                return this.formatValue(typedRecord.content);
            }
            // If the tool call has a title or name, include it
            if (('title' in typedRecord && typedRecord.title) ||
                ('name' in typedRecord && typedRecord.name)) {
                return `Tool: ${typedRecord.title || typedRecord.name}`;
            }
            // Handle tool_call records with more details
            if (typedRecord.type === 'tool_call' &&
                'toolCall' in typedRecord &&
                typedRecord.toolCall) {
                const toolCall = typedRecord.toolCall;
                if (('title' in toolCall && toolCall.title) ||
                    ('name' in toolCall && toolCall.name)) {
                    return `Tool call: ${toolCall.title || toolCall.name}`;
                }
                if ('rawInput' in toolCall && toolCall.rawInput) {
                    return `Tool input: ${this.formatValue(toolCall.rawInput)}`;
                }
            }
            // Handle tool_call_update records with status
            if (typedRecord.type === 'tool_call_update') {
                const status = ('status' in typedRecord && typedRecord.status) || 'unknown';
                const title = ('title' in typedRecord && typedRecord.title) ||
                    ('name' in typedRecord && typedRecord.name) ||
                    'Unknown tool';
                return `Tool ${status}: ${title}`;
            }
            return null;
        }
        catch {
            return null;
        }
    }
    // Format any value to a string for display
    formatValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            }
            catch (_e) {
                return String(value);
            }
        }
        return String(value);
    }
    // Extract plain text from Content (genai Content)
    contentToText(message) {
        try {
            // Type guard for message
            if (typeof message !== 'object' || message === null) {
                return '';
            }
            // Cast to a more specific type for easier handling
            const typedMessage = message;
            const parts = Array.isArray(typedMessage.parts) ? typedMessage.parts : [];
            const texts = [];
            for (const p of parts) {
                // Type guard for part
                if (typeof p !== 'object' || p === null) {
                    continue;
                }
                const typedPart = p;
                if (typeof typedPart.text === 'string') {
                    texts.push(typedPart.text);
                }
                else if (typeof typedPart.data === 'string') {
                    texts.push(typedPart.data);
                }
            }
            return texts.join('\n');
        }
        catch {
            return '';
        }
    }
    /**
     * Save session via /chat save command
     * Since CLI doesn't support session/save ACP method, we send /chat save command directly
     *
     * @param sessionId - Session ID
     * @param tag - Save tag
     * @returns Save response
     */
    async saveSessionViaCommand(sessionId, tag) {
        try {
            console.log('[OllamaAgentManager] Saving session via /chat save command:', sessionId, 'with tag:', tag);
            // Send /chat save command as a prompt
            // The CLI will handle this as a special command
            await this.connection.sendPrompt(`/chat save "${tag}"`);
            console.log('[OllamaAgentManager] /chat save command sent successfully');
            return {
                success: true,
                message: `Session saved with tag: ${tag}`,
            };
        }
        catch (error) {
            console.error('[OllamaAgentManager] /chat save command failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Save session via ACP session/save method (deprecated, CLI doesn't support)
     *
     * @deprecated Use saveSessionViaCommand instead
     * @param sessionId - Session ID
     * @param tag - Save tag
     * @returns Save response
     */
    async saveSessionViaAcp(sessionId, tag) {
        // Fallback to command-based save since CLI doesn't support session/save ACP method
        console.warn('[OllamaAgentManager] saveSessionViaAcp is deprecated, using command-based save instead');
        return this.saveSessionViaCommand(sessionId, tag);
    }
    /**
     * Try to load session via ACP session/load method
     * This method will only be used if CLI version supports it
     *
     * @param sessionId - Session ID
     * @returns Load response or error
     */
    async loadSessionViaAcp(sessionId, cwdOverride) {
        try {
            // Route upcoming session/update messages as discrete messages for replay
            this.rehydratingSessionId = sessionId;
            console.log('[OllamaAgentManager] Rehydration start for session:', sessionId);
            console.log('[OllamaAgentManager] Attempting session/load via ACP for session:', sessionId);
            const response = await this.connection.loadSession(sessionId, cwdOverride);
            console.log('[OllamaAgentManager] Session load succeeded. Response:', JSON.stringify(response).substring(0, 200));
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[OllamaAgentManager] Session load via ACP failed for session:', sessionId);
            console.error('[OllamaAgentManager] Error type:', error?.constructor?.name);
            console.error('[OllamaAgentManager] Error message:', errorMessage);
            // Check if error is from ACP response
            if (error && typeof error === 'object') {
                // Safely check if 'error' property exists
                if ('error' in error) {
                    const acpError = error;
                    if (acpError.error) {
                        console.error('[OllamaAgentManager] ACP error code:', acpError.error.code);
                        console.error('[OllamaAgentManager] ACP error message:', acpError.error.message);
                    }
                }
                else {
                    console.error('[OllamaAgentManager] Non-ACPIf error details:', error);
                }
            }
            throw error;
        }
        finally {
            // End rehydration routing regardless of outcome
            console.log('[OllamaAgentManager] Rehydration end for session:', sessionId);
            this.rehydratingSessionId = null;
        }
    }
    /**
     * Load session with version-aware strategy
     * First tries ACP method if CLI version supports it, falls back to file system method
     *
     * @param sessionId - Session ID to load
     * @returns Loaded session messages or null
     */
    async loadSession(sessionId) {
        console.log('[OllamaAgentManager] Loading session with version-aware strategy:', sessionId);
        try {
            console.log('[OllamaAgentManager] Attempting to load session via ACP method');
            await this.loadSessionViaAcp(sessionId);
            console.log('[OllamaAgentManager] Session loaded successfully via ACP');
            // After loading via ACP, we still need to get messages from file system
            // In future, we might get them directly from the ACP response
        }
        catch (error) {
            console.warn('[OllamaAgentManager] ACP session load failed, falling back to file system method:', error);
        }
        // Always fall back to file system method
        try {
            console.log('[OllamaAgentManager] Loading session messages from file system');
            const messages = await this.loadSessionMessagesFromFile(sessionId);
            console.log('[OllamaAgentManager] Session messages loaded successfully from file system');
            return messages;
        }
        catch (error) {
            console.error('[OllamaAgentManager] Failed to load session messages from file system:', error);
            return null;
        }
    }
    /**
     * Load session messages from file system
     *
     * @param sessionId - Session ID to load
     * @returns Loaded session messages
     */
    async loadSessionMessagesFromFile(sessionId) {
        try {
            console.log('[OllamaAgentManager] Loading session from file system:', sessionId);
            // Load session from file system
            const session = await this.sessionManager.loadSession(sessionId, this.currentWorkingDir);
            if (!session) {
                console.log('[OllamaAgentManager] Session not found in file system:', sessionId);
                return null;
            }
            // Convert message format
            const messages = session.messages.map((msg) => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content,
                timestamp: new Date(msg.timestamp).getTime(),
            }));
            return messages;
        }
        catch (error) {
            console.error('[OllamaAgentManager] Session load from file system failed:', error);
            throw error;
        }
    }
    /**
     * Create new session
     *
     * Note: Authentication should be done in connect() method, only create session here
     *
     * @param workingDir - Working directory
     * @returns Newly created session ID
     */
    async createNewSession(workingDir, options) {
        const autoAuthenticate = options?.autoAuthenticate ?? true;
        // Reuse existing session if present
        if (this.connection.currentSessionId) {
            console.log('[OllamaAgentManager] createNewSession: reusing existing session', this.connection.currentSessionId);
            return this.connection.currentSessionId;
        }
        // Deduplicate concurrent session/new attempts
        if (this.sessionCreateInFlight) {
            console.log('[OllamaAgentManager] createNewSession: session creation already in flight');
            return this.sessionCreateInFlight;
        }
        console.log('[OllamaAgentManager] Creating new session...');
        this.sessionCreateInFlight = (async () => {
            try {
                let newSessionResult;
                // Try to create a new ACP session. If Qwen asks for auth, let it handle authentication.
                try {
                    newSessionResult = await this.connection.newSession(workingDir);
                    console.log('[OllamaAgentManager] newSession returned:', JSON.stringify(newSessionResult, null, 2));
                }
                catch (err) {
                    const requiresAuth = isAuthenticationRequiredError(err);
                    if (requiresAuth) {
                        if (!autoAuthenticate) {
                            console.warn('[OllamaAgentManager] session/new requires authentication but auto-auth is disabled. Deferring until user logs in.');
                            throw err;
                        }
                        console.warn('[OllamaAgentManager] session/new requires authentication. Retrying with authenticate...');
                        try {
                            // Let CLI handle authentication - it's the single source of truth
                            await this.connection.authenticate(authMethod);
                            console.log('[OllamaAgentManager] createNewSession Authentication successful. Retrying session/new...');
                            // Add a slight delay to ensure auth state is settled
                            await new Promise((resolve) => setTimeout(resolve, 300));
                            newSessionResult = await this.connection.newSession(workingDir);
                        }
                        catch (reauthErr) {
                            console.error('[OllamaAgentManager] Re-authentication failed:', reauthErr);
                            throw reauthErr;
                        }
                    }
                    else {
                        throw err;
                    }
                }
                const modelInfo = extractModelInfoFromNewSessionResult(newSessionResult);
                if (modelInfo && this.callbacks.onModelInfo) {
                    this.callbacks.onModelInfo(modelInfo);
                }
                // Extract and emit available models
                const modelState = extractSessionModelState(newSessionResult);
                console.log('[OllamaAgentManager] Extracted model state from session/new:', modelState);
                if (modelState?.availableModels &&
                    modelState.availableModels.length > 0) {
                    console.log('[OllamaAgentManager] Emitting availableModels:', modelState.availableModels);
                    if (this.callbacks.onAvailableModels) {
                        this.callbacks.onAvailableModels(modelState.availableModels);
                    }
                }
                else {
                    console.warn('[OllamaAgentManager] No availableModels found in session/new response. Raw models field:', newSessionResult?.models);
                }
                const newSessionId = this.connection.currentSessionId;
                console.log('[OllamaAgentManager] New session created with ID:', newSessionId);
                return newSessionId;
            }
            finally {
                this.sessionCreateInFlight = null;
            }
        })();
        return this.sessionCreateInFlight;
    }
    /**
     * Switch to specified session
     *
     * @param sessionId - Session ID
     */
    async switchToSession(sessionId) {
        await this.connection.switchSession(sessionId);
    }
    /**
     * Cancel current prompt
     */
    async cancelCurrentPrompt() {
        console.log('[OllamaAgentManager] Cancelling current prompt');
        await this.connection.cancelSession();
    }
    /**
     * Register message callback
     *
     * @param callback - Message callback function
     */
    onMessage(callback) {
        this.callbacks.onMessage = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register stream chunk callback
     *
     * @param callback - Stream chunk callback function
     */
    onStreamChunk(callback) {
        this.callbacks.onStreamChunk = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register thought chunk callback
     *
     * @param callback - Thought chunk callback function
     */
    onThoughtChunk(callback) {
        this.callbacks.onThoughtChunk = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register tool call callback
     *
     * @param callback - Tool call callback function
     */
    onToolCall(callback) {
        this.callbacks.onToolCall = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register plan callback
     *
     * @param callback - Plan callback function
     */
    onPlan(callback) {
        this.callbacks.onPlan = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register permission request callback
     *
     * @param callback - Permission request callback function
     */
    onPermissionRequest(callback) {
        this.callbacks.onPermissionRequest = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register end-of-turn callback
     *
     * @param callback - Called when ACP stopReason is reported
     */
    onEndTurn(callback) {
        this.callbacks.onEndTurn = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register initialize mode info callback
     */
    onModeInfo(callback) {
        this.callbacks.onModeInfo = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register mode changed callback
     */
    onModeChanged(callback) {
        this.callbacks.onModeChanged = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register callback for usage metadata updates
     */
    onUsageUpdate(callback) {
        this.callbacks.onUsageUpdate = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register callback for model info updates
     */
    onModelInfo(callback) {
        this.callbacks.onModelInfo = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register callback for model changed updates (from ACP current_model_update)
     */
    onModelChanged(callback) {
        this.callbacks.onModelChanged = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register callback for available commands updates (from ACP available_commands_update)
     */
    onAvailableCommands(callback) {
        this.callbacks.onAvailableCommands = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Register callback for available models updates (from session/new response)
     */
    onAvailableModels(callback) {
        this.callbacks.onAvailableModels = callback;
        this.sessionUpdateHandler.updateCallbacks(this.callbacks);
    }
    /**
     * Disconnect
     */
    disconnect() {
        this.connection.disconnect();
    }
    /**
     * Check if connected
     */
    get isConnected() {
        return this.connection.isConnected;
    }
    /**
     * Get current session ID
     */
    get currentSessionId() {
        return this.connection.currentSessionId;
    }
}
//# sourceMappingURL=ollamaAgentManager.js.map