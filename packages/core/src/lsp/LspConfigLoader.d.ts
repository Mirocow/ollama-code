/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Extension } from '../extension/extensionManager.js';
import type { LspServerConfig } from './types.js';
export declare class LspConfigLoader {
    private readonly workspaceRoot;
    constructor(workspaceRoot: string);
    /**
     * Load user .lsp.json configuration.
     * Supports basic format: { "language": { "command": "...", "extensionToLanguage": {...} } }
     */
    loadUserConfigs(): Promise<LspServerConfig[]>;
    /**
     * Load LSP configurations declared by extensions (Claude plugins).
     */
    loadExtensionConfigs(extensions: Extension[]): Promise<LspServerConfig[]>;
    /**
     * Merge configs: built-in presets + extension configs + user configs
     */
    mergeConfigs(detectedLanguages: string[], extensionConfigs: LspServerConfig[], userConfigs: LspServerConfig[]): LspServerConfig[];
    collectExtensionToLanguageOverrides(configs: LspServerConfig[]): Record<string, string>;
    /**
     * Get built-in preset configurations
     */
    private getBuiltInPresets;
    /**
     * Parse configuration source and extract server configs.
     * Expects basic format keyed by language identifier.
     */
    private parseConfigSource;
    private resolveExtensionConfigPath;
    private hydrateExtensionLspConfig;
    private buildServerConfig;
    private isRecord;
    private normalizeStringArray;
    private normalizeEnv;
    private normalizeExtensionToLanguage;
    private normalizeTransport;
    private normalizeTimeout;
    private normalizeMaxRestarts;
    private normalizeSocketOptions;
    private resolveWorkspaceFolder;
}
