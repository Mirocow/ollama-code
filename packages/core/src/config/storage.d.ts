/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { OLLAMA_DIR } from '../utils/paths.js';
export { OLLAMA_DIR };
export declare const GOOGLE_ACCOUNTS_FILENAME = "google_accounts.json";
export declare const OAUTH_FILE = "oauth_creds.json";
export declare class Storage {
    private readonly targetDir;
    constructor(targetDir: string);
    static getGlobalOllamaDir(): string;
    static getMcpOAuthTokensPath(): string;
    static getGlobalSettingsPath(): string;
    static getInstallationIdPath(): string;
    static getGoogleAccountsPath(): string;
    static getUserCommandsDir(): string;
    static getGlobalMemoryFilePath(): string;
    static getGlobalTempDir(): string;
    static getGlobalDebugDir(): string;
    static getDebugLogPath(sessionId: string): string;
    static getGlobalIdeDir(): string;
    static getGlobalBinDir(): string;
    getOllamaDir(): string;
    getProjectDir(): string;
    getProjectTempDir(): string;
    ensureProjectTempDirExists(): void;
    static getOAuthCredsPath(): string;
    getProjectRoot(): string;
    getHistoryDir(): string;
    getWorkspaceSettingsPath(): string;
    getProjectCommandsDir(): string;
    getProjectTempCheckpointsDir(): string;
    getExtensionsDir(): string;
    getExtensionsConfigPath(): string;
    getUserSkillsDir(): string;
    getHistoryFilePath(): string;
    private sanitizeCwd;
}
