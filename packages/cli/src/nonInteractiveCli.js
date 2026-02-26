/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { isSlashCommand } from './ui/utils/commandUtils.js';
import { executeToolCall, shutdownTelemetry, isTelemetrySdkInitialized, OllamaEventType, FatalInputError, promptIdContext, OutputFormat, InputFormat, uiTelemetryService, parseAndFormatApiError, createDebugLogger, } from '@ollama-code/ollama-code-core';
import { JsonOutputAdapter } from './nonInteractive/io/JsonOutputAdapter.js';
import { StreamJsonOutputAdapter } from './nonInteractive/io/StreamJsonOutputAdapter.js';
import { handleSlashCommand } from './nonInteractiveCliCommands.js';
import { handleAtCommand } from './ui/hooks/atCommandProcessor.js';
import { handleError, handleToolError, handleCancellationError, handleMaxTurnsExceededError, } from './utils/errors.js';
const debugLogger = createDebugLogger('NON_INTERACTIVE_CLI');
import { normalizePartList, extractPartsFromUserMessage, buildSystemMessage, createToolProgressHandler, createTaskToolProgressHandler, computeUsageFromMetrics, } from './utils/nonInteractiveHelpers.js';
/**
 * Emits a final message for slash command results.
 * Note: systemMessage should already be emitted before calling this function.
 */
async function emitNonInteractiveFinalMessage(params) {
    const { message, isError, adapter, config } = params;
    // JSON output mode: emit assistant message and result
    // (systemMessage should already be emitted by caller)
    adapter.startAssistantMessage();
    adapter.processEvent({
        type: OllamaEventType.Content,
        value: message,
    });
    adapter.finalizeAssistantMessage();
    const metrics = uiTelemetryService.getMetrics();
    const usage = computeUsageFromMetrics(metrics);
    const outputFormat = config.getOutputFormat();
    const stats = outputFormat === OutputFormat.JSON
        ? uiTelemetryService.getMetrics()
        : undefined;
    adapter.emitResult({
        isError,
        durationMs: Date.now() - params.startTimeMs,
        apiDurationMs: 0,
        numTurns: 0,
        errorMessage: isError ? message : undefined,
        usage,
        stats,
        summary: message,
    });
}
/**
 * Executes the non-interactive CLI flow for a single request.
 */
export async function runNonInteractive(config, settings, input, prompt_id, options = {}) {
    return promptIdContext.run(prompt_id, async () => {
        // Create output adapter based on format
        let adapter;
        const outputFormat = config.getOutputFormat();
        if (options.adapter) {
            adapter = options.adapter;
        }
        else if (outputFormat === OutputFormat.STREAM_JSON) {
            adapter = new StreamJsonOutputAdapter(config, config.getIncludePartialMessages());
        }
        else {
            adapter = new JsonOutputAdapter(config);
        }
        // Get readonly values once at the start
        const sessionId = config.getSessionId();
        const permissionMode = config.getApprovalMode();
        let turnCount = 0;
        let totalApiDurationMs = 0;
        const startTime = Date.now();
        const stdoutErrorHandler = (err) => {
            if (err.code === 'EPIPE') {
                process.stdout.removeListener('error', stdoutErrorHandler);
                process.exit(0);
            }
        };
        const geminiClient = config.getOllamaClient();
        const abortController = options.abortController ?? new AbortController();
        // Setup signal handlers for graceful shutdown
        const shutdownHandler = () => {
            debugLogger.debug('[runNonInteractive] Shutdown signal received');
            abortController.abort();
        };
        try {
            process.stdout.on('error', stdoutErrorHandler);
            process.on('SIGINT', shutdownHandler);
            process.on('SIGTERM', shutdownHandler);
            // Emit systemMessage first (always the first message in JSON mode)
            const systemMessage = await buildSystemMessage(config, sessionId, permissionMode);
            adapter.emitMessage(systemMessage);
            let initialPartList = extractPartsFromUserMessage(options.userMessage);
            if (!initialPartList) {
                let slashHandled = false;
                if (isSlashCommand(input)) {
                    const slashCommandResult = await handleSlashCommand(input, abortController, config, settings);
                    switch (slashCommandResult.type) {
                        case 'submit_prompt':
                            // A slash command can replace the prompt entirely; fall back to @-command processing otherwise.
                            initialPartList = slashCommandResult.content;
                            slashHandled = true;
                            break;
                        case 'message': {
                            // systemMessage already emitted above
                            await emitNonInteractiveFinalMessage({
                                message: slashCommandResult.content,
                                isError: slashCommandResult.messageType === 'error',
                                adapter,
                                config,
                                startTimeMs: startTime,
                            });
                            return;
                        }
                        case 'stream_messages':
                            throw new FatalInputError('Stream messages mode is not supported in non-interactive CLI');
                        case 'unsupported': {
                            await emitNonInteractiveFinalMessage({
                                message: slashCommandResult.reason,
                                isError: true,
                                adapter,
                                config,
                                startTimeMs: startTime,
                            });
                            return;
                        }
                        case 'no_command':
                            break;
                        default: {
                            const _exhaustive = slashCommandResult;
                            throw new FatalInputError(`Unhandled slash command result type: ${_exhaustive.type}`);
                        }
                    }
                }
                if (!slashHandled) {
                    const { processedQuery, shouldProceed } = await handleAtCommand({
                        query: input,
                        config,
                        onDebugMessage: () => { },
                        messageId: Date.now(),
                        signal: abortController.signal,
                    });
                    if (!shouldProceed || !processedQuery) {
                        // An error occurred during @include processing (e.g., file not found).
                        // The error message is already logged by handleAtCommand.
                        throw new FatalInputError('Exiting due to an error processing the @ command.');
                    }
                    initialPartList = processedQuery;
                }
            }
            if (!initialPartList) {
                initialPartList = [{ text: input }];
            }
            const initialParts = normalizePartList(initialPartList);
            let currentMessages = [{ role: 'user', parts: initialParts }];
            let isFirstTurn = true;
            while (true) {
                turnCount++;
                if (config.getMaxSessionTurns() >= 0 &&
                    turnCount > config.getMaxSessionTurns()) {
                    handleMaxTurnsExceededError(config);
                }
                const toolCallRequests = [];
                const apiStartTime = Date.now();
                const responseStream = geminiClient.sendMessageStream(currentMessages[0]?.parts || [], abortController.signal, prompt_id, { isContinuation: !isFirstTurn });
                isFirstTurn = false;
                // Start assistant message for this turn
                adapter.startAssistantMessage();
                for await (const event of responseStream) {
                    if (abortController.signal.aborted) {
                        handleCancellationError(config);
                    }
                    // Use adapter for all event processing
                    adapter.processEvent(event);
                    if (event.type === OllamaEventType.ToolCallRequest) {
                        toolCallRequests.push(event.value);
                    }
                    if (outputFormat === OutputFormat.TEXT &&
                        event.type === OllamaEventType.Error) {
                        const errorText = parseAndFormatApiError(event.value.error, config.getContentGeneratorConfig()?.authType);
                        process.stderr.write(`${errorText}\n`);
                        // Throw error to exit with non-zero code
                        throw new Error(errorText);
                    }
                }
                // Finalize assistant message
                adapter.finalizeAssistantMessage();
                totalApiDurationMs += Date.now() - apiStartTime;
                if (toolCallRequests.length > 0) {
                    const toolResponseParts = [];
                    for (const requestInfo of toolCallRequests) {
                        const finalRequestInfo = requestInfo;
                        const inputFormat = typeof config.getInputFormat === 'function'
                            ? config.getInputFormat()
                            : InputFormat.TEXT;
                        const toolCallUpdateCallback = inputFormat === InputFormat.STREAM_JSON && options.controlService
                            ? options.controlService.permission.getToolCallUpdateCallback()
                            : undefined;
                        // Build outputUpdateHandler for this tool call.
                        // Task tool has its own complex handler (subagent messages).
                        // All other tools with canUpdateOutput=true (e.g., MCP tools)
                        // get a generic handler that emits progress via the adapter.
                        const isTaskTool = finalRequestInfo.name === 'task';
                        const { handler: outputUpdateHandler } = isTaskTool
                            ? createTaskToolProgressHandler(config, finalRequestInfo.callId, adapter)
                            : createToolProgressHandler(finalRequestInfo, adapter);
                        const toolResponse = await executeToolCall(config, finalRequestInfo, abortController.signal, {
                            outputUpdateHandler,
                            ...(toolCallUpdateCallback && {
                                onToolCallsUpdate: toolCallUpdateCallback,
                            }),
                        });
                        // Note: In JSON mode, subagent messages are automatically added to the main
                        // adapter's messages array and will be output together on emitResult()
                        if (toolResponse.error) {
                            // In JSON/STREAM_JSON mode, tool errors are tolerated and formatted
                            // as tool_result blocks. handleToolError will detect JSON/STREAM_JSON mode
                            // from config and allow the session to continue so the LLM can decide what to do next.
                            // In text mode, we still log the error.
                            handleToolError(finalRequestInfo.name, toolResponse.error, config, toolResponse.errorType || 'TOOL_EXECUTION_ERROR', typeof toolResponse.resultDisplay === 'string'
                                ? toolResponse.resultDisplay
                                : undefined);
                        }
                        adapter.emitToolResult(finalRequestInfo, toolResponse);
                        if (toolResponse.responseParts) {
                            toolResponseParts.push(...toolResponse.responseParts);
                        }
                    }
                    currentMessages = [{ role: 'user', parts: toolResponseParts }];
                }
                else {
                    const metrics = uiTelemetryService.getMetrics();
                    const usage = computeUsageFromMetrics(metrics);
                    // Get stats for JSON format output
                    const stats = outputFormat === OutputFormat.JSON
                        ? uiTelemetryService.getMetrics()
                        : undefined;
                    adapter.emitResult({
                        isError: false,
                        durationMs: Date.now() - startTime,
                        apiDurationMs: totalApiDurationMs,
                        numTurns: turnCount,
                        usage,
                        stats,
                    });
                    return;
                }
            }
        }
        catch (error) {
            // For JSON and STREAM_JSON modes, compute usage from metrics
            const message = error instanceof Error ? error.message : String(error);
            const metrics = uiTelemetryService.getMetrics();
            const usage = computeUsageFromMetrics(metrics);
            // Get stats for JSON format output
            const stats = outputFormat === OutputFormat.JSON
                ? uiTelemetryService.getMetrics()
                : undefined;
            adapter.emitResult({
                isError: true,
                durationMs: Date.now() - startTime,
                apiDurationMs: totalApiDurationMs,
                numTurns: turnCount,
                errorMessage: message,
                usage,
                stats,
            });
            handleError(error, config);
        }
        finally {
            process.stdout.removeListener('error', stdoutErrorHandler);
            // Cleanup signal handlers
            process.removeListener('SIGINT', shutdownHandler);
            process.removeListener('SIGTERM', shutdownHandler);
            if (isTelemetrySdkInitialized()) {
                await shutdownTelemetry();
            }
        }
    });
}
//# sourceMappingURL=nonInteractiveCli.js.map