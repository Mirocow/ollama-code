/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @packageDocumentation
 *
 * Ollama Code SDK - TypeScript SDK for building AI-powered applications.
 *
 * This SDK provides a comprehensive API for interacting with Ollama Code's
 * core functionality, including:
 *
 * - **Query API**: Execute AI queries with streaming support
 * - **MCP Integration**: Create MCP (Model Context Protocol) servers
 * - **Type Definitions**: Full TypeScript support for all protocol types
 *
 * @example Basic Usage
 * ```typescript
 * import { query } from '@ollama-code/sdk';
 *
 * const result = await query({
 *   prompt: 'Explain TypeScript generics',
 *   model: 'llama3.2',
 * });
 * ```
 *
 * @example MCP Server
 * ```typescript
 * import { createSdkMcpServer, tool } from '@ollama-code/sdk';
 *
 * const myTool = tool({
 *   name: 'echo',
 *   description: 'Echo back a message',
 *   parameters: { message: { type: 'string' } },
 *   execute: async (params) => ({ echo: params.message }),
 * });
 *
 * const server = createSdkMcpServer({
 *   name: 'my-server',
 *   version: '1.0.0',
 *   tools: [myTool],
 * });
 * ```
 *
 * @module @ollama-code/sdk
 */

// Query API
export { query } from './query/createQuery.js';
export { AbortError, isAbortError } from './types/errors.js';
export { Query } from './query/Query.js';

// Logging
export { SdkLogger } from './utils/logger.js';

// MCP Server exports
export { tool } from './mcp/tool.js';
export { createSdkMcpServer } from './mcp/createSdkMcpServer.js';

// Type exports
export type { SdkMcpToolDefinition } from './mcp/tool.js';

export type {
  CreateSdkMcpServerOptions,
  McpSdkServerConfigWithInstance,
} from './mcp/createSdkMcpServer.js';

export type { QueryOptions } from './query/createQuery.js';
export type { LogLevel, LoggerConfig, ScopedLogger } from './utils/logger.js';

export type {
  ContentBlock,
  TextBlock,
  ThinkingBlock,
  ToolUseBlock,
  ToolResultBlock,
  SDKUserMessage,
  SDKAssistantMessage,
  SDKSystemMessage,
  SDKResultMessage,
  SDKPartialAssistantMessage,
  SDKMessage,
  SDKMcpServerConfig,
  ControlMessage,
  CLIControlRequest,
  CLIControlResponse,
  ControlCancelRequest,
  SubagentConfig,
  SubagentLevel,
  ModelConfig,
  RunConfig,
} from './types/protocol.js';

// Type guards
export {
  isSDKUserMessage,
  isSDKAssistantMessage,
  isSDKSystemMessage,
  isSDKResultMessage,
  isSDKPartialAssistantMessage,
  isControlRequest,
  isControlResponse,
  isControlCancel,
} from './types/protocol.js';

export type {
  PermissionMode,
  CanUseTool,
  PermissionResult,
  CLIMcpServerConfig,
  McpServerConfig,
  McpOAuthConfig,
  McpAuthProviderType,
} from './types/types.js';

export { isSdkMcpServerConfig } from './types/types.js';
