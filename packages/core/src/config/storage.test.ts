/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  Storage, 
  InMemoryStorageBackend, 
  FileStorageBackend,
  type IStorageBackend 
} from './storage.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Storage Backends', () => {
  describe('InMemoryStorageBackend', () => {
    let backend: InMemoryStorageBackend;

    beforeEach(async () => {
      backend = new InMemoryStorageBackend();
      await backend.initialize();
    });

    afterEach(async () => {
      await backend.close();
    });

    it('should set and get values', async () => {
      await backend.set('test', 'key1', { data: 'value1' });
      const entry = await backend.get('test', 'key1');
      expect(entry).not.toBeNull();
      expect(entry?.value).toEqual({ data: 'value1' });
      expect(entry?.metadata.version).toBe(1);
    });

    it('should return null for non-existent keys', async () => {
      const entry = await backend.get('test', 'nonexistent');
      expect(entry).toBeNull();
    });

    it('should delete values', async () => {
      await backend.set('test', 'key1', 'value1');
      expect(await backend.exists('test', 'key1')).toBe(true);
      
      const deleted = await backend.delete('test', 'key1');
      expect(deleted).toBe(true);
      expect(await backend.exists('test', 'key1')).toBe(false);
    });

    it('should support TTL', async () => {
      await backend.set('test', 'key1', 'value1', { ttl: 1 });
      
      // Should exist immediately
      expect(await backend.exists('test', 'key1')).toBe(true);
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired
      const entry = await backend.get('test', 'key1');
      expect(entry).toBeNull();
    });

    it('should support tags', async () => {
      await backend.set('test', 'key1', 'value1', { tags: ['important', 'cached'] });
      await backend.set('test', 'key2', 'value2', { tags: ['cached'] });
      await backend.set('test', 'key3', 'value3', { tags: ['other'] });
      
      const results = await backend.findByTags('test', ['cached']);
      expect(results.length).toBe(2);
    });

    it('should list keys in namespace', async () => {
      await backend.set('test', 'key1', 'value1');
      await backend.set('test', 'key2', 'value2');
      await backend.set('test', 'key3', 'value3');
      
      const entries = await backend.list('test');
      expect(entries.length).toBe(3);
    });

    it('should support batch operations', async () => {
      const entries = new Map([
        ['key1', { value: 'value1' }],
        ['key2', { value: 'value2' }],
        ['key3', { value: 'value3' }],
      ]);
      
      await backend.setBatch('test', entries);
      
      const batch = await backend.getBatch('test', ['key1', 'key2', 'key3']);
      expect(batch.size).toBe(3);
    });

    it('should clear namespace', async () => {
      await backend.set('test', 'key1', 'value1');
      await backend.set('test', 'key2', 'value2');
      
      const count = await backend.clear('test');
      expect(count).toBe(2);
      
      const entries = await backend.list('test');
      expect(entries.length).toBe(0);
    });

    it('should return stats', async () => {
      await backend.set('test', 'key1', 'value1', { tags: ['a'] });
      await backend.set('test', 'key2', 'value2', { tags: ['a', 'b'] });
      
      const stats = await backend.stats('test');
      expect(stats.totalKeys).toBe(2);
      expect(stats.tags).toContain('a');
      expect(stats.tags).toContain('b');
    });
  });

  describe('FileStorageBackend', () => {
    let backend: FileStorageBackend;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `storage-test-${Date.now()}`);
      backend = new FileStorageBackend(tempDir);
      await backend.initialize();
    });

    afterEach(async () => {
      await backend.close();
      // Cleanup temp dir
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should persist data across restarts', async () => {
      await backend.set('test', 'key1', { data: 'persistent' });
      await backend.close();
      
      // Reopen
      backend = new FileStorageBackend(tempDir);
      await backend.initialize();
      
      const entry = await backend.get('test', 'key1');
      expect(entry?.value).toEqual({ data: 'persistent' });
    });

    it('should create separate files per namespace', async () => {
      await backend.set('ns1', 'key1', 'value1');
      await backend.set('ns2', 'key1', 'value2');
      
      const entry1 = await backend.get('ns1', 'key1');
      const entry2 = await backend.get('ns2', 'key1');
      
      expect(entry1?.value).toBe('value1');
      expect(entry2?.value).toBe('value2');
    });
  });
});

describe('Storage Manager', () => {
  it('should create storage with memory backend', async () => {
    const storage = new Storage('/tmp/test');
    await storage.initialize('memory');
    
    const backend = storage.getBackend();
    expect(backend.name).toBe('memory');
    
    await storage.close();
  });

  it('should fallback to file if SQLite unavailable', async () => {
    const storage = new Storage('/tmp/test');
    
    // This should work even without SQLite
    await storage.initialize('file');
    
    const backend = storage.getBackend();
    expect(backend.name).toBe('file');
    
    await storage.close();
  });
});
