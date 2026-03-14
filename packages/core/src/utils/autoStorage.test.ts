/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  initializeAutoStorage,
  autoSaveGeneratedText,
  autoSaveWebContent,
  autoSaveUserClarification,
  autoSaveConversationContext,
  getAutoSavedEntries,
  clearAutoSavedEntries,
  setAutoStorageService,
  getAutoStorageService,
  AutoStorageKeys,
  StorageAdapter,
  type StorageService,
  type AutoSavedEntry,
} from './autoStorage.js';
import type { Storage } from '../config/storage.js';

describe('AutoStorage', () => {
  let tempDir: string;
  let storage: Storage;

  beforeEach(async () => {
    // Create temp directory for testing
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'auto-storage-test-'),
    );

    // Create a minimal Storage-like object for testing
    const storageDir = path.join(tempDir, 'storage');
    await fs.promises.mkdir(storageDir, { recursive: true });

    storage = {
      getProjectStorageDir: () => storageDir,
    } as Storage;

    // Initialize auto storage
    initializeAutoStorage(storage);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });

    // Reset global storage service
    setAutoStorageService(null as unknown as StorageService);
  });

  describe('initializeAutoStorage', () => {
    it('should initialize the global storage service', () => {
      const service = getAutoStorageService();
      expect(service).not.toBeNull();
    });

    it('should create storage directory if it does not exist', () => {
      const service = getAutoStorageService();
      expect(service).toBeDefined();
    });
  });

  describe('autoSaveGeneratedText', () => {
    it('should save generated text with metadata', async () => {
      const id = await autoSaveGeneratedText('Test generated content', {
        prompt: 'Write a hello world program',
        tags: ['test', 'generated'],
      });

      expect(id).not.toBeNull();
      expect(id).toMatch(/^\d+_[a-z0-9]+$/);
    });

    it('should append to existing entries', async () => {
      await autoSaveGeneratedText('First text');
      await autoSaveGeneratedText('Second text');

      const entries = await getAutoSavedEntries(AutoStorageKeys.GENERATED_TEXT);
      expect(entries).toHaveLength(2);
      expect(entries[0].content).toBe('First text');
      expect(entries[1].content).toBe('Second text');
    });

    it('should return null if storage service not initialized', async () => {
      setAutoStorageService(null as unknown as StorageService);
      const id = await autoSaveGeneratedText('Test');
      expect(id).toBeNull();
    });
  });

  describe('autoSaveWebContent', () => {
    it('should save web content with URL source', async () => {
      const id = await autoSaveWebContent(
        'Fetched article content here...',
        'https://example.com/article',
        {
          title: 'Example Article',
          tags: ['web-fetch', 'auto-saved'],
        },
      );

      expect(id).not.toBeNull();

      const entries = await getAutoSavedEntries(AutoStorageKeys.WEB_CONTENT);
      expect(entries).toHaveLength(1);
      expect(entries[0].metadata?.source).toBe('https://example.com/article');
      expect(entries[0].metadata?.tags).toContain('web-fetch');
    });

    it('should support TTL parameter', async () => {
      const id = await autoSaveWebContent('Content', 'https://example.com', {
        ttl: 3600, // 1 hour
      });

      const entries = await getAutoSavedEntries(AutoStorageKeys.WEB_CONTENT);
      expect(entries[0].metadata?.ttl).toBe(3600);
    });
  });

  describe('autoSaveUserClarification', () => {
    it('should save question and answer pair', async () => {
      const id = await autoSaveUserClarification(
        'What language should I use?',
        'Python please',
        { tags: ['user-preference'] },
      );

      expect(id).not.toBeNull();

      const entries = await getAutoSavedEntries(
        AutoStorageKeys.USER_CLARIFICATIONS,
      );
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toContain('Q: What language should I use?');
      expect(entries[0].content).toContain('A: Python please');
    });
  });

  describe('autoSaveConversationContext', () => {
    it('should save conversation context with importance', async () => {
      const id = await autoSaveConversationContext(
        'User prefers dark theme and TypeScript',
        {
          topic: 'user-preferences',
          importance: 'high',
          tags: ['preferences', 'ui'],
        },
      );

      expect(id).not.toBeNull();

      const entries = await getAutoSavedEntries(
        AutoStorageKeys.CONVERSATION_CONTEXT,
      );
      expect(entries).toHaveLength(1);
      // importance is added to tags array
      expect(entries[0].metadata?.tags).toContain('high');
      expect(entries[0].metadata?.tags).toContain('preferences');
    });
  });

  describe('getAutoSavedEntries', () => {
    it('should return empty array for non-existent type', async () => {
      const entries = await getAutoSavedEntries(
        AutoStorageKeys.GENERATED_TEXT,
      );
      expect(entries).toEqual([]);
    });

    it('should return all entries of specified type', async () => {
      await autoSaveGeneratedText('Text 1');
      await autoSaveWebContent('Web content', 'https://example.com');
      await autoSaveGeneratedText('Text 2');

      const genEntries = await getAutoSavedEntries(
        AutoStorageKeys.GENERATED_TEXT,
      );
      const webEntries = await getAutoSavedEntries(AutoStorageKeys.WEB_CONTENT);

      expect(genEntries).toHaveLength(2);
      expect(webEntries).toHaveLength(1);
    });
  });

  describe('clearAutoSavedEntries', () => {
    it('should clear all entries of specified type', async () => {
      await autoSaveGeneratedText('Text 1');
      await autoSaveGeneratedText('Text 2');

      const result = await clearAutoSavedEntries(AutoStorageKeys.GENERATED_TEXT);
      expect(result).toBe(true);

      const entries = await getAutoSavedEntries(AutoStorageKeys.GENERATED_TEXT);
      expect(entries).toEqual([]);
    });
  });

  describe('StorageAdapter', () => {
    it('should create namespace directories on demand', async () => {
      const adapter = new StorageAdapter(storage);

      await adapter.setItem('test-namespace', 'test-key', { data: 'test' });

      const nsDir = path.join(
        storage.getProjectStorageDir(),
        'test-namespace',
      );
      expect(fs.existsSync(nsDir)).toBe(true);
    });

    it('should append items to existing array', async () => {
      const adapter = new StorageAdapter(storage);

      await adapter.appendItem('ns', 'key', { id: 1 });
      await adapter.appendItem('ns', 'key', { id: 2 });
      await adapter.appendItem('ns', 'key', { id: 3 });

      const result = await adapter.getItem('ns', 'key');
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should return null for non-existent items', async () => {
      const adapter = new StorageAdapter(storage);
      const result = await adapter.getItem('non-existent', 'key');
      expect(result).toBeNull();
    });
  });

  describe('AutoSavedEntry structure', () => {
    it('should create entries with correct structure', async () => {
      await autoSaveGeneratedText('Test content', {
        prompt: 'Test prompt',
        tags: ['test'],
      });

      const entries = await getAutoSavedEntries(AutoStorageKeys.GENERATED_TEXT);
      const entry = entries[0] as AutoSavedEntry;

      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('type');
      expect(entry).toHaveProperty('content');
      expect(entry).toHaveProperty('metadata');

      expect(entry.type).toBe(AutoStorageKeys.GENERATED_TEXT);
      expect(entry.content).toBe('Test content');
      expect(entry.metadata?.source).toBe('Test prompt');
      expect(entry.metadata?.tags).toContain('test');
    });
  });
});
