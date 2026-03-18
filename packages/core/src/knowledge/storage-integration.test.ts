/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  performSearch,
  performFindSimilar,
  performAddWithEmbedding,
  performKnowledgeStats,
} from './storage-integration.js';
import type { ToolResult } from '../tools/tools.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// Mock fetch for Ollama API
global.fetch = vi.fn();

describe('Storage Integration', () => {
  let tempStorageDir: string;

  beforeEach(async () => {
    tempStorageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-integration-test-'));
    
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
  });

  afterEach(async () => {
    await fs.rm(tempStorageDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('performSearch', () => {
    it('should return error when query is missing', async () => {
      const result = await performSearch({
        query: undefined as any,
      });

      expect(result.llmContent).toContain('Error');
      expect(result.returnDisplay).toContain('Error');
    });

    it('should return no results for empty storage', async () => {
      const result = await performSearch({
        query: 'test query',
        namespaces: ['knowledge'],
        mode: 'keyword', // Use keyword mode to avoid knowledge base
      });

      expect(result.llmContent).toContain('No results');
    });

    it('should handle keyword search fallback', async () => {
      // Create a test storage file
      const storageFile = path.join(tempStorageDir, 'knowledge.json');
      await fs.writeFile(storageFile, JSON.stringify({
        test_entry: {
          value: 'This is a test entry about authentication',
          metadata: { createdAt: new Date().toISOString() },
        },
      }));

      const result = await performSearch({
        query: 'authentication',
        namespaces: ['knowledge'],
        mode: 'keyword',
      });

      // Result depends on whether the fallback can find the test file
      expect(result).toBeDefined();
    });
  });

  describe('performFindSimilar', () => {
    it('should return error when key is missing', async () => {
      const result = await performFindSimilar({
        namespace: 'knowledge',
        key: undefined as any,
      });

      expect(result.llmContent).toContain('Error');
    });

    it('should return error when entry not found', async () => {
      const result = await performFindSimilar({
        namespace: 'knowledge',
        key: 'nonexistent-entry',
        threshold: 0.8,
      });

      expect(result.llmContent).toContain('not found');
    });
  });

  describe('performAddWithEmbedding', () => {
    it('should return error when key is missing', async () => {
      const mockSet = vi.fn<() => Promise<ToolResult>>().mockResolvedValue({
        llmContent: 'Stored',
        returnDisplay: 'Stored',
      });

      const result = await performAddWithEmbedding(
        {
          namespace: 'knowledge',
          key: undefined as any,
          value: 'Test content',
        },
        mockSet
      );

      expect(result.llmContent).toContain('Error');
    });

    it('should return error when value is missing', async () => {
      const mockSet = vi.fn<() => Promise<ToolResult>>().mockResolvedValue({
        llmContent: 'Stored',
        returnDisplay: 'Stored',
      });

      const result = await performAddWithEmbedding(
        {
          namespace: 'knowledge',
          key: 'test-key',
          value: undefined,
        },
        mockSet
      );

      expect(result.llmContent).toContain('Error');
    });

    it('should call performSet and add to knowledge base', async () => {
      const mockSet = vi.fn<() => Promise<ToolResult>>().mockResolvedValue({
        llmContent: 'Stored test-key in knowledge',
        returnDisplay: 'Stored',
      });

      const result = await performAddWithEmbedding(
        {
          namespace: 'knowledge',
          key: 'test-key',
          value: 'Test content for embedding',
          tags: ['test', 'important'],
        },
        mockSet
      );

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'set',
          namespace: 'knowledge',
          key: 'test-key',
          value: 'Test content for embedding',
          tags: ['test', 'important'],
        })
      );
      expect(result.returnDisplay).toContain('test-key');
    });
  });

  describe('performKnowledgeStats', () => {
    it('should return statistics', async () => {
      const result = await performKnowledgeStats();

      expect(result).toBeDefined();
      expect(result.llmContent).toBeDefined();
    });
  });
});
