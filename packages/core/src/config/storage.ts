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
export const SSH_CREDENTIALS_FILE = 'ssh_credentials.json';
const TMP_DIR_NAME = 'tmp';
const BIN_DIR_NAME = 'bin';
const PROJECT_DIR_NAME = 'projects';
const IDE_DIR_NAME = 'ide';
const DEBUG_DIR_NAME = 'debug';

// ============================================================================
// Types
// ============================================================================

/**
 * Storage entry metadata
 */
export interface StorageMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
  ttl?: number;
  expiresAt?: string;
  tags?: string[];
  source?: string;
}

/**
 * Storage entry with metadata
 */
export interface StorageEntry<T = unknown> {
  value: T;
  metadata: StorageMetadata;
}

/**
 * Storage entry with key (for list operations)
 */
export interface StorageEntryWithKey<T = unknown> extends StorageEntry<T> {
  key: string;
}

/**
 * Storage backend interface
 */
export interface IStorageBackend {
  /** Backend name for logging */
  readonly name: string;

  /** Initialize the backend */
  initialize(): Promise<void>;

  /** Close/cleanup the backend */
  close(): Promise<void>;

  // Core operations
  get<T = unknown>(
    namespace: string,
    key: string,
  ): Promise<StorageEntry<T> | null>;
  set<T = unknown>(
    namespace: string,
    key: string,
    value: T,
    options?: StorageSetOptions,
  ): Promise<void>;
  delete(namespace: string, key: string): Promise<boolean>;
  exists(namespace: string, key: string): Promise<boolean>;

  // Batch operations
  getBatch<T = unknown>(
    namespace: string,
    keys: string[],
  ): Promise<Map<string, StorageEntry<T>>>;
  setBatch<T = unknown>(
    namespace: string,
    entries: Map<string, { value: T; options?: StorageSetOptions }>,
  ): Promise<void>;
  deleteBatch(namespace: string, keys: string[]): Promise<number>;

  // Namespace operations
  list(
    namespace: string,
    options?: StorageListOptions,
  ): Promise<StorageEntryWithKey[]>;
  clear(namespace: string): Promise<number>;
  stats(namespace: string): Promise<StorageStats>;

  // Search operations
  findByTags(namespace: string, tags: string[]): Promise<StorageEntryWithKey[]>;
  findExpired(namespace?: string): Promise<StorageEntryWithKey[]>;

  // Cleanup
  cleanup(): Promise<{ expired: number; cleaned: number }>;
}

/**
 * Options for set operation
 */
export interface StorageSetOptions {
  ttl?: number;
  tags?: string[];
  source?: string;
}

/**
 * Options for list operation
 */
export interface StorageListOptions {
  limit?: number;
  offset?: number;
  tags?: string[];
  includeMetadata?: boolean;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  namespace: string;
  totalKeys: number;
  totalSize: number;
  expiredKeys: number;
  tags: string[];
  oldestEntry?: { key: string; date: string };
  newestEntry?: { key: string; date: string };
}

/**
 * SSH Host Configuration
 */
export interface SSHHostConfig {
  host: string;
  user: string;
  port?: number;
  identity_file?: string;
  password?: string;
  options?: Record<string, string>;
  description?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * SSH Credentials Store
 */
export interface SSHCredentialsStore {
  hosts: Record<string, SSHHostConfig>;
}

/**
 * SSH Host Configuration
 */
export interface SSHHostConfig {
  /** Hostname or IP address */
  host: string;
  /** Username for SSH */
  user: string;
  /** SSH port (default: 22) */
  port?: number;
  /** Path to SSH private key file */
  identity_file?: string;
  /** Password (not recommended, use identity_file instead) */
  password?: string;
  /** SSH options */
  options?: Record<string, string>;
  /** Description of the host */
  description?: string;
  /** Tags for organization */
  tags?: string[];
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * SSH Credentials Store
 */
export interface SSHCredentialsStore {
  /** Named host configurations */
  hosts: Record<string, SSHHostConfig>;
}

// ============================================================================
// In-Memory Storage Backend (for testing and session data)
// ============================================================================

export class InMemoryStorageBackend implements IStorageBackend {
  readonly name = 'memory';
  private data: Map<string, Map<string, StorageEntry>> = new Map();

  async initialize(): Promise<void> {}
  async close(): Promise<void> {}

  private getNamespace(namespace: string): Map<string, StorageEntry> {
    if (!this.data.has(namespace)) {
      this.data.set(namespace, new Map());
    }
    return this.data.get(namespace)!;
  }

  async get<T>(
    namespace: string,
    key: string,
  ): Promise<StorageEntry<T> | null> {
    const ns = this.getNamespace(namespace);
    const entry = ns.get(key);
    if (!entry || this.isExpired(entry)) return null;
    return entry as StorageEntry<T>;
  }

  async set<T>(
    namespace: string,
    key: string,
    value: T,
    options?: StorageSetOptions,
  ): Promise<void> {
    const ns = this.getNamespace(namespace);
    const existing = ns.get(key);
    const metadata = existing
      ? this.updateMetadata(existing.metadata, options)
      : this.createMetadata(options);
    ns.set(key, { value, metadata });
  }

  async delete(namespace: string, key: string): Promise<boolean> {
    return this.getNamespace(namespace).delete(key);
  }

  async exists(namespace: string, key: string): Promise<boolean> {
    const entry = await this.get(namespace, key);
    return entry !== null;
  }

  async getBatch<T>(
    namespace: string,
    keys: string[],
  ): Promise<Map<string, StorageEntry<T>>> {
    const result = new Map<string, StorageEntry<T>>();
    for (const key of keys) {
      const entry = await this.get<T>(namespace, key);
      if (entry) result.set(key, entry);
    }
    return result;
  }

  async setBatch<T>(
    namespace: string,
    entries: Map<string, { value: T; options?: StorageSetOptions }>,
  ): Promise<void> {
    for (const [key, { value, options }] of entries) {
      await this.set(namespace, key, value, options);
    }
  }

  async deleteBatch(namespace: string, keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (await this.delete(namespace, key)) count++;
    }
    return count;
  }

  async list(
    namespace: string,
    options?: StorageListOptions,
  ): Promise<StorageEntryWithKey[]> {
    const ns = this.getNamespace(namespace);
    let entries = Array.from(ns.entries())
      .filter(([, entry]) => !this.isExpired(entry))
      .map(([key, entry]) => ({ key, ...entry }));

    if (options?.tags?.length) {
      entries = entries.filter((e) =>
        options.tags!.some((tag) => e.metadata.tags?.includes(tag)),
      );
    }

    if (options?.offset) entries = entries.slice(options.offset);
    if (options?.limit) entries = entries.slice(0, options.limit);

    return entries as StorageEntryWithKey[];
  }

  async clear(namespace: string): Promise<number> {
    const ns = this.getNamespace(namespace);
    const count = ns.size;
    ns.clear();
    return count;
  }

  async stats(namespace: string): Promise<StorageStats> {
    const ns = this.getNamespace(namespace);
    let totalSize = 0;
    let expiredKeys = 0;
    const tags = new Set<string>();
    let oldest: { key: string; date: string } | undefined;
    let newest: { key: string; date: string } | undefined;

    for (const [key, entry] of ns) {
      if (this.isExpired(entry)) {
        expiredKeys++;
        continue;
      }
      totalSize += JSON.stringify(entry.value).length;
      entry.metadata.tags?.forEach((t) => tags.add(t));
      if (!oldest || entry.metadata.createdAt < oldest.date) {
        oldest = { key, date: entry.metadata.createdAt };
      }
      if (!newest || entry.metadata.createdAt > newest.date) {
        newest = { key, date: entry.metadata.createdAt };
      }
    }

    return {
      namespace,
      totalKeys: ns.size - expiredKeys,
      totalSize,
      expiredKeys,
      tags: Array.from(tags),
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  async findByTags(
    namespace: string,
    tags: string[],
  ): Promise<StorageEntryWithKey[]> {
    return this.list(namespace, { tags });
  }

  async findExpired(namespace?: string): Promise<StorageEntryWithKey[]> {
    const result: StorageEntryWithKey[] = [];
    const namespaces = namespace ? [namespace] : Array.from(this.data.keys());

    for (const ns of namespaces) {
      const entries = this.data.get(ns);
      if (!entries) continue;
      for (const [key, entry] of entries) {
        if (this.isExpired(entry)) {
          result.push({ key, ...entry });
        }
      }
    }
    return result;
  }

  async cleanup(): Promise<{ expired: number; cleaned: number }> {
    let expired = 0;
    for (const [, ns] of this.data) {
      for (const [key, entry] of ns) {
        if (this.isExpired(entry)) {
          ns.delete(key);
          expired++;
        }
      }
    }
    return { expired, cleaned: expired };
  }

  private createMetadata(options?: StorageSetOptions): StorageMetadata {
    const now = new Date().toISOString();
    const metadata: StorageMetadata = {
      createdAt: now,
      updatedAt: now,
      version: 1,
      source: options?.source,
    };
    if (options?.ttl && options.ttl > 0) {
      metadata.ttl = options.ttl;
      metadata.expiresAt = new Date(
        Date.now() + options.ttl * 1000,
      ).toISOString();
    }
    if (options?.tags?.length) {
      metadata.tags = options.tags;
    }
    return metadata;
  }

  private updateMetadata(
    existing: StorageMetadata,
    options?: StorageSetOptions,
  ): StorageMetadata {
    const updated: StorageMetadata = {
      ...existing,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
    if (options?.ttl !== undefined) {
      if (options.ttl > 0) {
        updated.ttl = options.ttl;
        updated.expiresAt = new Date(
          Date.now() + options.ttl * 1000,
        ).toISOString();
      } else {
        delete updated.ttl;
        delete updated.expiresAt;
      }
    }
    if (options?.tags !== undefined) {
      updated.tags = options.tags.length > 0 ? options.tags : undefined;
    }
    return updated;
  }

  private isExpired(entry: StorageEntry): boolean {
    if (!entry?.metadata?.expiresAt) return false;
    try {
      return new Date(entry.metadata.expiresAt) < new Date();
    } catch {
      return false;
    }
  }
}

// ============================================================================
// File Storage
// ============================================================================

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
    const projectsDir = path.join(
      Storage.getGlobalOllamaDir(),
      PROJECT_DIR_NAME,
    );
    return path.join(projectsDir, projectId);
  }

  getProjectTempDir(): string {
    const hash = getProjectHash(this.getProjectRoot());
    const tempDir = Storage.getGlobalTempDir();
    const targetDir = path.join(tempDir, hash);
    return targetDir;
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

  // ============================================================================
  // SSH Credentials Storage
  // ============================================================================

  /**
   * Get the path to SSH credentials file
   */
  static getSSHCredentialsPath(): string {
    return path.join(Storage.getGlobalOllamaDir(), SSH_CREDENTIALS_FILE);
  }

  /**
   * Load SSH credentials from storage
   */
  static loadSSHCredentials(): SSHCredentialsStore {
    const filePath = Storage.getSSHCredentialsPath();
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as SSHCredentialsStore;
      }
    } catch (_error) {
      // Return empty store if file doesn't exist or is corrupted
    }
    return { hosts: {} };
  }

  /**
   * Save SSH credentials to storage
   */
  static saveSSHCredentials(store: SSHCredentialsStore): void {
    const filePath = Storage.getSSHCredentialsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  }

  /**
   * Get SSH host configuration by name
   */
  static getSSHHost(name: string): SSHHostConfig | undefined {
    const store = Storage.loadSSHCredentials();
    return store.hosts[name];
  }

  /**
   * Add or update SSH host configuration
   */
  static setSSHHost(name: string, config: SSHHostConfig): void {
    const store = Storage.loadSSHCredentials();
    store.hosts[name] = {
      ...config,
      createdAt: config.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    Storage.saveSSHCredentials(store);
  }

  /**
   * Remove SSH host configuration
   */
  static removeSSHHost(name: string): boolean {
    const store = Storage.loadSSHCredentials();
    if (store.hosts[name]) {
      delete store.hosts[name];
      Storage.saveSSHCredentials(store);
      return true;
    }
    return false;
  }

  /**
   * List all SSH host configurations
   */
  static listSSHHosts(): Record<string, SSHHostConfig> {
    const store = Storage.loadSSHCredentials();
    return store.hosts;
  }

  private sanitizeCwd(cwd: string): string {
    // On Windows, normalize to lowercase for case-insensitive matching
    const normalizedCwd = os.platform() === 'win32' ? cwd.toLowerCase() : cwd;
    return normalizedCwd.replace(/[^a-zA-Z0-9]/g, '-');
  }
}
