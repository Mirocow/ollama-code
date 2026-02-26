/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { logs } from '@opentelemetry/api-logs';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { safeJsonStringify } from '../utils/safeJsonStringify.js';
import { EVENT_API_ERROR, EVENT_API_CANCEL, EVENT_API_REQUEST, EVENT_API_RESPONSE, EVENT_CLI_CONFIG, EVENT_EXTENSION_UNINSTALL, EVENT_EXTENSION_ENABLE, EVENT_IDE_CONNECTION, EVENT_TOOL_CALL, EVENT_USER_PROMPT, EVENT_FLASH_FALLBACK, EVENT_NEXT_SPEAKER_CHECK, SERVICE_NAME, EVENT_SLASH_COMMAND, EVENT_CONVERSATION_FINISHED, EVENT_CHAT_COMPRESSION, EVENT_CONTENT_RETRY, EVENT_CONTENT_RETRY_FAILURE, EVENT_FILE_OPERATION, EVENT_RIPGREP_FALLBACK, EVENT_EXTENSION_INSTALL, EVENT_MODEL_SLASH_COMMAND, EVENT_EXTENSION_DISABLE, EVENT_SUBAGENT_EXECUTION, EVENT_MALFORMED_JSON_RESPONSE, EVENT_INVALID_CHUNK, EVENT_AUTH, EVENT_SKILL_LAUNCH, EVENT_EXTENSION_UPDATE, EVENT_USER_FEEDBACK, } from './constants.js';
import { recordApiErrorMetrics, recordApiResponseMetrics, recordChatCompressionMetrics, recordContentRetry, recordContentRetryFailure, recordFileOperationMetric, recordInvalidChunk, recordModelSlashCommand, recordSubagentExecutionMetrics, recordTokenUsageMetrics, recordToolCallMetrics, } from './metrics.js';
import { OllamaLogger } from './ollama-logger/ollama-logger.js';
import { isTelemetrySdkInitialized } from './sdk.js';
import { uiTelemetryService } from './uiTelemetry.js';
const shouldLogUserPrompts = (config) => config.getTelemetryLogPromptsEnabled();
function getCommonAttributes(config) {
    return {
        'session.id': config.getSessionId(),
    };
}
export function logStartSession(config, event) {
    OllamaLogger.getInstance(config)?.logStartSessionEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        'event.name': EVENT_CLI_CONFIG,
        'event.timestamp': new Date().toISOString(),
        model: event.model,
        embedding_model: event.embedding_model,
        sandbox_enabled: event.sandbox_enabled,
        core_tools_enabled: event.core_tools_enabled,
        approval_mode: event.approval_mode,
        api_key_enabled: event.api_key_enabled,
        vertex_ai_enabled: event.vertex_ai_enabled,
        log_user_prompts_enabled: event.telemetry_log_user_prompts_enabled,
        file_filtering_respect_git_ignore: event.file_filtering_respect_git_ignore,
        debug_mode: event.debug_enabled,
        mcp_servers: event.mcp_servers,
        mcp_servers_count: event.mcp_servers_count,
        mcp_tools: event.mcp_tools,
        mcp_tools_count: event.mcp_tools_count,
        output_format: event.output_format,
        skills: event.skills,
        subagents: event.subagents,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: 'CLI configuration loaded.',
        attributes,
    };
    logger.emit(logRecord);
}
export function logUserPrompt(config, event) {
    OllamaLogger.getInstance(config)?.logNewPromptEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        'event.name': EVENT_USER_PROMPT,
        'event.timestamp': new Date().toISOString(),
        prompt_length: event.prompt_length,
        prompt_id: event.prompt_id,
    };
    if (event.auth_type) {
        attributes['auth_type'] = event.auth_type;
    }
    if (shouldLogUserPrompts(config)) {
        attributes['prompt'] = event.prompt;
    }
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `User prompt. Length: ${event.prompt_length}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logToolCall(config, event) {
    const uiEvent = {
        ...event,
        'event.name': EVENT_TOOL_CALL,
        'event.timestamp': new Date().toISOString(),
    };
    uiTelemetryService.addEvent(uiEvent);
    config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent);
    OllamaLogger.getInstance(config)?.logToolCallEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_TOOL_CALL,
        'event.timestamp': new Date().toISOString(),
        function_args: safeJsonStringify(event.function_args, 2),
    };
    if (event.error) {
        attributes['error.message'] = event.error;
        if (event.error_type) {
            attributes['error.type'] = event.error_type;
        }
    }
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Tool call: ${event.function_name}${event.decision ? `. Decision: ${event.decision}` : ''}. Success: ${event.success}. Duration: ${event.duration_ms}ms.`,
        attributes,
    };
    logger.emit(logRecord);
    recordToolCallMetrics(config, event.duration_ms, {
        function_name: event.function_name,
        success: event.success,
        decision: event.decision,
        tool_type: event.tool_type,
    });
}
export function logToolOutputTruncated(config, event) {
    OllamaLogger.getInstance(config)?.logToolOutputTruncatedEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': 'tool_output_truncated',
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Tool output truncated for ${event.tool_name}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logFileOperation(config, event) {
    OllamaLogger.getInstance(config)?.logFileOperationEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        'event.name': EVENT_FILE_OPERATION,
        'event.timestamp': new Date().toISOString(),
        tool_name: event.tool_name,
        operation: event.operation,
    };
    if (event.lines) {
        attributes['lines'] = event.lines;
    }
    if (event.mimetype) {
        attributes['mimetype'] = event.mimetype;
    }
    if (event.extension) {
        attributes['extension'] = event.extension;
    }
    if (event.programming_language) {
        attributes['programming_language'] = event.programming_language;
    }
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `File operation: ${event.operation}. Lines: ${event.lines}.`,
        attributes,
    };
    logger.emit(logRecord);
    recordFileOperationMetric(config, {
        operation: event.operation,
        lines: event.lines,
        mimetype: event.mimetype,
        extension: event.extension,
        programming_language: event.programming_language,
    });
}
export function logApiRequest(config, event) {
    // OllamaLogger.getInstance(config)?.logApiRequestEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_API_REQUEST,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `API request to ${event.model}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logFlashFallback(config, event) {
    OllamaLogger.getInstance(config)?.logFlashFallbackEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_FLASH_FALLBACK,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Switching to flash as Fallback.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logRipgrepFallback(config, event) {
    OllamaLogger.getInstance(config)?.logRipgrepFallbackEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_RIPGREP_FALLBACK,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Switching to grep as fallback.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logApiError(config, event) {
    const uiEvent = {
        ...event,
        'event.name': EVENT_API_ERROR,
        'event.timestamp': new Date().toISOString(),
    };
    uiTelemetryService.addEvent(uiEvent);
    config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent);
    OllamaLogger.getInstance(config)?.logApiErrorEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_API_ERROR,
        'event.timestamp': new Date().toISOString(),
        ['error.message']: event.error,
        model_name: event.model,
        duration: event.duration_ms,
    };
    if (event.error_type) {
        attributes['error.type'] = event.error_type;
    }
    if (typeof event.status_code === 'number') {
        attributes[SemanticAttributes.HTTP_STATUS_CODE] = event.status_code;
    }
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `API error for ${event.model}. Error: ${event.error}. Duration: ${event.duration_ms}ms.`,
        attributes,
    };
    logger.emit(logRecord);
    recordApiErrorMetrics(config, event.duration_ms, {
        model: event.model,
        status_code: event.status_code,
        error_type: event.error_type,
    });
}
export function logApiCancel(config, event) {
    const uiEvent = {
        ...event,
        'event.name': EVENT_API_CANCEL,
        'event.timestamp': new Date().toISOString(),
    };
    uiTelemetryService.addEvent(uiEvent);
    OllamaLogger.getInstance(config)?.logApiCancelEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_API_CANCEL,
        'event.timestamp': new Date().toISOString(),
        model_name: event.model,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `API request cancelled for ${event.model}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logApiResponse(config, event) {
    const uiEvent = {
        ...event,
        'event.name': EVENT_API_RESPONSE,
        'event.timestamp': new Date().toISOString(),
    };
    uiTelemetryService.addEvent(uiEvent);
    config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent);
    OllamaLogger.getInstance(config)?.logApiResponseEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_API_RESPONSE,
        'event.timestamp': new Date().toISOString(),
    };
    if (event.response_text) {
        attributes['response_text'] = event.response_text;
    }
    if (event.status_code) {
        if (typeof event.status_code === 'number') {
            attributes[SemanticAttributes.HTTP_STATUS_CODE] = event.status_code;
        }
    }
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `API response from ${event.model}. Status: ${event.status_code || 'N/A'}. Duration: ${event.duration_ms}ms.`,
        attributes,
    };
    logger.emit(logRecord);
    recordApiResponseMetrics(config, event.duration_ms, {
        model: event.model,
        status_code: event.status_code,
    });
    recordTokenUsageMetrics(config, event.input_token_count, {
        model: event.model,
        type: 'input',
    });
    recordTokenUsageMetrics(config, event.output_token_count, {
        model: event.model,
        type: 'output',
    });
    recordTokenUsageMetrics(config, event.cached_content_token_count, {
        model: event.model,
        type: 'cache',
    });
    recordTokenUsageMetrics(config, event.thoughts_token_count, {
        model: event.model,
        type: 'thought',
    });
    recordTokenUsageMetrics(config, event.tool_token_count, {
        model: event.model,
        type: 'tool',
    });
}
export function logLoopDetected(config, event) {
    OllamaLogger.getInstance(config)?.logLoopDetectedEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Loop detected. Type: ${event.loop_type}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logLoopDetectionDisabled(config, _event) {
    OllamaLogger.getInstance(config)?.logLoopDetectionDisabledEvent();
}
export function logNextSpeakerCheck(config, event) {
    OllamaLogger.getInstance(config)?.logNextSpeakerCheck(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_NEXT_SPEAKER_CHECK,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Next speaker check.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logSlashCommand(config, event) {
    OllamaLogger.getInstance(config)?.logSlashCommandEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_SLASH_COMMAND,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Slash command: ${event.command}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logIdeConnection(config, event) {
    OllamaLogger.getInstance(config)?.logIdeConnectionEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_IDE_CONNECTION,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Ide connection. Type: ${event.connection_type}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logConversationFinishedEvent(config, event) {
    OllamaLogger.getInstance(config)?.logConversationFinishedEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_CONVERSATION_FINISHED,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Conversation finished.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logChatCompression(config, event) {
    OllamaLogger.getInstance(config)?.logChatCompressionEvent(event);
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_CHAT_COMPRESSION,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Chat compression (Saved ${event.tokens_before - event.tokens_after} tokens)`,
        attributes,
    };
    logger.emit(logRecord);
    recordChatCompressionMetrics(config, {
        tokens_before: event.tokens_before,
        tokens_after: event.tokens_after,
    });
}
export function logKittySequenceOverflow(config, event) {
    OllamaLogger.getInstance(config)?.logKittySequenceOverflowEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Kitty sequence buffer overflow: ${event.sequence_length} bytes`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logMalformedJsonResponse(config, event) {
    OllamaLogger.getInstance(config)?.logMalformedJsonResponseEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_MALFORMED_JSON_RESPONSE,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Malformed JSON response from ${event.model}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logInvalidChunk(config, event) {
    OllamaLogger.getInstance(config)?.logInvalidChunkEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        'event.name': EVENT_INVALID_CHUNK,
        'event.timestamp': event['event.timestamp'],
    };
    if (event.error_message) {
        attributes['error.message'] = event.error_message;
    }
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Invalid chunk received from stream.`,
        attributes,
    };
    logger.emit(logRecord);
    recordInvalidChunk(config);
}
export function logContentRetry(config, event) {
    OllamaLogger.getInstance(config)?.logContentRetryEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_CONTENT_RETRY,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Content retry attempt ${event.attempt_number} due to ${event.error_type}.`,
        attributes,
    };
    logger.emit(logRecord);
    recordContentRetry(config);
}
export function logContentRetryFailure(config, event) {
    OllamaLogger.getInstance(config)?.logContentRetryFailureEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_CONTENT_RETRY_FAILURE,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `All content retries failed after ${event.total_attempts} attempts.`,
        attributes,
    };
    logger.emit(logRecord);
    recordContentRetryFailure(config);
}
export function logSubagentExecution(config, event) {
    OllamaLogger.getInstance(config)?.logSubagentExecutionEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_SUBAGENT_EXECUTION,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Subagent execution: ${event.subagent_name}.`,
        attributes,
    };
    logger.emit(logRecord);
    recordSubagentExecutionMetrics(config, event.subagent_name, event.status, event.terminate_reason);
}
export function logModelSlashCommand(config, event) {
    OllamaLogger.getInstance(config)?.logModelSlashCommandEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_MODEL_SLASH_COMMAND,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Model slash command. Model: ${event.model_name}`,
        attributes,
    };
    logger.emit(logRecord);
    recordModelSlashCommand(config, event);
}
export function logExtensionInstallEvent(config, event) {
    OllamaLogger.getInstance(config)?.logExtensionInstallEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_EXTENSION_INSTALL,
        'event.timestamp': new Date().toISOString(),
        extension_name: event.extension_name,
        extension_version: event.extension_version,
        extension_source: event.extension_source,
        status: event.status,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Installed extension ${event.extension_name}`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logExtensionUninstall(config, event) {
    OllamaLogger.getInstance(config)?.logExtensionUninstallEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_EXTENSION_UNINSTALL,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Uninstalled extension ${event.extension_name}`,
        attributes,
    };
    logger.emit(logRecord);
}
export async function logExtensionUpdateEvent(config, event) {
    OllamaLogger.getInstance(config)?.logExtensionUpdateEvent(event);
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_EXTENSION_UPDATE,
        'event.timestamp': new Date().toISOString(),
        extension_name: event.extension_name,
        extension_id: event.extension_id,
        extension_previous_version: event.extension_previous_version,
        extension_version: event.extension_version,
        extension_source: event.extension_source,
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Updated extension ${event.extension_name} from ${event.extension_previous_version} to ${event.extension_version}`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logExtensionEnable(config, event) {
    OllamaLogger.getInstance(config)?.logExtensionEnableEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_EXTENSION_ENABLE,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Enabled extension ${event.extension_name}`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logExtensionDisable(config, event) {
    OllamaLogger.getInstance(config)?.logExtensionDisableEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_EXTENSION_DISABLE,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Disabled extension ${event.extension_name}`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logAuth(config, event) {
    OllamaLogger.getInstance(config)?.logAuthEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_AUTH,
        'event.timestamp': new Date().toISOString(),
        auth_type: event.auth_type,
        action_type: event.action_type,
        status: event.status,
    };
    if (event.error_message) {
        attributes['error.message'] = event.error_message;
    }
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Auth event: ${event.action_type} ${event.status} for ${event.auth_type}`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logSkillLaunch(config, event) {
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_SKILL_LAUNCH,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `Skill launch: ${event.skill_name}. Success: ${event.success}.`,
        attributes,
    };
    logger.emit(logRecord);
}
export function logUserFeedback(config, event) {
    const uiEvent = {
        ...event,
        'event.name': EVENT_USER_FEEDBACK,
        'event.timestamp': new Date().toISOString(),
    };
    uiTelemetryService.addEvent(uiEvent);
    config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent);
    OllamaLogger.getInstance(config)?.logUserFeedbackEvent(event);
    if (!isTelemetrySdkInitialized())
        return;
    const attributes = {
        ...getCommonAttributes(config),
        ...event,
        'event.name': EVENT_USER_FEEDBACK,
        'event.timestamp': new Date().toISOString(),
    };
    const logger = logs.getLogger(SERVICE_NAME);
    const logRecord = {
        body: `User feedback: Rating ${event.rating} for session ${event.session_id}.`,
        attributes,
    };
    logger.emit(logRecord);
}
//# sourceMappingURL=loggers.js.map