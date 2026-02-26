/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';
export declare const AGENT_METHODS: {
    authenticate: string;
    initialize: string;
    session_cancel: string;
    session_load: string;
    session_new: string;
    session_prompt: string;
    session_list: string;
    session_set_mode: string;
    session_set_model: string;
};
export declare const CLIENT_METHODS: {
    fs_read_text_file: string;
    fs_write_text_file: string;
    authenticate_update: string;
    session_request_permission: string;
    session_update: string;
};
export declare const PROTOCOL_VERSION = 1;
export type WriteTextFileRequest = z.infer<typeof writeTextFileRequestSchema>;
export type ReadTextFileRequest = z.infer<typeof readTextFileRequestSchema>;
export type PermissionOptionKind = z.infer<typeof permissionOptionKindSchema>;
export type Role = z.infer<typeof roleSchema>;
export type TextResourceContents = z.infer<typeof textResourceContentsSchema>;
export type BlobResourceContents = z.infer<typeof blobResourceContentsSchema>;
export type ToolKind = z.infer<typeof toolKindSchema>;
export type ToolCallStatus = z.infer<typeof toolCallStatusSchema>;
export type WriteTextFileResponse = z.infer<typeof writeTextFileResponseSchema>;
export type ReadTextFileResponse = z.infer<typeof readTextFileResponseSchema>;
export type RequestPermissionOutcome = z.infer<typeof requestPermissionOutcomeSchema>;
export type SessionListItem = z.infer<typeof sessionListItemSchema>;
export type ListSessionsRequest = z.infer<typeof listSessionsRequestSchema>;
export type ListSessionsResponse = z.infer<typeof listSessionsResponseSchema>;
export type CancelNotification = z.infer<typeof cancelNotificationSchema>;
export type AuthenticateRequest = z.infer<typeof authenticateRequestSchema>;
export type NewSessionResponse = z.infer<typeof newSessionResponseSchema>;
export type LoadSessionResponse = z.infer<typeof loadSessionResponseSchema>;
export type StopReason = z.infer<typeof stopReasonSchema>;
export type PromptResponse = z.infer<typeof promptResponseSchema>;
export type ToolCallLocation = z.infer<typeof toolCallLocationSchema>;
export type PlanEntry = z.infer<typeof planEntrySchema>;
export type PermissionOption = z.infer<typeof permissionOptionSchema>;
export type Annotations = z.infer<typeof annotationsSchema>;
export type RequestPermissionResponse = z.infer<typeof requestPermissionResponseSchema>;
export type FileSystemCapability = z.infer<typeof fileSystemCapabilitySchema>;
export type EnvVariable = z.infer<typeof envVariableSchema>;
export type McpServer = z.infer<typeof mcpServerSchema>;
export type AgentCapabilities = z.infer<typeof agentCapabilitiesSchema>;
export type AuthMethod = z.infer<typeof authMethodSchema>;
export type ModeInfo = z.infer<typeof modeInfoSchema>;
export type ModesData = z.infer<typeof modesDataSchema>;
export type AgentInfo = z.infer<typeof agentInfoSchema>;
export type ModelInfo = z.infer<typeof modelInfoSchema>;
export type PromptCapabilities = z.infer<typeof promptCapabilitiesSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>;
export type ClientNotification = z.infer<typeof clientNotificationSchema>;
export type EmbeddedResourceResource = z.infer<typeof embeddedResourceResourceSchema>;
export type NewSessionRequest = z.infer<typeof newSessionRequestSchema>;
export type LoadSessionRequest = z.infer<typeof loadSessionRequestSchema>;
export type InitializeResponse = z.infer<typeof initializeResponseSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type ToolCallContent = z.infer<typeof toolCallContentSchema>;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type ClientCapabilities = z.infer<typeof clientCapabilitiesSchema>;
export type PromptRequest = z.infer<typeof promptRequestSchema>;
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>;
export type AgentResponse = z.infer<typeof agentResponseSchema>;
export type RequestPermissionRequest = z.infer<typeof requestPermissionRequestSchema>;
export type InitializeRequest = z.infer<typeof initializeRequestSchema>;
export type SessionNotification = z.infer<typeof sessionNotificationSchema>;
export type ClientRequest = z.infer<typeof clientRequestSchema>;
export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type AgentNotification = z.infer<typeof agentNotificationSchema>;
export type ApprovalModeValue = z.infer<typeof approvalModeValueSchema>;
export type SetModeRequest = z.infer<typeof setModeRequestSchema>;
export type SetModeResponse = z.infer<typeof setModeResponseSchema>;
export type AvailableCommandInput = z.infer<typeof availableCommandInputSchema>;
export type AvailableCommand = z.infer<typeof availableCommandSchema>;
export type AvailableCommandsUpdate = z.infer<typeof availableCommandsUpdateSchema>;
export declare const writeTextFileRequestSchema: z.ZodObject<{
    content: z.ZodString;
    path: z.ZodString;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    sessionId: string;
    path: string;
}, {
    content: string;
    sessionId: string;
    path: string;
}>;
export declare const readTextFileRequestSchema: z.ZodObject<{
    limit: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    path: z.ZodString;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    path: string;
    line?: number | null | undefined;
    limit?: number | null | undefined;
}, {
    sessionId: string;
    path: string;
    line?: number | null | undefined;
    limit?: number | null | undefined;
}>;
export declare const permissionOptionKindSchema: z.ZodUnion<[z.ZodLiteral<"allow_once">, z.ZodLiteral<"allow_always">, z.ZodLiteral<"reject_once">, z.ZodLiteral<"reject_always">]>;
export declare const roleSchema: z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>;
export declare const textResourceContentsSchema: z.ZodObject<{
    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    text: z.ZodString;
    uri: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
    uri: string;
    mimeType?: string | null | undefined;
}, {
    text: string;
    uri: string;
    mimeType?: string | null | undefined;
}>;
export declare const blobResourceContentsSchema: z.ZodObject<{
    blob: z.ZodString;
    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    uri: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uri: string;
    blob: string;
    mimeType?: string | null | undefined;
}, {
    uri: string;
    blob: string;
    mimeType?: string | null | undefined;
}>;
export declare const toolKindSchema: z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>;
export declare const toolCallStatusSchema: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>;
export declare const writeTextFileResponseSchema: z.ZodNull;
export declare const readTextFileResponseSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const requestPermissionOutcomeSchema: z.ZodUnion<[z.ZodObject<{
    outcome: z.ZodLiteral<"cancelled">;
}, "strip", z.ZodTypeAny, {
    outcome: "cancelled";
}, {
    outcome: "cancelled";
}>, z.ZodObject<{
    optionId: z.ZodString;
    outcome: z.ZodLiteral<"selected">;
}, "strip", z.ZodTypeAny, {
    outcome: "selected";
    optionId: string;
}, {
    outcome: "selected";
    optionId: string;
}>]>;
export declare const cancelNotificationSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
}, {
    sessionId: string;
}>;
export declare const approvalModeValueSchema: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
export declare const setModeRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    modeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}, {
    sessionId: string;
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}>;
export declare const setModeResponseSchema: z.ZodObject<{
    modeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
}, "strip", z.ZodTypeAny, {
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}, {
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}>;
export declare const authenticateRequestSchema: z.ZodObject<{
    methodId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    methodId: string;
}, {
    methodId: string;
}>;
export declare const authenticateUpdateSchema: z.ZodObject<{
    _meta: z.ZodObject<{
        authUri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        authUri: string;
    }, {
        authUri: string;
    }>;
}, "strip", z.ZodTypeAny, {
    _meta: {
        authUri: string;
    };
}, {
    _meta: {
        authUri: string;
    };
}>;
export type AuthenticateUpdate = z.infer<typeof authenticateUpdateSchema>;
export declare const acpMetaSchema: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
export declare const modelIdSchema: z.ZodString;
export declare const modelInfoSchema: z.ZodObject<{
    _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    modelId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    modelId: string;
    description?: string | null | undefined;
    _meta?: Record<string, unknown> | null | undefined;
}, {
    name: string;
    modelId: string;
    description?: string | null | undefined;
    _meta?: Record<string, unknown> | null | undefined;
}>;
export declare const setModelRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    modelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    modelId: string;
}, {
    sessionId: string;
    modelId: string;
}>;
export declare const setModelResponseSchema: z.ZodObject<{
    modelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    modelId: string;
}, {
    modelId: string;
}>;
export type SetModelRequest = z.infer<typeof setModelRequestSchema>;
export type SetModelResponse = z.infer<typeof setModelResponseSchema>;
export declare const sessionModelStateSchema: z.ZodObject<{
    _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    availableModels: z.ZodArray<z.ZodObject<{
        _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        modelId: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    }, {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    }>, "many">;
    currentModelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    availableModels: {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    }[];
    currentModelId: string;
    _meta?: Record<string, unknown> | null | undefined;
}, {
    availableModels: {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    }[];
    currentModelId: string;
    _meta?: Record<string, unknown> | null | undefined;
}>;
export declare const newSessionResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    models: z.ZodObject<{
        _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        availableModels: z.ZodArray<z.ZodObject<{
            _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            modelId: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }, {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }>, "many">;
        currentModelId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        availableModels: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }[];
        currentModelId: string;
        _meta?: Record<string, unknown> | null | undefined;
    }, {
        availableModels: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }[];
        currentModelId: string;
        _meta?: Record<string, unknown> | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    models: {
        availableModels: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }[];
        currentModelId: string;
        _meta?: Record<string, unknown> | null | undefined;
    };
}, {
    sessionId: string;
    models: {
        availableModels: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }[];
        currentModelId: string;
        _meta?: Record<string, unknown> | null | undefined;
    };
}>;
export declare const loadSessionResponseSchema: z.ZodNull;
export declare const sessionListItemSchema: z.ZodObject<{
    cwd: z.ZodString;
    filePath: z.ZodString;
    gitBranch: z.ZodOptional<z.ZodString>;
    messageCount: z.ZodNumber;
    mtime: z.ZodNumber;
    prompt: z.ZodString;
    sessionId: z.ZodString;
    startTime: z.ZodString;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    prompt: string;
    sessionId: string;
    cwd: string;
    startTime: string;
    messageCount: number;
    mtime: number;
    gitBranch?: string | undefined;
}, {
    filePath: string;
    prompt: string;
    sessionId: string;
    cwd: string;
    startTime: string;
    messageCount: number;
    mtime: number;
    gitBranch?: string | undefined;
}>;
export declare const listSessionsResponseSchema: z.ZodObject<{
    hasMore: z.ZodBoolean;
    items: z.ZodArray<z.ZodObject<{
        cwd: z.ZodString;
        filePath: z.ZodString;
        gitBranch: z.ZodOptional<z.ZodString>;
        messageCount: z.ZodNumber;
        mtime: z.ZodNumber;
        prompt: z.ZodString;
        sessionId: z.ZodString;
        startTime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        prompt: string;
        sessionId: string;
        cwd: string;
        startTime: string;
        messageCount: number;
        mtime: number;
        gitBranch?: string | undefined;
    }, {
        filePath: string;
        prompt: string;
        sessionId: string;
        cwd: string;
        startTime: string;
        messageCount: number;
        mtime: number;
        gitBranch?: string | undefined;
    }>, "many">;
    nextCursor: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    hasMore: boolean;
    items: {
        filePath: string;
        prompt: string;
        sessionId: string;
        cwd: string;
        startTime: string;
        messageCount: number;
        mtime: number;
        gitBranch?: string | undefined;
    }[];
    nextCursor?: number | undefined;
}, {
    hasMore: boolean;
    items: {
        filePath: string;
        prompt: string;
        sessionId: string;
        cwd: string;
        startTime: string;
        messageCount: number;
        mtime: number;
        gitBranch?: string | undefined;
    }[];
    nextCursor?: number | undefined;
}>;
export declare const listSessionsRequestSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodNumber>;
    cwd: z.ZodString;
    size: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cwd: string;
    cursor?: number | undefined;
    size?: number | undefined;
}, {
    cwd: string;
    cursor?: number | undefined;
    size?: number | undefined;
}>;
export declare const stopReasonSchema: z.ZodUnion<[z.ZodLiteral<"end_turn">, z.ZodLiteral<"max_tokens">, z.ZodLiteral<"refusal">, z.ZodLiteral<"cancelled">]>;
export declare const promptResponseSchema: z.ZodObject<{
    stopReason: z.ZodUnion<[z.ZodLiteral<"end_turn">, z.ZodLiteral<"max_tokens">, z.ZodLiteral<"refusal">, z.ZodLiteral<"cancelled">]>;
}, "strip", z.ZodTypeAny, {
    stopReason: "cancelled" | "refusal" | "max_tokens" | "end_turn";
}, {
    stopReason: "cancelled" | "refusal" | "max_tokens" | "end_turn";
}>;
export declare const toolCallLocationSchema: z.ZodObject<{
    line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    line?: number | null | undefined;
}, {
    path: string;
    line?: number | null | undefined;
}>;
export declare const planEntrySchema: z.ZodObject<{
    content: z.ZodString;
    priority: z.ZodUnion<[z.ZodLiteral<"high">, z.ZodLiteral<"medium">, z.ZodLiteral<"low">]>;
    status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">]>;
}, "strip", z.ZodTypeAny, {
    content: string;
    status: "completed" | "in_progress" | "pending";
    priority: "low" | "medium" | "high";
}, {
    content: string;
    status: "completed" | "in_progress" | "pending";
    priority: "low" | "medium" | "high";
}>;
export declare const permissionOptionSchema: z.ZodObject<{
    kind: z.ZodUnion<[z.ZodLiteral<"allow_once">, z.ZodLiteral<"allow_always">, z.ZodLiteral<"reject_once">, z.ZodLiteral<"reject_always">]>;
    name: z.ZodString;
    optionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
    optionId: string;
}, {
    name: string;
    kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
    optionId: string;
}>;
export declare const annotationsSchema: z.ZodObject<{
    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    lastModified?: string | null | undefined;
    audience?: ("user" | "assistant")[] | null | undefined;
    priority?: number | null | undefined;
}, {
    lastModified?: string | null | undefined;
    audience?: ("user" | "assistant")[] | null | undefined;
    priority?: number | null | undefined;
}>;
export declare const usageSchema: z.ZodObject<{
    promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    totalTokens?: number | null | undefined;
    promptTokens?: number | null | undefined;
    completionTokens?: number | null | undefined;
    thoughtsTokens?: number | null | undefined;
    cachedTokens?: number | null | undefined;
}, {
    totalTokens?: number | null | undefined;
    promptTokens?: number | null | undefined;
    completionTokens?: number | null | undefined;
    thoughtsTokens?: number | null | undefined;
    cachedTokens?: number | null | undefined;
}>;
export type Usage = z.infer<typeof usageSchema>;
export declare const sessionUpdateMetaSchema: z.ZodObject<{
    usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        totalTokens?: number | null | undefined;
        promptTokens?: number | null | undefined;
        completionTokens?: number | null | undefined;
        thoughtsTokens?: number | null | undefined;
        cachedTokens?: number | null | undefined;
    }, {
        totalTokens?: number | null | undefined;
        promptTokens?: number | null | undefined;
        completionTokens?: number | null | undefined;
        thoughtsTokens?: number | null | undefined;
        cachedTokens?: number | null | undefined;
    }>>>;
    durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    /** Server-side timestamp (ms since epoch) for correct message ordering */
    timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    toolName?: string | null | undefined;
    timestamp?: number | null | undefined;
    durationMs?: number | null | undefined;
    usage?: {
        totalTokens?: number | null | undefined;
        promptTokens?: number | null | undefined;
        completionTokens?: number | null | undefined;
        thoughtsTokens?: number | null | undefined;
        cachedTokens?: number | null | undefined;
    } | null | undefined;
    parentToolCallId?: string | null | undefined;
    subagentType?: string | null | undefined;
}, {
    toolName?: string | null | undefined;
    timestamp?: number | null | undefined;
    durationMs?: number | null | undefined;
    usage?: {
        totalTokens?: number | null | undefined;
        promptTokens?: number | null | undefined;
        completionTokens?: number | null | undefined;
        thoughtsTokens?: number | null | undefined;
        cachedTokens?: number | null | undefined;
    } | null | undefined;
    parentToolCallId?: string | null | undefined;
    subagentType?: string | null | undefined;
}>;
export type SessionUpdateMeta = z.infer<typeof sessionUpdateMetaSchema>;
export declare const requestPermissionResponseSchema: z.ZodObject<{
    outcome: z.ZodUnion<[z.ZodObject<{
        outcome: z.ZodLiteral<"cancelled">;
    }, "strip", z.ZodTypeAny, {
        outcome: "cancelled";
    }, {
        outcome: "cancelled";
    }>, z.ZodObject<{
        optionId: z.ZodString;
        outcome: z.ZodLiteral<"selected">;
    }, "strip", z.ZodTypeAny, {
        outcome: "selected";
        optionId: string;
    }, {
        outcome: "selected";
        optionId: string;
    }>]>;
}, "strip", z.ZodTypeAny, {
    outcome: {
        outcome: "cancelled";
    } | {
        outcome: "selected";
        optionId: string;
    };
}, {
    outcome: {
        outcome: "cancelled";
    } | {
        outcome: "selected";
        optionId: string;
    };
}>;
export declare const fileSystemCapabilitySchema: z.ZodObject<{
    readTextFile: z.ZodBoolean;
    writeTextFile: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    readTextFile: boolean;
    writeTextFile: boolean;
}, {
    readTextFile: boolean;
    writeTextFile: boolean;
}>;
export declare const envVariableSchema: z.ZodObject<{
    name: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    value: string;
}, {
    name: string;
    value: string;
}>;
export declare const mcpServerSchema: z.ZodObject<{
    args: z.ZodArray<z.ZodString, "many">;
    command: z.ZodString;
    env: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        value: string;
    }, {
        name: string;
        value: string;
    }>, "many">;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    command: string;
    args: string[];
    env: {
        name: string;
        value: string;
    }[];
}, {
    name: string;
    command: string;
    args: string[];
    env: {
        name: string;
        value: string;
    }[];
}>;
export declare const promptCapabilitiesSchema: z.ZodObject<{
    audio: z.ZodOptional<z.ZodBoolean>;
    embeddedContext: z.ZodOptional<z.ZodBoolean>;
    image: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    image?: boolean | undefined;
    audio?: boolean | undefined;
    embeddedContext?: boolean | undefined;
}, {
    image?: boolean | undefined;
    audio?: boolean | undefined;
    embeddedContext?: boolean | undefined;
}>;
export declare const agentCapabilitiesSchema: z.ZodObject<{
    loadSession: z.ZodOptional<z.ZodBoolean>;
    promptCapabilities: z.ZodOptional<z.ZodObject<{
        audio: z.ZodOptional<z.ZodBoolean>;
        embeddedContext: z.ZodOptional<z.ZodBoolean>;
        image: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        image?: boolean | undefined;
        audio?: boolean | undefined;
        embeddedContext?: boolean | undefined;
    }, {
        image?: boolean | undefined;
        audio?: boolean | undefined;
        embeddedContext?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    loadSession?: boolean | undefined;
    promptCapabilities?: {
        image?: boolean | undefined;
        audio?: boolean | undefined;
        embeddedContext?: boolean | undefined;
    } | undefined;
}, {
    loadSession?: boolean | undefined;
    promptCapabilities?: {
        image?: boolean | undefined;
        audio?: boolean | undefined;
        embeddedContext?: boolean | undefined;
    } | undefined;
}>;
export declare const authMethodSchema: z.ZodObject<{
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    description: z.ZodNullable<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string | null;
    id: string;
    type?: string | undefined;
    args?: string[] | undefined;
    env?: Record<string, string> | undefined;
}, {
    name: string;
    description: string | null;
    id: string;
    type?: string | undefined;
    args?: string[] | undefined;
    env?: Record<string, string> | undefined;
}>;
export declare const clientResponseSchema: z.ZodUnion<[z.ZodNull, z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>, z.ZodObject<{
    outcome: z.ZodUnion<[z.ZodObject<{
        outcome: z.ZodLiteral<"cancelled">;
    }, "strip", z.ZodTypeAny, {
        outcome: "cancelled";
    }, {
        outcome: "cancelled";
    }>, z.ZodObject<{
        optionId: z.ZodString;
        outcome: z.ZodLiteral<"selected">;
    }, "strip", z.ZodTypeAny, {
        outcome: "selected";
        optionId: string;
    }, {
        outcome: "selected";
        optionId: string;
    }>]>;
}, "strip", z.ZodTypeAny, {
    outcome: {
        outcome: "cancelled";
    } | {
        outcome: "selected";
        optionId: string;
    };
}, {
    outcome: {
        outcome: "cancelled";
    } | {
        outcome: "selected";
        optionId: string;
    };
}>]>;
export declare const clientNotificationSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
}, {
    sessionId: string;
}>;
export declare const embeddedResourceResourceSchema: z.ZodUnion<[z.ZodObject<{
    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    text: z.ZodString;
    uri: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
    uri: string;
    mimeType?: string | null | undefined;
}, {
    text: string;
    uri: string;
    mimeType?: string | null | undefined;
}>, z.ZodObject<{
    blob: z.ZodString;
    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    uri: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uri: string;
    blob: string;
    mimeType?: string | null | undefined;
}, {
    uri: string;
    blob: string;
    mimeType?: string | null | undefined;
}>]>;
export declare const newSessionRequestSchema: z.ZodObject<{
    cwd: z.ZodString;
    mcpServers: z.ZodArray<z.ZodObject<{
        args: z.ZodArray<z.ZodString, "many">;
        command: z.ZodString;
        env: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }, {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    cwd: string;
    mcpServers: {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }[];
}, {
    cwd: string;
    mcpServers: {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }[];
}>;
export declare const loadSessionRequestSchema: z.ZodObject<{
    cwd: z.ZodString;
    mcpServers: z.ZodArray<z.ZodObject<{
        args: z.ZodArray<z.ZodString, "many">;
        command: z.ZodString;
        env: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }, {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }>, "many">;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    cwd: string;
    mcpServers: {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }[];
}, {
    sessionId: string;
    cwd: string;
    mcpServers: {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }[];
}>;
export declare const modeInfoSchema: z.ZodObject<{
    id: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
    name: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    id: "default" | "plan" | "auto-edit" | "yolo";
}, {
    name: string;
    description: string;
    id: "default" | "plan" | "auto-edit" | "yolo";
}>;
export declare const modesDataSchema: z.ZodObject<{
    currentModeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
    availableModes: z.ZodArray<z.ZodObject<{
        id: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
        name: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        id: "default" | "plan" | "auto-edit" | "yolo";
    }, {
        name: string;
        description: string;
        id: "default" | "plan" | "auto-edit" | "yolo";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    currentModeId: "default" | "plan" | "auto-edit" | "yolo";
    availableModes: {
        name: string;
        description: string;
        id: "default" | "plan" | "auto-edit" | "yolo";
    }[];
}, {
    currentModeId: "default" | "plan" | "auto-edit" | "yolo";
    availableModes: {
        name: string;
        description: string;
        id: "default" | "plan" | "auto-edit" | "yolo";
    }[];
}>;
export declare const agentInfoSchema: z.ZodObject<{
    name: z.ZodString;
    title: z.ZodString;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    title: string;
    version: string;
}, {
    name: string;
    title: string;
    version: string;
}>;
export declare const initializeResponseSchema: z.ZodObject<{
    agentCapabilities: z.ZodObject<{
        loadSession: z.ZodOptional<z.ZodBoolean>;
        promptCapabilities: z.ZodOptional<z.ZodObject<{
            audio: z.ZodOptional<z.ZodBoolean>;
            embeddedContext: z.ZodOptional<z.ZodBoolean>;
            image: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        }, {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        loadSession?: boolean | undefined;
        promptCapabilities?: {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        } | undefined;
    }, {
        loadSession?: boolean | undefined;
        promptCapabilities?: {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        } | undefined;
    }>;
    agentInfo: z.ZodObject<{
        name: z.ZodString;
        title: z.ZodString;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        title: string;
        version: string;
    }, {
        name: string;
        title: string;
        version: string;
    }>;
    authMethods: z.ZodArray<z.ZodObject<{
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        description: z.ZodNullable<z.ZodString>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string | null;
        id: string;
        type?: string | undefined;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }, {
        name: string;
        description: string | null;
        id: string;
        type?: string | undefined;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }>, "many">;
    modes: z.ZodObject<{
        currentModeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
        availableModes: z.ZodArray<z.ZodObject<{
            id: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
            name: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }, {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        currentModeId: "default" | "plan" | "auto-edit" | "yolo";
        availableModes: {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }[];
    }, {
        currentModeId: "default" | "plan" | "auto-edit" | "yolo";
        availableModes: {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }[];
    }>;
    protocolVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    protocolVersion: number;
    agentCapabilities: {
        loadSession?: boolean | undefined;
        promptCapabilities?: {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        } | undefined;
    };
    agentInfo: {
        name: string;
        title: string;
        version: string;
    };
    authMethods: {
        name: string;
        description: string | null;
        id: string;
        type?: string | undefined;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }[];
    modes: {
        currentModeId: "default" | "plan" | "auto-edit" | "yolo";
        availableModes: {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }[];
    };
}, {
    protocolVersion: number;
    agentCapabilities: {
        loadSession?: boolean | undefined;
        promptCapabilities?: {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        } | undefined;
    };
    agentInfo: {
        name: string;
        title: string;
        version: string;
    };
    authMethods: {
        name: string;
        description: string | null;
        id: string;
        type?: string | undefined;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }[];
    modes: {
        currentModeId: "default" | "plan" | "auto-edit" | "yolo";
        availableModes: {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }[];
    };
}>;
export declare const contentBlockSchema: z.ZodUnion<[z.ZodObject<{
    annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
        lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }>>>;
    text: z.ZodString;
    type: z.ZodLiteral<"text">;
}, "strip", z.ZodTypeAny, {
    text: string;
    type: "text";
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}, {
    text: string;
    type: "text";
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}>, z.ZodObject<{
    annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
        lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }>>>;
    data: z.ZodString;
    mimeType: z.ZodString;
    type: z.ZodLiteral<"image">;
}, "strip", z.ZodTypeAny, {
    type: "image";
    data: string;
    mimeType: string;
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}, {
    type: "image";
    data: string;
    mimeType: string;
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}>, z.ZodObject<{
    annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
        lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }>>>;
    data: z.ZodString;
    mimeType: z.ZodString;
    type: z.ZodLiteral<"audio">;
}, "strip", z.ZodTypeAny, {
    type: "audio";
    data: string;
    mimeType: string;
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}, {
    type: "audio";
    data: string;
    mimeType: string;
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}>, z.ZodObject<{
    annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
        lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }>>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodLiteral<"resource_link">;
    uri: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "resource_link";
    name: string;
    uri: string;
    title?: string | null | undefined;
    size?: number | null | undefined;
    description?: string | null | undefined;
    mimeType?: string | null | undefined;
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}, {
    type: "resource_link";
    name: string;
    uri: string;
    title?: string | null | undefined;
    size?: number | null | undefined;
    description?: string | null | undefined;
    mimeType?: string | null | undefined;
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}>, z.ZodObject<{
    annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
        lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }, {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    }>>>;
    resource: z.ZodUnion<[z.ZodObject<{
        mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        text: z.ZodString;
        uri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        text: string;
        uri: string;
        mimeType?: string | null | undefined;
    }, {
        text: string;
        uri: string;
        mimeType?: string | null | undefined;
    }>, z.ZodObject<{
        blob: z.ZodString;
        mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        uri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        uri: string;
        blob: string;
        mimeType?: string | null | undefined;
    }, {
        uri: string;
        blob: string;
        mimeType?: string | null | undefined;
    }>]>;
    type: z.ZodLiteral<"resource">;
}, "strip", z.ZodTypeAny, {
    type: "resource";
    resource: {
        text: string;
        uri: string;
        mimeType?: string | null | undefined;
    } | {
        uri: string;
        blob: string;
        mimeType?: string | null | undefined;
    };
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}, {
    type: "resource";
    resource: {
        text: string;
        uri: string;
        mimeType?: string | null | undefined;
    } | {
        uri: string;
        blob: string;
        mimeType?: string | null | undefined;
    };
    annotations?: {
        lastModified?: string | null | undefined;
        audience?: ("user" | "assistant")[] | null | undefined;
        priority?: number | null | undefined;
    } | null | undefined;
}>]>;
export declare const toolCallContentSchema: z.ZodUnion<[z.ZodObject<{
    content: z.ZodUnion<[z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"image">;
    }, "strip", z.ZodTypeAny, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"audio">;
    }, "strip", z.ZodTypeAny, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        name: z.ZodString;
        size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        type: z.ZodLiteral<"resource_link">;
        uri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        resource: z.ZodUnion<[z.ZodObject<{
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            text: z.ZodString;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }>, z.ZodObject<{
            blob: z.ZodString;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }>]>;
        type: z.ZodLiteral<"resource">;
    }, "strip", z.ZodTypeAny, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>]>;
    type: z.ZodLiteral<"content">;
}, "strip", z.ZodTypeAny, {
    content: {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    };
    type: "content";
}, {
    content: {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    };
    type: "content";
}>, z.ZodObject<{
    newText: z.ZodString;
    oldText: z.ZodNullable<z.ZodString>;
    path: z.ZodString;
    type: z.ZodLiteral<"diff">;
}, "strip", z.ZodTypeAny, {
    type: "diff";
    path: string;
    newText: string;
    oldText: string | null;
}, {
    type: "diff";
    path: string;
    newText: string;
    oldText: string | null;
}>]>;
export declare const toolCallSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        type: z.ZodLiteral<"content">;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    }>, z.ZodObject<{
        newText: z.ZodString;
        oldText: z.ZodNullable<z.ZodString>;
        path: z.ZodString;
        type: z.ZodLiteral<"diff">;
    }, "strip", z.ZodTypeAny, {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    }, {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    }>]>, "many">>;
    kind: z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>;
    locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        path: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        line?: number | null | undefined;
    }, {
        path: string;
        line?: number | null | undefined;
    }>, "many">>;
    rawInput: z.ZodOptional<z.ZodUnknown>;
    status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>;
    title: z.ZodString;
    toolCallId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "failed" | "in_progress" | "pending";
    title: string;
    kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
    toolCallId: string;
    content?: ({
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    } | {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    })[] | undefined;
    locations?: {
        path: string;
        line?: number | null | undefined;
    }[] | undefined;
    rawInput?: unknown;
}, {
    status: "completed" | "failed" | "in_progress" | "pending";
    title: string;
    kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
    toolCallId: string;
    content?: ({
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    } | {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    })[] | undefined;
    locations?: {
        path: string;
        line?: number | null | undefined;
    }[] | undefined;
    rawInput?: unknown;
}>;
export declare const clientCapabilitiesSchema: z.ZodObject<{
    fs: z.ZodObject<{
        readTextFile: z.ZodBoolean;
        writeTextFile: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        readTextFile: boolean;
        writeTextFile: boolean;
    }, {
        readTextFile: boolean;
        writeTextFile: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    fs: {
        readTextFile: boolean;
        writeTextFile: boolean;
    };
}, {
    fs: {
        readTextFile: boolean;
        writeTextFile: boolean;
    };
}>;
export declare const promptRequestSchema: z.ZodObject<{
    prompt: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"image">;
    }, "strip", z.ZodTypeAny, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"audio">;
    }, "strip", z.ZodTypeAny, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        name: z.ZodString;
        size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        type: z.ZodLiteral<"resource_link">;
        uri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        resource: z.ZodUnion<[z.ZodObject<{
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            text: z.ZodString;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }>, z.ZodObject<{
            blob: z.ZodString;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }>]>;
        type: z.ZodLiteral<"resource">;
    }, "strip", z.ZodTypeAny, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>]>, "many">;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    prompt: ({
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    })[];
    sessionId: string;
}, {
    prompt: ({
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    })[];
    sessionId: string;
}>;
export declare const availableCommandInputSchema: z.ZodObject<{
    hint: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hint: string;
}, {
    hint: string;
}>;
export declare const availableCommandSchema: z.ZodObject<{
    description: z.ZodString;
    input: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        hint: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        hint: string;
    }, {
        hint: string;
    }>>>;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    input?: {
        hint: string;
    } | null | undefined;
}, {
    name: string;
    description: string;
    input?: {
        hint: string;
    } | null | undefined;
}>;
export declare const availableCommandsUpdateSchema: z.ZodObject<{
    availableCommands: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        input: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            hint: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            hint: string;
        }, {
            hint: string;
        }>>>;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        input?: {
            hint: string;
        } | null | undefined;
    }, {
        name: string;
        description: string;
        input?: {
            hint: string;
        } | null | undefined;
    }>, "many">;
    sessionUpdate: z.ZodLiteral<"available_commands_update">;
}, "strip", z.ZodTypeAny, {
    sessionUpdate: "available_commands_update";
    availableCommands: {
        name: string;
        description: string;
        input?: {
            hint: string;
        } | null | undefined;
    }[];
}, {
    sessionUpdate: "available_commands_update";
    availableCommands: {
        name: string;
        description: string;
        input?: {
            hint: string;
        } | null | undefined;
    }[];
}>;
export declare const currentModeUpdateSchema: z.ZodObject<{
    sessionUpdate: z.ZodLiteral<"current_mode_update">;
    modeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
}, "strip", z.ZodTypeAny, {
    sessionUpdate: "current_mode_update";
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}, {
    sessionUpdate: "current_mode_update";
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}>;
export type CurrentModeUpdate = z.infer<typeof currentModeUpdateSchema>;
export declare const currentModelUpdateSchema: z.ZodObject<{
    sessionUpdate: z.ZodLiteral<"current_model_update">;
    model: z.ZodObject<{
        _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        modelId: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    }, {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    model: {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    };
    sessionUpdate: "current_model_update";
}, {
    model: {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    };
    sessionUpdate: "current_model_update";
}>;
export type CurrentModelUpdate = z.infer<typeof currentModelUpdateSchema>;
export declare const sessionUpdateSchema: z.ZodUnion<[z.ZodObject<{
    content: z.ZodUnion<[z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"image">;
    }, "strip", z.ZodTypeAny, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"audio">;
    }, "strip", z.ZodTypeAny, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        name: z.ZodString;
        size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        type: z.ZodLiteral<"resource_link">;
        uri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        resource: z.ZodUnion<[z.ZodObject<{
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            text: z.ZodString;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }>, z.ZodObject<{
            blob: z.ZodString;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }>]>;
        type: z.ZodLiteral<"resource">;
    }, "strip", z.ZodTypeAny, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>]>;
    sessionUpdate: z.ZodLiteral<"user_message_chunk">;
    _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }>>>;
        durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        /** Server-side timestamp (ms since epoch) for correct message ordering */
        timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    content: {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    };
    sessionUpdate: "user_message_chunk";
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
}, {
    content: {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    };
    sessionUpdate: "user_message_chunk";
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
}>, z.ZodObject<{
    content: z.ZodUnion<[z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"image">;
    }, "strip", z.ZodTypeAny, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"audio">;
    }, "strip", z.ZodTypeAny, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        name: z.ZodString;
        size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        type: z.ZodLiteral<"resource_link">;
        uri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        resource: z.ZodUnion<[z.ZodObject<{
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            text: z.ZodString;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }>, z.ZodObject<{
            blob: z.ZodString;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }>]>;
        type: z.ZodLiteral<"resource">;
    }, "strip", z.ZodTypeAny, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>]>;
    sessionUpdate: z.ZodLiteral<"agent_message_chunk">;
    _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }>>>;
        durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        /** Server-side timestamp (ms since epoch) for correct message ordering */
        timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    content: {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    };
    sessionUpdate: "agent_message_chunk";
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
}, {
    content: {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    };
    sessionUpdate: "agent_message_chunk";
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
}>, z.ZodObject<{
    content: z.ZodUnion<[z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"image">;
    }, "strip", z.ZodTypeAny, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"audio">;
    }, "strip", z.ZodTypeAny, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        name: z.ZodString;
        size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        type: z.ZodLiteral<"resource_link">;
        uri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        resource: z.ZodUnion<[z.ZodObject<{
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            text: z.ZodString;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }>, z.ZodObject<{
            blob: z.ZodString;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }>]>;
        type: z.ZodLiteral<"resource">;
    }, "strip", z.ZodTypeAny, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>]>;
    sessionUpdate: z.ZodLiteral<"agent_thought_chunk">;
    _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }>>>;
        durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        /** Server-side timestamp (ms since epoch) for correct message ordering */
        timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    content: {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    };
    sessionUpdate: "agent_thought_chunk";
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
}, {
    content: {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    };
    sessionUpdate: "agent_thought_chunk";
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
}>, z.ZodObject<{
    content: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        type: z.ZodLiteral<"content">;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    }>, z.ZodObject<{
        newText: z.ZodString;
        oldText: z.ZodNullable<z.ZodString>;
        path: z.ZodString;
        type: z.ZodLiteral<"diff">;
    }, "strip", z.ZodTypeAny, {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    }, {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    }>]>, "many">>;
    kind: z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>;
    locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        path: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        line?: number | null | undefined;
    }, {
        path: string;
        line?: number | null | undefined;
    }>, "many">>;
    rawInput: z.ZodOptional<z.ZodUnknown>;
    _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }>>>;
        durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        /** Server-side timestamp (ms since epoch) for correct message ordering */
        timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }>>>;
    sessionUpdate: z.ZodLiteral<"tool_call">;
    status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>;
    title: z.ZodString;
    toolCallId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "failed" | "in_progress" | "pending";
    title: string;
    kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
    sessionUpdate: "tool_call";
    toolCallId: string;
    content?: ({
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    } | {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    })[] | undefined;
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
    locations?: {
        path: string;
        line?: number | null | undefined;
    }[] | undefined;
    rawInput?: unknown;
}, {
    status: "completed" | "failed" | "in_progress" | "pending";
    title: string;
    kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
    sessionUpdate: "tool_call";
    toolCallId: string;
    content?: ({
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    } | {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    })[] | undefined;
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
    locations?: {
        path: string;
        line?: number | null | undefined;
    }[] | undefined;
    rawInput?: unknown;
}>, z.ZodObject<{
    content: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        type: z.ZodLiteral<"content">;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    }>, z.ZodObject<{
        newText: z.ZodString;
        oldText: z.ZodNullable<z.ZodString>;
        path: z.ZodString;
        type: z.ZodLiteral<"diff">;
    }, "strip", z.ZodTypeAny, {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    }, {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    }>]>, "many">>>;
    kind: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>>>;
    locations: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
        line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        path: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        line?: number | null | undefined;
    }, {
        path: string;
        line?: number | null | undefined;
    }>, "many">>>;
    rawInput: z.ZodOptional<z.ZodUnknown>;
    rawOutput: z.ZodOptional<z.ZodUnknown>;
    _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }, {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        }>>>;
        durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        /** Server-side timestamp (ms since epoch) for correct message ordering */
        timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }, {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    }>>>;
    sessionUpdate: z.ZodLiteral<"tool_call_update">;
    status: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>>>;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    toolCallId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionUpdate: "tool_call_update";
    toolCallId: string;
    content?: ({
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    } | {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    })[] | null | undefined;
    status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
    title?: string | null | undefined;
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
    kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
    rawOutput?: unknown;
    locations?: {
        path: string;
        line?: number | null | undefined;
    }[] | null | undefined;
    rawInput?: unknown;
}, {
    sessionUpdate: "tool_call_update";
    toolCallId: string;
    content?: ({
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        type: "content";
    } | {
        type: "diff";
        path: string;
        newText: string;
        oldText: string | null;
    })[] | null | undefined;
    status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
    title?: string | null | undefined;
    _meta?: {
        toolName?: string | null | undefined;
        timestamp?: number | null | undefined;
        durationMs?: number | null | undefined;
        usage?: {
            totalTokens?: number | null | undefined;
            promptTokens?: number | null | undefined;
            completionTokens?: number | null | undefined;
            thoughtsTokens?: number | null | undefined;
            cachedTokens?: number | null | undefined;
        } | null | undefined;
        parentToolCallId?: string | null | undefined;
        subagentType?: string | null | undefined;
    } | null | undefined;
    kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
    rawOutput?: unknown;
    locations?: {
        path: string;
        line?: number | null | undefined;
    }[] | null | undefined;
    rawInput?: unknown;
}>, z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        content: z.ZodString;
        priority: z.ZodUnion<[z.ZodLiteral<"high">, z.ZodLiteral<"medium">, z.ZodLiteral<"low">]>;
        status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">]>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        status: "completed" | "in_progress" | "pending";
        priority: "low" | "medium" | "high";
    }, {
        content: string;
        status: "completed" | "in_progress" | "pending";
        priority: "low" | "medium" | "high";
    }>, "many">;
    sessionUpdate: z.ZodLiteral<"plan">;
}, "strip", z.ZodTypeAny, {
    entries: {
        content: string;
        status: "completed" | "in_progress" | "pending";
        priority: "low" | "medium" | "high";
    }[];
    sessionUpdate: "plan";
}, {
    entries: {
        content: string;
        status: "completed" | "in_progress" | "pending";
        priority: "low" | "medium" | "high";
    }[];
    sessionUpdate: "plan";
}>, z.ZodObject<{
    sessionUpdate: z.ZodLiteral<"current_mode_update">;
    modeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
}, "strip", z.ZodTypeAny, {
    sessionUpdate: "current_mode_update";
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}, {
    sessionUpdate: "current_mode_update";
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}>, z.ZodObject<{
    sessionUpdate: z.ZodLiteral<"current_model_update">;
    model: z.ZodObject<{
        _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        modelId: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    }, {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    model: {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    };
    sessionUpdate: "current_model_update";
}, {
    model: {
        name: string;
        modelId: string;
        description?: string | null | undefined;
        _meta?: Record<string, unknown> | null | undefined;
    };
    sessionUpdate: "current_model_update";
}>, z.ZodObject<{
    availableCommands: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        input: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            hint: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            hint: string;
        }, {
            hint: string;
        }>>>;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        input?: {
            hint: string;
        } | null | undefined;
    }, {
        name: string;
        description: string;
        input?: {
            hint: string;
        } | null | undefined;
    }>, "many">;
    sessionUpdate: z.ZodLiteral<"available_commands_update">;
}, "strip", z.ZodTypeAny, {
    sessionUpdate: "available_commands_update";
    availableCommands: {
        name: string;
        description: string;
        input?: {
            hint: string;
        } | null | undefined;
    }[];
}, {
    sessionUpdate: "available_commands_update";
    availableCommands: {
        name: string;
        description: string;
        input?: {
            hint: string;
        } | null | undefined;
    }[];
}>]>;
export declare const agentResponseSchema: z.ZodUnion<[z.ZodObject<{
    agentCapabilities: z.ZodObject<{
        loadSession: z.ZodOptional<z.ZodBoolean>;
        promptCapabilities: z.ZodOptional<z.ZodObject<{
            audio: z.ZodOptional<z.ZodBoolean>;
            embeddedContext: z.ZodOptional<z.ZodBoolean>;
            image: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        }, {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        loadSession?: boolean | undefined;
        promptCapabilities?: {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        } | undefined;
    }, {
        loadSession?: boolean | undefined;
        promptCapabilities?: {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        } | undefined;
    }>;
    agentInfo: z.ZodObject<{
        name: z.ZodString;
        title: z.ZodString;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        title: string;
        version: string;
    }, {
        name: string;
        title: string;
        version: string;
    }>;
    authMethods: z.ZodArray<z.ZodObject<{
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        description: z.ZodNullable<z.ZodString>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string | null;
        id: string;
        type?: string | undefined;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }, {
        name: string;
        description: string | null;
        id: string;
        type?: string | undefined;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }>, "many">;
    modes: z.ZodObject<{
        currentModeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
        availableModes: z.ZodArray<z.ZodObject<{
            id: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
            name: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }, {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        currentModeId: "default" | "plan" | "auto-edit" | "yolo";
        availableModes: {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }[];
    }, {
        currentModeId: "default" | "plan" | "auto-edit" | "yolo";
        availableModes: {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }[];
    }>;
    protocolVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    protocolVersion: number;
    agentCapabilities: {
        loadSession?: boolean | undefined;
        promptCapabilities?: {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        } | undefined;
    };
    agentInfo: {
        name: string;
        title: string;
        version: string;
    };
    authMethods: {
        name: string;
        description: string | null;
        id: string;
        type?: string | undefined;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }[];
    modes: {
        currentModeId: "default" | "plan" | "auto-edit" | "yolo";
        availableModes: {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }[];
    };
}, {
    protocolVersion: number;
    agentCapabilities: {
        loadSession?: boolean | undefined;
        promptCapabilities?: {
            image?: boolean | undefined;
            audio?: boolean | undefined;
            embeddedContext?: boolean | undefined;
        } | undefined;
    };
    agentInfo: {
        name: string;
        title: string;
        version: string;
    };
    authMethods: {
        name: string;
        description: string | null;
        id: string;
        type?: string | undefined;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }[];
    modes: {
        currentModeId: "default" | "plan" | "auto-edit" | "yolo";
        availableModes: {
            name: string;
            description: string;
            id: "default" | "plan" | "auto-edit" | "yolo";
        }[];
    };
}>, z.ZodObject<{
    sessionId: z.ZodString;
    models: z.ZodObject<{
        _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        availableModels: z.ZodArray<z.ZodObject<{
            _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            modelId: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }, {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }>, "many">;
        currentModelId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        availableModels: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }[];
        currentModelId: string;
        _meta?: Record<string, unknown> | null | undefined;
    }, {
        availableModels: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }[];
        currentModelId: string;
        _meta?: Record<string, unknown> | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    models: {
        availableModels: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }[];
        currentModelId: string;
        _meta?: Record<string, unknown> | null | undefined;
    };
}, {
    sessionId: string;
    models: {
        availableModels: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }[];
        currentModelId: string;
        _meta?: Record<string, unknown> | null | undefined;
    };
}>, z.ZodNull, z.ZodObject<{
    stopReason: z.ZodUnion<[z.ZodLiteral<"end_turn">, z.ZodLiteral<"max_tokens">, z.ZodLiteral<"refusal">, z.ZodLiteral<"cancelled">]>;
}, "strip", z.ZodTypeAny, {
    stopReason: "cancelled" | "refusal" | "max_tokens" | "end_turn";
}, {
    stopReason: "cancelled" | "refusal" | "max_tokens" | "end_turn";
}>, z.ZodObject<{
    hasMore: z.ZodBoolean;
    items: z.ZodArray<z.ZodObject<{
        cwd: z.ZodString;
        filePath: z.ZodString;
        gitBranch: z.ZodOptional<z.ZodString>;
        messageCount: z.ZodNumber;
        mtime: z.ZodNumber;
        prompt: z.ZodString;
        sessionId: z.ZodString;
        startTime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        prompt: string;
        sessionId: string;
        cwd: string;
        startTime: string;
        messageCount: number;
        mtime: number;
        gitBranch?: string | undefined;
    }, {
        filePath: string;
        prompt: string;
        sessionId: string;
        cwd: string;
        startTime: string;
        messageCount: number;
        mtime: number;
        gitBranch?: string | undefined;
    }>, "many">;
    nextCursor: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    hasMore: boolean;
    items: {
        filePath: string;
        prompt: string;
        sessionId: string;
        cwd: string;
        startTime: string;
        messageCount: number;
        mtime: number;
        gitBranch?: string | undefined;
    }[];
    nextCursor?: number | undefined;
}, {
    hasMore: boolean;
    items: {
        filePath: string;
        prompt: string;
        sessionId: string;
        cwd: string;
        startTime: string;
        messageCount: number;
        mtime: number;
        gitBranch?: string | undefined;
    }[];
    nextCursor?: number | undefined;
}>, z.ZodObject<{
    modeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
}, "strip", z.ZodTypeAny, {
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}, {
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}>, z.ZodObject<{
    modelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    modelId: string;
}, {
    modelId: string;
}>]>;
export declare const requestPermissionRequestSchema: z.ZodObject<{
    options: z.ZodArray<z.ZodObject<{
        kind: z.ZodUnion<[z.ZodLiteral<"allow_once">, z.ZodLiteral<"allow_always">, z.ZodLiteral<"reject_once">, z.ZodLiteral<"reject_always">]>;
        name: z.ZodString;
        optionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
        optionId: string;
    }, {
        name: string;
        kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
        optionId: string;
    }>, "many">;
    sessionId: z.ZodString;
    toolCall: z.ZodObject<{
        content: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
            content: z.ZodUnion<[z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                text: z.ZodString;
                type: z.ZodLiteral<"text">;
            }, "strip", z.ZodTypeAny, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"image">;
            }, "strip", z.ZodTypeAny, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"audio">;
            }, "strip", z.ZodTypeAny, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                name: z.ZodString;
                size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                type: z.ZodLiteral<"resource_link">;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                resource: z.ZodUnion<[z.ZodObject<{
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    text: z.ZodString;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }>, z.ZodObject<{
                    blob: z.ZodString;
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }>]>;
                type: z.ZodLiteral<"resource">;
            }, "strip", z.ZodTypeAny, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>]>;
            type: z.ZodLiteral<"content">;
        }, "strip", z.ZodTypeAny, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }>, z.ZodObject<{
            newText: z.ZodString;
            oldText: z.ZodNullable<z.ZodString>;
            path: z.ZodString;
            type: z.ZodLiteral<"diff">;
        }, "strip", z.ZodTypeAny, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }>]>, "many">>;
        kind: z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>;
        locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            line?: number | null | undefined;
        }, {
            path: string;
            line?: number | null | undefined;
        }>, "many">>;
        rawInput: z.ZodOptional<z.ZodUnknown>;
        status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>;
        title: z.ZodString;
        toolCallId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    }, {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    }>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    options: {
        name: string;
        kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
        optionId: string;
    }[];
    toolCall: {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    };
}, {
    sessionId: string;
    options: {
        name: string;
        kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
        optionId: string;
    }[];
    toolCall: {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    };
}>;
export declare const initializeRequestSchema: z.ZodObject<{
    clientCapabilities: z.ZodObject<{
        fs: z.ZodObject<{
            readTextFile: z.ZodBoolean;
            writeTextFile: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            readTextFile: boolean;
            writeTextFile: boolean;
        }, {
            readTextFile: boolean;
            writeTextFile: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        fs: {
            readTextFile: boolean;
            writeTextFile: boolean;
        };
    }, {
        fs: {
            readTextFile: boolean;
            writeTextFile: boolean;
        };
    }>;
    protocolVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    protocolVersion: number;
    clientCapabilities: {
        fs: {
            readTextFile: boolean;
            writeTextFile: boolean;
        };
    };
}, {
    protocolVersion: number;
    clientCapabilities: {
        fs: {
            readTextFile: boolean;
            writeTextFile: boolean;
        };
    };
}>;
export declare const sessionNotificationSchema: z.ZodObject<{
    sessionId: z.ZodString;
    update: z.ZodUnion<[z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        sessionUpdate: z.ZodLiteral<"user_message_chunk">;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "user_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "user_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        sessionUpdate: z.ZodLiteral<"agent_message_chunk">;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        sessionUpdate: z.ZodLiteral<"agent_thought_chunk">;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_thought_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_thought_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        content: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
            content: z.ZodUnion<[z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                text: z.ZodString;
                type: z.ZodLiteral<"text">;
            }, "strip", z.ZodTypeAny, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"image">;
            }, "strip", z.ZodTypeAny, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"audio">;
            }, "strip", z.ZodTypeAny, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                name: z.ZodString;
                size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                type: z.ZodLiteral<"resource_link">;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                resource: z.ZodUnion<[z.ZodObject<{
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    text: z.ZodString;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }>, z.ZodObject<{
                    blob: z.ZodString;
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }>]>;
                type: z.ZodLiteral<"resource">;
            }, "strip", z.ZodTypeAny, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>]>;
            type: z.ZodLiteral<"content">;
        }, "strip", z.ZodTypeAny, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }>, z.ZodObject<{
            newText: z.ZodString;
            oldText: z.ZodNullable<z.ZodString>;
            path: z.ZodString;
            type: z.ZodLiteral<"diff">;
        }, "strip", z.ZodTypeAny, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }>]>, "many">>;
        kind: z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>;
        locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            line?: number | null | undefined;
        }, {
            path: string;
            line?: number | null | undefined;
        }>, "many">>;
        rawInput: z.ZodOptional<z.ZodUnknown>;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
        sessionUpdate: z.ZodLiteral<"tool_call">;
        status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>;
        title: z.ZodString;
        toolCallId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        sessionUpdate: "tool_call";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    }, {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        sessionUpdate: "tool_call";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    }>, z.ZodObject<{
        content: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
            content: z.ZodUnion<[z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                text: z.ZodString;
                type: z.ZodLiteral<"text">;
            }, "strip", z.ZodTypeAny, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"image">;
            }, "strip", z.ZodTypeAny, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"audio">;
            }, "strip", z.ZodTypeAny, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                name: z.ZodString;
                size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                type: z.ZodLiteral<"resource_link">;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                resource: z.ZodUnion<[z.ZodObject<{
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    text: z.ZodString;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }>, z.ZodObject<{
                    blob: z.ZodString;
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }>]>;
                type: z.ZodLiteral<"resource">;
            }, "strip", z.ZodTypeAny, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>]>;
            type: z.ZodLiteral<"content">;
        }, "strip", z.ZodTypeAny, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }>, z.ZodObject<{
            newText: z.ZodString;
            oldText: z.ZodNullable<z.ZodString>;
            path: z.ZodString;
            type: z.ZodLiteral<"diff">;
        }, "strip", z.ZodTypeAny, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }>]>, "many">>>;
        kind: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>>>;
        locations: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
            line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            line?: number | null | undefined;
        }, {
            path: string;
            line?: number | null | undefined;
        }>, "many">>>;
        rawInput: z.ZodOptional<z.ZodUnknown>;
        rawOutput: z.ZodOptional<z.ZodUnknown>;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
        sessionUpdate: z.ZodLiteral<"tool_call_update">;
        status: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>>>;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toolCallId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sessionUpdate: "tool_call_update";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | null | undefined;
        status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
        title?: string | null | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
        rawOutput?: unknown;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | null | undefined;
        rawInput?: unknown;
    }, {
        sessionUpdate: "tool_call_update";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | null | undefined;
        status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
        title?: string | null | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
        rawOutput?: unknown;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | null | undefined;
        rawInput?: unknown;
    }>, z.ZodObject<{
        entries: z.ZodArray<z.ZodObject<{
            content: z.ZodString;
            priority: z.ZodUnion<[z.ZodLiteral<"high">, z.ZodLiteral<"medium">, z.ZodLiteral<"low">]>;
            status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">]>;
        }, "strip", z.ZodTypeAny, {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }, {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }>, "many">;
        sessionUpdate: z.ZodLiteral<"plan">;
    }, "strip", z.ZodTypeAny, {
        entries: {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }[];
        sessionUpdate: "plan";
    }, {
        entries: {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }[];
        sessionUpdate: "plan";
    }>, z.ZodObject<{
        sessionUpdate: z.ZodLiteral<"current_mode_update">;
        modeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
    }, "strip", z.ZodTypeAny, {
        sessionUpdate: "current_mode_update";
        modeId: "default" | "plan" | "auto-edit" | "yolo";
    }, {
        sessionUpdate: "current_mode_update";
        modeId: "default" | "plan" | "auto-edit" | "yolo";
    }>, z.ZodObject<{
        sessionUpdate: z.ZodLiteral<"current_model_update">;
        model: z.ZodObject<{
            _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            modelId: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }, {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        model: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        };
        sessionUpdate: "current_model_update";
    }, {
        model: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        };
        sessionUpdate: "current_model_update";
    }>, z.ZodObject<{
        availableCommands: z.ZodArray<z.ZodObject<{
            description: z.ZodString;
            input: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                hint: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                hint: string;
            }, {
                hint: string;
            }>>>;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }, {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }>, "many">;
        sessionUpdate: z.ZodLiteral<"available_commands_update">;
    }, "strip", z.ZodTypeAny, {
        sessionUpdate: "available_commands_update";
        availableCommands: {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }[];
    }, {
        sessionUpdate: "available_commands_update";
        availableCommands: {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }[];
    }>]>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    update: {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "user_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_thought_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        sessionUpdate: "tool_call";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    } | {
        sessionUpdate: "tool_call_update";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | null | undefined;
        status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
        title?: string | null | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
        rawOutput?: unknown;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | null | undefined;
        rawInput?: unknown;
    } | {
        entries: {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }[];
        sessionUpdate: "plan";
    } | {
        sessionUpdate: "current_mode_update";
        modeId: "default" | "plan" | "auto-edit" | "yolo";
    } | {
        model: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        };
        sessionUpdate: "current_model_update";
    } | {
        sessionUpdate: "available_commands_update";
        availableCommands: {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }[];
    };
}, {
    sessionId: string;
    update: {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "user_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_thought_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        sessionUpdate: "tool_call";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    } | {
        sessionUpdate: "tool_call_update";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | null | undefined;
        status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
        title?: string | null | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
        rawOutput?: unknown;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | null | undefined;
        rawInput?: unknown;
    } | {
        entries: {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }[];
        sessionUpdate: "plan";
    } | {
        sessionUpdate: "current_mode_update";
        modeId: "default" | "plan" | "auto-edit" | "yolo";
    } | {
        model: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        };
        sessionUpdate: "current_model_update";
    } | {
        sessionUpdate: "available_commands_update";
        availableCommands: {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }[];
    };
}>;
export declare const clientRequestSchema: z.ZodUnion<[z.ZodObject<{
    content: z.ZodString;
    path: z.ZodString;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    sessionId: string;
    path: string;
}, {
    content: string;
    sessionId: string;
    path: string;
}>, z.ZodObject<{
    limit: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    path: z.ZodString;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    path: string;
    line?: number | null | undefined;
    limit?: number | null | undefined;
}, {
    sessionId: string;
    path: string;
    line?: number | null | undefined;
    limit?: number | null | undefined;
}>, z.ZodObject<{
    options: z.ZodArray<z.ZodObject<{
        kind: z.ZodUnion<[z.ZodLiteral<"allow_once">, z.ZodLiteral<"allow_always">, z.ZodLiteral<"reject_once">, z.ZodLiteral<"reject_always">]>;
        name: z.ZodString;
        optionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
        optionId: string;
    }, {
        name: string;
        kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
        optionId: string;
    }>, "many">;
    sessionId: z.ZodString;
    toolCall: z.ZodObject<{
        content: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
            content: z.ZodUnion<[z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                text: z.ZodString;
                type: z.ZodLiteral<"text">;
            }, "strip", z.ZodTypeAny, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"image">;
            }, "strip", z.ZodTypeAny, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"audio">;
            }, "strip", z.ZodTypeAny, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                name: z.ZodString;
                size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                type: z.ZodLiteral<"resource_link">;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                resource: z.ZodUnion<[z.ZodObject<{
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    text: z.ZodString;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }>, z.ZodObject<{
                    blob: z.ZodString;
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }>]>;
                type: z.ZodLiteral<"resource">;
            }, "strip", z.ZodTypeAny, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>]>;
            type: z.ZodLiteral<"content">;
        }, "strip", z.ZodTypeAny, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }>, z.ZodObject<{
            newText: z.ZodString;
            oldText: z.ZodNullable<z.ZodString>;
            path: z.ZodString;
            type: z.ZodLiteral<"diff">;
        }, "strip", z.ZodTypeAny, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }>]>, "many">>;
        kind: z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>;
        locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            line?: number | null | undefined;
        }, {
            path: string;
            line?: number | null | undefined;
        }>, "many">>;
        rawInput: z.ZodOptional<z.ZodUnknown>;
        status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>;
        title: z.ZodString;
        toolCallId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    }, {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    }>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    options: {
        name: string;
        kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
        optionId: string;
    }[];
    toolCall: {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    };
}, {
    sessionId: string;
    options: {
        name: string;
        kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
        optionId: string;
    }[];
    toolCall: {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    };
}>]>;
export declare const agentRequestSchema: z.ZodUnion<[z.ZodObject<{
    clientCapabilities: z.ZodObject<{
        fs: z.ZodObject<{
            readTextFile: z.ZodBoolean;
            writeTextFile: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            readTextFile: boolean;
            writeTextFile: boolean;
        }, {
            readTextFile: boolean;
            writeTextFile: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        fs: {
            readTextFile: boolean;
            writeTextFile: boolean;
        };
    }, {
        fs: {
            readTextFile: boolean;
            writeTextFile: boolean;
        };
    }>;
    protocolVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    protocolVersion: number;
    clientCapabilities: {
        fs: {
            readTextFile: boolean;
            writeTextFile: boolean;
        };
    };
}, {
    protocolVersion: number;
    clientCapabilities: {
        fs: {
            readTextFile: boolean;
            writeTextFile: boolean;
        };
    };
}>, z.ZodObject<{
    methodId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    methodId: string;
}, {
    methodId: string;
}>, z.ZodObject<{
    cwd: z.ZodString;
    mcpServers: z.ZodArray<z.ZodObject<{
        args: z.ZodArray<z.ZodString, "many">;
        command: z.ZodString;
        env: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }, {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    cwd: string;
    mcpServers: {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }[];
}, {
    cwd: string;
    mcpServers: {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }[];
}>, z.ZodObject<{
    cwd: z.ZodString;
    mcpServers: z.ZodArray<z.ZodObject<{
        args: z.ZodArray<z.ZodString, "many">;
        command: z.ZodString;
        env: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }, {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }>, "many">;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    cwd: string;
    mcpServers: {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }[];
}, {
    sessionId: string;
    cwd: string;
    mcpServers: {
        name: string;
        command: string;
        args: string[];
        env: {
            name: string;
            value: string;
        }[];
    }[];
}>, z.ZodObject<{
    prompt: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"image">;
    }, "strip", z.ZodTypeAny, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        data: z.ZodString;
        mimeType: z.ZodString;
        type: z.ZodLiteral<"audio">;
    }, "strip", z.ZodTypeAny, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        name: z.ZodString;
        size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        type: z.ZodLiteral<"resource_link">;
        uri: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
            lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }, {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        }>>>;
        resource: z.ZodUnion<[z.ZodObject<{
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            text: z.ZodString;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }, {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        }>, z.ZodObject<{
            blob: z.ZodString;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }, {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        }>]>;
        type: z.ZodLiteral<"resource">;
    }, "strip", z.ZodTypeAny, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }, {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    }>]>, "many">;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    prompt: ({
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    })[];
    sessionId: string;
}, {
    prompt: ({
        text: string;
        type: "text";
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource_link";
        name: string;
        uri: string;
        title?: string | null | undefined;
        size?: number | null | undefined;
        description?: string | null | undefined;
        mimeType?: string | null | undefined;
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    } | {
        type: "resource";
        resource: {
            text: string;
            uri: string;
            mimeType?: string | null | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | null | undefined;
        };
        annotations?: {
            lastModified?: string | null | undefined;
            audience?: ("user" | "assistant")[] | null | undefined;
            priority?: number | null | undefined;
        } | null | undefined;
    })[];
    sessionId: string;
}>, z.ZodObject<{
    cursor: z.ZodOptional<z.ZodNumber>;
    cwd: z.ZodString;
    size: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cwd: string;
    cursor?: number | undefined;
    size?: number | undefined;
}, {
    cwd: string;
    cursor?: number | undefined;
    size?: number | undefined;
}>, z.ZodObject<{
    sessionId: z.ZodString;
    modeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}, {
    sessionId: string;
    modeId: "default" | "plan" | "auto-edit" | "yolo";
}>, z.ZodObject<{
    sessionId: z.ZodString;
    modelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    modelId: string;
}, {
    sessionId: string;
    modelId: string;
}>]>;
export declare const agentNotificationSchema: z.ZodObject<{
    sessionId: z.ZodString;
    update: z.ZodUnion<[z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        sessionUpdate: z.ZodLiteral<"user_message_chunk">;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "user_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "user_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        sessionUpdate: z.ZodLiteral<"agent_message_chunk">;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        content: z.ZodUnion<[z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            text: z.ZodString;
            type: z.ZodLiteral<"text">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"image">;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            data: z.ZodString;
            mimeType: z.ZodString;
            type: z.ZodLiteral<"audio">;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            name: z.ZodString;
            size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            type: z.ZodLiteral<"resource_link">;
            uri: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>, z.ZodObject<{
            annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }, {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            }>>>;
            resource: z.ZodUnion<[z.ZodObject<{
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                text: z.ZodString;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }, {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            }>, z.ZodObject<{
                blob: z.ZodString;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }, {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            }>]>;
            type: z.ZodLiteral<"resource">;
        }, "strip", z.ZodTypeAny, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }, {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        }>]>;
        sessionUpdate: z.ZodLiteral<"agent_thought_chunk">;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_thought_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }, {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_thought_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    }>, z.ZodObject<{
        content: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
            content: z.ZodUnion<[z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                text: z.ZodString;
                type: z.ZodLiteral<"text">;
            }, "strip", z.ZodTypeAny, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"image">;
            }, "strip", z.ZodTypeAny, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"audio">;
            }, "strip", z.ZodTypeAny, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                name: z.ZodString;
                size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                type: z.ZodLiteral<"resource_link">;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                resource: z.ZodUnion<[z.ZodObject<{
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    text: z.ZodString;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }>, z.ZodObject<{
                    blob: z.ZodString;
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }>]>;
                type: z.ZodLiteral<"resource">;
            }, "strip", z.ZodTypeAny, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>]>;
            type: z.ZodLiteral<"content">;
        }, "strip", z.ZodTypeAny, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }>, z.ZodObject<{
            newText: z.ZodString;
            oldText: z.ZodNullable<z.ZodString>;
            path: z.ZodString;
            type: z.ZodLiteral<"diff">;
        }, "strip", z.ZodTypeAny, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }>]>, "many">>;
        kind: z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>;
        locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            line?: number | null | undefined;
        }, {
            path: string;
            line?: number | null | undefined;
        }>, "many">>;
        rawInput: z.ZodOptional<z.ZodUnknown>;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
        sessionUpdate: z.ZodLiteral<"tool_call">;
        status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>;
        title: z.ZodString;
        toolCallId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        sessionUpdate: "tool_call";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    }, {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        sessionUpdate: "tool_call";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    }>, z.ZodObject<{
        content: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
            content: z.ZodUnion<[z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                text: z.ZodString;
                type: z.ZodLiteral<"text">;
            }, "strip", z.ZodTypeAny, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"image">;
            }, "strip", z.ZodTypeAny, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                data: z.ZodString;
                mimeType: z.ZodString;
                type: z.ZodLiteral<"audio">;
            }, "strip", z.ZodTypeAny, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                name: z.ZodString;
                size: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                type: z.ZodLiteral<"resource_link">;
                uri: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>, z.ZodObject<{
                annotations: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                    audience: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"assistant">, z.ZodLiteral<"user">]>, "many">>>;
                    lastModified: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    priority: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }, {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                }>>>;
                resource: z.ZodUnion<[z.ZodObject<{
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    text: z.ZodString;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }, {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                }>, z.ZodObject<{
                    blob: z.ZodString;
                    mimeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }, {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                }>]>;
                type: z.ZodLiteral<"resource">;
            }, "strip", z.ZodTypeAny, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }, {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            }>]>;
            type: z.ZodLiteral<"content">;
        }, "strip", z.ZodTypeAny, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }, {
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        }>, z.ZodObject<{
            newText: z.ZodString;
            oldText: z.ZodNullable<z.ZodString>;
            path: z.ZodString;
            type: z.ZodLiteral<"diff">;
        }, "strip", z.ZodTypeAny, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }, {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        }>]>, "many">>>;
        kind: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"read">, z.ZodLiteral<"edit">, z.ZodLiteral<"delete">, z.ZodLiteral<"move">, z.ZodLiteral<"search">, z.ZodLiteral<"execute">, z.ZodLiteral<"think">, z.ZodLiteral<"fetch">, z.ZodLiteral<"switch_mode">, z.ZodLiteral<"other">]>>>;
        locations: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
            line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            line?: number | null | undefined;
        }, {
            path: string;
            line?: number | null | undefined;
        }>, "many">>>;
        rawInput: z.ZodOptional<z.ZodUnknown>;
        rawOutput: z.ZodOptional<z.ZodUnknown>;
        _meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            usage: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                promptTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                completionTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                thoughtsTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                totalTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                cachedTokens: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }, {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            }>>>;
            durationMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            parentToolCallId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            subagentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            /** Server-side timestamp (ms since epoch) for correct message ordering */
            timestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }, {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        }>>>;
        sessionUpdate: z.ZodLiteral<"tool_call_update">;
        status: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"failed">]>>>;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toolCallId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sessionUpdate: "tool_call_update";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | null | undefined;
        status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
        title?: string | null | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
        rawOutput?: unknown;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | null | undefined;
        rawInput?: unknown;
    }, {
        sessionUpdate: "tool_call_update";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | null | undefined;
        status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
        title?: string | null | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
        rawOutput?: unknown;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | null | undefined;
        rawInput?: unknown;
    }>, z.ZodObject<{
        entries: z.ZodArray<z.ZodObject<{
            content: z.ZodString;
            priority: z.ZodUnion<[z.ZodLiteral<"high">, z.ZodLiteral<"medium">, z.ZodLiteral<"low">]>;
            status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"in_progress">, z.ZodLiteral<"completed">]>;
        }, "strip", z.ZodTypeAny, {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }, {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }>, "many">;
        sessionUpdate: z.ZodLiteral<"plan">;
    }, "strip", z.ZodTypeAny, {
        entries: {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }[];
        sessionUpdate: "plan";
    }, {
        entries: {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }[];
        sessionUpdate: "plan";
    }>, z.ZodObject<{
        sessionUpdate: z.ZodLiteral<"current_mode_update">;
        modeId: z.ZodUnion<[z.ZodLiteral<"plan">, z.ZodLiteral<"default">, z.ZodLiteral<"auto-edit">, z.ZodLiteral<"yolo">]>;
    }, "strip", z.ZodTypeAny, {
        sessionUpdate: "current_mode_update";
        modeId: "default" | "plan" | "auto-edit" | "yolo";
    }, {
        sessionUpdate: "current_mode_update";
        modeId: "default" | "plan" | "auto-edit" | "yolo";
    }>, z.ZodObject<{
        sessionUpdate: z.ZodLiteral<"current_model_update">;
        model: z.ZodObject<{
            _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            modelId: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }, {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        model: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        };
        sessionUpdate: "current_model_update";
    }, {
        model: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        };
        sessionUpdate: "current_model_update";
    }>, z.ZodObject<{
        availableCommands: z.ZodArray<z.ZodObject<{
            description: z.ZodString;
            input: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                hint: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                hint: string;
            }, {
                hint: string;
            }>>>;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }, {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }>, "many">;
        sessionUpdate: z.ZodLiteral<"available_commands_update">;
    }, "strip", z.ZodTypeAny, {
        sessionUpdate: "available_commands_update";
        availableCommands: {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }[];
    }, {
        sessionUpdate: "available_commands_update";
        availableCommands: {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }[];
    }>]>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    update: {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "user_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_thought_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        sessionUpdate: "tool_call";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    } | {
        sessionUpdate: "tool_call_update";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | null | undefined;
        status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
        title?: string | null | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
        rawOutput?: unknown;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | null | undefined;
        rawInput?: unknown;
    } | {
        entries: {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }[];
        sessionUpdate: "plan";
    } | {
        sessionUpdate: "current_mode_update";
        modeId: "default" | "plan" | "auto-edit" | "yolo";
    } | {
        model: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        };
        sessionUpdate: "current_model_update";
    } | {
        sessionUpdate: "available_commands_update";
        availableCommands: {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }[];
    };
}, {
    sessionId: string;
    update: {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "user_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_message_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        content: {
            text: string;
            type: "text";
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource_link";
            name: string;
            uri: string;
            title?: string | null | undefined;
            size?: number | null | undefined;
            description?: string | null | undefined;
            mimeType?: string | null | undefined;
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        } | {
            type: "resource";
            resource: {
                text: string;
                uri: string;
                mimeType?: string | null | undefined;
            } | {
                uri: string;
                blob: string;
                mimeType?: string | null | undefined;
            };
            annotations?: {
                lastModified?: string | null | undefined;
                audience?: ("user" | "assistant")[] | null | undefined;
                priority?: number | null | undefined;
            } | null | undefined;
        };
        sessionUpdate: "agent_thought_chunk";
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
    } | {
        status: "completed" | "failed" | "in_progress" | "pending";
        title: string;
        kind: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode";
        sessionUpdate: "tool_call";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | undefined;
        rawInput?: unknown;
    } | {
        sessionUpdate: "tool_call_update";
        toolCallId: string;
        content?: ({
            content: {
                text: string;
                type: "text";
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "image";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "audio";
                data: string;
                mimeType: string;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource_link";
                name: string;
                uri: string;
                title?: string | null | undefined;
                size?: number | null | undefined;
                description?: string | null | undefined;
                mimeType?: string | null | undefined;
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            } | {
                type: "resource";
                resource: {
                    text: string;
                    uri: string;
                    mimeType?: string | null | undefined;
                } | {
                    uri: string;
                    blob: string;
                    mimeType?: string | null | undefined;
                };
                annotations?: {
                    lastModified?: string | null | undefined;
                    audience?: ("user" | "assistant")[] | null | undefined;
                    priority?: number | null | undefined;
                } | null | undefined;
            };
            type: "content";
        } | {
            type: "diff";
            path: string;
            newText: string;
            oldText: string | null;
        })[] | null | undefined;
        status?: "completed" | "failed" | "in_progress" | "pending" | null | undefined;
        title?: string | null | undefined;
        _meta?: {
            toolName?: string | null | undefined;
            timestamp?: number | null | undefined;
            durationMs?: number | null | undefined;
            usage?: {
                totalTokens?: number | null | undefined;
                promptTokens?: number | null | undefined;
                completionTokens?: number | null | undefined;
                thoughtsTokens?: number | null | undefined;
                cachedTokens?: number | null | undefined;
            } | null | undefined;
            parentToolCallId?: string | null | undefined;
            subagentType?: string | null | undefined;
        } | null | undefined;
        kind?: "search" | "edit" | "other" | "read" | "delete" | "move" | "execute" | "think" | "fetch" | "switch_mode" | null | undefined;
        rawOutput?: unknown;
        locations?: {
            path: string;
            line?: number | null | undefined;
        }[] | null | undefined;
        rawInput?: unknown;
    } | {
        entries: {
            content: string;
            status: "completed" | "in_progress" | "pending";
            priority: "low" | "medium" | "high";
        }[];
        sessionUpdate: "plan";
    } | {
        sessionUpdate: "current_mode_update";
        modeId: "default" | "plan" | "auto-edit" | "yolo";
    } | {
        model: {
            name: string;
            modelId: string;
            description?: string | null | undefined;
            _meta?: Record<string, unknown> | null | undefined;
        };
        sessionUpdate: "current_model_update";
    } | {
        sessionUpdate: "available_commands_update";
        availableCommands: {
            name: string;
            description: string;
            input?: {
                hint: string;
            } | null | undefined;
        }[];
    };
}>;
