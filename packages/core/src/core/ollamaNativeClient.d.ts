/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Native Ollama API client for direct communication with Ollama server.
 * This client uses the native Ollama REST API endpoints, not the OpenAI-compatible API.
 *
 * API Documentation: https://github.com/ollama/ollama/blob/main/docs/api.md
 */
import type { Config } from '../config/config.js';
/**
 * Default Ollama base URL (native API, not OpenAI-compatible)
 */
export declare const DEFAULT_OLLAMA_NATIVE_URL = "http://localhost:11434";
/**
 * Default timeout for API requests (5 minutes)
 */
export declare const DEFAULT_OLLAMA_TIMEOUT = 300000;
/**
 * Model information returned by /api/tags and /api/show
 */
export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details?: OllamaModelDetails;
    modelfile?: string;
    parameters?: string;
    template?: string;
    license?: string;
    system?: string;
}
/**
 * Detailed model information
 */
export interface OllamaModelDetails {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
    parent_model?: string;
}
/**
 * Model info from /api/tags response
 */
export interface OllamaTagsResponse {
    models: OllamaModel[];
}
/**
 * Running model from /api/ps response
 */
export interface OllamaRunningModel {
    name: string;
    model: string;
    size: number;
    digest: string;
    details: OllamaModelDetails;
    expires_at: string;
    size_vram: number;
}
/**
 * Response from /api/ps
 */
export interface OllamaPsResponse {
    models: OllamaRunningModel[];
}
/**
 * Request for /api/generate
 */
export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    suffix?: string;
    images?: string[];
    system?: string;
    template?: string;
    context?: number[];
    stream?: boolean;
    raw?: boolean;
    format?: 'json' | string;
    keep_alive?: string | number;
    options?: OllamaModelOptions;
}
/**
 * Response from /api/generate (streaming and non-streaming)
 */
export interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}
/**
 * Chat message
 */
export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    images?: string[];
    tool_calls?: OllamaToolCall[];
}
/**
 * Tool call in a message
 */
export interface OllamaToolCall {
    function: {
        name: string;
        arguments: Record<string, unknown>;
    };
}
/**
 * Tool definition
 */
export interface OllamaTool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}
/**
 * Request for /api/chat
 */
export interface OllamaChatRequest {
    model: string;
    messages: OllamaChatMessage[];
    tools?: OllamaTool[];
    stream?: boolean;
    format?: 'json' | string;
    keep_alive?: string | number;
    options?: OllamaModelOptions;
}
/**
 * Response from /api/chat
 */
export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: OllamaChatMessage;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}
/**
 * Model options for generation
 */
export interface OllamaModelOptions {
    numa?: boolean;
    num_ctx?: number;
    num_batch?: number;
    num_gpu?: number;
    main_gpu?: number;
    low_vram?: boolean;
    f16_kv?: boolean;
    logits_all?: boolean;
    vocab_only?: boolean;
    use_mmap?: boolean;
    use_mlock?: boolean;
    embedding_only?: boolean;
    num_thread?: number;
    num_keep?: number;
    seed?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
    tfs_z?: number;
    typical_p?: number;
    repeat_last_n?: number;
    temperature?: number;
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    mirostat?: number;
    mirostat_tau?: number;
    mirostat_eta?: number;
    penalize_newline?: boolean;
    stop?: string[];
}
/**
 * Request for /api/embed
 */
export interface OllamaEmbedRequest {
    model: string;
    input: string | string[];
    truncate?: boolean;
    keep_alive?: string | number;
    options?: OllamaModelOptions;
}
/**
 * Response from /api/embed
 */
export interface OllamaEmbedResponse {
    model: string;
    embeddings: number[][];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
}
/**
 * Request for /api/embeddings (legacy)
 */
export interface OllamaEmbeddingsRequest {
    model: string;
    prompt: string;
    options?: OllamaModelOptions;
    keep_alive?: string | number;
}
/**
 * Response from /api/embeddings (legacy)
 */
export interface OllamaEmbeddingsResponse {
    embedding: number[];
}
/**
 * Request for /api/pull
 */
export interface OllamaPullRequest {
    name: string;
    insecure?: boolean;
    stream?: boolean;
}
/**
 * Response from /api/pull (streaming)
 */
export interface OllamaPullResponse {
    status: string;
    digest?: string;
    total?: number;
    completed?: number;
}
/**
 * Request for /api/push
 */
export interface OllamaPushRequest {
    name: string;
    insecure?: boolean;
    stream?: boolean;
}
/**
 * Response from /api/push (streaming)
 */
export interface OllamaPushResponse {
    status: string;
    digest?: string;
    total?: number;
    completed?: number;
}
/**
 * Request for /api/copy
 */
export interface OllamaCopyRequest {
    source: string;
    destination: string;
}
/**
 * Request for /api/delete
 */
export interface OllamaDeleteRequest {
    model: string;
}
/**
 * Request for /api/show
 */
export interface OllamaShowRequest {
    model: string;
    system?: string;
    template?: string;
    options?: OllamaModelOptions;
}
/**
 * Response from /api/show
 */
export interface OllamaShowResponse {
    modelfile: string;
    parameters: string;
    template: string;
    details: OllamaModelDetails;
    model_info?: Record<string, unknown>;
    license?: string;
    system?: string;
}
/**
 * Response from /api/version
 */
export interface OllamaVersionResponse {
    version: string;
}
/**
 * Progress event for streaming operations
 */
export interface OllamaProgressEvent {
    status: string;
    digest?: string;
    total?: number;
    completed?: number;
    percentage?: number;
}
/**
 * Callback for streaming responses
 */
export type StreamCallback<T> = (chunk: T) => void;
/**
 * Callback for progress events
 */
export type ProgressCallback = (event: OllamaProgressEvent) => void;
/**
 * Native Ollama API client.
 * Provides methods to interact with all Ollama REST API endpoints.
 */
export declare class OllamaNativeClient {
    private baseUrl;
    private timeout;
    constructor(options?: {
        baseUrl?: string;
        timeout?: number;
        config?: Config;
    });
    /**
     * Get the base URL for the Ollama API
     */
    getBaseUrl(): string;
    /**
     * Make an HTTP request to the Ollama API
     */
    private request;
    /**
     * Make a streaming HTTP request to the Ollama API
     */
    private streamingRequest;
    /**
     * List local models.
     * GET /api/tags
     *
     * @example
     * const models = await client.listModels();
     * console.log(models.models);
     */
    listModels(): Promise<OllamaTagsResponse>;
    /**
     * Show model information.
     * POST /api/show
     *
     * @example
     * const info = await client.showModel('llama3.2');
     * console.log(info.modelfile);
     */
    showModel(model: string | OllamaShowRequest): Promise<OllamaShowResponse>;
    /**
     * Copy a model.
     * POST /api/copy
     *
     * @example
     * await client.copyModel('llama3.2', 'llama3-backup');
     */
    copyModel(source: string, destination: string): Promise<void>;
    /**
     * Delete a model.
     * DELETE /api/delete
     *
     * @example
     * await client.deleteModel('llama3:13b');
     */
    deleteModel(model: string): Promise<void>;
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
    pullModel(name: string, progressCallback?: ProgressCallback): Promise<void>;
    /**
     * Push a model to the registry.
     * POST /api/push
     *
     * @example
     * await client.pushModel('mattw/pygmalion:latest', (progress) => {
     *   console.log(progress.status);
     * });
     */
    pushModel(name: string, progressCallback?: ProgressCallback): Promise<void>;
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
    generate(request: OllamaGenerateRequest, streamCallback?: StreamCallback<OllamaGenerateResponse>): Promise<OllamaGenerateResponse>;
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
    chat(request: OllamaChatRequest, streamCallback?: StreamCallback<OllamaChatResponse>): Promise<OllamaChatResponse>;
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
    embed(request: OllamaEmbedRequest): Promise<OllamaEmbedResponse>;
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
    embeddings(request: OllamaEmbeddingsRequest): Promise<OllamaEmbeddingsResponse>;
    /**
     * Get the Ollama version.
     * GET /api/version
     *
     * @example
     * const { version } = await client.getVersion();
     * console.log(`Ollama version: ${version}`);
     */
    getVersion(): Promise<OllamaVersionResponse>;
    /**
     * List running models.
     * GET /api/ps
     *
     * @example
     * const { models } = await client.listRunningModels();
     * console.log('Running models:', models.map(m => m.name));
     */
    listRunningModels(): Promise<OllamaPsResponse>;
    /**
     * Check if Ollama server is running and accessible.
     */
    isServerRunning(): Promise<boolean>;
    /**
     * Wait for the Ollama server to be ready.
     *
     * @param maxAttempts Maximum number of connection attempts
     * @param delayMs Delay between attempts in milliseconds
     */
    waitForServer(maxAttempts?: number, delayMs?: number): Promise<boolean>;
    /**
     * Check if a model is available locally.
     */
    isModelAvailable(modelName: string): Promise<boolean>;
    /**
     * Ensure a model is available (pull if necessary).
     */
    ensureModelAvailable(modelName: string, progressCallback?: ProgressCallback): Promise<void>;
}
/**
 * Create an Ollama native API client.
 *
 * @example
 * const client = createOllamaClient();
 * const models = await client.listModels();
 */
export declare function createOllamaNativeClient(options?: {
    baseUrl?: string;
    timeout?: number;
    config?: Config;
}): OllamaNativeClient;
