/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export const SERVICE_NAME = 'ollama-code';
export const EVENT_USER_PROMPT = 'ollama-code.user_prompt';
export const EVENT_TOOL_CALL = 'ollama-code.tool_call';
export const EVENT_API_REQUEST = 'ollama-code.api_request';
export const EVENT_API_ERROR = 'ollama-code.api_error';
export const EVENT_API_CANCEL = 'ollama-code.api_cancel';
export const EVENT_API_RESPONSE = 'ollama-code.api_response';
export const EVENT_CLI_CONFIG = 'ollama-code.config';
export const EVENT_EXTENSION_DISABLE = 'ollama-code.extension_disable';
export const EVENT_EXTENSION_ENABLE = 'ollama-code.extension_enable';
export const EVENT_EXTENSION_INSTALL = 'ollama-code.extension_install';
export const EVENT_EXTENSION_UNINSTALL = 'ollama-code.extension_uninstall';
export const EVENT_EXTENSION_UPDATE = 'ollama-code.extension_update';
export const EVENT_FLASH_FALLBACK = 'ollama-code.flash_fallback';
export const EVENT_RIPGREP_FALLBACK = 'ollama-code.ripgrep_fallback';
export const EVENT_NEXT_SPEAKER_CHECK = 'ollama-code.next_speaker_check';
export const EVENT_SLASH_COMMAND = 'ollama-code.slash_command';
export const EVENT_IDE_CONNECTION = 'ollama-code.ide_connection';
export const EVENT_CHAT_COMPRESSION = 'ollama-code.chat_compression';
export const EVENT_INVALID_CHUNK = 'ollama-code.chat.invalid_chunk';
export const EVENT_CONTENT_RETRY = 'ollama-code.chat.content_retry';
export const EVENT_CONTENT_RETRY_FAILURE = 'ollama-code.chat.content_retry_failure';
export const EVENT_CONVERSATION_FINISHED = 'ollama-code.conversation_finished';
export const EVENT_MALFORMED_JSON_RESPONSE = 'ollama-code.malformed_json_response';
export const EVENT_FILE_OPERATION = 'ollama-code.file_operation';
export const EVENT_MODEL_SLASH_COMMAND = 'ollama-code.slash_command.model';
export const EVENT_SUBAGENT_EXECUTION = 'ollama-code.subagent_execution';
export const EVENT_SKILL_LAUNCH = 'ollama-code.skill_launch';
export const EVENT_AUTH = 'ollama-code.auth';
export const EVENT_USER_FEEDBACK = 'ollama-code.user_feedback';
// Performance Events
export const EVENT_STARTUP_PERFORMANCE = 'ollama-code.startup.performance';
export const EVENT_MEMORY_USAGE = 'ollama-code.memory.usage';
export const EVENT_PERFORMANCE_BASELINE = 'ollama-code.performance.baseline';
export const EVENT_PERFORMANCE_REGRESSION = 'ollama-code.performance.regression';
//# sourceMappingURL=constants.js.map