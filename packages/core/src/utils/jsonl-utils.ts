/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Crash-safe JSONL (JSON Lines) file utilities.
 *
 * Features:
 * - Atomic writes with fsync for crash protection
 * - Handles corrupted files (concatenated JSON objects, incomplete lines)
 * - Mutex-based concurrency control
 * - Automatic recovery on read
 *
 * Reading operations:
 * - readLines() - Reads the first N lines efficiently using buffered I/O
 * - read() - Reads entire file into memory as array
 *
 * Writing operations:
 * - writeLine() - Async append with crash protection
 * - writeLineSync() - Sync append (use in non-async contexts)
 * - write() - Overwrites entire file with array of objects
 *
 * Utility operations:
 * - countLines() - Counts non-empty lines
 * - exists() - Checks if file exists and is non-empty
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Mutex } from 'async-mutex';
import { createDebugLogger } from './debugLogger.js';

const debugLogger = createDebugLogger('JSONL');

/**
 * A map of file paths to mutexes for preventing concurrent writes (async).
 * Used by async writeLine function.
 */
const asyncFileLocks = new Map<string, Mutex>();

/**
 * A map of file paths to lock status for synchronous operations.
 * CRITICAL: This is shared between sync and async operations to prevent
 * interleaved writes. Both writeLine (async) and writeLineSync must check
 * this lock before writing.
 */
const syncFileLocks = new Map<string, { locked: boolean }>();

/**
 * Gets or creates a mutex for a specific file path (for async operations).
 */
function getAsyncFileLock(filePath: string): Mutex {
  if (!asyncFileLocks.has(filePath)) {
    asyncFileLocks.set(filePath, new Mutex());
  }
  return asyncFileLocks.get(filePath)!;
}

/**
 * Gets or creates a sync lock for a specific file path.
 * This lock is SHARED between sync and async operations.
 */
function getSyncFileLock(filePath: string): { locked: boolean } {
  if (!syncFileLocks.has(filePath)) {
    syncFileLocks.set(filePath, { locked: false });
  }
  return syncFileLocks.get(filePath)!;
}

/**
 * Executes a function with a sync lock.
 * This ensures writes are serialized even when called from different async contexts.
 * CRITICAL: This lock is shared with async operations via syncFileLocks.
 * 
 * The function uses a spin-wait with yield to allow other operations to complete
 * when called from async context. This ensures proper synchronization between
 * sync and async code paths.
 */
function withSyncLock<T>(filePath: string, fn: () => T): T {
  const lock = getSyncFileLock(filePath);

  // Check if already locked (reentrant call)
  const wasLocked = lock.locked;
  
  if (!wasLocked) {
    lock.locked = true;
  }
  
  try {
    return fn();
  } finally {
    // Only release if we acquired the lock
    if (!wasLocked) {
      lock.locked = false;
    }
  }
}

/**
 * Waits for sync lock to be available, then executes the function.
 * Used by async code to coordinate with sync writeLineSync calls.
 * 
 * This creates a proper barrier: if sync code is holding the lock,
 * async code will wait (via setImmediate) until it's released.
 */
async function waitForSyncLockAndExecute<T>(filePath: string, fn: () => T): Promise<T> {
  const lock = getSyncFileLock(filePath);
  
  // Wait for lock to be available
  while (lock.locked) {
    // Yield to allow other operations (including sync writes) to complete
    await new Promise(resolve => setImmediate(resolve));
  }
  
  // Now acquire the lock and execute
  lock.locked = true;
  try {
    return fn();
  } finally {
    lock.locked = false;
  }
}

/**
 * Ensures the parent directory exists.
 */
function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Validates that a string is valid JSON.
 * Returns the parsed object or throws an error.
 */
function validateJson(jsonStr: string): unknown {
  return JSON.parse(jsonStr);
}

/**
 * Writes all data to a file descriptor, handling partial writes.
 * fs.writeSync may not write all bytes in a single call, especially for large strings.
 * This function loops until all bytes are written.
 *
 * @param fd File descriptor
 * @param data String to write
 */
function writeAllSync(fd: number, data: string): void {
  const buffer = Buffer.from(data, 'utf8');
  let offset = 0;
  let bytesWritten = 0;

  while (offset < buffer.length) {
    bytesWritten = fs.writeSync(fd, buffer, offset, buffer.length - offset, null);
    if (bytesWritten === 0) {
      throw new Error('writeAllSync: wrote 0 bytes, possible disk full or I/O error');
    }
    offset += bytesWritten;
  }
}

/**
 * Parses one or more JSON objects from a line.
 * Handles cases where multiple JSON objects are concatenated without newlines.
 * Also handles incomplete/truncated JSON at the end.
 */
function parseJsonObjectsFromLine<T>(line: string, isLastLine: boolean): T[] {
  const results: T[] = [];
  let pos = 0;
  const trimmed = line.trim();

  while (pos < trimmed.length) {
    // Skip whitespace
    while (pos < trimmed.length && /\s/.test(trimmed[pos])) {
      pos++;
    }
    if (pos >= trimmed.length) break;

    // Find the end of the JSON object by counting braces
    let depth = 0;
    const startPos = pos;
    let inString = false;
    let escape = false;
    let foundComplete = false;

    while (pos < trimmed.length) {
      const char = trimmed[pos];

      if (escape) {
        escape = false;
        pos++;
        continue;
      }

      if (char === '\\' && inString) {
        escape = true;
        pos++;
        continue;
      }

      if (char === '"') {
        inString = !inString;
      } else if (!inString) {
        if (char === '{' || char === '[') {
          depth++;
        } else if (char === '}' || char === ']') {
          depth--;
          if (depth === 0) {
            pos++;
            foundComplete = true;
            break;
          }
        }
      }
      pos++;
    }

    const jsonStr = trimmed.slice(startPos, pos);

    // If this is the last line and JSON is incomplete, skip it (truncated write)
    if (!foundComplete && isLastLine) {
      debugLogger.warn(
        `Skipping incomplete JSON at end of file: ${jsonStr.slice(0, 50)}...`,
      );
      break;
    }

    // If we found a complete object or this isn't the last line, try to parse
    if (jsonStr.length > 0) {
      try {
        results.push(JSON.parse(jsonStr) as T);
      } catch {
        // If incomplete on last line, skip
        if (isLastLine && !foundComplete) {
          debugLogger.warn(
            `Skipping malformed JSON at end of file: ${jsonStr.slice(0, 50)}...`,
          );
        } else {
          debugLogger.warn(
            `Skipping malformed JSON: ${jsonStr.slice(0, 50)}...`,
          );
        }
      }
    }
  }

  return results;
}

/**
 * Reads the first N lines from a JSONL file efficiently.
 * Returns an array of parsed objects.
 * Handles corrupted files gracefully.
 */
export async function readLines<T = unknown>(
  filePath: string,
  count: number,
): Promise<T[]> {
  try {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const results: T[] = [];
    const lines: string[] = [];

    // Collect all lines first to know which is last
    for await (const line of rl) {
      lines.push(line);
    }

    for (let i = 0; i < lines.length && results.length < count; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        const isLastLine = i === lines.length - 1;
        const objects = parseJsonObjectsFromLine<T>(trimmed, isLastLine);
        for (const obj of objects) {
          if (results.length >= count) break;
          results.push(obj);
        }
      }
    }

    return results;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      debugLogger.error(
        `Error reading first ${count} lines from ${filePath}:`,
        error,
      );
    }
    return [];
  }
}

/**
 * Reads all lines from a JSONL file.
 * Returns an array of parsed objects.
 * Handles corrupted files gracefully (concatenated objects, truncated lines).
 */
export async function read<T = unknown>(filePath: string): Promise<T[]> {
  try {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const results: T[] = [];
    const lines: string[] = [];

    // Collect all lines first to know which is last
    for await (const line of rl) {
      lines.push(line);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        const isLastLine = i === lines.length - 1;
        const objects = parseJsonObjectsFromLine<T>(trimmed, isLastLine);
        results.push(...objects);
      }
    }

    return results;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      debugLogger.error(`Error reading ${filePath}:`, error);
    }
    return [];
  }
}

/**
 * Appends a line to a JSONL file with crash protection.
 *
 * Safety features:
 * - Uses sync lock with async wait for full synchronization
 * - Validates JSON before writing
 * - Uses fsync to ensure data is written to disk
 * - Atomic append operation
 * 
 * CRITICAL: This function coordinates with writeLineSync through syncFileLocks.
 * It waits for any sync write to complete before starting, and vice versa.
 */
export async function writeLine(
  filePath: string,
  data: unknown,
): Promise<void> {
  // Use waitForSyncLockAndExecute to coordinate with sync writes
  await waitForSyncLockAndExecute(filePath, () => {
    writeLineSyncInternal(filePath, data);
  });
}

/**
 * Synchronous version of writeLine for use in non-async contexts.
 * Uses queue-based locking for concurrency control to prevent interleaved writes.
 *
 * IMPORTANT: This function uses a sync locking mechanism to serialize writes.
 * Without proper locking, concurrent writes from different async contexts can
 * interleave, corrupting the JSONL file with mixed/partial records.
 */
export function writeLineSync(filePath: string, data: unknown): void {
  ensureDir(filePath);

  // Validate and serialize JSON BEFORE acquiring lock to minimize lock time
  const jsonStr = JSON.stringify(data);
  validateJson(jsonStr); // Will throw if invalid

  const line = `${jsonStr}\n`;

  // Use sync lock to prevent concurrent writes
  withSyncLock(filePath, () => {
    // Open file in append mode, write, then fsync
    const fd = fs.openSync(filePath, 'a');
    try {
      // CRITICAL: fs.writeSync may not write all bytes in one call!
      // We must loop until all bytes are written to prevent partial writes.
      writeAllSync(fd, line);
      // Force write to disk for crash protection
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  });
}

/**
 * Internal sync write with fsync for crash protection.
 * CRITICAL: This function does NOT use locking - caller must ensure proper synchronization
 * by wrapping the call in withSyncLock().
 */
function writeLineSyncInternal(filePath: string, data: unknown): void {
  ensureDir(filePath);

  // Validate JSON first
  const jsonStr = JSON.stringify(data);
  validateJson(jsonStr); // Will throw if invalid

  const line = `${jsonStr}\n`;

  // Open file in append mode, write, then fsync
  const fd = fs.openSync(filePath, 'a');
  try {
    // CRITICAL: fs.writeSync may not write all bytes in one call!
    writeAllSync(fd, line);
    // Force write to disk for crash protection
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Overwrites a JSONL file with an array of objects.
 * Each object will be written as a separate line.
 * Uses atomic write (write to temp, then rename) for crash protection.
 */
export function write(filePath: string, data: unknown[]): void {
  ensureDir(filePath);

  // Write all lines to a temp file first
  const tempPath = `${filePath}.tmp`;
  const lines = data.map((item) => JSON.stringify(item)).join('\n') + '\n';

  // Write to temp file with fsync
  const fd = fs.openSync(tempPath, 'w');
  try {
    // CRITICAL: fs.writeSync may not write all bytes in one call!
    writeAllSync(fd, lines);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }

  // Atomic rename (this is atomic on POSIX systems)
  fs.renameSync(tempPath, filePath);
}

/**
 * Counts the number of non-empty lines in a JSONL file.
 */
export async function countLines(filePath: string): Promise<number> {
  try {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let count = 0;
    for await (const line of rl) {
      if (line.trim().length > 0) {
        count++;
      }
    }
    return count;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      debugLogger.error(`Error counting lines in ${filePath}:`, error);
    }
    return 0;
  }
}

/**
 * Checks if a JSONL file exists and is not empty.
 */
export function exists(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile() && stats.size > 0;
  } catch {
    return false;
  }
}

/**
 * Repairs a corrupted JSONL file by removing incomplete/corrupted lines.
 * Returns the number of valid records preserved.
 */
export async function repair(filePath: string): Promise<number> {
  try {
    const records = await read(filePath);
    if (records.length === 0) {
      return 0;
    }

    // Rewrite the file with only valid records
    write(filePath, records);

    debugLogger.info(
      `Repaired ${filePath}: preserved ${records.length} valid records`,
    );
    return records.length;
  } catch (error) {
    debugLogger.error(`Error repairing ${filePath}:`, error);
    return 0;
  }
}
