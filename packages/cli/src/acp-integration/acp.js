/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/* ACP defines a schema for a simple (experimental) JSON-RPC protocol that allows GUI applications to interact with agents. */
import { z } from 'zod';
import { createDebugLogger } from '@ollama-code/ollama-code-core';
import * as schema from './schema.js';
import { ACP_ERROR_CODES } from './errorCodes.js';
import { pickAuthMethodsForDetails } from './authMethods.js';
export * from './schema.js';
const debugLogger = createDebugLogger('ACP_PROTOCOL');
export class AgentSideConnection {
    #connection;
    constructor(toAgent, input, output) {
        const agent = toAgent(this);
        const handler = async (method, params) => {
            switch (method) {
                case schema.AGENT_METHODS.initialize: {
                    const validatedParams = schema.initializeRequestSchema.parse(params);
                    return agent.initialize(validatedParams);
                }
                case schema.AGENT_METHODS.session_new: {
                    const validatedParams = schema.newSessionRequestSchema.parse(params);
                    return agent.newSession(validatedParams);
                }
                case schema.AGENT_METHODS.session_load: {
                    if (!agent.loadSession) {
                        throw RequestError.methodNotFound();
                    }
                    const validatedParams = schema.loadSessionRequestSchema.parse(params);
                    return agent.loadSession(validatedParams);
                }
                case schema.AGENT_METHODS.session_list: {
                    if (!agent.listSessions) {
                        throw RequestError.methodNotFound();
                    }
                    const validatedParams = schema.listSessionsRequestSchema.parse(params);
                    return agent.listSessions(validatedParams);
                }
                case schema.AGENT_METHODS.authenticate: {
                    const validatedParams = schema.authenticateRequestSchema.parse(params);
                    return agent.authenticate(validatedParams);
                }
                case schema.AGENT_METHODS.session_prompt: {
                    const validatedParams = schema.promptRequestSchema.parse(params);
                    return agent.prompt(validatedParams);
                }
                case schema.AGENT_METHODS.session_cancel: {
                    const validatedParams = schema.cancelNotificationSchema.parse(params);
                    return agent.cancel(validatedParams);
                }
                case schema.AGENT_METHODS.session_set_mode: {
                    if (!agent.setMode) {
                        throw RequestError.methodNotFound();
                    }
                    const validatedParams = schema.setModeRequestSchema.parse(params);
                    return agent.setMode(validatedParams);
                }
                case schema.AGENT_METHODS.session_set_model: {
                    if (!agent.setModel) {
                        throw RequestError.methodNotFound();
                    }
                    const validatedParams = schema.setModelRequestSchema.parse(params);
                    return agent.setModel(validatedParams);
                }
                default:
                    throw RequestError.methodNotFound(method);
            }
        };
        this.#connection = new Connection(handler, input, output);
    }
    /**
     * Streams new content to the client including text, tool calls, etc.
     */
    async sessionUpdate(params) {
        return await this.#connection.sendNotification(schema.CLIENT_METHODS.session_update, params);
    }
    /**
     * Streams authentication updates (e.g. Ollama configuration) to the client.
     */
    async authenticateUpdate(params) {
        return await this.#connection.sendNotification(schema.CLIENT_METHODS.authenticate_update, params);
    }
    /**
     * Sends a custom notification to the client.
     * Used for extension-specific notifications that are not part of the core ACP protocol.
     */
    async sendCustomNotification(method, params) {
        return await this.#connection.sendNotification(method, params);
    }
    /**
     * Request permission before running a tool
     *
     * The agent specifies a series of permission options with different granularity,
     * and the client returns the chosen one.
     */
    async requestPermission(params) {
        return await this.#connection.sendRequest(schema.CLIENT_METHODS.session_request_permission, params);
    }
    async readTextFile(params) {
        return await this.#connection.sendRequest(schema.CLIENT_METHODS.fs_read_text_file, params);
    }
    async writeTextFile(params) {
        return await this.#connection.sendRequest(schema.CLIENT_METHODS.fs_write_text_file, params);
    }
}
class Connection {
    #pendingResponses = new Map();
    #nextRequestId = 0;
    #handler;
    #peerInput;
    #writeQueue = Promise.resolve();
    #textEncoder;
    constructor(handler, peerInput, peerOutput) {
        this.#handler = handler;
        this.#peerInput = peerInput;
        this.#textEncoder = new TextEncoder();
        this.#receive(peerOutput);
    }
    async #receive(output) {
        let content = '';
        const decoder = new TextDecoder();
        for await (const chunk of output) {
            content += decoder.decode(chunk, { stream: true });
            const lines = content.split('\n');
            content = lines.pop() || '';
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    try {
                        const message = JSON.parse(trimmedLine);
                        this.#processMessage(message);
                    }
                    catch (error) {
                        debugLogger.error('ACP parse error for inbound message.', {
                            code: ACP_ERROR_CODES.PARSE_ERROR,
                            line: trimmedLine,
                            error,
                        });
                    }
                }
            }
        }
    }
    async #processMessage(message) {
        if ('method' in message && 'id' in message) {
            // It's a request
            const response = await this.#tryCallHandler(message.method, message.params);
            await this.#sendMessage({
                jsonrpc: '2.0',
                id: message.id,
                ...response,
            });
        }
        else if ('method' in message) {
            // It's a notification
            await this.#tryCallHandler(message.method, message.params);
        }
        else if ('id' in message) {
            // It's a response
            this.#handleResponse(message);
        }
    }
    async #tryCallHandler(method, params) {
        try {
            const result = await this.#handler(method, params);
            return { result: result ?? null };
        }
        catch (error) {
            if (error instanceof RequestError) {
                debugLogger.debug('ACP handler returned request error.', {
                    method,
                    code: error.code,
                    message: error.message,
                    details: error.data?.details,
                });
                return error.toResult();
            }
            if (error instanceof z.ZodError) {
                const formattedDetails = JSON.stringify(error.format(), undefined, 2);
                debugLogger.debug('ACP handler validation error.', {
                    method,
                    code: ACP_ERROR_CODES.INVALID_PARAMS,
                    details: formattedDetails,
                });
                return RequestError.invalidParams(formattedDetails).toResult();
            }
            let errorName;
            let details;
            if (error instanceof Error) {
                errorName = error.name;
                details = error.message;
            }
            else if (typeof error === 'object' &&
                error != null &&
                'message' in error &&
                typeof error.message === 'string') {
                details = error.message;
            }
            if (errorName === 'TokenManagerError' || details?.includes('/auth')) {
                return RequestError.authRequired(details, pickAuthMethodsForDetails(details)).toResult();
            }
            debugLogger.error('ACP handler failed with internal error.', { method, errorName, details }, error);
            return RequestError.internalError(details).toResult();
        }
    }
    #handleResponse(response) {
        const pendingResponse = this.#pendingResponses.get(response.id);
        if (pendingResponse) {
            if ('result' in response) {
                pendingResponse.resolve(response.result);
            }
            else if ('error' in response) {
                const { error } = response;
                debugLogger.warn('ACP response error received.', {
                    id: response.id,
                    code: error.code,
                    message: error.message,
                    data: error.data,
                });
                pendingResponse.reject(error);
            }
            this.#pendingResponses.delete(response.id);
        }
    }
    async sendRequest(method, params) {
        const id = this.#nextRequestId++;
        const responsePromise = new Promise((resolve, reject) => {
            this.#pendingResponses.set(id, { resolve, reject });
        });
        await this.#sendMessage({ jsonrpc: '2.0', id, method, params });
        return responsePromise;
    }
    async sendNotification(method, params) {
        await this.#sendMessage({ jsonrpc: '2.0', method, params });
    }
    async #sendMessage(json) {
        const content = JSON.stringify(json) + '\n';
        this.#writeQueue = this.#writeQueue
            .then(async () => {
            const writer = this.#peerInput.getWriter();
            try {
                await writer.write(this.#textEncoder.encode(content));
            }
            finally {
                writer.releaseLock();
            }
        })
            .catch((error) => {
            // Continue processing writes on error
            debugLogger.error('ACP write error:', error);
        });
        return this.#writeQueue;
    }
}
export class RequestError extends Error {
    code;
    data;
    constructor(code, message, details, authMethods) {
        super(message);
        this.code = code;
        this.name = 'RequestError';
        if (details || authMethods) {
            this.data = {};
            if (details) {
                this.data.details = details;
            }
            if (authMethods) {
                this.data.authMethods = authMethods;
            }
        }
    }
    static parseError(details) {
        return new RequestError(ACP_ERROR_CODES.PARSE_ERROR, 'Parse error', details);
    }
    static invalidRequest(details) {
        return new RequestError(ACP_ERROR_CODES.INVALID_REQUEST, 'Invalid request', details);
    }
    static methodNotFound(details) {
        return new RequestError(ACP_ERROR_CODES.METHOD_NOT_FOUND, 'Method not found', details);
    }
    static invalidParams(details) {
        return new RequestError(ACP_ERROR_CODES.INVALID_PARAMS, 'Invalid params', details);
    }
    static internalError(details) {
        return new RequestError(ACP_ERROR_CODES.INTERNAL_ERROR, 'Internal error', details);
    }
    static authRequired(details, authMethods) {
        return new RequestError(ACP_ERROR_CODES.AUTH_REQUIRED, 'Authentication required', details, authMethods);
    }
    toResult() {
        return {
            error: {
                code: this.code,
                message: this.message,
                data: this.data,
            },
        };
    }
}
//# sourceMappingURL=acp.js.map