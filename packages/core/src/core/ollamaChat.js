/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export class OllamaChat {
    config;
    history = [];
    systemInstruction;
    tools;
    constructor(config, options, history) {
        this.config = config;
        this.systemInstruction = options.systemInstruction;
        this.tools = options.tools;
        this.history = history;
    }
    addHistory(content) {
        this.history.push(content);
    }
    getHistory(_curated) {
        return this.history;
    }
    setHistory(history) {
        this.history = history;
    }
    stripThoughtsFromHistory() {
        // Remove thought parts from history
        this.history = this.history.map((content) => ({
            ...content,
            parts: content.parts?.filter((part) => !('thought' in part)) || [],
        }));
    }
    setTools(tools) {
        this.tools = tools;
    }
    async *sendMessageStream(model, params, prompt_id) {
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
            },
        };
        const stream = await contentGenerator.generateContentStream(request, prompt_id);
        for await (const response of stream) {
            yield { type: 'chunk', value: response };
        }
    }
    async maybeIncludeSchemaDepthContext(_error) {
        // No-op for now - can be extended to include schema depth context for debugging
    }
}
//# sourceMappingURL=ollamaChat.js.map