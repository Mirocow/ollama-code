/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ExtensionAliasRegistry,
  getExtensionAliasRegistry,
  resetExtensionAliasRegistry,
} from './extensionAliasRegistry.js';
import type {
  ExtensionV2,
  ExtensionAliasDefinition,
} from './extension-types.js';

// Mock extension for testing
const mockExtension: ExtensionV2 = {
  id: 'test-extension-id',
  name: 'test-extension',
  version: '1.0.0',
  isActive: true,
  path: '/test/path',
  type: 'user',
  config: {
    name: 'test-extension',
    version: '1.0.0',
  },
  contextFiles: [],
};

const mockAlias: ExtensionAliasDefinition = {
  name: 'tt',
  target: 'test_tool',
  description: 'Test tool shortcut',
  type: 'tool',
};

describe('ExtensionAliasRegistry', () => {
  let registry: ExtensionAliasRegistry;

  beforeEach(() => {
    registry = new ExtensionAliasRegistry();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('registerAliasesFromExtension', () => {
    it('should register aliases from an extension', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [mockAlias],
      };

      const registered = registry.registerAliasesFromExtension(extension);

      expect(registered).toHaveLength(1);
      expect(registered[0]).toBe('tt');
    });

    it('should return empty array if extension has no aliases', () => {
      const registered = registry.registerAliasesFromExtension(mockExtension);
      expect(registered).toHaveLength(0);
    });

    it('should skip invalid alias definitions', () => {
      const invalidAlias: ExtensionAliasDefinition = {
        name: '',
        target: '',
      };

      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [invalidAlias, mockAlias],
      };

      const registered = registry.registerAliasesFromExtension(extension);

      expect(registered).toHaveLength(1);
    });

    it('should warn when overriding existing alias', () => {
      const extension1: ExtensionV2 = {
        ...mockExtension,
        id: 'ext1',
        name: 'ext1',
        aliases: [mockAlias],
      };

      const extension2: ExtensionV2 = {
        ...mockExtension,
        id: 'ext2',
        name: 'ext2',
        aliases: [mockAlias],
      };

      registry.registerAliasesFromExtension(extension1);
      registry.registerAliasesFromExtension(extension2);

      expect(registry.has('tt')).toBe(true);
    });
  });

  describe('unregisterAliasesFromExtension', () => {
    it('should unregister aliases from an extension', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [mockAlias],
      };

      registry.registerAliasesFromExtension(extension);
      registry.unregisterAliasesFromExtension(extension.id);

      expect(registry.has('tt')).toBe(false);
    });
  });

  describe('resolve', () => {
    it('should resolve an alias to its target', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [mockAlias],
      };

      registry.registerAliasesFromExtension(extension);

      const alias = registry.resolve('tt');

      expect(alias).toBeDefined();
      expect(alias?.target).toBe('test_tool');
    });

    it('should return null for non-existent alias', () => {
      const alias = registry.resolve('nonexistent');
      expect(alias).toBeNull();
    });

    it('should resolve case-insensitively', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [mockAlias],
      };

      registry.registerAliasesFromExtension(extension);

      const alias = registry.resolve('TT');

      expect(alias).toBeDefined();
    });
  });

  describe('resolveWithMetadata', () => {
    it('should resolve an alias with full metadata', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [mockAlias],
      };

      registry.registerAliasesFromExtension(extension);

      const result = registry.resolveWithMetadata('tt');

      expect(result.found).toBe(true);
      expect(result.alias?.target).toBe('test_tool');
      expect(result.extensionId).toBe(extension.id);
      expect(result.extensionName).toBe(extension.name);
    });

    it('should return not found for non-existent alias', () => {
      const result = registry.resolveWithMetadata('nonexistent');

      expect(result.found).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all aliases', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [
          mockAlias,
          { ...mockAlias, name: 'tt2', target: 'test_tool2' },
        ],
      };

      registry.registerAliasesFromExtension(extension);

      const aliases = registry.list();

      expect(aliases).toHaveLength(2);
    });
  });

  describe('listByExtension', () => {
    it('should list aliases for a specific extension', () => {
      const extension1: ExtensionV2 = {
        ...mockExtension,
        id: 'ext1',
        name: 'ext1',
        aliases: [mockAlias],
      };

      const extension2: ExtensionV2 = {
        ...mockExtension,
        id: 'ext2',
        name: 'ext2',
        aliases: [{ ...mockAlias, name: 'tt2' }],
      };

      registry.registerAliasesFromExtension(extension1);
      registry.registerAliasesFromExtension(extension2);

      const aliases = registry.listByExtension('ext1');

      expect(aliases).toHaveLength(1);
      expect(aliases[0].name).toBe('tt');
    });
  });

  describe('listByType', () => {
    it('should list aliases by target type', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [
          { ...mockAlias, type: 'tool' },
          { ...mockAlias, name: 'tc', type: 'command' },
          { ...mockAlias, name: 'ta', type: 'agent' },
        ],
      };

      registry.registerAliasesFromExtension(extension);

      const toolAliases = registry.listByType('tool');
      const commandAliases = registry.listByType('command');

      expect(toolAliases).toHaveLength(1);
      expect(commandAliases).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should remove an alias', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [mockAlias],
      };

      registry.registerAliasesFromExtension(extension);
      registry.remove('tt');

      expect(registry.has('tt')).toBe(false);
    });

    it('should do nothing for non-existent alias', () => {
      registry.remove('nonexistent');
      // Should not throw
    });
  });

  describe('clearForExtension', () => {
    it('should clear all aliases for an extension', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [mockAlias],
      };

      registry.registerAliasesFromExtension(extension);
      registry.clearForExtension(extension.id);

      expect(registry.has('tt')).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing alias', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [mockAlias],
      };

      registry.registerAliasesFromExtension(extension);

      expect(registry.has('tt')).toBe(true);
    });

    it('should return false for non-existent alias', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [
          { ...mockAlias, type: 'tool' },
          { ...mockAlias, name: 'tc', type: 'command' },
        ],
      };

      registry.registerAliasesFromExtension(extension);

      const stats = registry.getStats();

      expect(stats.totalAliases).toBe(2);
      expect(stats.byType.tool).toBe(1);
      expect(stats.byType.command).toBe(1);
      expect(stats.extensionsWithAliases.size).toBe(1);
    });
  });

  describe('validation', () => {
    it('should reject alias names starting with numbers', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [{ name: '1alias', target: 'tool' }],
      };

      const registered = registry.registerAliasesFromExtension(extension);

      expect(registered).toHaveLength(0);
    });

    it('should reject reserved alias names', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [{ name: 'help', target: 'tool' }],
      };

      const registered = registry.registerAliasesFromExtension(extension);

      expect(registered).toHaveLength(0);
    });

    it('should reject too long alias names', () => {
      const longName = 'a'.repeat(50);
      const extension: ExtensionV2 = {
        ...mockExtension,
        aliases: [{ name: longName, target: 'tool' }],
      };

      const registered = registry.registerAliasesFromExtension(extension);

      expect(registered).toHaveLength(0);
    });
  });
});

describe('Singleton functions', () => {
  beforeEach(() => {
    resetExtensionAliasRegistry();
  });

  afterEach(() => {
    resetExtensionAliasRegistry();
  });

  it('should return the same registry instance', () => {
    const registry1 = getExtensionAliasRegistry();
    const registry2 = getExtensionAliasRegistry();

    expect(registry1).toBe(registry2);
  });

  it('should reset the registry', () => {
    const registry1 = getExtensionAliasRegistry();
    resetExtensionAliasRegistry();
    const registry2 = getExtensionAliasRegistry();

    expect(registry1).not.toBe(registry2);
  });
});
