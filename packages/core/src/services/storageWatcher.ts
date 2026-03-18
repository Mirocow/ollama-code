/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Storage Watcher Service
 * 
 * Monitors storage directory for changes in MD files and notifies the model.
 * Supports user-editable knowledge files that are automatically synced to storage.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { EventEmitter } from 'node:events';
import { getOllamaDir } from '../utils/paths.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('STORAGE_WATCHER');

// ============================================================================
// Types
// ============================================================================

export interface StorageChangeEvent {
  type: 'created' | 'modified' | 'deleted';
  path: string;
  namespace: string;
  key: string;
  content?: string;
  timestamp: string;
}

export interface MDFileInfo {
  path: string;
  namespace: string;
  key: string;
  hash: string;
  lastModified: string;
  size: number;
}

export interface StorageWatcherConfig {
  watchInterval?: number; // Polling interval in ms (default: 5000)
  enabled?: boolean;
  mdDirectories?: string[]; // Additional directories to watch for MD files
}

// ============================================================================
// Storage Watcher Class
// ============================================================================

export class StorageWatcher extends EventEmitter {
  private config: Required<StorageWatcherConfig>;
  private storageDir: string;
  private knowledgeDir: string;
  private watcher: FSWatcher | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private fileHashes: Map<string, string> = new Map();
  private isRunning = false;

  // Directories to watch for MD files
  private readonly MD_WATCH_DIRS = [
    'knowledge',      // Knowledge base MD files
    'roadmap',        // Project roadmap MD files
    'plans',          // Active plans MD files
    'context',        // Session context MD files
    'learning',       // Learned patterns MD files
  ];

  // Special MD files that are synced to storage
  private readonly SPECIAL_MD_FILES = [
    'PROJECT_KNOWLEDGE.md',
    'USER_PREFERENCES.md',
    'ACTIVE_PLAN.md',
    'SESSION_NOTES.md',
    'LEARNED_PATTERNS.md',
    'ERROR_SOLUTIONS.md',
  ];

  constructor(config: StorageWatcherConfig = {}) {
    super();
    
    this.config = {
      watchInterval: config.watchInterval ?? 5000,
      enabled: config.enabled ?? true,
      mdDirectories: config.mdDirectories ?? [],
    };

    this.storageDir = path.join(getOllamaDir(), 'storage');
    this.knowledgeDir = path.join(getOllamaDir(), 'knowledge');
    
    debugLogger.info('[StorageWatcher] Created with config:', this.config);
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start watching for changes
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      debugLogger.warn('[StorageWatcher] Already running');
      return;
    }

    if (!this.config.enabled) {
      debugLogger.info('[StorageWatcher] Disabled, not starting');
      return;
    }

    debugLogger.info('[StorageWatcher] Starting...');
    this.isRunning = true;

    // Ensure directories exist
    await this.ensureDirectories();

    // Initial scan
    await this.scanAllMDFiles();

    // Start file watcher
    this.startFileWatcher();

    // Start polling as backup
    this.startPolling();

    debugLogger.info('[StorageWatcher] Started successfully');
    this.emit('started');
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (!this.isRunning) return;

    debugLogger.info('[StorageWatcher] Stopping...');
    
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.fileHashes.clear();

    debugLogger.info('[StorageWatcher] Stopped');
    this.emit('stopped');
  }

  /**
   * Get all tracked MD files
   */
  async getTrackedFiles(): Promise<MDFileInfo[]> {
    const files: MDFileInfo[] = [];
    
    for (const [filePath, hash] of this.fileHashes) {
      try {
        const stats = await fs.stat(filePath);
        const info = this.parseFilePath(filePath);
        
        files.push({
          path: filePath,
          namespace: info.namespace,
          key: info.key,
          hash,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
        });
      } catch {
        // File might have been deleted
      }
    }

    return files;
  }

  /**
   * Force scan for changes
   */
  async scan(): Promise<StorageChangeEvent[]> {
    return this.scanAllMDFiles();
  }

  /**
   * Import MD file to storage
   */
  async importMDFile(filePath: string, namespace?: string, key?: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const info = this.parseFilePath(filePath);
    
    const targetNamespace = namespace || info.namespace;
    const targetKey = key || info.key;

    // Store the MD content
    const targetPath = this.getMDFilePath(targetNamespace, targetKey);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content, 'utf-8');

    // Update hash
    const hash = this.hashContent(content);
    this.fileHashes.set(targetPath, hash);

    // Emit change event
    const event: StorageChangeEvent = {
      type: 'created',
      path: targetPath,
      namespace: targetNamespace,
      key: targetKey,
      content,
      timestamp: new Date().toISOString(),
    };

    this.emit('change', event);
    debugLogger.info(`[StorageWatcher] Imported MD file: ${filePath} -> ${targetNamespace}:${targetKey}`);
  }

  /**
   * Export storage entry to MD file
   */
  async exportToMDFile(
    namespace: string,
    key: string,
    content: string,
    targetPath?: string,
  ): Promise<string> {
    const mdPath = targetPath || this.getMDFilePath(namespace, key);
    
    await fs.mkdir(path.dirname(mdPath), { recursive: true });
    
    // Add header comment
    const header = this.generateMDHeader(namespace, key);
    const fullContent = `${header}\n\n${content}`;
    
    await fs.writeFile(mdPath, fullContent, 'utf-8');

    // Update hash
    const hash = this.hashContent(fullContent);
    this.fileHashes.set(mdPath, hash);

    debugLogger.info(`[StorageWatcher] Exported to MD file: ${mdPath}`);
    return mdPath;
  }

  /**
   * Get pending changes for model notification
   */
  getPendingChangesNotification(): string | null {
    const changes = this.getRecentChanges();
    
    if (changes.length === 0) return null;

    const lines: string[] = [
      '<storage-notification>',
      '📝 **Storage Updated by User**',
      '',
      'The following files in your knowledge storage have been modified:',
      '',
    ];

    for (const change of changes.slice(0, 10)) {
      const icon = change.type === 'created' ? '✅' : change.type === 'modified' ? '📝' : '❌';
      lines.push(`${icon} \`${change.namespace}/${change.key}\` - ${change.type}`);
    }

    if (changes.length > 10) {
      lines.push(`\n... and ${changes.length - 10} more changes`);
    }

    lines.push('');
    lines.push('Use `model_storage operation=search` to find relevant information.');
    lines.push('</storage-notification>');

    return lines.join('\n');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    await fs.mkdir(this.knowledgeDir, { recursive: true });

    // Create MD subdirectories
    for (const dir of this.MD_WATCH_DIRS) {
      await fs.mkdir(path.join(this.storageDir, 'md', dir), { recursive: true });
    }
  }

  private startFileWatcher(): void {
    try {
      const mdDir = path.join(this.storageDir, 'md');
      
      this.watcher = watch(mdDir, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.md')) return;
        
        debugLogger.debug(`[StorageWatcher] File event: ${eventType} ${filename}`);
        
        // Debounce and process
        this.handleFileChange(path.join(mdDir, filename));
      });

      debugLogger.info('[StorageWatcher] File watcher started');
    } catch (error) {
      debugLogger.error('[StorageWatcher] Failed to start file watcher:', error);
    }
  }

  private startPolling(): void {
    this.intervalId = setInterval(async () => {
      try {
        await this.scanAllMDFiles();
      } catch (error) {
        debugLogger.error('[StorageWatcher] Polling scan failed:', error);
      }
    }, this.config.watchInterval);

    debugLogger.info(`[StorageWatcher] Polling started (${this.config.watchInterval}ms)`);
  }

  private async scanAllMDFiles(): Promise<StorageChangeEvent[]> {
    const changes: StorageChangeEvent[] = [];
    const mdDir = path.join(this.storageDir, 'md');

    try {
      await fs.mkdir(mdDir, { recursive: true });
      
      for (const namespace of this.MD_WATCH_DIRS) {
        const namespaceDir = path.join(mdDir, namespace);
        
        try {
          const files = await fs.readdir(namespaceDir);
          
          for (const file of files) {
            if (!file.endsWith('.md')) continue;

            const filePath = path.join(namespaceDir, file);
            const change = await this.checkFile(filePath, namespace);
            
            if (change) {
              changes.push(change);
            }
          }
        } catch {
          // Directory doesn't exist yet
        }
      }

      // Also check special MD files in root storage dir
      for (const specialFile of this.SPECIAL_MD_FILES) {
        const filePath = path.join(this.storageDir, specialFile);
        
        try {
          const change = await this.checkFile(filePath, 'special');
          if (change) {
            changes.push(change);
          }
        } catch {
          // File doesn't exist
        }
      }

      if (changes.length > 0) {
        debugLogger.info(`[StorageWatcher] Detected ${changes.length} changes`);
        this.emit('changes', changes);
      }
    } catch (error) {
      debugLogger.error('[StorageWatcher] Scan failed:', error);
    }

    return changes;
  }

  private async checkFile(filePath: string, namespace: string): Promise<StorageChangeEvent | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const hash = this.hashContent(content);
      const existingHash = this.fileHashes.get(filePath);

      if (existingHash === hash) {
        return null; // No change
      }

      const info = this.parseFilePath(filePath);
      const stats = await fs.stat(filePath);
      
      // Update hash
      this.fileHashes.set(filePath, hash);

      const event: StorageChangeEvent = {
        type: existingHash ? 'modified' : 'created',
        path: filePath,
        namespace: info.namespace || namespace,
        key: info.key,
        content,
        timestamp: stats.mtime.toISOString(),
      };

      this.emit('change', event);
      return event;
    } catch (error) {
      // File might have been deleted
      if (this.fileHashes.has(filePath)) {
        this.fileHashes.delete(filePath);
        
        const info = this.parseFilePath(filePath);
        const event: StorageChangeEvent = {
          type: 'deleted',
          path: filePath,
          namespace: info.namespace || namespace,
          key: info.key,
          timestamp: new Date().toISOString(),
        };

        this.emit('change', event);
        return event;
      }

      return null;
    }
  }

  private async handleFileChange(filePath: string): Promise<void> {
    const info = this.parseFilePath(filePath);
    await this.checkFile(filePath, info.namespace);
  }

  private parseFilePath(filePath: string): { namespace: string; key: string } {
    const basename = path.basename(filePath, '.md');
    const parts = filePath.split(path.sep);
    
    // Find namespace in path
    let namespace = 'knowledge';
    for (const dir of this.MD_WATCH_DIRS) {
      if (parts.includes(dir)) {
        namespace = dir;
        break;
      }
    }

    // Key is the filename without extension
    const key = basename;

    return { namespace, key };
  }

  private getMDFilePath(namespace: string, key: string): string {
    return path.join(this.storageDir, 'md', namespace, `${key}.md`);
  }

  private hashContent(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private generateMDHeader(namespace: string, key: string): string {
    return `<!--
@storage: true
@namespace: ${namespace}
@key: ${key}
@generated: ${new Date().toISOString()}
@editable: true

This file is part of the model's knowledge storage.
You can edit this file directly - changes will be detected automatically.
Use markdown formatting for better readability.
-->`;
  }

  private recentChanges: StorageChangeEvent[] = [];
  private maxRecentChanges = 50;

  private getRecentChanges(): StorageChangeEvent[] {
    return this.recentChanges.slice(-this.maxRecentChanges);
  }

  // Override emit to track recent changes
  override emit(event: string, ...args: any[]): boolean {
    if (event === 'change' && args[0]) {
      this.recentChanges.push(args[0] as StorageChangeEvent);
      if (this.recentChanges.length > this.maxRecentChanges) {
        this.recentChanges.shift();
      }
    }
    return super.emit(event, ...args);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storageWatcherInstance: StorageWatcher | null = null;

export function getStorageWatcher(config?: StorageWatcherConfig): StorageWatcher {
  if (!storageWatcherInstance) {
    storageWatcherInstance = new StorageWatcher(config);
  }
  return storageWatcherInstance;
}

export async function startStorageWatcher(config?: StorageWatcherConfig): Promise<StorageWatcher> {
  const watcher = getStorageWatcher(config);
  await watcher.start();
  return watcher;
}

export function stopStorageWatcher(): void {
  if (storageWatcherInstance) {
    storageWatcherInstance.stop();
  }
}

export default StorageWatcher;
