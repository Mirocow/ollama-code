/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import type { WorkspaceContext } from '../utils/workspaceContext.js';
/**
 * Detects programming languages in a workspace.
 */
export declare class LspLanguageDetector {
    private readonly workspaceContext;
    private readonly fileDiscoveryService;
    constructor(workspaceContext: WorkspaceContext, fileDiscoveryService: FileDiscoveryService);
    /**
     * Detect programming languages in workspace by analyzing files and markers.
     * Returns languages sorted by frequency (most common first).
     *
     * @param extensionOverrides - Custom extension to language mappings
     * @returns Array of detected language IDs
     */
    detectLanguages(extensionOverrides?: Record<string, string>): Promise<string[]>;
    /**
     * Detect root marker files in workspace directories
     */
    private detectRootMarkers;
    /**
     * Map file extension to programming language ID
     */
    private mapExtensionToLanguage;
    /**
     * Get extension to language mapping with overrides applied
     */
    private getExtensionToLanguageMap;
    /**
     * Map root marker file to programming language ID
     */
    private mapMarkerToLanguage;
}
