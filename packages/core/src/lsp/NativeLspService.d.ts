/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config as CoreConfig } from '../config/config.js';
import type { IdeContextStore } from '../ide/ideContext.js';
import type { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import type { WorkspaceContext } from '../utils/workspaceContext.js';
import type { LspCallHierarchyIncomingCall, LspCallHierarchyItem, LspCallHierarchyOutgoingCall, LspCodeAction, LspCodeActionContext, LspDefinition, LspDiagnostic, LspFileDiagnostics, LspHoverResult, LspLocation, LspRange, LspReference, LspSymbolInformation, LspWorkspaceEdit } from './types.js';
import type { EventEmitter } from 'events';
import type { LspServerStatus, NativeLspServiceOptions } from './types.js';
export declare class NativeLspService {
    private config;
    private workspaceContext;
    private fileDiscoveryService;
    private requireTrustedWorkspace;
    private workspaceRoot;
    private configLoader;
    private serverManager;
    private languageDetector;
    private normalizer;
    constructor(config: CoreConfig, workspaceContext: WorkspaceContext, _eventEmitter: EventEmitter, fileDiscoveryService: FileDiscoveryService, _ideContextStore: IdeContextStore, options?: NativeLspServiceOptions);
    /**
     * Discover and prepare LSP servers
     */
    discoverAndPrepare(): Promise<void>;
    private getActiveExtensions;
    /**
     * Start all LSP servers
     */
    start(): Promise<void>;
    /**
     * Stop all LSP servers
     */
    stop(): Promise<void>;
    /**
     * Get LSP server status
     */
    getStatus(): Map<string, LspServerStatus>;
    /**
     * Get ready server handles filtered by optional server name.
     * Each handle is guaranteed to have a valid connection.
     *
     * @param serverName - Optional server name to filter by
     * @returns Array of [serverName, handle] tuples with active connections
     */
    private getReadyHandles;
    /**
     * Workspace symbol search across all ready LSP servers.
     */
    workspaceSymbols(query: string, limit?: number): Promise<LspSymbolInformation[]>;
    /**
     * Go to definition
     */
    definitions(location: LspLocation, serverName?: string, limit?: number): Promise<LspDefinition[]>;
    /**
     * Find references
     */
    references(location: LspLocation, serverName?: string, includeDeclaration?: boolean, limit?: number): Promise<LspReference[]>;
    /**
     * Get hover information
     */
    hover(location: LspLocation, serverName?: string): Promise<LspHoverResult | null>;
    /**
     * Get document symbols
     */
    documentSymbols(uri: string, serverName?: string, limit?: number): Promise<LspSymbolInformation[]>;
    /**
     * Find implementations
     */
    implementations(location: LspLocation, serverName?: string, limit?: number): Promise<LspDefinition[]>;
    /**
     * Prepare call hierarchy
     */
    prepareCallHierarchy(location: LspLocation, serverName?: string, limit?: number): Promise<LspCallHierarchyItem[]>;
    /**
     * Find callers of the current function
     */
    incomingCalls(item: LspCallHierarchyItem, serverName?: string, limit?: number): Promise<LspCallHierarchyIncomingCall[]>;
    /**
     * Find functions called by the current function
     */
    outgoingCalls(item: LspCallHierarchyItem, serverName?: string, limit?: number): Promise<LspCallHierarchyOutgoingCall[]>;
    /**
     * Get diagnostics for a document
     */
    diagnostics(uri: string, serverName?: string): Promise<LspDiagnostic[]>;
    /**
     * Get diagnostics for all documents in the workspace
     */
    workspaceDiagnostics(serverName?: string, limit?: number): Promise<LspFileDiagnostics[]>;
    /**
     * Get code actions at the specified position
     */
    codeActions(uri: string, range: LspRange, context: LspCodeActionContext, serverName?: string, limit?: number): Promise<LspCodeAction[]>;
    /**
     * Apply workspace edit
     */
    applyWorkspaceEdit(edit: LspWorkspaceEdit, _serverName?: string): Promise<boolean>;
    /**
     * Apply text edits to a file
     */
    private applyTextEdits;
    private isNoProjectErrorResponse;
}
