/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerPluginAliases,
  unregisterPluginAliases,
  resolveToolAlias,
  getDynamicAliasCount,
  DynamicAliases,
} from '../tools/tool-names.js';

describe('Tool Alias System', () => {
  beforeEach(() => {
    // Clear dynamic aliases before each test
    for (const key of Object.keys(DynamicAliases)) {
      delete DynamicAliases[key];
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('registerPluginAliases', () => {
    it('should register aliases from a plugin', () => {
      const aliases = [
        { alias: 'edit', canonicalName: 'edit_file', description: 'Edit a file' },
        { alias: 'write', canonicalName: 'write_file', description: 'Write a file' },
      ];

      const count = registerPluginAliases('test-plugin', aliases);

      expect(count).toBe(2);
      expect(DynamicAliases['edit']).toBe('edit_file');
      expect(DynamicAliases['write']).toBe('write_file');
    });

    it('should normalize alias names to lowercase', () => {
      const aliases = [
        { alias: 'EDIT', canonicalName: 'edit_file' },
        { alias: 'WriteFile', canonicalName: 'write_file' },
      ];

      registerPluginAliases('case-test', aliases);

      expect(DynamicAliases['edit']).toBe('edit_file');
      expect(DynamicAliases['writefile']).toBe('edit_file'); // Note: normalized to lowercase
    });

    it('should overwrite existing aliases', () => {
      registerPluginAliases('plugin-a', [
        { alias: 'edit', canonicalName: 'edit_file_v1' },
      ]);

      registerPluginAliases('plugin-b', [
        { alias: 'edit', canonicalName: 'edit_file_v2' },
      ]);

      expect(DynamicAliases['edit']).toBe('edit_file_v2');
    });

    it('should return correct count of registered aliases', () => {
      const aliases = [
        { alias: 'a', canonicalName: 'tool_a' },
        { alias: 'b', canonicalName: 'tool_b' },
        { alias: 'c', canonicalName: 'tool_c' },
      ];

      const count = registerPluginAliases('count-test', aliases);
      expect(count).toBe(3);
    });
  });

  describe('unregisterPluginAliases', () => {
    it('should unregister aliases by canonical name', () => {
      registerPluginAliases('unreg-test', [
        { alias: 'edit', canonicalName: 'edit_file' },
        { alias: 'write', canonicalName: 'write_file' },
        { alias: 'modify', canonicalName: 'edit_file' },
      ]);

      const count = unregisterPluginAliases(new Set(['edit_file']));

      expect(count).toBe(2); // 'edit' and 'modify' both resolve to 'edit_file'
      expect(DynamicAliases['edit']).toBeUndefined();
      expect(DynamicAliases['modify']).toBeUndefined();
      expect(DynamicAliases['write']).toBe('write_file');
    });

    it('should return 0 if no aliases match', () => {
      registerPluginAliases('no-match', [
        { alias: 'test', canonicalName: 'test_tool' },
      ]);

      const count = unregisterPluginAliases(new Set(['non_existent_tool']));
      expect(count).toBe(0);
    });

    it('should handle empty set', () => {
      registerPluginAliases('empty-set', [
        { alias: 'test', canonicalName: 'test_tool' },
      ]);

      const count = unregisterPluginAliases(new Set());
      expect(count).toBe(0);
    });
  });

  describe('resolveToolAlias', () => {
    beforeEach(() => {
      // Register some test aliases
      registerPluginAliases('resolve-test', [
        { alias: 'e', canonicalName: 'edit_file' },
        { alias: 'w', canonicalName: 'write_file' },
        { alias: 'EDIT', canonicalName: 'edit_file' },
      ]);
    });

    it('should resolve registered aliases', () => {
      expect(resolveToolAlias('e')).toBe('edit_file');
      expect(resolveToolAlias('w')).toBe('write_file');
    });

    it('should be case-insensitive', () => {
      expect(resolveToolAlias('E')).toBe('edit_file');
      expect(resolveToolAlias('Edit')).toBe('edit_file');
    });

    it('should return original name if no alias found', () => {
      expect(resolveToolAlias('non_existent_tool')).toBe('non_existent_tool');
    });

    it('should trim whitespace', () => {
      expect(resolveToolAlias('  edit  ')).toBe('edit_file');
    });
  });

  describe('getDynamicAliasCount', () => {
    it('should return 0 when no aliases registered', () => {
      expect(getDynamicAliasCount()).toBe(0);
    });

    it('should return correct count', () => {
      registerPluginAliases('count-test-1', [
        { alias: 'a', canonicalName: 'tool_a' },
      ]);
      expect(getDynamicAliasCount()).toBe(1);

      registerPluginAliases('count-test-2', [
        { alias: 'b', canonicalName: 'tool_b' },
        { alias: 'c', canonicalName: 'tool_c' },
      ]);
      expect(getDynamicAliasCount()).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty aliases array', () => {
      const count = registerPluginAliases('empty-aliases', []);
      expect(count).toBe(0);
    });

    it('should handle aliases with special characters', () => {
      registerPluginAliases('special-chars', [
        { alias: 'tool-name', canonicalName: 'tool_name' },
        { alias: 'tool.name', canonicalName: 'tool_name' },
      ]);

      expect(resolveToolAlias('tool-name')).toBe('tool_name');
      expect(resolveToolAlias('tool.name')).toBe('tool_name');
    });

    it('should handle very long alias names', () => {
      const longAlias = 'a'.repeat(100);
      registerPluginAliases('long-alias', [
        { alias: longAlias, canonicalName: 'tool' },
      ]);

      expect(resolveToolAlias(longAlias)).toBe('tool');
    });
  });
});
