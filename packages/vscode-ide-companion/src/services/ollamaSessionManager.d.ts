/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { OllamaSession, OllamaMessage } from './ollamaSessionReader.js';
/**
 * Ollama Session Manager
 *
 * This service provides direct filesystem access to save and load sessions
 * without relying on the CLI's ACP session/save method.
 *
 * Note: This is primarily used as a fallback mechanism when ACP methods are
 * unavailable or fail. In normal operation, ACP session/list and session/load
 * should be preferred for consistency with the CLI.
 */
export declare class OllamaSessionManager {
    private ollamaDir;
    constructor();
    /**
     * Get the session directory for a project with backward compatibility
     */
    private getSessionDir;
    /**
     * Generate a new session ID
     */
    private generateSessionId;
    /**
     * Save current conversation as a named session
     *
     * @param messages - Current conversation messages
     * @param sessionName - Name/tag for the saved session
     * @param workingDir - Current working directory
     * @returns Session ID of the saved session
     */
    saveSession(messages: OllamaMessage[], sessionName: string, workingDir: string): Promise<string>;
    /**
     * Load a saved session by name
     *
     * @param sessionName - Name/tag of the session to load
     * @param workingDir - Current working directory
     * @returns Loaded session or null if not found
     */
    loadSession(sessionId: string, workingDir: string): Promise<OllamaSession | null>;
    /**
     * List all saved sessions
     *
     * @param workingDir - Current working directory
     * @returns Array of session objects
     */
    listSessions(workingDir: string): Promise<OllamaSession[]>;
    /**
     * Delete a saved session
     *
     * @param sessionId - ID of the session to delete
     * @param workingDir - Current working directory
     * @returns True if deleted successfully, false otherwise
     */
    deleteSession(sessionId: string, workingDir: string): Promise<boolean>;
}
