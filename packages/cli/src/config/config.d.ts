/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config, FileDiscoveryService } from '@ollama-code/ollama-code-core';
import type { Settings } from './settings.js';
export interface CliArgs {
    query: string | undefined;
    model: string | undefined;
    sandbox: boolean | string | undefined;
    sandboxImage: string | undefined;
    debug: boolean | undefined;
    prompt: string | undefined;
    promptInteractive: string | undefined;
    yolo: boolean | undefined;
    approvalMode: string | undefined;
    telemetry: boolean | undefined;
    checkpointing: boolean | undefined;
    telemetryTarget: string | undefined;
    telemetryOtlpEndpoint: string | undefined;
    telemetryOtlpProtocol: string | undefined;
    telemetryLogPrompts: boolean | undefined;
    telemetryOutfile: string | undefined;
    allowedMcpServerNames: string[] | undefined;
    allowedTools: string[] | undefined;
    acp: boolean | undefined;
    experimentalAcp: boolean | undefined;
    experimentalLsp: boolean | undefined;
    extensions: string[] | undefined;
    listExtensions: boolean | undefined;
    ollamaApiKey: string | undefined;
    ollamaBaseUrl: string | undefined;
    proxy: string | undefined;
    includeDirectories: string[] | undefined;
    tavilyApiKey: string | undefined;
    googleApiKey: string | undefined;
    googleSearchEngineId: string | undefined;
    webSearchDefault: string | undefined;
    screenReader: boolean | undefined;
    vlmSwitchMode: string | undefined;
    inputFormat?: string | undefined;
    outputFormat: string | undefined;
    includePartialMessages?: boolean;
    /**
     * If chat recording is disabled, the chat history would not be recorded,
     * so --continue and --resume would not take effect.
     */
    chatRecording: boolean | undefined;
    /** Resume the most recent session for the current project */
    continue: boolean | undefined;
    /** Resume a specific session by its ID */
    resume: string | undefined;
    /** Specify a session ID without session resumption */
    sessionId: string | undefined;
    maxSessionTurns: number | undefined;
    coreTools: string[] | undefined;
    excludeTools: string[] | undefined;
    authType: string | undefined;
    channel: string | undefined;
}
export declare function parseArguments(): Promise<CliArgs>;
export declare function loadHierarchicalGeminiMemory(currentWorkingDirectory: string, includeDirectoriesToReadGemini: readonly string[] | undefined, fileService: FileDiscoveryService, extensionContextFilePaths: string[] | undefined, folderTrust: boolean, memoryImportFormat?: 'flat' | 'tree'): Promise<{
    memoryContent: string;
    fileCount: number;
}>;
export declare function isDebugMode(argv: CliArgs): boolean;
export declare function loadCliConfig(settings: Settings, argv: CliArgs, cwd?: string, overrideExtensions?: string[]): Promise<Config>;
