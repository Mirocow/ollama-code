/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageTool, StorageNamespaces, getProjectInfo, clearProjectRootCache } from './index.js';
import type { ToolResult } from '../../../tools/tools.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('StorageTool', () => {
  let storageTool: StorageTool;
  let testStorageDir: string;

  beforeEach(async () => {
    storageTool = new StorageTool();
    // Create a temporary test directory
    testStorageDir = path.join(os.tmpdir(), `storage-test-${Date.now()}`);
    await fs.mkdir(testStorageDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Tool Configuration', () => {
    it('should have correct tool name', () => {
      expect(StorageTool.Name).toBe('model_storage');
    });

    it('should have valid JSON schema', () => {
      const schema = storageTool['schema'];
      expect(schema).toBeDefined();
      expect(schema.name).toBe('model_storage');
      expect(schema.parametersJsonSchema).toBeDefined();
      const paramsSchema = schema.parametersJsonSchema as Record<string, unknown>;
      expect(paramsSchema.type).toBe('object');
      expect(paramsSchema.properties?.operation).toBeDefined();
      expect(paramsSchema.properties?.namespace).toBeDefined();
    });

    it('should validate required parameters', () => {
      const result = storageTool.validateToolParamValues({
        operation: 'set',
        namespace: 'test',
        key: 'mykey',
        value: 'myvalue',
      });
      expect(result).toBeNull();
    });

    it('should reject missing key for set operation', () => {
      const result = storageTool.validateToolParamValues({
        operation: 'set',
        namespace: 'test',
        value: 'myvalue',
      });
      expect(result).toContain('key');
    });

    it('should reject missing value for set operation', () => {
      const result = storageTool.validateToolParamValues({
        operation: 'set',
        namespace: 'test',
        key: 'mykey',
      });
      expect(result).toContain('value');
    });

    it('should reject invalid operation', () => {
      const result = storageTool.validateToolParamValues({
        operation: 'invalid' as 'set',
        namespace: 'test',
      });
      expect(result).toContain('Invalid operation');
    });

    it('should accept valid operations', () => {
      const operations = ['set', 'get', 'delete', 'list', 'append', 'merge', 'clear', 'exists', 'stats'];
      for (const op of operations) {
        const params: { operation: string; namespace: string; key?: string; value?: unknown } = {
          operation: op,
          namespace: 'test',
        };
        if (['set', 'get', 'delete', 'append', 'merge', 'exists'].includes(op)) {
          params.key = 'testkey';
        }
        if (['set', 'append', 'merge'].includes(op)) {
          params.value = 'testvalue';
        }
        const result = storageTool.validateToolParamValues(params as Parameters<typeof storageTool.validateToolParamValues>[0]);
        expect(result).toBeNull();
      }
    });
  });

  describe('Storage Operations', () => {
    describe('set and get', () => {
      it('should set and get a string value', async () => {
        const invocation = storageTool.build({
          operation: 'set',
          namespace: 'test',
          key: 'string_key',
          value: 'hello world',
          scope: 'global',
        });

        const setResult = await invocation.execute(new AbortController().signal);
        expect(setResult.llmContent).toContain('Stored');

        // Now get it
        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: 'string_key',
          scope: 'global',
        });

        const getResult = await getInvocation.execute(new AbortController().signal);
        expect(getResult.llmContent).toBe('"hello world"');
      });

      it('should set and get an object value', async () => {
        const testValue = { name: 'test', count: 42, nested: { a: 1 } };

        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: 'test',
          key: 'object_key',
          value: testValue,
          scope: 'global',
        });

        await setInvocation.execute(new AbortController().signal);

        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: 'object_key',
          scope: 'global',
        });

        const getResult = await getInvocation.execute(new AbortController().signal);
        const parsed = JSON.parse(getResult.llmContent);
        expect(parsed.name).toBe('test');
        expect(parsed.count).toBe(42);
      });

      it('should set and get an array value', async () => {
        const testArray = ['item1', 'item2', 'item3'];

        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: 'test',
          key: 'array_key',
          value: testArray,
          scope: 'global',
        });

        await setInvocation.execute(new AbortController().signal);

        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: 'array_key',
          scope: 'global',
        });

        const getResult = await getInvocation.execute(new AbortController().signal);
        const parsed = JSON.parse(getResult.llmContent);
        expect(parsed).toHaveLength(3);
        expect(parsed[0]).toBe('item1');
      });

      it('should return not found for missing key', async () => {
        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: 'nonexistent_key',
          scope: 'global',
        });

        const result = await getInvocation.execute(new AbortController().signal);
        expect(result.llmContent).toContain('not found');
      });
    });

    describe('delete', () => {
      it('should delete an existing key', async () => {
        // Set a value first
        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: 'test',
          key: 'to_delete',
          value: 'value',
          scope: 'global',
        });
        await setInvocation.execute(new AbortController().signal);

        // Delete it
        const deleteInvocation = storageTool.build({
          operation: 'delete',
          namespace: 'test',
          key: 'to_delete',
          scope: 'global',
        });
        const deleteResult = await deleteInvocation.execute(new AbortController().signal);
        expect(deleteResult.llmContent).toContain('Deleted');

        // Verify it's gone
        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: 'to_delete',
          scope: 'global',
        });
        const getResult = await getInvocation.execute(new AbortController().signal);
        expect(getResult.llmContent).toContain('not found');
      });

      it('should return not found for missing key on delete', async () => {
        const deleteInvocation = storageTool.build({
          operation: 'delete',
          namespace: 'test',
          key: 'nonexistent',
          scope: 'global',
        });
        const result = await deleteInvocation.execute(new AbortController().signal);
        expect(result.llmContent).toContain('not found');
      });
    });

    describe('list', () => {
      it('should list all keys in namespace', async () => {
        // Set multiple values
        for (let i = 0; i < 3; i++) {
          const setInvocation = storageTool.build({
            operation: 'set',
            namespace: 'test_list',
            key: `key_${i}`,
            value: `value_${i}`,
            scope: 'global',
          });
          await setInvocation.execute(new AbortController().signal);
        }

        const listInvocation = storageTool.build({
          operation: 'list',
          namespace: 'test_list',
          scope: 'global',
        });

        const result = await listInvocation.execute(new AbortController().signal);
        expect(result.llmContent).toContain('key_0');
        expect(result.llmContent).toContain('key_1');
        expect(result.llmContent).toContain('key_2');
      });

      it('should show empty for empty namespace', async () => {
        const listInvocation = storageTool.build({
          operation: 'list',
          namespace: 'empty_namespace_xyz',
          scope: 'global',
        });

        const result = await listInvocation.execute(new AbortController().signal);
        expect(result.llmContent).toContain('empty');
      });
    });

    describe('append', () => {
      it('should append to existing array', async () => {
        // Create initial array
        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: 'test',
          key: 'append_key',
          value: ['item1'],
          scope: 'global',
        });
        await setInvocation.execute(new AbortController().signal);

        // Append
        const appendInvocation = storageTool.build({
          operation: 'append',
          namespace: 'test',
          key: 'append_key',
          value: 'item2',
          scope: 'global',
        });
        const appendResult = await appendInvocation.execute(new AbortController().signal);
        expect(appendResult.llmContent).toContain('2 items');

        // Verify
        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: 'append_key',
          scope: 'global',
        });
        const result = await getInvocation.execute(new AbortController().signal);
        const parsed = JSON.parse(result.llmContent);
        expect(parsed).toHaveLength(2);
        expect(parsed[1]).toBe('item2');
      });

      it('should create new array if key does not exist', async () => {
        const uniqueKey = `new_array_key_${Date.now()}`;
        const appendInvocation = storageTool.build({
          operation: 'append',
          namespace: 'test',
          key: uniqueKey,
          value: 'first_item',
          scope: 'global',
        });
        await appendInvocation.execute(new AbortController().signal);

        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: uniqueKey,
          scope: 'global',
        });
        const result = await getInvocation.execute(new AbortController().signal);
        const parsed = JSON.parse(result.llmContent);
        expect(parsed).toEqual(['first_item']);
      });

      it('should error when appending to non-array', async () => {
        // Set a non-array value
        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: 'test',
          key: 'non_array',
          value: 'string value',
          scope: 'global',
        });
        await setInvocation.execute(new AbortController().signal);

        // Try to append
        const appendInvocation = storageTool.build({
          operation: 'append',
          namespace: 'test',
          key: 'non_array',
          value: 'item',
          scope: 'global',
        });
        const result = await appendInvocation.execute(new AbortController().signal);
        expect(result.llmContent).toContain('Error');
        expect(result.llmContent).toContain('non-array');
      });
    });

    describe('merge', () => {
      it('should merge objects', async () => {
        // Set initial object
        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: 'test',
          key: 'merge_key',
          value: { a: 1, b: 2 },
          scope: 'global',
        });
        await setInvocation.execute(new AbortController().signal);

        // Merge
        const mergeInvocation = storageTool.build({
          operation: 'merge',
          namespace: 'test',
          key: 'merge_key',
          value: { b: 3, c: 4 },
          scope: 'global',
        });
        const mergeResult = await mergeInvocation.execute(new AbortController().signal);
        expect(mergeResult.llmContent).toContain('Merged');

        // Verify
        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: 'merge_key',
          scope: 'global',
        });
        const result = await getInvocation.execute(new AbortController().signal);
        const parsed = JSON.parse(result.llmContent);
        expect(parsed).toEqual({ a: 1, b: 3, c: 4 });
      });

      it('should create new object if key does not exist', async () => {
        const mergeInvocation = storageTool.build({
          operation: 'merge',
          namespace: 'test',
          key: 'new_merge_key',
          value: { x: 1, y: 2 },
          scope: 'global',
        });
        await mergeInvocation.execute(new AbortController().signal);

        const getInvocation = storageTool.build({
          operation: 'get',
          namespace: 'test',
          key: 'new_merge_key',
          scope: 'global',
        });
        const result = await getInvocation.execute(new AbortController().signal);
        const parsed = JSON.parse(result.llmContent);
        expect(parsed).toEqual({ x: 1, y: 2 });
      });

      it('should error when merging into non-object', async () => {
        // Set a non-object value
        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: 'test',
          key: 'non_object',
          value: 'string value',
          scope: 'global',
        });
        await setInvocation.execute(new AbortController().signal);

        // Try to merge
        const mergeInvocation = storageTool.build({
          operation: 'merge',
          namespace: 'test',
          key: 'non_object',
          value: { a: 1 },
          scope: 'global',
        });
        const result = await mergeInvocation.execute(new AbortController().signal);
        expect(result.llmContent).toContain('Error');
        expect(result.llmContent).toContain('non-object');
      });
    });

    describe('clear', () => {
      it('should clear all keys in namespace', async () => {
        // Set multiple values
        for (let i = 0; i < 3; i++) {
          const setInvocation = storageTool.build({
            operation: 'set',
            namespace: 'test_clear',
            key: `key_${i}`,
            value: `value_${i}`,
            scope: 'global',
          });
          await setInvocation.execute(new AbortController().signal);
        }

        // Clear
        const clearInvocation = storageTool.build({
          operation: 'clear',
          namespace: 'test_clear',
          scope: 'global',
        });
        const clearResult = await clearInvocation.execute(new AbortController().signal);
        expect(clearResult.llmContent).toContain('Cleared');

        // Verify empty
        const listInvocation = storageTool.build({
          operation: 'list',
          namespace: 'test_clear',
          scope: 'global',
        });
        const listResult = await listInvocation.execute(new AbortController().signal);
        expect(listResult.llmContent).toContain('empty');
      });
    });
  });

  describe('Scopes', () => {
    it('should store in global scope by default', async () => {
      const setInvocation = storageTool.build({
        operation: 'set',
        namespace: 'scope_test',
        key: 'global_key',
        value: 'global_value',
      });

      const result = await setInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('global');
    });

    it('should store in project scope when specified', async () => {
      const setInvocation = storageTool.build({
        operation: 'set',
        namespace: 'scope_test',
        key: 'project_key',
        value: 'project_value',
        scope: 'project',
      });

      const result = await setInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('project');
    });

    it('should separate global and project scope', async () => {
      // Set in global
      const setGlobal = storageTool.build({
        operation: 'set',
        namespace: 'scope_separation',
        key: 'test_key',
        value: 'global_value',
        scope: 'global',
      });
      await setGlobal.execute(new AbortController().signal);

      // Set in project
      const setProject = storageTool.build({
        operation: 'set',
        namespace: 'scope_separation',
        key: 'test_key',
        value: 'project_value',
        scope: 'project',
      });
      await setProject.execute(new AbortController().signal);

      // Get global
      const getGlobal = storageTool.build({
        operation: 'get',
        namespace: 'scope_separation',
        key: 'test_key',
        scope: 'global',
      });
      const globalResult = await getGlobal.execute(new AbortController().signal);
      expect(globalResult.llmContent).toBe('"global_value"');

      // Get project
      const getProject = storageTool.build({
        operation: 'get',
        namespace: 'scope_separation',
        key: 'test_key',
        scope: 'project',
      });
      const projectResult = await getProject.execute(new AbortController().signal);
      expect(projectResult.llmContent).toBe('"project_value"');
    });
  });

  describe('Namespaces', () => {
    it('should support predefined namespaces', () => {
      const namespaces = Object.values(StorageNamespaces);
      expect(namespaces).toContain('roadmap');
      expect(namespaces).toContain('session');
      expect(namespaces).toContain('knowledge');
      expect(namespaces).toContain('context');
      expect(namespaces).toContain('learning');
      expect(namespaces).toContain('metrics');
    });

    it('should support custom namespace names', async () => {
      const setInvocation = storageTool.build({
        operation: 'set',
        namespace: 'custom_namespace_xyz',
        key: 'test',
        value: 'value',
        scope: 'global',
      });

      const result = await setInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('Stored');
    });
  });

  describe('Invocation Description', () => {
    it('should generate correct description for set operation', () => {
      const invocation = storageTool.build({
        operation: 'set',
        namespace: 'roadmap',
        key: 'v1.0',
        value: { features: [] },
        scope: 'global',
      });

      expect(invocation.getDescription()).toContain('set');
      expect(invocation.getDescription()).toContain('roadmap');
      expect(invocation.getDescription()).toContain('v1.0');
    });

    it('should generate correct description for list operation', () => {
      const invocation = storageTool.build({
        operation: 'list',
        namespace: 'knowledge',
        scope: 'project',
      });

      expect(invocation.getDescription()).toContain('list');
      expect(invocation.getDescription()).toContain('knowledge');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing key error gracefully', async () => {
      const getInvocation = storageTool.build({
        operation: 'get',
        namespace: 'test',
        key: 'missing_key_xyz',
        scope: 'global',
      });

      const result = await getInvocation.execute(new AbortController().signal);
      expect(result.returnDisplay).toContain('not found');
    });

    it('should not require confirmation', async () => {
      const invocation = storageTool.build({
        operation: 'set',
        namespace: 'test',
        key: 'test_key',
        value: 'test_value',
      });

      const confirmation = await invocation.shouldConfirmExecute(new AbortController().signal);
      expect(confirmation).toBe(false);
    });
  });

  // ==================== NEW TESTS FOR v0.17.3 ====================

  describe('TTL Support', () => {
    it('should set value with TTL', async () => {
      const setInvocation = storageTool.build({
        operation: 'set',
        namespace: 'test_ttl',
        key: 'ttl_key',
        value: 'expires soon',
        ttl: 3600, // 1 hour
        scope: 'global',
      });

      const result = await setInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('TTL');
      expect(result.llmContent).toContain('3600');
    });

    it('should include expiresAt in metadata', async () => {
      const setInvocation = storageTool.build({
        operation: 'set',
        namespace: 'test_ttl_meta',
        key: 'ttl_meta_key',
        value: 'data',
        ttl: 60,
        scope: 'global',
      });
      await setInvocation.execute(new AbortController().signal);

      const getInvocation = storageTool.build({
        operation: 'get',
        namespace: 'test_ttl_meta',
        key: 'ttl_meta_key',
        scope: 'global',
        includeMetadata: true,
      });

      const result = await getInvocation.execute(new AbortController().signal);
      const parsed = JSON.parse(result.llmContent);
      expect(parsed.metadata.ttl).toBe(60);
      expect(parsed.metadata.expiresAt).toBeDefined();
    });
  });

  describe('Metadata Support', () => {
    it('should include metadata when requested', async () => {
      const uniqueKey = `meta_key_${Date.now()}`;
      const uniqueNs = `test_metadata_${Date.now()}`;
      
      const setInvocation = storageTool.build({
        operation: 'set',
        namespace: uniqueNs,
        key: uniqueKey,
        value: { test: 'value' },
        scope: 'global',
      });
      await setInvocation.execute(new AbortController().signal);

      const getInvocation = storageTool.build({
        operation: 'get',
        namespace: uniqueNs,
        key: uniqueKey,
        scope: 'global',
        includeMetadata: true,
      });

      const result = await getInvocation.execute(new AbortController().signal);
      const parsed = JSON.parse(result.llmContent);
      
      expect(parsed.value).toEqual({ test: 'value' });
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.createdAt).toBeDefined();
      expect(parsed.metadata.updatedAt).toBeDefined();
      expect(parsed.metadata.version).toBe(1);
    });

    it('should increment version on update', async () => {
      const key = `version_test_${Date.now()}`;
      
      // First set
      const set1 = storageTool.build({
        operation: 'set',
        namespace: 'test_version',
        key,
        value: 'v1',
        scope: 'global',
      });
      await set1.execute(new AbortController().signal);

      // Update
      const set2 = storageTool.build({
        operation: 'set',
        namespace: 'test_version',
        key,
        value: 'v2',
        scope: 'global',
      });
      await set2.execute(new AbortController().signal);

      // Get with metadata
      const getInvocation = storageTool.build({
        operation: 'get',
        namespace: 'test_version',
        key,
        scope: 'global',
        includeMetadata: true,
      });

      const result = await getInvocation.execute(new AbortController().signal);
      const parsed = JSON.parse(result.llmContent);
      expect(parsed.metadata.version).toBe(2);
    });

    it('should support tags', async () => {
      const setInvocation = storageTool.build({
        operation: 'set',
        namespace: 'test_tags',
        key: 'tagged_key',
        value: 'data',
        tags: ['important', 'test', 'v0.17.3'],
        scope: 'global',
      });
      await setInvocation.execute(new AbortController().signal);

      const getInvocation = storageTool.build({
        operation: 'get',
        namespace: 'test_tags',
        key: 'tagged_key',
        scope: 'global',
        includeMetadata: true,
      });

      const result = await getInvocation.execute(new AbortController().signal);
      const parsed = JSON.parse(result.llmContent);
      expect(parsed.metadata.tags).toContain('important');
      expect(parsed.metadata.tags).toContain('test');
    });

    it('should list with metadata', async () => {
      const ns = `list_meta_${Date.now()}`;
      
      // Set multiple values with tags
      for (let i = 0; i < 3; i++) {
        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: ns,
          key: `key_${i}`,
          value: `value_${i}`,
          tags: [`tag_${i}`],
          scope: 'global',
        });
        await setInvocation.execute(new AbortController().signal);
      }

      const listInvocation = storageTool.build({
        operation: 'list',
        namespace: ns,
        scope: 'global',
        includeMetadata: true,
      });

      const result = await listInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('v1'); // version
    });
  });

  describe('exists operation', () => {
    it('should return true for existing key', async () => {
      const setInvocation = storageTool.build({
        operation: 'set',
        namespace: 'test_exists',
        key: 'exists_key',
        value: 'data',
        scope: 'global',
      });
      await setInvocation.execute(new AbortController().signal);

      const existsInvocation = storageTool.build({
        operation: 'exists',
        namespace: 'test_exists',
        key: 'exists_key',
        scope: 'global',
      });

      const result = await existsInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('exists');
      expect(result.returnDisplay).toContain('Exists');
    });

    it('should return false for missing key', async () => {
      const existsInvocation = storageTool.build({
        operation: 'exists',
        namespace: 'test_exists',
        key: 'nonexistent_key_xyz',
        scope: 'global',
      });

      const result = await existsInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('does not exist');
      expect(result.returnDisplay).toContain('Not found');
    });
  });

  describe('stats operation', () => {
    it('should return storage statistics', async () => {
      const ns = `stats_test_${Date.now()}`;
      
      // Set some values
      for (let i = 0; i < 5; i++) {
        const setInvocation = storageTool.build({
          operation: 'set',
          namespace: ns,
          key: `key_${i}`,
          value: { data: `value_${i}` },
          tags: ['test'],
          scope: 'global',
        });
        await setInvocation.execute(new AbortController().signal);
      }

      const statsInvocation = storageTool.build({
        operation: 'stats',
        namespace: ns,
        scope: 'global',
      });

      const result = await statsInvocation.execute(new AbortController().signal);
      const stats = JSON.parse(result.llmContent);
      
      expect(stats.keys.total).toBe(5);
      expect(stats.tags).toContain('test');
      expect(stats.oldest).toBeDefined();
      expect(stats.newest).toBeDefined();
    });
  });

  describe('batch operation', () => {
    it('should execute multiple operations', async () => {
      const ns = `batch_test_${Date.now()}`;
      
      const batchInvocation = storageTool.build({
        operation: 'batch',
        namespace: ns,
        scope: 'global',
        actions: [
          { operation: 'set', key: 'key_a', value: 1 },
          { operation: 'set', key: 'key_b', value: 2 },
          { operation: 'set', key: 'key_c', value: 3 },
        ],
      });

      const result = await batchInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('3 succeeded');
      expect(result.returnDisplay).toContain('3/3');

      // Verify all keys exist
      const listInvocation = storageTool.build({
        operation: 'list',
        namespace: ns,
        scope: 'global',
      });
      const listResult = await listInvocation.execute(new AbortController().signal);
      expect(listResult.llmContent).toContain('key_a');
      expect(listResult.llmContent).toContain('key_b');
      expect(listResult.llmContent).toContain('key_c');
    });

    it('should handle mixed success and failure', async () => {
      const ns = `batch_mixed_${Date.now()}`;
      
      const batchInvocation = storageTool.build({
        operation: 'batch',
        namespace: ns,
        scope: 'global',
        actions: [
          { operation: 'set', key: 'success', value: 'ok' },
          { operation: 'invalid' as 'set', key: 'fail', value: 'bad' },
        ],
      });

      const result = await batchInvocation.execute(new AbortController().signal);
      expect(result.llmContent).toContain('1 succeeded');
      expect(result.llmContent).toContain('1 failed');
    });
  });

  describe('Project Root Detection', () => {
    it('should cache project root', async () => {
      clearProjectRootCache();
      
      const info1 = await getProjectInfo();
      const info2 = await getProjectInfo();
      
      expect(info1.root).toBe(info2.root);
      expect(info1.id).toBeDefined();
      expect(info1.name).toBeDefined();
      expect(info1.type).toBeDefined();
    });

    it('should detect project type', async () => {
      clearProjectRootCache();
      
      const info = await getProjectInfo();
      
      // Project type should be one of the valid types
      expect(['node', 'python', 'go', 'rust', 'java', 'php', 'unknown']).toContain(info.type);
    });
  });
});
