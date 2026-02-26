/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Ollama Session Update Handler
 *
 * Handles session updates from ACP and dispatches them to appropriate callbacks
 */
import type { AcpSessionUpdate } from '../types/acpTypes.js';
import type { OllamaAgentCallbacks } from '../types/chatTypes.js';
/**
 * Ollama Session Update Handler class
 * Processes various session update events and calls appropriate callbacks
 */
export declare class OllamaSessionUpdateHandler {
    private callbacks;
    constructor(callbacks: OllamaAgentCallbacks);
    /**
     * Update callbacks
     *
     * @param callbacks - New callback collection
     */
    updateCallbacks(callbacks: OllamaAgentCallbacks): void;
    /**
     * Handle session update
     *
     * @param data - ACP session update data
     */
    handleSessionUpdate(data: AcpSessionUpdate): void;
    private emitUsageMeta;
}
