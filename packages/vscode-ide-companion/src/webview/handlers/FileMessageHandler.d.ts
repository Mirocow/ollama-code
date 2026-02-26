/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseMessageHandler } from './BaseMessageHandler.js';
/**
 * File message handler
 * Handles all file-related messages
 */
export declare class FileMessageHandler extends BaseMessageHandler {
    private readonly fileDiscoveryServices;
    private readonly globSpecialChars;
    canHandle(messageType: string): boolean;
    handle(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Handle attach file request
     */
    private handleAttachFile;
    /**
     * Handle show context picker request
     */
    private handleShowContextPicker;
    /**
     * Get workspace files
     */
    private handleGetWorkspaceFiles;
    /**
     * Open file
     */
    private handleOpenFile;
    /**
     * Open diff view
     */
    private handleOpenDiff;
    /**
     * Create and open temporary readonly file
     */
    private handleCreateAndOpenTempFile;
    private buildCaseInsensitiveGlob;
}
