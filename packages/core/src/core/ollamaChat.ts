/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Content,
  Part,
  Tool,
  GenerateContentResponse,
  GenerateContentConfig,
} from '../types/content.js';
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

export class OllamaChat {
  private history: Content[] = [];
  private systemInstruction?: string | Part | Part[];
  private tools?: Tool[];

  constructor(
    private readonly config: Config,
    options: OllamaChatOptions,
    history: Content[],
  ) {
    this.systemInstruction = options.systemInstruction;
    this.tools = options.tools;
    this.history = history;
  }

  addHistory(content: Content): void {
    this.history.push(content);
  }

  getHistory(_curated?: boolean): Content[] {
    return this.history;
  }

  setHistory(history: Content[]): void {
    this.history = history;
  }

  stripThoughtsFromHistory(): void {
    // Remove thought parts from history
    this.history = this.history.map((content) => ({
      ...content,
      parts: content.parts?.filter((part) => !('thought' in part)) || [],
    }));
  }

  setTools(tools: Tool[]): void {
    this.tools = tools;
  }

  async *sendMessageStream(
    model: string,
    params: SendMessageStreamParams,
    prompt_id: string,
  ): AsyncGenerator<StreamEvent> {
    // Add user message to history
    this.history.push({ role: 'user', parts: params.message });

    const contentGenerator = this.config.getContentGenerator();

    const request = {
      model,
      contents: this.history,
      config: {
        ...params.config,
        systemInstruction: this.systemInstruction,
        tools: this.tools,
      } as GenerateContentConfig,
    };

    const stream = await contentGenerator.generateContentStream(
      request,
      prompt_id,
    );

    for await (const response of stream) {
      yield { type: 'chunk', value: response };
    }
  }

  async maybeIncludeSchemaDepthContext(_error: {
    message: string;
    status?: number;
  }): Promise<void> {
    // No-op for now - can be extended to include schema depth context for debugging
  }
}
