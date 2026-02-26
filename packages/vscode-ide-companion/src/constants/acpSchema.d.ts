/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const AGENT_METHODS: {
    readonly authenticate: "authenticate";
    readonly initialize: "initialize";
    readonly session_cancel: "session/cancel";
    readonly session_list: "session/list";
    readonly session_load: "session/load";
    readonly session_new: "session/new";
    readonly session_prompt: "session/prompt";
    readonly session_save: "session/save";
    readonly session_set_mode: "session/set_mode";
    readonly session_set_model: "session/set_model";
};
export declare const CLIENT_METHODS: {
    readonly fs_read_text_file: "fs/read_text_file";
    readonly fs_write_text_file: "fs/write_text_file";
    readonly authenticate_update: "authenticate/update";
    readonly session_request_permission: "session/request_permission";
    readonly session_update: "session/update";
};
export declare const ACP_ERROR_CODES: {
    readonly PARSE_ERROR: -32700;
    readonly INVALID_REQUEST: -32600;
    readonly METHOD_NOT_FOUND: -32601;
    readonly INVALID_PARAMS: -32602;
    readonly INTERNAL_ERROR: -32603;
    readonly AUTH_REQUIRED: -32000;
    readonly RESOURCE_NOT_FOUND: -32002;
};
export type AcpErrorCode = (typeof ACP_ERROR_CODES)[keyof typeof ACP_ERROR_CODES];
