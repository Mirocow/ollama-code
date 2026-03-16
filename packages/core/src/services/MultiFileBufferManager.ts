/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('MULTI_FILE_BUFFER');

/**
 * Represents a single file buffer with its content and metadata
 */
export interface FileBuffer {
  /** Absolute path to the file */
  filePath: string;
  /** Current content in memory (may differ from disk) */
  content: string;
  /** Original content when first loaded (for change detection) */
  originalContent: string;
  /** Whether the buffer has unsaved changes */
  isDirty: boolean;
  /** Whether this is a new file that doesn't exist on disk */
  isNewFile: boolean;
  /** Last known modification time on disk */
  lastModified?: number;
  /** Line number where cursor was last positioned */
  cursorLine: number;
  /** Column number where cursor was last positioned */
  cursorColumn: number;
  /** Buffer number (like vim's buffer number) */
  bufferNumber: number;
  /** When the buffer was opened */
  openedAt: number;
  /** When the buffer was last accessed */
  lastAccessedAt: number;
}

/**
 * Buffer list entry for display purposes (like vim's :ls)
 */
export interface BufferListEntry {
  bufferNumber: number;
  filePath: string;
  fileName: string;
  isDirty: boolean;
  isNewFile: boolean;
  isActive: boolean;
  isPrevious: boolean;
}

/**
 * Event types for buffer changes
 */
export type BufferEventType =
  | 'buffer_added'
  | 'buffer_removed'
  | 'buffer_switched'
  | 'buffer_updated'
  | 'buffer_saved'
  | 'buffers_cleared';

/**
 * Listener function type for buffer events
 */
export type BufferEventListener = (event: BufferEvent) => void;

/**
 * Buffer event payload
 */
export interface BufferEvent {
  type: BufferEventType;
  buffer?: FileBuffer;
  bufferNumber?: number;
  previousBufferNumber?: number;
}

/**
 * Configuration options for the buffer manager
 */
export interface BufferManagerOptions {
  /** Maximum number of buffers to keep open */
  maxBuffers?: number;
  /** Whether to auto-save dirty buffers when switching */
  autoSaveOnSwitch?: boolean;
}

/**
 * Manages multiple file buffers similar to vim's buffer system.
 * 
 * Features:
 * - Open multiple files in memory buffers
 * - Track dirty/unsaved state
 * - Switch between buffers without re-reading files
 * - Vim-like commands (:bn, :bp, :bd, :ls, :w, :q)
 */
export class MultiFileBufferManager {
  private buffers: Map<string, FileBuffer> = new Map();
  private bufferNumberCounter = 1;
  private activeBufferPath: string | null = null;
  private previousBufferPath: string | null = null;
  private listeners: Set<BufferEventListener> = new Set();
  private options: Required<BufferManagerOptions>;

  constructor(options: BufferManagerOptions = {}) {
    this.options = {
      maxBuffers: options.maxBuffers ?? 50,
      autoSaveOnSwitch: options.autoSaveOnSwitch ?? false,
    };
  }

  /**
   * Add a listener for buffer events
   */
  addListener(listener: BufferEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: BufferEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        debugLogger.error('Error in buffer event listener:', error);
      }
    }
  }

  /**
   * Get or create a buffer for a file
   * @param filePath Absolute path to the file
   * @param content Optional initial content (for new files or explicit content)
   * @returns The file buffer
   */
  async openBuffer(
    filePath: string,
    content?: string,
  ): Promise<FileBuffer> {
    const absolutePath = path.resolve(filePath);
    
    // Check if buffer already exists
    const existingBuffer = this.buffers.get(absolutePath);
    if (existingBuffer) {
      // Update access time and make it active
      existingBuffer.lastAccessedAt = Date.now();
      this.previousBufferPath = this.activeBufferPath;
      this.activeBufferPath = absolutePath;
      
      this.emit({
        type: 'buffer_switched',
        buffer: existingBuffer,
        previousBufferNumber: this.previousBufferPath 
          ? this.buffers.get(this.previousBufferPath)?.bufferNumber
          : undefined,
      });
      
      return existingBuffer;
    }

    // Check if we need to evict a buffer (LRU)
    if (this.buffers.size >= this.options.maxBuffers) {
      this.evictLeastRecentlyUsed();
    }

    // Determine if file exists and read content
    let isNewFile = false;
    let fileContent = content ?? '';
    let lastModified: number | undefined;

    if (content === undefined) {
      try {
        const stats = await fs.stat(absolutePath);
        fileContent = await fs.readFile(absolutePath, 'utf-8');
        lastModified = stats.mtimeMs;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          isNewFile = true;
        } else {
          throw error;
        }
      }
    } else {
      // Check if file exists for provided content
      try {
        const stats = await fs.stat(absolutePath);
        lastModified = stats.mtimeMs;
      } catch {
        isNewFile = true;
      }
    }

    // Create new buffer
    const buffer: FileBuffer = {
      filePath: absolutePath,
      content: fileContent,
      originalContent: fileContent,
      isDirty: false,
      isNewFile,
      lastModified,
      cursorLine: 0,
      cursorColumn: 0,
      bufferNumber: this.bufferNumberCounter++,
      openedAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    this.buffers.set(absolutePath, buffer);
    this.previousBufferPath = this.activeBufferPath;
    this.activeBufferPath = absolutePath;

    this.emit({
      type: 'buffer_added',
      buffer,
      previousBufferNumber: this.previousBufferPath
        ? this.buffers.get(this.previousBufferPath)?.bufferNumber
        : undefined,
    });

    debugLogger.info(`Opened buffer #${buffer.bufferNumber}: ${absolutePath}`);
    return buffer;
  }

  /**
   * Evict the least recently used buffer (non-dirty preferred)
   */
  private evictLeastRecentlyUsed(): void {
    if (this.buffers.size === 0) return;

    // Sort by last accessed time, preferring non-dirty buffers
    const sortedBuffers = Array.from(this.buffers.values()).sort((a, b) => {
      // Prefer evicting non-dirty buffers
      if (a.isDirty !== b.isDirty) {
        return a.isDirty ? 1 : -1;
      }
      // Then by access time (oldest first)
      return a.lastAccessedAt - b.lastAccessedAt;
    });

    const bufferToEvict = sortedBuffers[0];
    if (bufferToEvict && !bufferToEvict.isDirty) {
      this.buffers.delete(bufferToEvict.filePath);
      if (this.activeBufferPath === bufferToEvict.filePath) {
        this.activeBufferPath = null;
      }
      if (this.previousBufferPath === bufferToEvict.filePath) {
        this.previousBufferPath = null;
      }
      
      this.emit({
        type: 'buffer_removed',
        bufferNumber: bufferToEvict.bufferNumber,
      });
      
      debugLogger.info(`Evicted buffer #${bufferToEvict.bufferNumber}: ${bufferToEvict.filePath}`);
    }
  }

  /**
   * Get the currently active buffer
   */
  getActiveBuffer(): FileBuffer | null {
    if (!this.activeBufferPath) return null;
    return this.buffers.get(this.activeBufferPath) ?? null;
  }

  /**
   * Get a buffer by its number
   */
  getBufferByNumber(bufferNumber: number): FileBuffer | null {
    for (const buffer of this.buffers.values()) {
      if (buffer.bufferNumber === bufferNumber) {
        return buffer;
      }
    }
    return null;
  }

  /**
   * Get a buffer by its file path
   */
  getBufferByPath(filePath: string): FileBuffer | null {
    const absolutePath = path.resolve(filePath);
    return this.buffers.get(absolutePath) ?? null;
  }

  /**
   * Switch to the next buffer (like vim's :bn)
   */
  nextBuffer(): FileBuffer | null {
    const bufferArray = Array.from(this.buffers.values());
    if (bufferArray.length === 0) return null;

    const currentIndex = this.activeBufferPath
      ? bufferArray.findIndex(b => b.filePath === this.activeBufferPath)
      : -1;

    const nextIndex = (currentIndex + 1) % bufferArray.length;
    const nextBuffer = bufferArray[nextIndex];

    this.previousBufferPath = this.activeBufferPath;
    this.activeBufferPath = nextBuffer.filePath;
    nextBuffer.lastAccessedAt = Date.now();

    this.emit({
      type: 'buffer_switched',
      buffer: nextBuffer,
      previousBufferNumber: this.previousBufferPath
        ? this.buffers.get(this.previousBufferPath)?.bufferNumber
        : undefined,
    });

    return nextBuffer;
  }

  /**
   * Switch to the previous buffer (like vim's :bp)
   */
  previousBuffer(): FileBuffer | null {
    const bufferArray = Array.from(this.buffers.values());
    if (bufferArray.length === 0) return null;

    const currentIndex = this.activeBufferPath
      ? bufferArray.findIndex(b => b.filePath === this.activeBufferPath)
      : -1;

    const prevIndex = currentIndex <= 0 
      ? bufferArray.length - 1 
      : currentIndex - 1;
    const prevBuffer = bufferArray[prevIndex];

    this.previousBufferPath = this.activeBufferPath;
    this.activeBufferPath = prevBuffer.filePath;
    prevBuffer.lastAccessedAt = Date.now();

    this.emit({
      type: 'buffer_switched',
      buffer: prevBuffer,
      previousBufferNumber: this.previousBufferPath
        ? this.buffers.get(this.previousBufferPath)?.bufferNumber
        : undefined,
    });

    return prevBuffer;
  }

  /**
   * Switch to the alternate buffer (the previously active one, like vim's Ctrl-^)
   */
  alternateBuffer(): FileBuffer | null {
    if (!this.previousBufferPath) return null;
    
    const alternateBuffer = this.buffers.get(this.previousBufferPath);
    if (!alternateBuffer) return null;

    this.previousBufferPath = this.activeBufferPath;
    this.activeBufferPath = alternateBuffer.filePath;
    alternateBuffer.lastAccessedAt = Date.now();

    this.emit({
      type: 'buffer_switched',
      buffer: alternateBuffer,
      previousBufferNumber: this.previousBufferPath
        ? this.buffers.get(this.previousBufferPath)?.bufferNumber
        : undefined,
    });

    return alternateBuffer;
  }

  /**
   * Switch to a specific buffer by number
   */
  switchToBuffer(bufferNumber: number): FileBuffer | null {
    const buffer = this.getBufferByNumber(bufferNumber);
    if (!buffer) return null;

    this.previousBufferPath = this.activeBufferPath;
    this.activeBufferPath = buffer.filePath;
    buffer.lastAccessedAt = Date.now();

    this.emit({
      type: 'buffer_switched',
      buffer,
      previousBufferNumber: this.previousBufferPath
        ? this.buffers.get(this.previousBufferPath)?.bufferNumber
        : undefined,
    });

    return buffer;
  }

  /**
   * Update buffer content (marks as dirty)
   */
  updateBufferContent(
    filePath: string,
    content: string,
    cursorLine?: number,
    cursorColumn?: number,
  ): FileBuffer | null {
    const absolutePath = path.resolve(filePath);
    const buffer = this.buffers.get(absolutePath);
    if (!buffer) return null;

    buffer.content = content;
    buffer.isDirty = content !== buffer.originalContent;
    buffer.lastAccessedAt = Date.now();
    
    if (cursorLine !== undefined) buffer.cursorLine = cursorLine;
    if (cursorColumn !== undefined) buffer.cursorColumn = cursorColumn;

    this.emit({
      type: 'buffer_updated',
      buffer,
    });

    return buffer;
  }

  /**
   * Save buffer to disk
   */
  async saveBuffer(filePath?: string): Promise<{ success: boolean; error?: string }> {
    const targetPath = filePath 
      ? path.resolve(filePath) 
      : this.activeBufferPath;
    
    if (!targetPath) {
      return { success: false, error: 'No buffer to save' };
    }

    const buffer = this.buffers.get(targetPath);
    if (!buffer) {
      return { success: false, error: 'Buffer not found' };
    }

    try {
      // Ensure parent directory exists
      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(targetPath, buffer.content, 'utf-8');
      
      buffer.originalContent = buffer.content;
      buffer.isDirty = false;
      buffer.isNewFile = false;
      buffer.lastModified = Date.now();

      this.emit({
        type: 'buffer_saved',
        buffer,
      });

      debugLogger.info(`Saved buffer #${buffer.bufferNumber}: ${targetPath}`);
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      debugLogger.error(`Failed to save buffer: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Delete a buffer (like vim's :bd)
   * @param force If true, delete even if buffer has unsaved changes
   */
  deleteBuffer(
    bufferNumber: number,
    force: boolean = false,
  ): { success: boolean; error?: string; unsavedContent?: string } {
    const buffer = this.getBufferByNumber(bufferNumber);
    if (!buffer) {
      return { success: false, error: 'Buffer not found' };
    }

    if (buffer.isDirty && !force) {
      return { 
        success: false, 
        error: 'Buffer has unsaved changes. Use force=true to delete anyway.',
        unsavedContent: buffer.content,
      };
    }

    this.buffers.delete(buffer.filePath);

    // Update active buffer pointers
    if (this.activeBufferPath === buffer.filePath) {
      this.activeBufferPath = this.previousBufferPath;
    }
    if (this.previousBufferPath === buffer.filePath) {
      this.previousBufferPath = null;
    }

    this.emit({
      type: 'buffer_removed',
      bufferNumber: buffer.bufferNumber,
    });

    debugLogger.info(`Deleted buffer #${bufferNumber}: ${buffer.filePath}`);
    return { success: true };
  }

  /**
   * Close the current buffer (like vim's :q)
   */
  closeCurrentBuffer(force: boolean = false): { success: boolean; error?: string } {
    const activeBuffer = this.getActiveBuffer();
    if (!activeBuffer) {
      return { success: false, error: 'No active buffer' };
    }

    const result = this.deleteBuffer(activeBuffer.bufferNumber, force);
    return { 
      success: result.success, 
      error: result.error,
    };
  }

  /**
   * Get list of all buffers for display (like vim's :ls)
   */
  getBufferList(): BufferListEntry[] {
    return Array.from(this.buffers.values())
      .sort((a, b) => a.bufferNumber - b.bufferNumber)
      .map(buffer => ({
        bufferNumber: buffer.bufferNumber,
        filePath: buffer.filePath,
        fileName: path.basename(buffer.filePath),
        isDirty: buffer.isDirty,
        isNewFile: buffer.isNewFile,
        isActive: buffer.filePath === this.activeBufferPath,
        isPrevious: buffer.filePath === this.previousBufferPath,
      }));
  }

  /**
   * Get the count of open buffers
   */
  getBufferCount(): number {
    return this.buffers.size;
  }

  /**
   * Check if there are any dirty (unsaved) buffers
   */
  hasDirtyBuffers(): boolean {
    return Array.from(this.buffers.values()).some(b => b.isDirty);
  }

  /**
   * Get all dirty buffers
   */
  getDirtyBuffers(): FileBuffer[] {
    return Array.from(this.buffers.values()).filter(b => b.isDirty);
  }

  /**
   * Clear all buffers
   */
  clearBuffers(): void {
    this.buffers.clear();
    this.activeBufferPath = null;
    this.previousBufferPath = null;
    
    this.emit({
      type: 'buffers_cleared',
    });
  }

  /**
   * Reload buffer from disk (discarding unsaved changes if forced)
   */
  async reloadBuffer(
    bufferNumber: number,
    force: boolean = false,
  ): Promise<{ success: boolean; error?: string }> {
    const buffer = this.getBufferByNumber(bufferNumber);
    if (!buffer) {
      return { success: false, error: 'Buffer not found' };
    }

    if (buffer.isDirty && !force) {
      return { 
        success: false, 
        error: 'Buffer has unsaved changes. Use force=true to reload anyway.',
      };
    }

    try {
      const content = await fs.readFile(buffer.filePath, 'utf-8');
      buffer.content = content;
      buffer.originalContent = content;
      buffer.isDirty = false;
      buffer.lastModified = Date.now();

      this.emit({
        type: 'buffer_updated',
        buffer,
      });

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Check if a file has been modified on disk since we loaded it
   */
  async checkFileChanged(bufferNumber: number): Promise<boolean> {
    const buffer = this.getBufferByNumber(bufferNumber);
    if (!buffer || buffer.isNewFile) return false;

    try {
      const stats = await fs.stat(buffer.filePath);
      return stats.mtimeMs > (buffer.lastModified ?? 0);
    } catch {
      return false;
    }
  }
}

// Singleton instance
let defaultManager: MultiFileBufferManager | null = null;

/**
 * Get the default buffer manager instance
 */
export function getBufferManager(
  options?: BufferManagerOptions,
): MultiFileBufferManager {
  if (!defaultManager) {
    defaultManager = new MultiFileBufferManager(options);
  }
  return defaultManager;
}

/**
 * Reset the default buffer manager (useful for testing)
 */
export function resetBufferManager(): void {
  defaultManager = null;
}
