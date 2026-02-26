/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { JSONRPC_VERSION } from '../types/acpTypes.js';
import { ACP_ERROR_CODES } from '../constants/acpSchema.js';
import { spawn } from 'child_process';
import { AcpMessageHandler } from './acpMessageHandler.js';
import { AcpSessionManager } from './acpSessionManager.js';
import * as fs from 'node:fs';
/**
 * ACP Connection Handler for VSCode Extension
 *
 * This class implements the client side of the ACP (Agent Communication Protocol).
 */
export class AcpConnection {
    child = null;
    pendingRequests = new Map();
    nextRequestId = { value: 0 };
    // Remember the working dir provided at connect() so later ACP calls
    // that require cwd (e.g. session/list) can include it.
    workingDir = process.cwd();
    messageHandler;
    sessionManager;
    onSessionUpdate = () => { };
    onPermissionRequest = () => Promise.resolve({ optionId: 'allow' });
    onAuthenticateUpdate = () => { };
    onEndTurn = () => { };
    // Called after successful initialize() with the initialize result
    onInitialized = () => { };
    constructor() {
        this.messageHandler = new AcpMessageHandler();
        this.sessionManager = new AcpSessionManager();
    }
    /**
     * Connect to Ollama ACP
     *
     * @param cliEntryPath - Path to the bundled CLI entrypoint (cli.js)
     * @param workingDir - Working directory
     * @param extraArgs - Extra command line arguments
     */
    async connect(cliEntryPath, workingDir = process.cwd(), extraArgs = []) {
        if (this.child) {
            this.disconnect();
        }
        this.workingDir = workingDir;
        const env = { ...process.env };
        // If proxy is configured in extraArgs, also set it as environment variable
        // This ensures token refresh requests also use the proxy
        const proxyArg = extraArgs.find((arg, i) => arg === '--proxy' && i + 1 < extraArgs.length);
        if (proxyArg) {
            const proxyIndex = extraArgs.indexOf('--proxy');
            const proxyUrl = extraArgs[proxyIndex + 1];
            console.log('[ACP] Setting proxy environment variables:', proxyUrl);
            env['HTTP_PROXY'] = proxyUrl;
            env['HTTPS_PROXY'] = proxyUrl;
            env['http_proxy'] = proxyUrl;
            env['https_proxy'] = proxyUrl;
        }
        // Always run the bundled CLI using the VS Code extension host's Node runtime.
        // This avoids PATH/NVM/global install problems and ensures deterministic behavior.
        const spawnCommand = process.execPath;
        const spawnArgs = [
            cliEntryPath,
            '--acp',
            '--channel=VSCode',
            ...extraArgs,
        ];
        if (!fs.existsSync(cliEntryPath)) {
            throw new Error(`Bundled Ollama CLI entry not found at ${cliEntryPath}. The extension may not have been packaged correctly.`);
        }
        console.log('[ACP] Spawning command:', spawnCommand, spawnArgs.join(' '));
        const options = {
            cwd: workingDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env,
            // We spawn node directly; no shell needed (and shell quoting can break paths).
            shell: false,
        };
        this.child = spawn(spawnCommand, spawnArgs, options);
        await this.setupChildProcessHandlers();
    }
    /**
     * Set up child process handlers
     */
    async setupChildProcessHandlers() {
        let spawnError = null;
        this.child.stderr?.on('data', (data) => {
            const message = data.toString();
            if (message.toLowerCase().includes('error') &&
                !message.includes('Loaded cached')) {
                console.error(`[ACP ollama]:`, message);
            }
            else {
                console.log(`[ACP ollama]:`, message);
            }
        });
        this.child.on('error', (error) => {
            spawnError = error;
        });
        this.child.on('exit', (code, signal) => {
            console.error(`[ACP ollama] Process exited with code: ${code}, signal: ${signal}`);
            // Clear pending requests when process exits
            this.pendingRequests.clear();
        });
        // Wait for process to start
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (spawnError) {
            throw spawnError;
        }
        if (!this.child || this.child.killed) {
            throw new Error(`Ollama ACP process failed to start`);
        }
        // Handle messages from ACP server
        let buffer = '';
        this.child.stdout?.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const message = JSON.parse(line);
                        console.log('[ACP] <<< Received message:', JSON.stringify(message).substring(0, 500 * 3));
                        this.handleMessage(message);
                    }
                    catch (_error) {
                        // Ignore non-JSON lines
                        console.log('[ACP] <<< Non-JSON line (ignored):', line.substring(0, 200));
                    }
                }
            }
        });
        // Initialize protocol
        const res = await this.sessionManager.initialize(this.child, this.pendingRequests, this.nextRequestId);
        console.log('[ACP] Initialization response:', res);
        try {
            this.onInitialized(res);
        }
        catch (err) {
            console.warn('[ACP] onInitialized callback error:', err);
        }
    }
    /**
     * Handle received messages
     *
     * @param message - ACP message
     */
    handleMessage(message) {
        const callbacks = {
            onSessionUpdate: this.onSessionUpdate,
            onPermissionRequest: this.onPermissionRequest,
            onAuthenticateUpdate: this.onAuthenticateUpdate,
            onEndTurn: this.onEndTurn,
        };
        // Handle message
        if ('method' in message) {
            // Request or notification
            this.messageHandler
                .handleIncomingRequest(message, callbacks)
                .then((result) => {
                if ('id' in message && typeof message.id === 'number') {
                    this.messageHandler.sendResponseMessage(this.child, {
                        jsonrpc: JSONRPC_VERSION,
                        id: message.id,
                        result,
                    });
                }
            })
                .catch((error) => {
                if ('id' in message && typeof message.id === 'number') {
                    const errorMessage = error instanceof Error
                        ? error.message
                        : typeof error === 'object' &&
                            error !== null &&
                            'message' in error &&
                            typeof error.message === 'string'
                            ? error.message
                            : String(error);
                    let errorCode = ACP_ERROR_CODES.INTERNAL_ERROR;
                    const errorCodeValue = typeof error === 'object' && error !== null && 'code' in error
                        ? error.code
                        : undefined;
                    if (typeof errorCodeValue === 'number') {
                        errorCode = errorCodeValue;
                    }
                    else if (errorCodeValue === 'ENOENT') {
                        errorCode = ACP_ERROR_CODES.RESOURCE_NOT_FOUND;
                    }
                    this.messageHandler.sendResponseMessage(this.child, {
                        jsonrpc: JSONRPC_VERSION,
                        id: message.id,
                        error: {
                            code: errorCode,
                            message: errorMessage,
                        },
                    });
                }
            });
        }
        else {
            // Response
            this.messageHandler.handleMessage(message, this.pendingRequests, callbacks);
        }
    }
    /**
     * Authenticate
     *
     * @param methodId - Authentication method ID
     * @returns Authentication response
     */
    async authenticate(methodId) {
        return this.sessionManager.authenticate(methodId, this.child, this.pendingRequests, this.nextRequestId);
    }
    /**
     * Create new session
     *
     * @param cwd - Working directory
     * @returns New session response
     */
    async newSession(cwd = process.cwd()) {
        return this.sessionManager.newSession(cwd, this.child, this.pendingRequests, this.nextRequestId);
    }
    /**
     * Send prompt message
     *
     * @param prompt - Prompt content
     * @returns Response
     */
    async sendPrompt(prompt) {
        return this.sessionManager.sendPrompt(prompt, this.child, this.pendingRequests, this.nextRequestId);
    }
    /**
     * Load existing session
     *
     * @param sessionId - Session ID
     * @returns Load response
     */
    async loadSession(sessionId, cwdOverride) {
        return this.sessionManager.loadSession(sessionId, this.child, this.pendingRequests, this.nextRequestId, cwdOverride || this.workingDir);
    }
    /**
     * Get session list
     *
     * @returns Session list response
     */
    async listSessions(options) {
        return this.sessionManager.listSessions(this.child, this.pendingRequests, this.nextRequestId, this.workingDir, options);
    }
    /**
     * Switch to specified session
     *
     * @param sessionId - Session ID
     * @returns Switch response
     */
    async switchSession(sessionId) {
        return this.sessionManager.switchSession(sessionId, this.nextRequestId);
    }
    /**
     * Cancel current session prompt generation
     */
    async cancelSession() {
        await this.sessionManager.cancelSession(this.child);
    }
    /**
     * Save current session
     *
     * @param tag - Save tag
     * @returns Save response
     */
    async saveSession(tag) {
        return this.sessionManager.saveSession(tag, this.child, this.pendingRequests, this.nextRequestId);
    }
    /**
     * Set approval mode
     */
    async setMode(modeId) {
        return this.sessionManager.setMode(modeId, this.child, this.pendingRequests, this.nextRequestId);
    }
    /**
     * Set model for current session
     *
     * @param modelId - Model ID
     * @returns Set model response
     */
    async setModel(modelId) {
        return this.sessionManager.setModel(modelId, this.child, this.pendingRequests, this.nextRequestId);
    }
    /**
     * Disconnect
     */
    disconnect() {
        if (this.child) {
            this.child.kill();
            this.child = null;
        }
        this.pendingRequests.clear();
        this.sessionManager.reset();
    }
    /**
     * Check if connected
     */
    get isConnected() {
        return this.child !== null && !this.child.killed;
    }
    /**
     * Check if there is an active session
     */
    get hasActiveSession() {
        return this.sessionManager.getCurrentSessionId() !== null;
    }
    /**
     * Get current session ID
     */
    get currentSessionId() {
        return this.sessionManager.getCurrentSessionId();
    }
}
//# sourceMappingURL=acpConnection.js.map