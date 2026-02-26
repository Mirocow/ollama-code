/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { getProjectHash, OLLAMA_DIR } from '../utils/paths.js';

export const GOOGLE_ACCOUNTS_FILENAME = 'google_accounts.json';
export const OAUTH_FILE = 'oauth_creds.json';
const TMP_DIR_NAME = 'tmp';
const BIN_DIR_NAME = 'bin';
const PROJECT_DIR_NAME = 'projects';
const IDE_DIR_NAME = 'ide';
const DEBUG_DIR_NAME = 'debug';

export class Storage {
  private readonly targetDir: string;

  constructor(targetDir: string) {
    this.targetDir = targetDir;
  }

  static getGlobalOllamaDir(): string {
    const homeDir = os.homedir();
    if (!homeDir) {
      return path.join(os.tmpdir(), '.ollama-code');
    }
    return path.join(homeDir, OLLAMA_DIR);
  }

  static getMcpOAuthTokensPath(): string {
    return path.join(Storage.getGlobalOllamaDir(), 'mcp-oauth-tokens.json');
  }

  static getGlobalSettingsPath(): string {
    return path.join(Storage.getGlobalOllamaDir(), 'settings.json');
  }

  static getInstallationIdPath(): string {
    return path.join(Storage.getGlobalOllamaDir(), 'installation_id');
  }

  static getGoogleAccountsPath(): string {
    return path.join(Storage.getGlobalOllamaDir(), GOOGLE_ACCOUNTS_FILENAME);
  }

  static getUserCommandsDir(): string {
    return path.join(Storage.getGlobalOllamaDir(), 'commands');
  }

  static getGlobalMemoryFilePath(): string {
    return path.join(Storage.getGlobalOllamaDir(), 'memory.md');
  }

  static getGlobalTempDir(): string {
    return path.join(Storage.getGlobalOllamaDir(), TMP_DIR_NAME);
  }

  static getGlobalDebugDir(): string {
    return path.join(Storage.getGlobalOllamaDir(), DEBUG_DIR_NAME);
  }

  static getDebugLogPath(sessionId: string): string {
    return path.join(Storage.getGlobalDebugDir(), `${sessionId}.txt`);
  }

  static getGlobalIdeDir(): string {
    return path.join(Storage.getGlobalOllamaDir(), IDE_DIR_NAME);
  }

  static getGlobalBinDir(): string {
    return path.join(Storage.getGlobalOllamaDir(), BIN_DIR_NAME);
  }

  getOllamaDir(): string {
    return path.join(this.targetDir, OLLAMA_DIR);
  }

  getProjectDir(): string {
    const projectId = this.sanitizeCwd(this.getProjectRoot());
    const projectsDir = path.join(Storage.getGlobalOllamaDir(), PROJECT_DIR_NAME);
    return path.join(projectsDir, projectId);
  }

  getProjectTempDir(): string {
    const hash = getProjectHash(this.getProjectRoot());
    const tempDir = Storage.getGlobalTempDir();
    const targetDir = path.join(tempDir, hash);
    return targetDir;
  }

  ensureProjectTempDirExists(): void {
    fs.mkdirSync(this.getProjectTempDir(), { recursive: true });
  }

  static getOAuthCredsPath(): string {
    return path.join(Storage.getGlobalOllamaDir(), OAUTH_FILE);
  }

  getProjectRoot(): string {
    return this.targetDir;
  }

  getHistoryDir(): string {
    const hash = getProjectHash(this.getProjectRoot());
    const historyDir = path.join(Storage.getGlobalOllamaDir(), 'history');
    const targetDir = path.join(historyDir, hash);
    return targetDir;
  }

  getWorkspaceSettingsPath(): string {
    return path.join(this.getOllamaDir(), 'settings.json');
  }

  getProjectCommandsDir(): string {
    return path.join(this.getOllamaDir(), 'commands');
  }

  getProjectTempCheckpointsDir(): string {
    return path.join(this.getProjectTempDir(), 'checkpoints');
  }

  getExtensionsDir(): string {
    return path.join(this.getOllamaDir(), 'extensions');
  }

  getExtensionsConfigPath(): string {
    return path.join(this.getExtensionsDir(), 'ollama-extension.json');
  }

  getUserSkillsDir(): string {
    return path.join(Storage.getGlobalOllamaDir(), 'skills');
  }

  getHistoryFilePath(): string {
    return path.join(this.getProjectTempDir(), 'shell_history');
  }

  private sanitizeCwd(cwd: string): string {
    // On Windows, normalize to lowercase for case-insensitive matching
    const normalizedCwd = os.platform() === 'win32' ? cwd.toLowerCase() : cwd;
    return normalizedCwd.replace(/[^a-zA-Z0-9]/g, '-');
  }
}
