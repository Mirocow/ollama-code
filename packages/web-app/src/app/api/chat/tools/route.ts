/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0

 */
export const dynamic = 'force-dynamic';

/**
 * Chat Tools API Route
 *
 * Handles chat requests with tool execution using Core ToolRegistry
 */

import type { NextRequest } from 'next/server';
import { getCoreService } from '@/server/coreService';

/**
 * Tool definition for Ollama
 */
interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/**
 * Tool call from model
 */
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Chat message
 */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

/**
 * Chat request
 */
interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

/**
 * Get Ollama URL
 */
function getOllamaUrl(): string {
  return (
    process.env.OLLAMA_URL ||
    process.env.OLLAMA_HOST ||
    'http://localhost:11434'
  );
}

/**
 * Get tool definitions from Core ToolRegistry
 */
async function getToolDefinitions(): Promise<ToolDefinition[]> {
  try {
    const service = getCoreService();
    await service.initialize();
    const tools = await service.listTools();

    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties:
            (tool.inputSchema?.properties as Record<string, unknown>) || {},
          required: (tool.inputSchema?.required as string[]) || [],
        },
      },
    }));
  } catch (error) {
    console.error('Failed to get tool definitions:', error);
    return [];
  }
}

/**
 * Execute a tool call
 */
async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  signal: AbortSignal,
): Promise<unknown> {
  try {
    const service = getCoreService();
    await service.initialize();
    const toolRegistry = service.getToolRegistry();

    // Get the tool
    const tool = toolRegistry.getTool(name);

    if (!tool) {
      return { error: `Tool "${name}" not found` };
    }

    // Execute using validateBuildAndExecute (doesn't throw)
    const result = await tool.validateBuildAndExecute(args, signal);

    return result.llmContent || result.returnDisplay || result;
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * POST /api/chat/tools
 *
 * Chat with tool execution
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { model, messages, stream = true } = body;

    if (!model || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Model and messages are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const ollamaUrl = getOllamaUrl();
    const tools = await getToolDefinitions();

    if (stream) {
      const encoder = new TextEncoder();
      const abortController = new AbortController();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // First request to Ollama with tools
            const response = await fetch(`${ollamaUrl}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model,
                messages,
                tools: tools.length > 0 ? tools : undefined,
                stream: true,
              }),
              signal: abortController.signal,
            });

            if (!response.ok) {
              throw new Error(`Ollama error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let toolCalls: ToolCall[] = [];

            // Read the stream
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(Boolean);

              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line);

                  // Send content to client
                  if (parsed.message?.content) {
                    accumulatedContent += parsed.message.content;
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: 'content',
                          content: parsed.message.content,
                        }) + '\n',
                      ),
                    );
                  }

                  // Collect tool calls
                  if (parsed.message?.tool_calls) {
                    toolCalls = parsed.message.tool_calls;
                  }

                  // Handle done
                  if (parsed.done) {
                    // If there are tool calls, execute them
                    if (toolCalls.length > 0) {
                      controller.enqueue(
                        encoder.encode(
                          JSON.stringify({
                            type: 'tool_calls_start',
                            count: toolCalls.length,
                          }) + '\n',
                        ),
                      );

                      // Execute each tool call
                      const toolResults: ChatMessage[] = [];
                      for (const toolCall of toolCalls) {
                        const args = JSON.parse(toolCall.function.arguments);

                        controller.enqueue(
                          encoder.encode(
                            JSON.stringify({
                              type: 'tool_call',
                              name: toolCall.function.name,
                              args,
                            }) + '\n',
                          ),
                        );

                        const result = await executeToolCall(
                          toolCall.function.name,
                          args,
                          abortController.signal,
                        );

                        controller.enqueue(
                          encoder.encode(
                            JSON.stringify({
                              type: 'tool_result',
                              name: toolCall.function.name,
                              result,
                            }) + '\n',
                          ),
                        );

                        toolResults.push({
                          role: 'tool',
                          content: JSON.stringify(result),
                          tool_call_id: toolCall.id,
                          name: toolCall.function.name,
                        });
                      }

                      // Make follow-up request with tool results
                      const assistantMessage: ChatMessage = {
                        role: 'assistant',
                        content: accumulatedContent,
                        tool_calls: toolCalls,
                      };

                      const followUpResponse = await fetch(
                        `${ollamaUrl}/api/chat`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            model,
                            messages: [
                              ...messages,
                              assistantMessage,
                              ...toolResults,
                            ],
                            stream: true,
                          }),
                          signal: abortController.signal,
                        },
                      );

                      if (followUpResponse.ok) {
                        const followUpReader =
                          followUpResponse.body?.getReader();
                        if (followUpReader) {
                          while (true) {
                            const { done: followUpDone, value: followUpValue } =
                              await followUpReader.read();
                            if (followUpDone) break;

                            const followUpChunk = decoder.decode(
                              followUpValue,
                              {
                                stream: true,
                              },
                            );
                            const followUpLines = followUpChunk
                              .split('\n')
                              .filter(Boolean);

                            for (const followUpLine of followUpLines) {
                              try {
                                const followUpParsed = JSON.parse(followUpLine);
                                if (followUpParsed.message?.content) {
                                  controller.enqueue(
                                    encoder.encode(
                                      JSON.stringify({
                                        type: 'content',
                                        content: followUpParsed.message.content,
                                      }) + '\n',
                                    ),
                                  );
                                }
                              } catch {
                                // Skip invalid JSON
                              }
                            }
                          }
                        }
                      }
                    }

                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: 'done',
                        }) + '\n',
                      ),
                    );
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }

            controller.close();
          } catch (error) {
            console.error('Stream error:', error);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'error',
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                }) + '\n',
              ),
            );
            controller.close();
          }
        },
        cancel() {
          abortController.abort();
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          tools: tools.length > 0 ? tools : undefined,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();

      // Handle tool calls in non-streaming mode
      if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
        const toolResults: ChatMessage[] = [];
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message.content || '',
          tool_calls: data.message.tool_calls,
        };

        for (const toolCall of data.message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await executeToolCall(
            toolCall.function.name,
            args,
            new AbortController().signal,
          );
          toolResults.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
          });
        }

        // Make follow-up request
        const followUpResponse = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [...messages, assistantMessage, ...toolResults],
            stream: false,
          }),
        });

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          return new Response(JSON.stringify(followUpData), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
