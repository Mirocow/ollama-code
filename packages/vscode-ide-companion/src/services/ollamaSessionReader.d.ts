/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface OllamaMessage {
    id: string;
    timestamp: string;
    type: 'user' | 'ollama';
    content: string;
    thoughts?: unknown[];
    tokens?: {
        input: number;
        output: number;
        cached: number;
        thoughts: number;
        tool: number;
        total: number;
    };
    model?: string;
}
export interface OllamaSession {
    sessionId: string;
    projectHash: string;
    startTime: string;
    lastUpdated: string;
    messages: OllamaMessage[];
    filePath?: string;
    messageCount?: number;
    firstUserText?: string;
    cwd?: string;
}
export declare class OllamaSessionReader {
    private ollamaDir;
    constructor();
    /**
     * Get all session list (optional: current project only or all projects)
     */
    getAllSessions(workingDir?: string, allProjects?: boolean): Promise<OllamaSession[]>;
    /**
     * Read all sessions from specified directory
     */
    private readSessionsFromDir;
    /**
     * Get details of specific session
     */
    getSession(sessionId: string, _workingDir?: string): Promise<OllamaSession | null>;
    /**
     * Get session title (based on first user message)
     */
    getSessionTitle(session: OllamaSession): string;
    /**
     * Parse a JSONL session file written by the CLI.
     * When includeMessages is false, only lightweight metadata is returned.
     */
    private readJsonlSession;
    private contentToText;
    /**
     * Delete session file
     */
    deleteSession(sessionId: string, _workingDir: string): Promise<boolean>;
}
