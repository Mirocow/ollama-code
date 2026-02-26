/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converter utilities for transforming between Ollama Code types and Ollama API types.
 */

import type {
  Content,
  Part,
  TextPart,
  FunctionCallPart,
  FunctionDeclaration,
  Tool,
  GenerateContentResponse,
  ContentCandidate,
  FinishReason,
} from '../types/index.js';

import type {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaTool,
  OllamaToolCall,
  OllamaModelOptions,
} from '../types/index.js';

import { FinishReason as FR } from '../types/index.js';

// ============================================================================
// Content to Ollama Message Conversion
// ============================================================================

/**
 * Convert Content[] to OllamaChatMessage[].
 * This is the main conversion function for chat requests.
 */
export function contentsToOllamaMessages(
  contents: Content[],
): OllamaChatMessage[] {
  const messages: OllamaChatMessage[] = [];

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
    } else if (content.role === 'model') {
      // Model/assistant message
      const textParts: string[] = [];
      const toolCalls: OllamaToolCall[] = [];

      for (const part of content.parts) {
        if ('text' in part && part.text) {
          textParts.push(part.text);
        } else if ('functionCall' in part) {
          toolCalls.push({
            function: {
              name: part.functionCall.name,
              arguments: part.functionCall.args,
            },
          });
        }
      }

      const message: OllamaChatMessage = {
        role: 'assistant',
        content: textParts.join('\n'),
      };

      if (toolCalls.length > 0) {
        message.tool_calls = toolCalls;
      }

      messages.push(message);
    } else {
      // User or system message
      const textParts: string[] = [];
      const images: string[] = [];

      for (const part of content.parts) {
        if ('text' in part && part.text) {
          textParts.push(part.text);
        } else if ('inlineData' in part && part.inlineData.mimeType.startsWith('image/')) {
          images.push(part.inlineData.data);
        }
      }

      const message: OllamaChatMessage = {
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
function mapRoleToOllama(role: string): 'system' | 'user' | 'assistant' | 'tool' {
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
export function ollamaResponseToGenerateContentResponse(
  response: OllamaChatResponse,
): GenerateContentResponse {
  const parts: Part[] = [];

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

  const candidate: ContentCandidate = {
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
function mapOllamaDoneToFinishReason(
  done: boolean,
  toolCalls?: OllamaToolCall[],
): FinishReason {
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
export function toolsToOllamaTools(tools: Tool[]): OllamaTool[] {
  const ollamaTools: OllamaTool[] = [];

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
export function functionDeclarationToOllamaTool(
  func: FunctionDeclaration,
): OllamaTool {
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
function schemaToOllamaSchema(
  schema?: import('../types/content.js').Schema,
): Record<string, unknown> {
  if (!schema) {
    return {};
  }

  const result: Record<string, unknown> = {
    type: schema.type,
  };

  if ('description' in schema && schema['description']) {
    result['description'] = schema['description'];
  }

  if ('properties' in schema && schema['properties']) {
    result['properties'] = Object.fromEntries(
      Object.entries(schema['properties']).map(([key, value]) => [
        key,
        schemaToOllamaSchema(value),
      ]),
    );
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
  private content = '';
  private toolCalls: OllamaToolCall[] = [];
  private promptEvalCount = 0;
  private evalCount = 0;
  private totalDuration = 0;
  private model = '';
  private done = false;

  addChunk(chunk: OllamaChatResponse): void {
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

  buildResponse(): OllamaChatResponse {
    const message: OllamaChatMessage = {
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

  buildGenerateContentResponse(): GenerateContentResponse {
    return ollamaResponseToGenerateContentResponse(this.buildResponse());
  }
}

// ============================================================================
// Generate Content Parameters to Ollama Request
// ============================================================================

/**
 * Convert GenerateContentParameters to OllamaChatRequest.
 */
export function generateParamsToOllamaRequest(
  params: import('../types/content.js').GenerateContentParameters,
  defaultModel: string,
): OllamaChatRequest {
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

  const request: OllamaChatRequest = {
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
function generationConfigToOllamaOptions(
  config: import('../types/content.js').GenerateContentConfig,
): OllamaModelOptions {
  const options: OllamaModelOptions = {};

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
export function extractTextFromParts(parts: Part[]): string {
  return parts
    .filter((p): p is TextPart => 'text' in p)
    .map((p) => p.text)
    .join('\n');
}

/**
 * Extract all text from contents.
 */
export function extractTextFromContents(contents: Content[]): string {
  return contents
    .flatMap((c) => c.parts)
    .filter((p): p is TextPart => 'text' in p)
    .map((p) => p.text)
    .join('\n');
}

/**
 * Check if content contains function calls.
 */
export function hasFunctionCalls(content: Content): boolean {
  return content.parts.some((p) => 'functionCall' in p);
}

/**
 * Get all function calls from content.
 */
export function getFunctionCalls(content: Content): import('../types/content.js').FunctionCall[] {
  return content.parts
    .filter((p): p is FunctionCallPart => 'functionCall' in p)
    .map((p) => p.functionCall);
}
