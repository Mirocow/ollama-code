/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Default Ollama base URL (native API, not OpenAI-compatible)
 */
export const DEFAULT_OLLAMA_NATIVE_URL = 'http://localhost:11434';
/**
 * Default timeout for API requests (5 minutes)
 */
export const DEFAULT_OLLAMA_TIMEOUT = 300000;
// ============================================================================
// OllamaNativeClient
// ============================================================================
/**
 * Native Ollama API client.
 * Provides methods to interact with all Ollama REST API endpoints.
 */
export class OllamaNativeClient {
    baseUrl;
    timeout;
    constructor(options) {
        this.baseUrl = options?.baseUrl ?? DEFAULT_OLLAMA_NATIVE_URL;
        this.timeout = options?.timeout ?? DEFAULT_OLLAMA_TIMEOUT;
        // options.config is reserved for future use (e.g., proxy settings)
    }
    /**
     * Get the base URL for the Ollama API
     */
    getBaseUrl() {
        return this.baseUrl;
    }
    /**
     * Make an HTTP request to the Ollama API
     */
    async request(endpoint, method = 'GET', body) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Ollama API error: ${response.status} ${response.statusText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) {
                        errorMessage = errorJson.error;
                    }
                }
                catch {
                    // Use default error message
                }
                throw new Error(errorMessage);
            }
            return await response.json();
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Make a streaming HTTP request to the Ollama API
     */
    async streamingRequest(endpoint, body, callback) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/x-ndjson',
                },
                body: JSON.stringify({ ...body, stream: true }),
                signal: controller.signal,
            });
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Ollama API error: ${response.status} ${response.statusText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) {
                        errorMessage = errorJson.error;
                    }
                }
                catch {
                    // Use default error message
                }
                throw new Error(errorMessage);
            }
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body is not readable');
            }
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const parsed = JSON.parse(line);
                            callback(parsed);
                        }
                        catch {
                            // Skip malformed JSON lines
                        }
                    }
                }
            }
            // Process any remaining data
            if (buffer.trim()) {
                try {
                    const parsed = JSON.parse(buffer);
                    callback(parsed);
                }
                catch {
                    // Skip malformed JSON
                }
            }
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    // ========================================================================
    // Model Management API
    // ========================================================================
    /**
     * List local models.
     * GET /api/tags
     *
     * @example
     * const models = await client.listModels();
     * console.log(models.models);
     */
    async listModels() {
        return this.request('/api/tags');
    }
    /**
     * Show model information.
     * POST /api/show
     *
     * @example
     * const info = await client.showModel('llama3.2');
     * console.log(info.modelfile);
     */
    async showModel(model) {
        const body = typeof model === 'string' ? { model } : model;
        return this.request('/api/show', 'POST', body);
    }
    /**
     * Copy a model.
     * POST /api/copy
     *
     * @example
     * await client.copyModel('llama3.2', 'llama3-backup');
     */
    async copyModel(source, destination) {
        await this.request('/api/copy', 'POST', { source, destination });
    }
    /**
     * Delete a model.
     * DELETE /api/delete
     *
     * @example
     * await client.deleteModel('llama3:13b');
     */
    async deleteModel(model) {
        await this.request('/api/delete', 'DELETE', { model });
    }
    /**
     * Pull a model from the registry.
     * POST /api/pull
     *
     * @example
     * // Non-streaming
     * await client.pullModel('llama3.2');
     *
     * // With progress callback
     * await client.pullModel('llama3.2', (progress) => {
     *   console.log(`${progress.status}: ${progress.percentage?.toFixed(1)}%`);
     * });
     */
    async pullModel(name, progressCallback) {
        if (progressCallback) {
            await this.streamingRequest('/api/pull', { name, stream: true }, (response) => {
                const percentage = response.total
                    ? ((response.completed ?? 0) / response.total) * 100
                    : undefined;
                progressCallback({
                    status: response.status,
                    digest: response.digest,
                    total: response.total,
                    completed: response.completed,
                    percentage,
                });
            });
        }
        else {
            await this.request('/api/pull', 'POST', { name, stream: false });
        }
    }
    /**
     * Push a model to the registry.
     * POST /api/push
     *
     * @example
     * await client.pushModel('mattw/pygmalion:latest', (progress) => {
     *   console.log(progress.status);
     * });
     */
    async pushModel(name, progressCallback) {
        if (progressCallback) {
            await this.streamingRequest('/api/push', { name, stream: true }, (response) => {
                const percentage = response.total
                    ? ((response.completed ?? 0) / response.total) * 100
                    : undefined;
                progressCallback({
                    status: response.status,
                    digest: response.digest,
                    total: response.total,
                    completed: response.completed,
                    percentage,
                });
            });
        }
        else {
            await this.request('/api/push', 'POST', { name, stream: false });
        }
    }
    // ========================================================================
    // Generation API
    // ========================================================================
    /**
     * Generate text from a prompt.
     * POST /api/generate
     *
     * @example
     * // Non-streaming
     * const response = await client.generate({
     *   model: 'llama3.2',
     *   prompt: 'Why is the sky blue?',
     * });
     * console.log(response.response);
     *
     * // Streaming
     * await client.generate({
     *   model: 'llama3.2',
     *   prompt: 'Tell me a story',
     * }, (chunk) => {
     *   process.stdout.write(chunk.response);
     * });
     */
    async generate(request, streamCallback) {
        if (streamCallback) {
            let finalResponse = null;
            await this.streamingRequest('/api/generate', request, (chunk) => {
                streamCallback(chunk);
                if (chunk.done) {
                    finalResponse = chunk;
                }
            });
            if (!finalResponse) {
                throw new Error('Stream ended without final response');
            }
            return finalResponse;
        }
        return this.request('/api/generate', 'POST', {
            ...request,
            stream: false,
        });
    }
    /**
     * Chat with a model.
     * POST /api/chat
     *
     * @example
     * const response = await client.chat({
     *   model: 'llama3.2',
     *   messages: [
     *     { role: 'user', content: 'Hello!' }
     *   ],
     * });
     * console.log(response.message.content);
     */
    async chat(request, streamCallback) {
        if (streamCallback) {
            let finalResponse = null;
            await this.streamingRequest('/api/chat', request, (chunk) => {
                streamCallback(chunk);
                if (chunk.done) {
                    finalResponse = chunk;
                }
            });
            if (!finalResponse) {
                throw new Error('Stream ended without final response');
            }
            return finalResponse;
        }
        return this.request('/api/chat', 'POST', {
            ...request,
            stream: false,
        });
    }
    // ========================================================================
    // Embeddings API
    // ========================================================================
    /**
     * Generate embeddings for text.
     * POST /api/embed
     *
     * @example
     * const response = await client.embed({
     *   model: 'all-minilm',
     *   input: ['Why is the sky blue?', 'Why is the grass green?'],
     * });
     * console.log(response.embeddings);
     */
    async embed(request) {
        return this.request('/api/embed', 'POST', request);
    }
    /**
     * Generate embeddings (legacy endpoint).
     * POST /api/embeddings
     *
     * @example
     * const response = await client.embeddings({
     *   model: 'all-minilm',
     *   prompt: 'Here is an article about llamas...',
     * });
     * console.log(response.embedding);
     */
    async embeddings(request) {
        return this.request('/api/embeddings', 'POST', request);
    }
    // ========================================================================
    // Server API
    // ========================================================================
    /**
     * Get the Ollama version.
     * GET /api/version
     *
     * @example
     * const { version } = await client.getVersion();
     * console.log(`Ollama version: ${version}`);
     */
    async getVersion() {
        return this.request('/api/version');
    }
    /**
     * List running models.
     * GET /api/ps
     *
     * @example
     * const { models } = await client.listRunningModels();
     * console.log('Running models:', models.map(m => m.name));
     */
    async listRunningModels() {
        return this.request('/api/ps');
    }
    // ========================================================================
    // Utility Methods
    // ========================================================================
    /**
     * Check if Ollama server is running and accessible.
     */
    async isServerRunning() {
        try {
            await this.getVersion();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Wait for the Ollama server to be ready.
     *
     * @param maxAttempts Maximum number of connection attempts
     * @param delayMs Delay between attempts in milliseconds
     */
    async waitForServer(maxAttempts = 30, delayMs = 1000) {
        for (let i = 0; i < maxAttempts; i++) {
            if (await this.isServerRunning()) {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        return false;
    }
    /**
     * Check if a model is available locally.
     */
    async isModelAvailable(modelName) {
        try {
            const { models } = await this.listModels();
            return models.some((m) => m.name === modelName || m.name.startsWith(`${modelName}:`));
        }
        catch {
            return false;
        }
    }
    /**
     * Ensure a model is available (pull if necessary).
     */
    async ensureModelAvailable(modelName, progressCallback) {
        if (!(await this.isModelAvailable(modelName))) {
            await this.pullModel(modelName, progressCallback);
        }
    }
}
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create an Ollama native API client.
 *
 * @example
 * const client = createOllamaClient();
 * const models = await client.listModels();
 */
export function createOllamaNativeClient(options) {
    return new OllamaNativeClient(options);
}
//# sourceMappingURL=ollamaNativeClient.js.map