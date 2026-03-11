/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ExtensionToolRegistry,
  ExtensionToolWrapper,
  getExtensionToolRegistry,
  resetExtensionToolRegistry,
} from './extensionToolRegistry.js';
import type {
  ExtensionV2,
  ExtensionToolDefinition,
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

const mockToolDefinition: ExtensionToolDefinition = {
  name: 'test_tool',
  displayName: 'Test Tool',
  description: 'A test tool',
  kind: 'other',
  parameterSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' },
    },
    required: ['message'],
  },
  handler: './tools/test.js',
};

describe('ExtensionToolRegistry', () => {
  let registry: ExtensionToolRegistry;

  beforeEach(() => {
    registry = new ExtensionToolRegistry();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('registerToolsFromExtension', () => {
    it('should register tools from an extension', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [mockToolDefinition],
      };

      const registered = registry.registerToolsFromExtension(extension);

      expect(registered).toHaveLength(1);
      expect(registered[0]).toBe('test-extension_test_tool');
    });

    it('should return empty array if extension has no tools', () => {
      const registered = registry.registerToolsFromExtension(mockExtension);
      expect(registered).toHaveLength(0);
    });

    it('should skip invalid tool definitions', () => {
      const invalidTool: ExtensionToolDefinition = {
        name: '',
        displayName: '',
        description: '',
        kind: 'other',
        parameterSchema: { type: 'object' },
        handler: '',
      };

      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [invalidTool, mockToolDefinition],
      };

      const registered = registry.registerToolsFromExtension(extension);

      expect(registered).toHaveLength(1);
    });
  });

  describe('unregisterToolsFromExtension', () => {
    it('should unregister tools from an extension', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [mockToolDefinition],
      };

      registry.registerToolsFromExtension(extension);
      registry.unregisterToolsFromExtension(extension.id);

      const tools = registry.getAllTools();
      expect(tools).toHaveLength(0);
    });
  });

  describe('getTool', () => {
    it('should return a registered tool by full name', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [mockToolDefinition],
      };

      registry.registerToolsFromExtension(extension);

      const tool = registry.getTool('test-extension_test_tool');
      expect(tool).toBeDefined();
      expect(tool?.definition.name).toBe('test_tool');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = registry.getTool('non_existent_tool');
      expect(tool).toBeUndefined();
    });

    it('should find tool by short name', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [mockToolDefinition],
      };

      registry.registerToolsFromExtension(extension);

      const tool = registry.getTool('test_tool');
      expect(tool).toBeDefined();
    });

    it('should find tool with extension name disambiguation', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [mockToolDefinition],
      };

      registry.registerToolsFromExtension(extension);

      const tool = registry.getTool('test_tool', 'test-extension');
      expect(tool).toBeDefined();
    });
  });

  describe('getAllTools', () => {
    it('should return all registered tools', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [
          mockToolDefinition,
          { ...mockToolDefinition, name: 'another_tool' },
        ],
      };

      registry.registerToolsFromExtension(extension);

      const tools = registry.getAllTools();
      expect(tools).toHaveLength(2);
    });
  });

  describe('getToolsByExtension', () => {
    it('should return tools for a specific extension', () => {
      const extension1: ExtensionV2 = {
        ...mockExtension,
        id: 'ext1',
        name: 'ext1',
        tools: [mockToolDefinition],
      };

      const extension2: ExtensionV2 = {
        ...mockExtension,
        id: 'ext2',
        name: 'ext2',
        tools: [{ ...mockToolDefinition, name: 'tool2' }],
      };

      registry.registerToolsFromExtension(extension1);
      registry.registerToolsFromExtension(extension2);

      const tools = registry.getToolsByExtension('ext1');
      expect(tools).toHaveLength(1);
      expect(tools[0].definition.name).toBe('test_tool');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [mockToolDefinition],
      };

      registry.registerToolsFromExtension(extension);

      const stats = registry.getStats();
      expect(stats.totalTools).toBe(1);
      expect(stats.loadedTools).toBe(0);
      expect(stats.extensionsWithTools.size).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all registered tools', () => {
      const extension: ExtensionV2 = {
        ...mockExtension,
        tools: [mockToolDefinition],
      };

      registry.registerToolsFromExtension(extension);
      registry.clear();

      const tools = registry.getAllTools();
      expect(tools).toHaveLength(0);
    });
  });
});

describe('ExtensionToolWrapper', () => {
  it('should create a wrapper for a registered tool', () => {
    const registry = new ExtensionToolRegistry();

    const extension: ExtensionV2 = {
      ...mockExtension,
      tools: [mockToolDefinition],
    };

    registry.registerToolsFromExtension(extension);

    const wrapper = registry.createToolWrapper(
      'test-extension_test_tool',
      () => ({
        extensionId: extension.id,
        extensionName: extension.name,
        extensionVersion: extension.version,
        extensionPath: extension.path,
        workingDirectory: '/test',
        abortSignal: new AbortController().signal,
        logger: {
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          getLogs: () => [],
          clearLogs: () => {},
        },
        config: {},
      }),
    );

    expect(wrapper).toBeInstanceOf(ExtensionToolWrapper);
    expect(wrapper?.name).toBe('test-extension_test_tool');
    expect(wrapper?.displayName).toBe('Test Tool');
  });
});

describe('Singleton functions', () => {
  beforeEach(() => {
    resetExtensionToolRegistry();
  });

  afterEach(() => {
    resetExtensionToolRegistry();
  });

  it('should return the same registry instance', () => {
    const registry1 = getExtensionToolRegistry();
    const registry2 = getExtensionToolRegistry();

    expect(registry1).toBe(registry2);
  });

  it('should reset the registry', () => {
    const registry1 = getExtensionToolRegistry();
    resetExtensionToolRegistry();
    const registry2 = getExtensionToolRegistry();

    expect(registry1).not.toBe(registry2);
  });
});
