/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, Part, Tool, GenerateContentResponse, GenerateContentConfig } from '@google/genai';
import type { Config } from '../config/config.js';
import type { RetryInfo } from '../utils/rateLimit.js';
export interface OllamaChatOptions {
    systemInstruction?: string | Part | Part[];
    tools?: Tool[];
}
export interface SendMessageStreamParams {
    message: Part[];
    config: GenerateContentConfig;
}
export interface StreamEvent {
    type: 'chunk' | 'retry';
    value?: GenerateContentResponse;
    retryInfo?: RetryInfo;
}
export declare class OllamaChat {
    private readonly config;
    private history;
    private systemInstruction?;
    private tools?;
    constructor(config: Config, options: OllamaChatOptions, history: Content[]);
    addHistory(content: Content): void;
    getHistory(_curated?: boolean): Content[];
    setHistory(history: Content[]): void;
    stripThoughtsFromHistory(): void;
    setTools(tools: Tool[]): void;
    sendMessageStream(model: string, params: SendMessageStreamParams, prompt_id: string): AsyncGenerator<StreamEvent>;
    maybeIncludeSchemaDepthContext(_error: {
        message: string;
        status?: number;
    }): Promise<void>;
}
