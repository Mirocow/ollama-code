/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolRegistry } from './tool-registry.js';
import { MCPDiscoveryState } from './mcp-client.js';
import type { SendSdkMcpMessage } from './mcp-client.js';
import type { EventEmitter } from 'node:events';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
/**
 * Manages the lifecycle of multiple MCP clients, including local child processes.
 * This class is responsible for starting, stopping, and discovering tools from
 * a collection of MCP servers defined in the configuration.
 */
export declare class McpClientManager {
    private clients;
    private readonly toolRegistry;
    private readonly cliConfig;
    private discoveryState;
    private readonly eventEmitter?;
    private readonly sendSdkMcpMessage?;
    constructor(config: Config, toolRegistry: ToolRegistry, eventEmitter?: EventEmitter, sendSdkMcpMessage?: SendSdkMcpMessage);
    /**
     * Initiates the tool discovery process for all configured MCP servers.
     * It connects to each server, discovers its available tools, and registers
     * them with the `ToolRegistry`.
     */
    discoverAllMcpTools(cliConfig: Config): Promise<void>;
    /**
     * Connects to a single MCP server and discovers its tools/prompts.
     * The connected client is tracked so it can be closed by {@link stop}.
     *
     * This is primarily used for on-demand re-discovery flows (e.g. after OAuth).
     */
    discoverMcpToolsForServer(serverName: string, cliConfig: Config): Promise<void>;
    /**
     * Stops all running local MCP servers and closes all client connections.
     * This is the cleanup method to be called on application exit.
     */
    stop(): Promise<void>;
    getDiscoveryState(): MCPDiscoveryState;
    readResource(serverName: string, uri: string, options?: {
        signal?: AbortSignal;
    }): Promise<ReadResourceResult>;
}
