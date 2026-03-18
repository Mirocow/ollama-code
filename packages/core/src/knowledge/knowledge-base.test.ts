/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KnowledgeBase, getKnowledgeBase } from './knowledge-base.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// Mock fetch for Ollama API
global.fetch = vi.fn();

describe('KnowledgeBase', () => {
  let tempDir: string;
  let kb: KnowledgeBase;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'knowledge-test-'));
    
    // Mock Ollama embeddings API
    (global.fetch as any).mockImplementation(async (url: string, options: any) => {
      if (url.includes('/api/embeddings')) {
        return {
          ok: true,
          json: async () => ({
            embedding: new Array(768).fill(0).map(() => Math.random()),
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    kb = new KnowledgeBase({
      vectorDbPath: tempDir,
      ollamaBaseUrl: 'http://localhost:11434',
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(kb.initialize()).resolves.not.toThrow();
    });

    it('should create vector db directory', async () => {
      await kb.initialize();
      const stats = await fs.stat(tempDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('add', () => {
    beforeEach(async () => {
      await kb.initialize();
    });

    it('should add content with embedding', async () => {
      const entry = await kb.add('Test content for knowledge base', 'knowledge', {
        key: 'test-entry',
        tags: ['test', 'important'],
      });

      expect(entry.id).toBeDefined();
      expect(entry.namespace).toBe('knowledge');
      expect(entry.key).toBe('test-entry');
      expect(entry.content).toBe('Test content for knowledge base');
      expect(entry.metadata.tags).toEqual(['test', 'important']);
    });

    it('should generate unique IDs for different entries', async () => {
      const entry1 = await kb.add('Content 1', 'knowledge');
      const entry2 = await kb.add('Content 2', 'knowledge');

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should call Ollama API for embeddings', async () => {
      await kb.add('Test content', 'knowledge');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/embeddings',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('nomic-embed-text'),
        })
      );
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await kb.initialize();
    });

    it('should retrieve entry by ID', async () => {
      const added = await kb.add('Test content', 'knowledge', { key: 'test-key' });
      const retrieved = await kb.get(added.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.content).toBe('Test content');
    });

    it('should retrieve entry by key and namespace', async () => {
      await kb.add('Test content', 'knowledge', { key: 'my-key' });
      const retrieved = await kb.get('my-key', 'knowledge');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.key).toBe('my-key');
    });

    it('should return null for non-existent entry', async () => {
      const result = await kb.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await kb.initialize();
    });

    it('should list all entries', async () => {
      await kb.add('Content 1', 'knowledge');
      await kb.add('Content 2', 'roadmap');

      const entries = await kb.list();
      expect(entries).toHaveLength(2);
    });

    it('should filter by namespace', async () => {
      await kb.add('Content 1', 'knowledge');
      await kb.add('Content 2', 'roadmap');
      await kb.add('Content 3', 'knowledge');

      const entries = await kb.list('knowledge');
      expect(entries).toHaveLength(2);
      entries.forEach(e => expect(e.namespace).toBe('knowledge'));
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await kb.initialize();
    });

    it('should delete entry', async () => {
      const added = await kb.add('Test content', 'knowledge');
      const deleted = await kb.delete(added.id);
      expect(deleted).toBe(true);

      const retrieved = await kb.get(added.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent entry', async () => {
      const result = await kb.delete('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await kb.initialize();
    });

    it('should search and return results', async () => {
      await kb.add('Authentication with JWT tokens', 'knowledge', { key: 'auth-jwt' });
      await kb.add('Database connection patterns', 'knowledge', { key: 'db-patterns' });

      const results = await kb.search({
        query: 'authentication login',
        limit: 5,
      });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by namespace', async () => {
      await kb.add('Auth pattern', 'knowledge');
      await kb.add('Auth plan', 'roadmap');

      const results = await kb.search({
        query: 'auth',
        namespaces: ['knowledge'],
      });

      results.forEach(r => expect(r.namespace).toBe('knowledge'));
    });
  });

  describe('findSimilar', () => {
    beforeEach(async () => {
      await kb.initialize();
    });

    it('should find similar entries', async () => {
      const entry1 = await kb.add('User authentication with email and password', 'knowledge');
      const entry2 = await kb.add('User login flow with credentials', 'knowledge');
      await kb.add('Database schema design', 'knowledge');

      const results = await kb.findSimilar(entry1.id, { limit: 2 });

      expect(results.length).toBeGreaterThan(0);
      // Results should not include the source entry
      results.forEach(r => expect(r.id).not.toBe(entry1.id));
    });
  });

  describe('stats', () => {
    beforeEach(async () => {
      await kb.initialize();
    });

    it('should return correct statistics', async () => {
      await kb.add('Content 1', 'knowledge');
      await kb.add('Content 2', 'knowledge');
      await kb.add('Content 3', 'roadmap');

      const stats = await kb.stats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.entriesByNamespace['knowledge']).toBe(2);
      expect(stats.entriesByNamespace['roadmap']).toBe(1);
    });
  });
});

describe('getKnowledgeBase singleton', () => {
  it('should return same instance', () => {
    const kb1 = getKnowledgeBase();
    const kb2 = getKnowledgeBase();

    expect(kb1).toBe(kb2);
  });
});
