/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';
export const AGENT_METHODS = {
    authenticate: 'authenticate',
    initialize: 'initialize',
    session_cancel: 'session/cancel',
    session_load: 'session/load',
    session_new: 'session/new',
    session_prompt: 'session/prompt',
    session_list: 'session/list',
    session_set_mode: 'session/set_mode',
    session_set_model: 'session/set_model',
};
export const CLIENT_METHODS = {
    fs_read_text_file: 'fs/read_text_file',
    fs_write_text_file: 'fs/write_text_file',
    authenticate_update: 'authenticate/update',
    session_request_permission: 'session/request_permission',
    session_update: 'session/update',
};
export const PROTOCOL_VERSION = 1;
export const writeTextFileRequestSchema = z.object({
    content: z.string(),
    path: z.string(),
    sessionId: z.string(),
});
export const readTextFileRequestSchema = z.object({
    limit: z.number().optional().nullable(),
    line: z.number().optional().nullable(),
    path: z.string(),
    sessionId: z.string(),
});
export const permissionOptionKindSchema = z.union([
    z.literal('allow_once'),
    z.literal('allow_always'),
    z.literal('reject_once'),
    z.literal('reject_always'),
]);
export const roleSchema = z.union([z.literal('assistant'), z.literal('user')]);
export const textResourceContentsSchema = z.object({
    mimeType: z.string().optional().nullable(),
    text: z.string(),
    uri: z.string(),
});
export const blobResourceContentsSchema = z.object({
    blob: z.string(),
    mimeType: z.string().optional().nullable(),
    uri: z.string(),
});
export const toolKindSchema = z.union([
    z.literal('read'),
    z.literal('edit'),
    z.literal('delete'),
    z.literal('move'),
    z.literal('search'),
    z.literal('execute'),
    z.literal('think'),
    z.literal('fetch'),
    z.literal('switch_mode'),
    z.literal('other'),
]);
export const toolCallStatusSchema = z.union([
    z.literal('pending'),
    z.literal('in_progress'),
    z.literal('completed'),
    z.literal('failed'),
]);
export const writeTextFileResponseSchema = z.null();
export const readTextFileResponseSchema = z.object({
    content: z.string(),
});
export const requestPermissionOutcomeSchema = z.union([
    z.object({
        outcome: z.literal('cancelled'),
    }),
    z.object({
        optionId: z.string(),
        outcome: z.literal('selected'),
    }),
]);
export const cancelNotificationSchema = z.object({
    sessionId: z.string(),
});
export const approvalModeValueSchema = z.union([
    z.literal('plan'),
    z.literal('default'),
    z.literal('auto-edit'),
    z.literal('yolo'),
]);
export const setModeRequestSchema = z.object({
    sessionId: z.string(),
    modeId: approvalModeValueSchema,
});
export const setModeResponseSchema = z.object({
    modeId: approvalModeValueSchema,
});
export const authenticateRequestSchema = z.object({
    methodId: z.string(),
});
export const authenticateUpdateSchema = z.object({
    _meta: z.object({
        authUri: z.string(),
    }),
});
export const acpMetaSchema = z.record(z.unknown()).nullable().optional();
export const modelIdSchema = z.string();
export const modelInfoSchema = z.object({
    _meta: acpMetaSchema,
    description: z.string().nullable().optional(),
    modelId: modelIdSchema,
    name: z.string(),
});
export const setModelRequestSchema = z.object({
    sessionId: z.string(),
    modelId: z.string(),
});
export const setModelResponseSchema = z.object({
    modelId: z.string(),
});
export const sessionModelStateSchema = z.object({
    _meta: acpMetaSchema,
    availableModels: z.array(modelInfoSchema),
    currentModelId: modelIdSchema,
});
export const newSessionResponseSchema = z.object({
    sessionId: z.string(),
    models: sessionModelStateSchema,
});
export const loadSessionResponseSchema = z.null();
export const sessionListItemSchema = z.object({
    cwd: z.string(),
    filePath: z.string(),
    gitBranch: z.string().optional(),
    messageCount: z.number(),
    mtime: z.number(),
    prompt: z.string(),
    sessionId: z.string(),
    startTime: z.string(),
});
export const listSessionsResponseSchema = z.object({
    hasMore: z.boolean(),
    items: z.array(sessionListItemSchema),
    nextCursor: z.number().optional(),
});
export const listSessionsRequestSchema = z.object({
    cursor: z.number().optional(),
    cwd: z.string(),
    size: z.number().optional(),
});
export const stopReasonSchema = z.union([
    z.literal('end_turn'),
    z.literal('max_tokens'),
    z.literal('refusal'),
    z.literal('cancelled'),
]);
export const promptResponseSchema = z.object({
    stopReason: stopReasonSchema,
});
export const toolCallLocationSchema = z.object({
    line: z.number().optional().nullable(),
    path: z.string(),
});
export const planEntrySchema = z.object({
    content: z.string(),
    priority: z.union([z.literal('high'), z.literal('medium'), z.literal('low')]),
    status: z.union([
        z.literal('pending'),
        z.literal('in_progress'),
        z.literal('completed'),
    ]),
});
export const permissionOptionSchema = z.object({
    kind: permissionOptionKindSchema,
    name: z.string(),
    optionId: z.string(),
});
export const annotationsSchema = z.object({
    audience: z.array(roleSchema).optional().nullable(),
    lastModified: z.string().optional().nullable(),
    priority: z.number().optional().nullable(),
});
export const usageSchema = z.object({
    promptTokens: z.number().optional().nullable(),
    completionTokens: z.number().optional().nullable(),
    thoughtsTokens: z.number().optional().nullable(),
    totalTokens: z.number().optional().nullable(),
    cachedTokens: z.number().optional().nullable(),
});
export const sessionUpdateMetaSchema = z.object({
    usage: usageSchema.optional().nullable(),
    durationMs: z.number().optional().nullable(),
    toolName: z.string().optional().nullable(),
    parentToolCallId: z.string().optional().nullable(),
    subagentType: z.string().optional().nullable(),
    /** Server-side timestamp (ms since epoch) for correct message ordering */
    timestamp: z.number().optional().nullable(),
});
export const requestPermissionResponseSchema = z.object({
    outcome: requestPermissionOutcomeSchema,
});
export const fileSystemCapabilitySchema = z.object({
    readTextFile: z.boolean(),
    writeTextFile: z.boolean(),
});
export const envVariableSchema = z.object({
    name: z.string(),
    value: z.string(),
});
export const mcpServerSchema = z.object({
    args: z.array(z.string()),
    command: z.string(),
    env: z.array(envVariableSchema),
    name: z.string(),
});
export const promptCapabilitiesSchema = z.object({
    audio: z.boolean().optional(),
    embeddedContext: z.boolean().optional(),
    image: z.boolean().optional(),
});
export const agentCapabilitiesSchema = z.object({
    loadSession: z.boolean().optional(),
    promptCapabilities: promptCapabilitiesSchema.optional(),
});
export const authMethodSchema = z.object({
    args: z.array(z.string()).optional(),
    description: z.string().nullable(),
    env: z.record(z.string()).optional(),
    id: z.string(),
    name: z.string(),
    type: z.string().optional(),
});
export const clientResponseSchema = z.union([
    writeTextFileResponseSchema,
    readTextFileResponseSchema,
    requestPermissionResponseSchema,
]);
export const clientNotificationSchema = cancelNotificationSchema;
export const embeddedResourceResourceSchema = z.union([
    textResourceContentsSchema,
    blobResourceContentsSchema,
]);
export const newSessionRequestSchema = z.object({
    cwd: z.string(),
    mcpServers: z.array(mcpServerSchema),
});
export const loadSessionRequestSchema = z.object({
    cwd: z.string(),
    mcpServers: z.array(mcpServerSchema),
    sessionId: z.string(),
});
export const modeInfoSchema = z.object({
    id: approvalModeValueSchema,
    name: z.string(),
    description: z.string(),
});
export const modesDataSchema = z.object({
    currentModeId: approvalModeValueSchema,
    availableModes: z.array(modeInfoSchema),
});
export const agentInfoSchema = z.object({
    name: z.string(),
    title: z.string(),
    version: z.string(),
});
export const initializeResponseSchema = z.object({
    agentCapabilities: agentCapabilitiesSchema,
    agentInfo: agentInfoSchema,
    authMethods: z.array(authMethodSchema),
    modes: modesDataSchema,
    protocolVersion: z.number(),
});
export const contentBlockSchema = z.union([
    z.object({
        annotations: annotationsSchema.optional().nullable(),
        text: z.string(),
        type: z.literal('text'),
    }),
    z.object({
        annotations: annotationsSchema.optional().nullable(),
        data: z.string(),
        mimeType: z.string(),
        type: z.literal('image'),
    }),
    z.object({
        annotations: annotationsSchema.optional().nullable(),
        data: z.string(),
        mimeType: z.string(),
        type: z.literal('audio'),
    }),
    z.object({
        annotations: annotationsSchema.optional().nullable(),
        description: z.string().optional().nullable(),
        mimeType: z.string().optional().nullable(),
        name: z.string(),
        size: z.number().optional().nullable(),
        title: z.string().optional().nullable(),
        type: z.literal('resource_link'),
        uri: z.string(),
    }),
    z.object({
        annotations: annotationsSchema.optional().nullable(),
        resource: embeddedResourceResourceSchema,
        type: z.literal('resource'),
    }),
]);
export const toolCallContentSchema = z.union([
    z.object({
        content: contentBlockSchema,
        type: z.literal('content'),
    }),
    z.object({
        newText: z.string(),
        oldText: z.string().nullable(),
        path: z.string(),
        type: z.literal('diff'),
    }),
]);
export const toolCallSchema = z.object({
    content: z.array(toolCallContentSchema).optional(),
    kind: toolKindSchema,
    locations: z.array(toolCallLocationSchema).optional(),
    rawInput: z.unknown().optional(),
    status: toolCallStatusSchema,
    title: z.string(),
    toolCallId: z.string(),
});
export const clientCapabilitiesSchema = z.object({
    fs: fileSystemCapabilitySchema,
});
export const promptRequestSchema = z.object({
    prompt: z.array(contentBlockSchema),
    sessionId: z.string(),
});
export const availableCommandInputSchema = z.object({
    hint: z.string(),
});
export const availableCommandSchema = z.object({
    description: z.string(),
    input: availableCommandInputSchema.nullable().optional(),
    name: z.string(),
});
export const availableCommandsUpdateSchema = z.object({
    availableCommands: z.array(availableCommandSchema),
    sessionUpdate: z.literal('available_commands_update'),
});
export const currentModeUpdateSchema = z.object({
    sessionUpdate: z.literal('current_mode_update'),
    modeId: approvalModeValueSchema,
});
export const currentModelUpdateSchema = z.object({
    sessionUpdate: z.literal('current_model_update'),
    model: modelInfoSchema,
});
export const sessionUpdateSchema = z.union([
    z.object({
        content: contentBlockSchema,
        sessionUpdate: z.literal('user_message_chunk'),
        _meta: sessionUpdateMetaSchema.optional().nullable(),
    }),
    z.object({
        content: contentBlockSchema,
        sessionUpdate: z.literal('agent_message_chunk'),
        _meta: sessionUpdateMetaSchema.optional().nullable(),
    }),
    z.object({
        content: contentBlockSchema,
        sessionUpdate: z.literal('agent_thought_chunk'),
        _meta: sessionUpdateMetaSchema.optional().nullable(),
    }),
    z.object({
        content: z.array(toolCallContentSchema).optional(),
        kind: toolKindSchema,
        locations: z.array(toolCallLocationSchema).optional(),
        rawInput: z.unknown().optional(),
        _meta: sessionUpdateMetaSchema.optional().nullable(),
        sessionUpdate: z.literal('tool_call'),
        status: toolCallStatusSchema,
        title: z.string(),
        toolCallId: z.string(),
    }),
    z.object({
        content: z.array(toolCallContentSchema).optional().nullable(),
        kind: toolKindSchema.optional().nullable(),
        locations: z.array(toolCallLocationSchema).optional().nullable(),
        rawInput: z.unknown().optional(),
        rawOutput: z.unknown().optional(),
        _meta: sessionUpdateMetaSchema.optional().nullable(),
        sessionUpdate: z.literal('tool_call_update'),
        status: toolCallStatusSchema.optional().nullable(),
        title: z.string().optional().nullable(),
        toolCallId: z.string(),
    }),
    z.object({
        entries: z.array(planEntrySchema),
        sessionUpdate: z.literal('plan'),
    }),
    currentModeUpdateSchema,
    currentModelUpdateSchema,
    availableCommandsUpdateSchema,
]);
export const agentResponseSchema = z.union([
    initializeResponseSchema,
    newSessionResponseSchema,
    loadSessionResponseSchema,
    promptResponseSchema,
    listSessionsResponseSchema,
    setModeResponseSchema,
    setModelResponseSchema,
]);
export const requestPermissionRequestSchema = z.object({
    options: z.array(permissionOptionSchema),
    sessionId: z.string(),
    toolCall: toolCallSchema,
});
export const initializeRequestSchema = z.object({
    clientCapabilities: clientCapabilitiesSchema,
    protocolVersion: z.number(),
});
export const sessionNotificationSchema = z.object({
    sessionId: z.string(),
    update: sessionUpdateSchema,
});
export const clientRequestSchema = z.union([
    writeTextFileRequestSchema,
    readTextFileRequestSchema,
    requestPermissionRequestSchema,
]);
export const agentRequestSchema = z.union([
    initializeRequestSchema,
    authenticateRequestSchema,
    newSessionRequestSchema,
    loadSessionRequestSchema,
    promptRequestSchema,
    listSessionsRequestSchema,
    setModeRequestSchema,
    setModelRequestSchema,
]);
export const agentNotificationSchema = sessionNotificationSchema;
//# sourceMappingURL=schema.js.map