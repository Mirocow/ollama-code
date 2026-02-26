/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { APPROVAL_MODE_INFO, APPROVAL_MODES, AuthType, createDebugLogger, MCPServerConfig, SessionService, tokenLimit, } from '@ollama-code/ollama-code-core';
import * as acp from './acp.js';
import { buildAuthMethods } from './authMethods.js';
import { AcpFileSystemService } from './service/filesystem.js';
import { Readable, Writable } from 'node:stream';
import { SettingScope } from '../config/settings.js';
import { z } from 'zod';
import { loadCliConfig } from '../config/config.js';
// Import the modular Session class
import { Session } from './session/Session.js';
import { formatAcpModelId } from '../utils/acpModelUtils.js';
const debugLogger = createDebugLogger('ACP_AGENT');
export async function runAcpAgent(config, settings, argv) {
    const stdout = Writable.toWeb(process.stdout);
    const stdin = Readable.toWeb(process.stdin);
    // Stdout is used to send messages to the client, so console.log/console.info
    // messages to stderr so that they don't interfere with ACP.
    console.log = console.error;
    console.info = console.error;
    console.debug = console.error;
    new acp.AgentSideConnection((client) => new OllamaAgent(config, settings, argv, client), stdout, stdin);
}
class OllamaAgent {
    config;
    settings;
    argv;
    client;
    sessions = new Map();
    clientCapabilities;
    constructor(config, settings, argv, client) {
        this.config = config;
        this.settings = settings;
        this.argv = argv;
        this.client = client;
    }
    async initialize(args) {
        this.clientCapabilities = args.clientCapabilities;
        const authMethods = buildAuthMethods();
        // Get current approval mode from config
        const currentApprovalMode = this.config.getApprovalMode();
        // Build available modes from shared APPROVAL_MODE_INFO
        const availableModes = APPROVAL_MODES.map((mode) => ({
            id: mode,
            name: APPROVAL_MODE_INFO[mode].name,
            description: APPROVAL_MODE_INFO[mode].description,
        }));
        const version = process.env['CLI_VERSION'] || process.version;
        return {
            protocolVersion: acp.PROTOCOL_VERSION,
            agentInfo: {
                name: 'ollama-code',
                title: 'Ollama Code',
                version,
            },
            authMethods,
            modes: {
                currentModeId: currentApprovalMode,
                availableModes,
            },
            agentCapabilities: {
                loadSession: true,
                promptCapabilities: {
                    image: true,
                    audio: true,
                    embeddedContext: true,
                },
            },
        };
    }
    async authenticate({ methodId }) {
        const method = z.nativeEnum(AuthType).parse(methodId);
        // For Ollama, authentication is straightforward - just set the auth type
        // No OAuth flow needed
        if (method === AuthType.USE_OLLAMA) {
            this.settings.setValue(SettingScope.User, 'security.auth.selectedType', method);
            return;
        }
        throw new Error(`Unsupported authentication method: ${method}`);
    }
    async newSession({ cwd, mcpServers, }) {
        const config = await this.newSessionConfig(cwd, mcpServers);
        await this.ensureAuthenticated(config);
        this.setupFileSystem(config);
        const session = await this.createAndStoreSession(config);
        const availableModels = this.buildAvailableModels(config);
        return {
            sessionId: session.getId(),
            models: availableModels,
        };
    }
    async newSessionConfig(cwd, mcpServers, sessionId) {
        const mergedMcpServers = { ...this.settings.merged.mcpServers };
        for (const { command, args, env: rawEnv, name } of mcpServers) {
            const env = {};
            for (const { name: envName, value } of rawEnv) {
                env[envName] = value;
            }
            mergedMcpServers[name] = new MCPServerConfig(command, args, env, cwd);
        }
        const settings = { ...this.settings.merged, mcpServers: mergedMcpServers };
        const argvForSession = {
            ...this.argv,
            resume: sessionId,
            continue: false,
        };
        const config = await loadCliConfig(settings, argvForSession, cwd);
        await config.initialize();
        return config;
    }
    async cancel(params) {
        const session = this.sessions.get(params.sessionId);
        if (!session) {
            throw new Error(`Session not found: ${params.sessionId}`);
        }
        await session.cancelPendingPrompt();
    }
    async prompt(params) {
        const session = this.sessions.get(params.sessionId);
        if (!session) {
            throw new Error(`Session not found: ${params.sessionId}`);
        }
        return session.prompt(params);
    }
    async loadSession(params) {
        const sessionService = new SessionService(params.cwd);
        const exists = await sessionService.sessionExists(params.sessionId);
        if (!exists) {
            throw acp.RequestError.invalidParams(`Session not found for id: ${params.sessionId}`);
        }
        const config = await this.newSessionConfig(params.cwd, params.mcpServers, params.sessionId);
        await this.ensureAuthenticated(config);
        this.setupFileSystem(config);
        const sessionData = config.getResumedSessionData();
        if (!sessionData) {
            throw acp.RequestError.internalError(`Failed to load session data for id: ${params.sessionId}`);
        }
        await this.createAndStoreSession(config, sessionData.conversation);
        return null;
    }
    async listSessions(params) {
        const sessionService = new SessionService(params.cwd);
        const result = await sessionService.listSessions({
            cursor: params.cursor,
            size: params.size,
        });
        return {
            items: result.items.map((item) => ({
                sessionId: item.sessionId,
                cwd: item.cwd,
                startTime: item.startTime,
                mtime: item.mtime,
                prompt: item.prompt,
                gitBranch: item.gitBranch,
                filePath: item.filePath,
                messageCount: item.messageCount,
            })),
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        };
    }
    async setMode(params) {
        const session = this.sessions.get(params.sessionId);
        if (!session) {
            throw acp.RequestError.invalidParams(`Session not found for id: ${params.sessionId}`);
        }
        return session.setMode(params);
    }
    async setModel(params) {
        const session = this.sessions.get(params.sessionId);
        if (!session) {
            throw acp.RequestError.invalidParams(`Session not found for id: ${params.sessionId}`);
        }
        return await session.setModel(params);
    }
    async ensureAuthenticated(config) {
        const selectedType = config.getModelsConfig().getCurrentAuthType();
        if (!selectedType) {
            throw acp.RequestError.authRequired('Use Ollama Code CLI to authenticate first.', this.pickAuthMethodsForAuthRequired());
        }
        // For Ollama, no authentication check is needed for local instances
        // Just verify the configuration is valid
        try {
            await config.refreshAuth(selectedType, true);
        }
        catch (e) {
            debugLogger.error(`Authentication check failed: ${e}`);
            throw acp.RequestError.authRequired('Ollama connection failed: ' + e.message, this.pickAuthMethodsForAuthRequired(selectedType, e));
        }
    }
    pickAuthMethodsForAuthRequired(_selectedType, _error) {
        // Only Ollama is supported
        return buildAuthMethods();
    }
    setupFileSystem(config) {
        if (!this.clientCapabilities?.fs) {
            return;
        }
        const acpFileSystemService = new AcpFileSystemService(this.client, config.getSessionId(), this.clientCapabilities.fs, config.getFileSystemService());
        config.setFileSystemService(acpFileSystemService);
    }
    async createAndStoreSession(config, conversation) {
        const sessionId = config.getSessionId();
        const geminiClient = config.getOllamaClient();
        // Use OllamaClient to manage chat lifecycle properly
        if (!geminiClient.isInitialized()) {
            await geminiClient.initialize();
        }
        // Now get the chat instance that's managed by OllamaClient
        const chat = geminiClient.getChat();
        const session = new Session(sessionId, chat, config, this.client, this.settings);
        this.sessions.set(sessionId, session);
        setTimeout(async () => {
            await session.sendAvailableCommandsUpdate();
        }, 0);
        if (conversation && conversation.messages) {
            await session.replayHistory(conversation.messages);
        }
        return session;
    }
    buildAvailableModels(config) {
        const rawCurrentModelId = (config.getModel() ||
            this.config.getModel() ||
            '').trim();
        const currentAuthType = config.getAuthType();
        const allConfiguredModels = config.getAllConfiguredModels();
        // Check if current model is a runtime model
        const activeRuntimeSnapshot = config.getActiveRuntimeModelSnapshot?.();
        const currentModelId = activeRuntimeSnapshot
            ? formatAcpModelId(activeRuntimeSnapshot.id, activeRuntimeSnapshot.authType)
            : this.formatCurrentModelId(rawCurrentModelId, currentAuthType);
        const availableModels = allConfiguredModels;
        const mappedAvailableModels = availableModels.map((model) => {
            const effectiveModelId = model.isRuntimeModel && model.runtimeSnapshotId
                ? model.runtimeSnapshotId
                : model.id;
            return {
                modelId: formatAcpModelId(effectiveModelId, model.authType),
                name: model.label,
                description: model.description ?? null,
                _meta: {
                    contextLimit: model.contextWindowSize ?? tokenLimit(model.id),
                },
            };
        });
        return {
            currentModelId,
            availableModels: mappedAvailableModels,
        };
    }
    formatCurrentModelId(baseModelId, authType) {
        if (!baseModelId) {
            return baseModelId;
        }
        return authType ? formatAcpModelId(baseModelId, authType) : baseModelId;
    }
}
//# sourceMappingURL=acpAgent.js.map