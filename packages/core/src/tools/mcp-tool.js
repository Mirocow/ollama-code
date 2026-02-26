/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { safeJsonStringify } from '../utils/safeJsonStringify.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind, ToolConfirmationOutcome, } from './tools.js';
import { ToolErrorType } from './tool-error.js';
class DiscoveredMCPToolInvocation extends BaseToolInvocation {
    mcpTool;
    serverName;
    serverToolName;
    displayName;
    trust;
    cliConfig;
    mcpClient;
    mcpTimeout;
    annotations;
    static allowlist = new Set();
    constructor(mcpTool, serverName, serverToolName, displayName, trust, params = {}, cliConfig, mcpClient, mcpTimeout, annotations) {
        super(params);
        this.mcpTool = mcpTool;
        this.serverName = serverName;
        this.serverToolName = serverToolName;
        this.displayName = displayName;
        this.trust = trust;
        this.cliConfig = cliConfig;
        this.mcpClient = mcpClient;
        this.mcpTimeout = mcpTimeout;
        this.annotations = annotations;
    }
    async shouldConfirmExecute(_abortSignal) {
        const serverAllowListKey = this.serverName;
        const toolAllowListKey = `${this.serverName}.${this.serverToolName}`;
        if (this.cliConfig?.isTrustedFolder() && this.trust) {
            return false; // server is trusted, no confirmation needed
        }
        // MCP tools annotated with readOnlyHint: true are safe to execute
        // without confirmation, especially important for plan mode support
        if (this.annotations?.readOnlyHint === true) {
            return false;
        }
        if (DiscoveredMCPToolInvocation.allowlist.has(serverAllowListKey) ||
            DiscoveredMCPToolInvocation.allowlist.has(toolAllowListKey)) {
            return false; // server and/or tool already allowlisted
        }
        const confirmationDetails = {
            type: 'mcp',
            title: 'Confirm MCP Tool Execution',
            serverName: this.serverName,
            toolName: this.serverToolName, // Display original tool name in confirmation
            toolDisplayName: this.displayName, // Display global registry name exposed to model and user
            onConfirm: async (outcome, _payload) => {
                if (outcome === ToolConfirmationOutcome.ProceedAlwaysServer) {
                    DiscoveredMCPToolInvocation.allowlist.add(serverAllowListKey);
                }
                else if (outcome === ToolConfirmationOutcome.ProceedAlwaysTool) {
                    DiscoveredMCPToolInvocation.allowlist.add(toolAllowListKey);
                }
            },
        };
        return confirmationDetails;
    }
    // Determine if the response contains tool errors
    // This is needed because CallToolResults should return errors inside the response.
    // ref: https://modelcontextprotocol.io/specification/2025-06-18/schema#calltoolresult
    isMCPToolError(rawResponseParts) {
        const functionResponse = rawResponseParts?.[0]?.functionResponse;
        const response = functionResponse?.response;
        if (response) {
            const error = response?.error;
            const isError = error?.isError;
            if (error && (isError === true || isError === 'true')) {
                return true;
            }
        }
        return false;
    }
    async execute(signal, updateOutput) {
        // Use direct MCP client if available (supports progress notifications),
        // otherwise fall back to the @google/genai mcpToTool wrapper.
        if (this.mcpClient) {
            return this.executeWithDirectClient(signal, updateOutput);
        }
        return this.executeWithCallableTool(signal);
    }
    /**
     * Execute using the raw MCP SDK Client, which supports progress
     * notifications via the onprogress callback. This enables real-time
     * streaming of progress updates to the user during long-running
     * MCP tool calls (e.g., browser automation).
     */
    async executeWithDirectClient(signal, updateOutput) {
        const callToolResult = await this.mcpClient.callTool({
            name: this.serverToolName,
            arguments: this.params,
        }, undefined, {
            onprogress: (progress) => {
                if (updateOutput) {
                    const progressData = {
                        type: 'mcp_tool_progress',
                        progress: progress.progress,
                        ...(progress.total != null && { total: progress.total }),
                        ...(progress.message != null && { message: progress.message }),
                    };
                    updateOutput(progressData);
                }
            },
            timeout: this.mcpTimeout,
            signal,
        });
        // Wrap the raw CallToolResult into the Part[] format that the
        // existing transform/display functions expect.
        const rawResponseParts = wrapMcpCallToolResultAsParts(this.serverToolName, callToolResult);
        // Ensure the response is not an error
        if (this.isMCPToolError(rawResponseParts)) {
            const errorMessage = `MCP tool '${this.serverToolName}' reported tool error for function call: ${safeJsonStringify({
                name: this.serverToolName,
                args: this.params,
            })} with response: ${safeJsonStringify(rawResponseParts)}`;
            return {
                llmContent: errorMessage,
                returnDisplay: `Error: MCP tool '${this.serverToolName}' reported an error.`,
                error: {
                    message: errorMessage,
                    type: ToolErrorType.MCP_TOOL_ERROR,
                },
            };
        }
        const transformedParts = transformMcpContentToParts(rawResponseParts);
        return {
            llmContent: transformedParts,
            returnDisplay: getStringifiedResultForDisplay(rawResponseParts),
        };
    }
    /**
     * Fallback: execute using the @google/genai CallableTool wrapper.
     * This path does NOT support progress notifications.
     */
    async executeWithCallableTool(signal) {
        const functionCalls = [
            {
                name: this.serverToolName,
                args: this.params,
            },
        ];
        // Race MCP tool call with abort signal to respect cancellation
        const rawResponseParts = await new Promise((resolve, reject) => {
            if (signal.aborted) {
                const error = new Error('Tool call aborted');
                error.name = 'AbortError';
                reject(error);
                return;
            }
            const onAbort = () => {
                cleanup();
                const error = new Error('Tool call aborted');
                error.name = 'AbortError';
                reject(error);
            };
            const cleanup = () => {
                signal.removeEventListener('abort', onAbort);
            };
            signal.addEventListener('abort', onAbort, { once: true });
            this.mcpTool
                .callTool(functionCalls)
                .then((res) => {
                cleanup();
                resolve(res);
            })
                .catch((err) => {
                cleanup();
                reject(err);
            });
        });
        // Ensure the response is not an error
        if (this.isMCPToolError(rawResponseParts)) {
            const errorMessage = `MCP tool '${this.serverToolName}' reported tool error for function call: ${safeJsonStringify(functionCalls[0])} with response: ${safeJsonStringify(rawResponseParts)}`;
            return {
                llmContent: errorMessage,
                returnDisplay: `Error: MCP tool '${this.serverToolName}' reported an error.`,
                error: {
                    message: errorMessage,
                    type: ToolErrorType.MCP_TOOL_ERROR,
                },
            };
        }
        const transformedParts = transformMcpContentToParts(rawResponseParts);
        return {
            llmContent: transformedParts,
            returnDisplay: getStringifiedResultForDisplay(rawResponseParts),
        };
    }
    getDescription() {
        return safeJsonStringify(this.params);
    }
}
export class DiscoveredMCPTool extends BaseDeclarativeTool {
    mcpTool;
    serverName;
    serverToolName;
    parameterSchema;
    trust;
    cliConfig;
    mcpClient;
    mcpTimeout;
    annotations;
    constructor(mcpTool, serverName, serverToolName, description, parameterSchema, trust, nameOverride, cliConfig, mcpClient, mcpTimeout, annotations) {
        super(nameOverride ??
            generateValidName(`mcp__${serverName}__${serverToolName}`), `${serverToolName} (${serverName} MCP Server)`, description, annotations?.readOnlyHint === true ? Kind.Read : Kind.Other, parameterSchema, true, // isOutputMarkdown
        true);
        this.mcpTool = mcpTool;
        this.serverName = serverName;
        this.serverToolName = serverToolName;
        this.parameterSchema = parameterSchema;
        this.trust = trust;
        this.cliConfig = cliConfig;
        this.mcpClient = mcpClient;
        this.mcpTimeout = mcpTimeout;
        this.annotations = annotations;
    }
    asFullyQualifiedTool() {
        return new DiscoveredMCPTool(this.mcpTool, this.serverName, this.serverToolName, this.description, this.parameterSchema, this.trust, generateValidName(`mcp__${this.serverName}__${this.serverToolName}`), this.cliConfig, this.mcpClient, this.mcpTimeout, this.annotations);
    }
    createInvocation(params) {
        return new DiscoveredMCPToolInvocation(this.mcpTool, this.serverName, this.serverToolName, this.displayName, this.trust, params, this.cliConfig, this.mcpClient, this.mcpTimeout, this.annotations);
    }
}
/**
 * Wraps a raw MCP CallToolResult into the Part[] format that the
 * existing transform/display functions expect. This bridges the gap
 * between the raw MCP SDK response and the @google/genai Part format.
 */
function wrapMcpCallToolResultAsParts(toolName, result) {
    const response = result.isError
        ? { error: result, content: result.content }
        : result;
    return [
        {
            functionResponse: {
                name: toolName,
                response,
            },
        },
    ];
}
function transformTextBlock(block) {
    return { text: block.text };
}
function transformImageAudioBlock(block, toolName) {
    return [
        {
            text: `[Tool '${toolName}' provided the following ${block.type} data with mime-type: ${block.mimeType}]`,
        },
        {
            inlineData: {
                mimeType: block.mimeType,
                data: block.data,
            },
        },
    ];
}
function transformResourceBlock(block, toolName) {
    const resource = block.resource;
    if (resource?.text) {
        return { text: resource.text };
    }
    if (resource?.blob) {
        const mimeType = resource.mimeType || 'application/octet-stream';
        return [
            {
                text: `[Tool '${toolName}' provided the following embedded resource with mime-type: ${mimeType}]`,
            },
            {
                inlineData: {
                    mimeType,
                    data: resource.blob,
                },
            },
        ];
    }
    return null;
}
function transformResourceLinkBlock(block) {
    return {
        text: `Resource Link: ${block.title || block.name} at ${block.uri}`,
    };
}
/**
 * Transforms the raw MCP content blocks from the SDK response into a
 * standard GenAI Part array.
 * @param sdkResponse The raw Part[] array from `mcpTool.callTool()`.
 * @returns A clean Part[] array ready for the scheduler.
 */
function transformMcpContentToParts(sdkResponse) {
    const funcResponse = sdkResponse?.[0]?.functionResponse;
    const mcpContent = funcResponse?.response?.['content'];
    const toolName = funcResponse?.name || 'unknown tool';
    if (!Array.isArray(mcpContent)) {
        return [{ text: '[Error: Could not parse tool response]' }];
    }
    const transformed = mcpContent.flatMap((block) => {
        switch (block.type) {
            case 'text':
                return transformTextBlock(block);
            case 'image':
            case 'audio':
                return transformImageAudioBlock(block, toolName);
            case 'resource':
                return transformResourceBlock(block, toolName);
            case 'resource_link':
                return transformResourceLinkBlock(block);
            default:
                return null;
        }
    });
    return transformed.filter((part) => part !== null);
}
/**
 * Processes the raw response from the MCP tool to generate a clean,
 * human-readable string for display in the CLI. It summarizes non-text
 * content and presents text directly.
 *
 * @param rawResponse The raw Part[] array from the GenAI SDK.
 * @returns A formatted string representing the tool's output.
 */
function getStringifiedResultForDisplay(rawResponse) {
    const mcpContent = rawResponse?.[0]?.functionResponse?.response?.['content'];
    if (!Array.isArray(mcpContent)) {
        return '```json\n' + JSON.stringify(rawResponse, null, 2) + '\n```';
    }
    const displayParts = mcpContent.map((block) => {
        switch (block.type) {
            case 'text':
                return block.text;
            case 'image':
                return `[Image: ${block.mimeType}]`;
            case 'audio':
                return `[Audio: ${block.mimeType}]`;
            case 'resource_link':
                return `[Link to ${block.title || block.name}: ${block.uri}]`;
            case 'resource':
                if (block.resource?.text) {
                    return block.resource.text;
                }
                return `[Embedded Resource: ${block.resource?.mimeType || 'unknown type'}]`;
            default:
                return `[Unknown content type: ${block.type}]`;
        }
    });
    return displayParts.join('\n');
}
/** Visible for testing */
export function generateValidName(name) {
    // Replace invalid characters (based on 400 error message from Gemini API) with underscores
    let validToolname = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    // If longer than 63 characters, replace middle with '___'
    // (Gemini API says max length 64, but actual limit seems to be 63)
    if (validToolname.length > 63) {
        validToolname =
            validToolname.slice(0, 28) + '___' + validToolname.slice(-32);
    }
    return validToolname;
}
//# sourceMappingURL=mcp-tool.js.map