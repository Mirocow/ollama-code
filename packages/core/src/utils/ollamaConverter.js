/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { FinishReason as FR } from '../types/index.js';
// ============================================================================
// Content to Ollama Message Conversion
// ============================================================================
/**
 * Convert Content[] to OllamaChatMessage[].
 * This is the main conversion function for chat requests.
 */
export function contentsToOllamaMessages(contents) {
    const messages = [];
    for (const content of contents) {
        const role = mapRoleToOllama(content.role);
        // Handle different content types
        if (content.role === 'tool') {
            // Tool response - convert to assistant message with tool results
            for (const part of content.parts) {
                if ('functionResponse' in part) {
                    // Ollama uses tool role for responses
                    messages.push({
                        role: 'tool',
                        content: JSON.stringify(part.functionResponse.response),
                    });
                }
            }
        }
        else if (content.role === 'model') {
            // Model/assistant message
            const textParts = [];
            const toolCalls = [];
            for (const part of content.parts) {
                if ('text' in part && part.text) {
                    textParts.push(part.text);
                }
                else if ('functionCall' in part) {
                    toolCalls.push({
                        function: {
                            name: part.functionCall.name,
                            arguments: part.functionCall.args,
                        },
                    });
                }
            }
            const message = {
                role: 'assistant',
                content: textParts.join('\n'),
            };
            if (toolCalls.length > 0) {
                message.tool_calls = toolCalls;
            }
            messages.push(message);
        }
        else {
            // User or system message
            const textParts = [];
            const images = [];
            for (const part of content.parts) {
                if ('text' in part && part.text) {
                    textParts.push(part.text);
                }
                else if ('inlineData' in part && part.inlineData.mimeType.startsWith('image/')) {
                    images.push(part.inlineData.data);
                }
            }
            const message = {
                role,
                content: textParts.join('\n'),
            };
            if (images.length > 0) {
                message.images = images;
            }
            messages.push(message);
        }
    }
    return messages;
}
/**
 * Map our role to Ollama role.
 */
function mapRoleToOllama(role) {
    switch (role) {
        case 'system':
            return 'system';
        case 'user':
            return 'user';
        case 'model':
        case 'assistant':
            return 'assistant';
        case 'tool':
            return 'tool';
        default:
            return 'user';
    }
}
// ============================================================================
// Ollama Response to Content Conversion
// ============================================================================
/**
 * Convert OllamaChatResponse to GenerateContentResponse.
 */
export function ollamaResponseToGenerateContentResponse(response) {
    const parts = [];
    // Add text content
    if (response.message.content) {
        parts.push({ text: response.message.content });
    }
    // Add tool calls
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
        for (const tc of response.message.tool_calls) {
            parts.push({
                functionCall: {
                    name: tc.function.name,
                    args: tc.function.arguments,
                },
            });
        }
    }
    const candidate = {
        index: 0,
        content: {
            role: 'model',
            parts,
        },
        finishReason: mapOllamaDoneToFinishReason(response.done, response.message.tool_calls),
    };
    return {
        candidates: [candidate],
        usageMetadata: {
            promptTokenCount: response.prompt_eval_count ?? 0,
            candidatesTokenCount: response.eval_count ?? 0,
            totalTokenCount: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),
        },
    };
}
/**
 * Map Ollama done status to FinishReason.
 */
function mapOllamaDoneToFinishReason(done, toolCalls) {
    if (!done) {
        return FR.OTHER;
    }
    if (toolCalls && toolCalls.length > 0) {
        return FR.TOOL_CALLS;
    }
    return FR.STOP;
}
// ============================================================================
// Tool Conversion
// ============================================================================
/**
 * Convert Tool[] to OllamaTool[].
 */
export function toolsToOllamaTools(tools) {
    const ollamaTools = [];
    for (const tool of tools) {
        for (const func of tool.functionDeclarations) {
            ollamaTools.push(functionDeclarationToOllamaTool(func));
        }
    }
    return ollamaTools;
}
/**
 * Convert FunctionDeclaration to OllamaTool.
 */
export function functionDeclarationToOllamaTool(func) {
    return {
        type: 'function',
        function: {
            name: func.name,
            description: func.description,
            parameters: schemaToOllamaSchema(func.parameters),
        },
    };
}
/**
 * Convert Schema to Ollama schema format.
 */
function schemaToOllamaSchema(schema) {
    if (!schema) {
        return {};
    }
    const result = {
        type: schema.type,
    };
    if ('description' in schema && schema['description']) {
        result['description'] = schema['description'];
    }
    if ('properties' in schema && schema['properties']) {
        result['properties'] = Object.fromEntries(Object.entries(schema['properties']).map(([key, value]) => [
            key,
            schemaToOllamaSchema(value),
        ]));
    }
    if ('items' in schema && schema['items']) {
        result['items'] = schemaToOllamaSchema(schema['items']);
    }
    if ('required' in schema && schema['required']) {
        result['required'] = schema['required'];
    }
    if ('enum' in schema && schema['enum']) {
        result['enum'] = schema['enum'];
    }
    return result;
}
// ============================================================================
// Streaming Response Aggregation
// ============================================================================
/**
 * Aggregator for streaming responses.
 * Collects chunks and builds the final response.
 */
export class StreamingResponseAggregator {
    content = '';
    toolCalls = [];
    promptEvalCount = 0;
    evalCount = 0;
    totalDuration = 0;
    model = '';
    done = false;
    addChunk(chunk) {
        if (chunk.model) {
            this.model = chunk.model;
        }
        if (chunk.message?.content) {
            this.content += chunk.message.content;
        }
        if (chunk.message?.tool_calls) {
            for (const tc of chunk.message.tool_calls) {
                this.toolCalls.push(tc);
            }
        }
        if (chunk.prompt_eval_count) {
            this.promptEvalCount = chunk.prompt_eval_count;
        }
        if (chunk.eval_count) {
            this.evalCount += chunk.eval_count;
        }
        if (chunk.total_duration) {
            this.totalDuration = chunk.total_duration;
        }
        if (chunk.done) {
            this.done = true;
        }
    }
    buildResponse() {
        const message = {
            role: 'assistant',
            content: this.content,
        };
        if (this.toolCalls.length > 0) {
            message.tool_calls = this.toolCalls;
        }
        return {
            model: this.model,
            created_at: new Date().toISOString(),
            message,
            done: this.done,
            prompt_eval_count: this.promptEvalCount,
            eval_count: this.evalCount,
            total_duration: this.totalDuration,
        };
    }
    buildGenerateContentResponse() {
        return ollamaResponseToGenerateContentResponse(this.buildResponse());
    }
}
// ============================================================================
// Generate Content Parameters to Ollama Request
// ============================================================================
/**
 * Convert GenerateContentParameters to OllamaChatRequest.
 */
export function generateParamsToOllamaRequest(params, defaultModel) {
    const messages = contentsToOllamaMessages(params.contents);
    // Add system instruction if provided
    if (params.systemInstruction) {
        const systemText = params.systemInstruction.parts
            .map((p) => ('text' in p ? p.text : ''))
            .filter(Boolean)
            .join('\n');
        if (systemText) {
            // Prepend system message
            messages.unshift({
                role: 'system',
                content: systemText,
            });
        }
    }
    const request = {
        model: params.model ?? defaultModel,
        messages,
        stream: false,
    };
    // Add tools if provided
    if (params.tools && params.tools.length > 0) {
        request.tools = toolsToOllamaTools(params.tools);
    }
    // Add generation config as options
    if (params.generationConfig) {
        request.options = generationConfigToOllamaOptions(params.generationConfig);
    }
    return request;
}
/**
 * Convert GenerateContentConfig to OllamaModelOptions.
 */
function generationConfigToOllamaOptions(config) {
    const options = {};
    if (config.temperature !== undefined) {
        options.temperature = config.temperature;
    }
    if (config.topP !== undefined) {
        options.top_p = config.topP;
    }
    if (config.topK !== undefined) {
        options.top_k = config.topK;
    }
    if (config.maxOutputTokens !== undefined) {
        options.num_predict = config.maxOutputTokens;
    }
    if (config.stopSequences) {
        options.stop = config.stopSequences;
    }
    if (config.presencePenalty !== undefined) {
        options.presence_penalty = config.presencePenalty;
    }
    if (config.frequencyPenalty !== undefined) {
        options.frequency_penalty = config.frequencyPenalty;
    }
    if (config.seed !== undefined) {
        options.seed = config.seed;
    }
    return options;
}
// ============================================================================
// Text Extraction Utilities
// ============================================================================
/**
 * Extract all text from content parts.
 */
export function extractTextFromParts(parts) {
    return parts
        .filter((p) => 'text' in p)
        .map((p) => p.text)
        .join('\n');
}
/**
 * Extract all text from contents.
 */
export function extractTextFromContents(contents) {
    return contents
        .flatMap((c) => c.parts)
        .filter((p) => 'text' in p)
        .map((p) => p.text)
        .join('\n');
}
/**
 * Check if content contains function calls.
 */
export function hasFunctionCalls(content) {
    return content.parts.some((p) => 'functionCall' in p);
}
/**
 * Get all function calls from content.
 */
export function getFunctionCalls(content) {
    return content.parts
        .filter((p) => 'functionCall' in p)
        .map((p) => p.functionCall);
}
//# sourceMappingURL=ollamaConverter.js.map