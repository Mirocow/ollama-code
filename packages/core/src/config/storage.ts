/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Storage Backend Interface
 *
 * Universal abstraction for storage backends.
 * Supports: SQLite (recommended), File-based (legacy), In-memory (testing)
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { getProjectHash, OLLAMA_DIR } from '../utils/paths.js';

export { OLLAMA_DIR };

// ============================================================================
// Constants
// ============================================================================

export const GOOGLE_ACCOUNTS_FILENAME = 'google_accounts.json';
export const OAUTH_FILE = 'oauth_creds.json';
export const SSH_CREDENTIALS_FILE = 'ssh_credentials.json';
const TMP_DIR_NAME = 'tmp';
const BIN_DIR_NAME = 'bin';
const PROJECT_DIR_NAME = 'projects';
const IDE_DIR_NAME = 'ide';
const DEBUG_DIR_NAME = 'debug';
const STORAGE_DIR_NAME = 'storage';
const DATABASE_FILE = 'ollama-code.db';

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
// SQLite Storage Backend (recommended for production)
// ============================================================================

export class SQLiteStorageBackend implements IStorageBackend {
  readonly name = 'sqlite';
  private db: any = null;
  private dbPath: string;
  private initialized = false;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      // Dynamic import for better-sqlite3
      const Database = (await import('better-sqlite3')).default;
      this.db = new Database(this.dbPath);

      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');

      // Create tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS storage (
          namespace TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          ttl INTEGER,
          expires_at TEXT,
          source TEXT,
          PRIMARY KEY (namespace, key)
        );
        
        CREATE TABLE IF NOT EXISTS storage_tags (
          namespace TEXT NOT NULL,
          key TEXT NOT NULL,
          tag TEXT NOT NULL,
          PRIMARY KEY (namespace, key, tag),
          FOREIGN KEY (namespace, key) REFERENCES storage(namespace, key) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_storage_expires ON storage(expires_at) WHERE expires_at IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_storage_tags ON storage_tags(tag);
      `);

      this.initialized = true;
    } catch (error) {
      // Fallback to in-memory if SQLite not available
      console.warn(
        'SQLite not available, falling back to in-memory storage:',
        error,
      );
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  async get<T>(
    namespace: string,
    key: string,
  ): Promise<StorageEntry<T> | null> {
    const row = this.db
      .prepare(
        `
      SELECT value, created_at, updated_at, version, ttl, expires_at, source
      FROM storage WHERE namespace = ? AND key = ?
    `,
      )
      .get(namespace, key);

    if (!row) return null;
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      await this.delete(namespace, key);
      return null;
    }

    const tags = this.db
      .prepare(
        `
      SELECT tag FROM storage_tags WHERE namespace = ? AND key = ?
    `,
      )
      .all(namespace, key)
      .map((r: any) => r.tag);

    return {
      value: JSON.parse(row.value) as T,
      metadata: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
        ttl: row.ttl,
        expiresAt: row.expires_at,
        source: row.source,
        tags: tags.length > 0 ? tags : undefined,
      },
    };
  }

  async set<T>(
    namespace: string,
    key: string,
    value: T,
    options?: StorageSetOptions,
  ): Promise<void> {
    const now = new Date().toISOString();
    const existing = this.db
      .prepare(
        `
      SELECT version FROM storage WHERE namespace = ? AND key = ?
    `,
      )
      .get(namespace, key);

    const version = existing ? existing.version + 1 : 1;
    const expiresAt = options?.ttl
      ? new Date(Date.now() + options.ttl * 1000).toISOString()
      : null;

    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO storage 
      (namespace, key, value, created_at, updated_at, version, ttl, expires_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        namespace,
        key,
        JSON.stringify(value),
        existing?.created_at || now,
        now,
        version,
        options?.ttl || null,
        expiresAt,
        options?.source || null,
      );

    // Update tags
    this.db
      .prepare(`DELETE FROM storage_tags WHERE namespace = ? AND key = ?`)
      .run(namespace, key);
    if (options?.tags?.length) {
      const insertTag = this.db.prepare(
        `INSERT INTO storage_tags (namespace, key, tag) VALUES (?, ?, ?)`,
      );
      for (const tag of options.tags) {
        insertTag.run(namespace, key, tag);
      }
    }
  }

  async delete(namespace: string, key: string): Promise<boolean> {
    const result = this.db
      .prepare(`DELETE FROM storage WHERE namespace = ? AND key = ?`)
      .run(namespace, key);
    return result.changes > 0;
  }

  async exists(namespace: string, key: string): Promise<boolean> {
    const row = this.db
      .prepare(
        `
      SELECT 1 FROM storage WHERE namespace = ? AND key = ? AND (expires_at IS NULL OR expires_at > ?)
    `,
      )
      .get(namespace, key, new Date().toISOString());
    return !!row;
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
    const transaction = this.db.transaction(() => {
      for (const [key, { value, options }] of entries) {
        this.set(namespace, key, value, options);
      }
    });
    transaction();
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
    let sql = `
      SELECT s.key, s.value, s.created_at, s.updated_at, s.version, s.ttl, s.expires_at, s.source,
             GROUP_CONCAT(st.tag) as tags
      FROM storage s
      LEFT JOIN storage_tags st ON s.namespace = st.namespace AND s.key = st.key
      WHERE s.namespace = ? AND (s.expires_at IS NULL OR s.expires_at > ?)
    `;

    const params: any[] = [namespace, new Date().toISOString()];

    if (options?.tags?.length) {
      sql += ` AND s.key IN (
        SELECT DISTINCT key FROM storage_tags 
        WHERE namespace = ? AND tag IN (${options.tags.map(() => '?').join(',')})
      )`;
      params.push(namespace, ...options.tags);
    }

    sql += ' GROUP BY s.key ORDER BY s.created_at DESC';

    if (options?.limit) sql += ` LIMIT ${options.limit}`;
    if (options?.offset) sql += ` OFFSET ${options.offset}`;

    const rows = this.db.prepare(sql).all(...params);

    return rows.map((row: any) => ({
      key: row.key,
      value: JSON.parse(row.value),
      metadata: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
        ttl: row.ttl,
        expiresAt: row.expires_at,
        source: row.source,
        tags: row.tags ? row.tags.split(',') : undefined,
      },
    }));
  }

  async clear(namespace: string): Promise<number> {
    const result = this.db
      .prepare(`DELETE FROM storage WHERE namespace = ?`)
      .run(namespace);
    return result.changes;
  }

  async stats(namespace: string): Promise<StorageStats> {
    const stats = this.db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_keys,
        SUM(LENGTH(value)) as total_size,
        COUNT(CASE WHEN expires_at < ? THEN 1 END) as expired_keys
      FROM storage WHERE namespace = ?
    `,
      )
      .get(new Date().toISOString(), namespace);

    const tags = this.db
      .prepare(
        `
      SELECT DISTINCT tag FROM storage_tags WHERE namespace = ?
    `,
      )
      .all(namespace)
      .map((r: any) => r.tag);

    const oldest = this.db
      .prepare(
        `
      SELECT key, created_at FROM storage 
      WHERE namespace = ? AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY created_at ASC LIMIT 1
    `,
      )
      .get(namespace, new Date().toISOString());

    const newest = this.db
      .prepare(
        `
      SELECT key, created_at FROM storage 
      WHERE namespace = ? AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY created_at DESC LIMIT 1
    `,
      )
      .get(namespace, new Date().toISOString());

    return {
      namespace,
      totalKeys: stats.total_keys - stats.expired_keys,
      totalSize: stats.total_size || 0,
      expiredKeys: stats.expired_keys,
      tags,
      oldestEntry: oldest
        ? { key: oldest.key, date: oldest.created_at }
        : undefined,
      newestEntry: newest
        ? { key: newest.key, date: newest.created_at }
        : undefined,
    };
  }

  async findByTags(
    namespace: string,
    tags: string[],
  ): Promise<StorageEntryWithKey[]> {
    return this.list(namespace, { tags });
  }

  async findExpired(namespace?: string): Promise<StorageEntryWithKey[]> {
    let sql = `
      SELECT namespace, key, value, created_at, updated_at, version, ttl, expires_at, source
      FROM storage WHERE expires_at < ?
    `;
    const params: any[] = [new Date().toISOString()];

    if (namespace) {
      sql += ' AND namespace = ?';
      params.push(namespace);
    }

    const rows = this.db.prepare(sql).all(...params);

    return rows.map((row: any) => ({
      namespace: row.namespace,
      key: row.key,
      value: JSON.parse(row.value),
      metadata: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
        ttl: row.ttl,
        expiresAt: row.expires_at,
        source: row.source,
      },
    }));
  }

  async cleanup(): Promise<{ expired: number; cleaned: number }> {
    const expired = await this.findExpired();
    let cleaned = 0;

    for (const entry of expired) {
      if (await this.delete((entry as any).namespace, entry.key)) {
        cleaned++;
      }
    }

    // Also run VACUUM to reclaim space
    this.db.exec('VACUUM');

    return { expired: expired.length, cleaned };
  }
}

// ============================================================================
// File Storage Backend (legacy, for backwards compatibility)
// ============================================================================

export class FileStorageBackend implements IStorageBackend {
  readonly name = 'file';
  private storageDir: string;
  private cache: Map<
    string,
    { data: Record<string, StorageEntry>; mtime: number }
  > = new Map();

  constructor(storageDir: string) {
    this.storageDir = storageDir;
  }

  async initialize(): Promise<void> {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async close(): Promise<void> {
    this.cache.clear();
  }

  private getFilePath(namespace: string): string {
    return path.join(this.storageDir, `${namespace}.json`);
  }

  private async readNamespace(
    namespace: string,
  ): Promise<Record<string, StorageEntry>> {
    const filePath = this.getFilePath(namespace);

    // Check cache
    try {
      const stat = fs.statSync(filePath);
      const cached = this.cache.get(namespace);
      if (cached && cached.mtime === stat.mtimeMs) {
        return cached.data;
      }
    } catch {
      return {};
    }

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Filter expired entries
      const validData: Record<string, StorageEntry> = {};
      for (const [key, entry] of Object.entries(data)) {
        const storageEntry = entry as StorageEntry;
        if (!this.isExpired(storageEntry)) {
          validData[key] = storageEntry;
        }
      }

      // Update cache
      const stat = fs.statSync(filePath);
      this.cache.set(namespace, { data: validData, mtime: stat.mtimeMs });

      return validData;
    } catch (error: any) {
      if (error.code === 'ENOENT') return {};
      throw error;
    }
  }

  private async writeNamespace(
    namespace: string,
    data: Record<string, StorageEntry>,
  ): Promise<void> {
    const filePath = this.getFilePath(namespace);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf-8',
    );

    // Update cache
    const stat = fs.statSync(filePath);
    this.cache.set(namespace, { data, mtime: stat.mtimeMs });
  }

  async get<T>(
    namespace: string,
    key: string,
  ): Promise<StorageEntry<T> | null> {
    const data = await this.readNamespace(namespace);
    const entry = data[key];
    if (!entry || this.isExpired(entry)) return null;
    return entry as StorageEntry<T>;
  }

  async set<T>(
    namespace: string,
    key: string,
    value: T,
    options?: StorageSetOptions,
  ): Promise<void> {
    const data = await this.readNamespace(namespace);
    const existing = data[key];

    data[key] = {
      value,
      metadata: existing
        ? this.updateMetadata(existing.metadata, options)
        : this.createMetadata(options),
    };

    await this.writeNamespace(namespace, data);
  }

  async delete(namespace: string, key: string): Promise<boolean> {
    const data = await this.readNamespace(namespace);
    if (!(key in data)) return false;
    delete data[key];
    await this.writeNamespace(namespace, data);
    return true;
  }

  async exists(namespace: string, key: string): Promise<boolean> {
    const entry = await this.get(namespace, key);
    return entry !== null;
  }

  async getBatch<T>(
    namespace: string,
    keys: string[],
  ): Promise<Map<string, StorageEntry<T>>> {
    const data = await this.readNamespace(namespace);
    const result = new Map<string, StorageEntry<T>>();
    for (const key of keys) {
      const entry = data[key];
      if (entry && !this.isExpired(entry)) {
        result.set(key, entry as StorageEntry<T>);
      }
    }
    return result;
  }

  async setBatch<T>(
    namespace: string,
    entries: Map<string, { value: T; options?: StorageSetOptions }>,
  ): Promise<void> {
    const data = await this.readNamespace(namespace);
    for (const [key, { value, options }] of entries) {
      const existing = data[key];
      data[key] = {
        value,
        metadata: existing
          ? this.updateMetadata(existing.metadata, options)
          : this.createMetadata(options),
      };
    }
    await this.writeNamespace(namespace, data);
  }

  async deleteBatch(namespace: string, keys: string[]): Promise<number> {
    const data = await this.readNamespace(namespace);
    let count = 0;
    for (const key of keys) {
      if (key in data) {
        delete data[key];
        count++;
      }
    }
    if (count > 0) await this.writeNamespace(namespace, data);
    return count;
  }

  async list(
    namespace: string,
    options?: StorageListOptions,
  ): Promise<StorageEntryWithKey[]> {
    const data = await this.readNamespace(namespace);
    let entries = Object.entries(data)
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
    const data = await this.readNamespace(namespace);
    const count = Object.keys(data).length;
    await this.writeNamespace(namespace, {});
    return count;
  }

  async stats(namespace: string): Promise<StorageStats> {
    const data = await this.readNamespace(namespace);
    let totalSize = 0;
    let expiredKeys = 0;
    const tags = new Set<string>();
    let oldest: { key: string; date: string } | undefined;
    let newest: { key: string; date: string } | undefined;

    for (const [key, entry] of Object.entries(data)) {
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
      totalKeys: Object.keys(data).length - expiredKeys,
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

    const scanDir = async (dir: string, ns?: string) => {
      const files = fs.existsSync(dir) ? await fs.promises.readdir(dir) : [];
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const nsName = file.slice(0, -5);
        if (ns && nsName !== ns) continue;

        const data = await this.readNamespace(nsName);
        for (const [key, entry] of Object.entries(data)) {
          if (this.isExpired(entry)) {
            result.push({ key, ...entry });
          }
        }
      }
    };

    await scanDir(this.storageDir, namespace);
    return result;
  }

  async cleanup(): Promise<{ expired: number; cleaned: number }> {
    const expired = await this.findExpired();
    let cleaned = 0;

    // Full cleanup by re-reading and re-writing all namespaces
    const files = fs.existsSync(this.storageDir)
      ? await fs.promises.readdir(this.storageDir)
      : [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const namespace = file.slice(0, -5);
      const data = await this.readNamespace(namespace);
      const validData: Record<string, StorageEntry> = {};
      let hadExpired = false;

      for (const [key, entry] of Object.entries(data)) {
        if (this.isExpired(entry)) {
          cleaned++;
          hadExpired = true;
        } else {
          validData[key] = entry;
        }
      }

      if (hadExpired) {
        await this.writeNamespace(namespace, validData);
      }
    }

    return { expired: expired.length, cleaned };
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
// Storage Manager
// ============================================================================

export type StorageBackendType = 'sqlite' | 'file' | 'memory';

export class Storage {
  private readonly targetDir: string;
  private backend: IStorageBackend | null = null;
  private sessionBackend: InMemoryStorageBackend | null = null;

  constructor(targetDir: string) {
    this.targetDir = targetDir;
  }

  /**
   * Initialize storage with specified backend type
   */
  async initialize(type: StorageBackendType = 'sqlite'): Promise<void> {
    // Initialize persistent backend
    switch (type) {
      case 'sqlite':
        try {
          this.backend = new SQLiteStorageBackend(this.getDatabasePath());
          await this.backend.initialize();
        } catch (error) {
          console.warn(
            'Failed to initialize SQLite, falling back to file storage:',
            error,
          );
          this.backend = new FileStorageBackend(this.getStorageDir());
          await this.backend.initialize();
        }
        break;
      case 'file':
        this.backend = new FileStorageBackend(this.getStorageDir());
        await this.backend.initialize();
        break;
      case 'memory':
        this.backend = new InMemoryStorageBackend();
        await this.backend.initialize();
        break;
      default:
        // Unknown backend type, fall back to file storage
        this.backend = new FileStorageBackend(this.getStorageDir());
        await this.backend.initialize();
        break;
    }

    // Session backend is always in-memory
    this.sessionBackend = new InMemoryStorageBackend();
    await this.sessionBackend.initialize();
  }

  /**
   * Get the current backend
   */
  getBackend(): IStorageBackend {
    if (!this.backend) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.backend;
  }

  /**
   * Get session backend (in-memory)
   */
  getSessionBackend(): InMemoryStorageBackend {
    if (!this.sessionBackend) {
      this.sessionBackend = new InMemoryStorageBackend();
    }
    return this.sessionBackend;
  }

  /**
   * Close storage
   */
  async close(): Promise<void> {
    if (this.backend) {
      await this.backend.close();
      this.backend = null;
    }
    if (this.sessionBackend) {
      await this.sessionBackend.close();
      this.sessionBackend = null;
    }
  }

  // ============================================================================
  // Path Helpers (static, for backwards compatibility)
  // ============================================================================

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

  // ============================================================================
  // Instance Path Helpers
  // ============================================================================

  getOllamaDir(): string {
    return path.join(this.targetDir, OLLAMA_DIR);
  }

  getProjectDir(): string {
    const projectId = this.sanitizeCwd(this.getProjectRoot());
    return path.join(Storage.getGlobalOllamaDir(), PROJECT_DIR_NAME, projectId);
  }

  getProjectTempDir(): string {
    const hash = getProjectHash(this.getProjectRoot());
    return path.join(Storage.getGlobalTempDir(), hash);
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
    return path.join(Storage.getGlobalOllamaDir(), 'history', hash);
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

  private getStorageDir(): string {
    return path.join(Storage.getGlobalOllamaDir(), STORAGE_DIR_NAME);
  }

  private getDatabasePath(): string {
    return path.join(Storage.getGlobalOllamaDir(), DATABASE_FILE);
  }

  private sanitizeCwd(cwd: string): string {
    const normalizedCwd = os.platform() === 'win32' ? cwd.toLowerCase() : cwd;
    return normalizedCwd.replace(/[^a-zA-Z0-9]/g, '-');
  }

  // ============================================================================
  // SSH Credentials (backwards compatible)
  // ============================================================================

  static getSSHCredentialsPath(): string {
    return path.join(Storage.getGlobalOllamaDir(), SSH_CREDENTIALS_FILE);
  }

  static loadSSHCredentials(): SSHCredentialsStore {
    const filePath = Storage.getSSHCredentialsPath();
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as SSHCredentialsStore;
      }
    } catch {
      // Return empty store if file doesn't exist or is corrupted
    }
    return { hosts: {} };
  }

  static saveSSHCredentials(store: SSHCredentialsStore): void {
    const filePath = Storage.getSSHCredentialsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  }

  static getSSHHost(name: string): SSHHostConfig | undefined {
    return Storage.loadSSHCredentials().hosts[name];
  }

  static setSSHHost(name: string, config: SSHHostConfig): void {
    const store = Storage.loadSSHCredentials();
    store.hosts[name] = {
      ...config,
      createdAt: config.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    Storage.saveSSHCredentials(store);
  }

  static removeSSHHost(name: string): boolean {
    const store = Storage.loadSSHCredentials();
    if (store.hosts[name]) {
      delete store.hosts[name];
      Storage.saveSSHCredentials(store);
      return true;
    }
    return false;
  }

  static listSSHHosts(): Record<string, SSHHostConfig> {
    return Storage.loadSSHCredentials().hosts;
  }
}
