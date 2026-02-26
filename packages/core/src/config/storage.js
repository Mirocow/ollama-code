/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { getProjectHash, OLLAMA_DIR } from '../utils/paths.js';
// Re-export OLLAMA_DIR for other modules
export { OLLAMA_DIR };
export const GOOGLE_ACCOUNTS_FILENAME = 'google_accounts.json';
export const OAUTH_FILE = 'oauth_creds.json';
const TMP_DIR_NAME = 'tmp';
const BIN_DIR_NAME = 'bin';
const PROJECT_DIR_NAME = 'projects';
const IDE_DIR_NAME = 'ide';
const DEBUG_DIR_NAME = 'debug';
export class Storage {
    targetDir;
    constructor(targetDir) {
        this.targetDir = targetDir;
    }
    static getGlobalOllamaDir() {
        const homeDir = os.homedir();
        if (!homeDir) {
            return path.join(os.tmpdir(), '.ollama-code');
        }
        return path.join(homeDir, OLLAMA_DIR);
    }
    static getMcpOAuthTokensPath() {
        return path.join(Storage.getGlobalOllamaDir(), 'mcp-oauth-tokens.json');
    }
    static getGlobalSettingsPath() {
        return path.join(Storage.getGlobalOllamaDir(), 'settings.json');
    }
    static getInstallationIdPath() {
        return path.join(Storage.getGlobalOllamaDir(), 'installation_id');
    }
    static getGoogleAccountsPath() {
        return path.join(Storage.getGlobalOllamaDir(), GOOGLE_ACCOUNTS_FILENAME);
    }
    static getUserCommandsDir() {
        return path.join(Storage.getGlobalOllamaDir(), 'commands');
    }
    static getGlobalMemoryFilePath() {
        return path.join(Storage.getGlobalOllamaDir(), 'memory.md');
    }
    static getGlobalTempDir() {
        return path.join(Storage.getGlobalOllamaDir(), TMP_DIR_NAME);
    }
    static getGlobalDebugDir() {
        return path.join(Storage.getGlobalOllamaDir(), DEBUG_DIR_NAME);
    }
    static getDebugLogPath(sessionId) {
        return path.join(Storage.getGlobalDebugDir(), `${sessionId}.txt`);
    }
    static getGlobalIdeDir() {
        return path.join(Storage.getGlobalOllamaDir(), IDE_DIR_NAME);
    }
    static getGlobalBinDir() {
        return path.join(Storage.getGlobalOllamaDir(), BIN_DIR_NAME);
    }
    getOllamaDir() {
        return path.join(this.targetDir, OLLAMA_DIR);
    }
    getProjectDir() {
        const projectId = this.sanitizeCwd(this.getProjectRoot());
        const projectsDir = path.join(Storage.getGlobalOllamaDir(), PROJECT_DIR_NAME);
        return path.join(projectsDir, projectId);
    }
    getProjectTempDir() {
        const hash = getProjectHash(this.getProjectRoot());
        const tempDir = Storage.getGlobalTempDir();
        const targetDir = path.join(tempDir, hash);
        return targetDir;
    }
    ensureProjectTempDirExists() {
        fs.mkdirSync(this.getProjectTempDir(), { recursive: true });
    }
    static getOAuthCredsPath() {
        return path.join(Storage.getGlobalOllamaDir(), OAUTH_FILE);
    }
    getProjectRoot() {
        return this.targetDir;
    }
    getHistoryDir() {
        const hash = getProjectHash(this.getProjectRoot());
        const historyDir = path.join(Storage.getGlobalOllamaDir(), 'history');
        const targetDir = path.join(historyDir, hash);
        return targetDir;
    }
    getWorkspaceSettingsPath() {
        return path.join(this.getOllamaDir(), 'settings.json');
    }
    getProjectCommandsDir() {
        return path.join(this.getOllamaDir(), 'commands');
    }
    getProjectTempCheckpointsDir() {
        return path.join(this.getProjectTempDir(), 'checkpoints');
    }
    getExtensionsDir() {
        return path.join(this.getOllamaDir(), 'extensions');
    }
    getExtensionsConfigPath() {
        return path.join(this.getExtensionsDir(), 'ollama-extension.json');
    }
    getUserSkillsDir() {
        return path.join(Storage.getGlobalOllamaDir(), 'skills');
    }
    getHistoryFilePath() {
        return path.join(this.getProjectTempDir(), 'shell_history');
    }
    sanitizeCwd(cwd) {
        // On Windows, normalize to lowercase for case-insensitive matching
        const normalizedCwd = os.platform() === 'win32' ? cwd.toLowerCase() : cwd;
        return normalizedCwd.replace(/[^a-zA-Z0-9]/g, '-');
    }
}
//# sourceMappingURL=storage.js.map