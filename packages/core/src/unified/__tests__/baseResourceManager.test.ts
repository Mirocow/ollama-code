/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { BaseResourceManager } from '../baseResourceManager.js';
import type {
  BaseResourceConfig,
  ResourceLevel,
  ValidationResult,
} from '../types.js';
import type { Config } from '../../config/config.js';

// Test resource type
interface TestResourceConfig extends BaseResourceConfig {
  testField: string;
}

// Concrete implementation for testing with custom home directory
class TestResourceManager extends BaseResourceManager<TestResourceConfig> {
  private sessionResources: TestResourceConfig[] = [];
  private builtinResources: TestResourceConfig[] = [];
  private customHomeDir: string | null = null;

  constructor(config: Config, customHomeDir?: string) {
    super(config, 'test-resource', 'test-resources');
    this.customHomeDir = customHomeDir ?? null;
  }

  // Override getBaseDir to use custom home directory
  protected getBaseDir(level: ResourceLevel): string {
    if (level === 'project') {
      return path.join(
        this.config.getProjectRoot(),
        this.OLLAMA_DIR,
        this.configSubdir,
      );
    }
    // Use custom home dir if set, otherwise fall back to os.homedir()
    const homeDir = this.customHomeDir ?? os.homedir();
    return path.join(homeDir, this.OLLAMA_DIR, this.configSubdir);
  }

  // Setters for test data
  setSessionResources(resources: TestResourceConfig[]): void {
    this.sessionResources = resources;
  }

  /**
   * Loads session-level resources into the cache.
   * Similar to SubagentManager.loadSessionSubagents().
   */
  loadSessionResources(resources: TestResourceConfig[]): void {
    if (!this.cache) {
      this.cache = new Map();
    }

    const sessionRes = resources.map((r) => ({
      ...r,
      level: 'session' as ResourceLevel,
      filePath: `<session:${r.name}>`,
    }));

    this.cache.set('session', sessionRes);
    this.sessionResources = sessionRes;
  }

  setBuiltinResources(resources: TestResourceConfig[]): void {
    this.builtinResources = resources;
  }

  // Implement abstract methods
  protected parseContent(
    content: string,
    filePath: string,
    level: ResourceLevel,
  ): TestResourceConfig {
    const lines = content.split('\n');
    const name = lines[0]?.replace('name: ', '') || 'unknown';
    const description = lines[1]?.replace('description: ', '') || '';
    const testField = lines[2]?.replace('testField: ', '') || '';

    return {
      name,
      description,
      level,
      filePath,
      testField,
    };
  }

  protected serializeContent(resource: TestResourceConfig): string {
    return `name: ${resource.name}\ndescription: ${resource.description}\ntestField: ${resource.testField}`;
  }

  protected getFileName(resourceName: string): string {
    return `${resourceName}.md`;
  }

  validateConfig(config: Partial<TestResourceConfig>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.name || config.name.length === 0) {
      errors.push('Name is required');
    }

    if (!config.description || config.description.length === 0) {
      errors.push('Description is required');
    }

    if (!config.testField || config.testField.length === 0) {
      warnings.push('testField is recommended');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  protected getBuiltinResources(): TestResourceConfig[] {
    return this.builtinResources.map((r) => ({
      ...r,
      isBuiltin: true,
      level: 'builtin' as ResourceLevel,
    }));
  }

  protected getSessionResources(): TestResourceConfig[] {
    return this.sessionResources.map((r) => ({
      ...r,
      level: 'session' as ResourceLevel,
    }));
  }

  // Expose protected methods for testing
  testGetBaseDir(level: ResourceLevel): string {
    return this.getBaseDir(level);
  }

  testGetResourcePath(name: string, level: ResourceLevel): string {
    return this.getResourcePath(name, level);
  }
}

// Mock config
function createMockConfig(projectRoot: string): Config {
  return {
    getProjectRoot: () => projectRoot,
    getActiveExtensions: () => [],
  } as unknown as Config;
}

describe('BaseResourceManager', () => {
  let manager: TestResourceManager;
  let tempDir: string;
  let projectDir: string;
  let userDir: string;
  let mockConfig: Config;

  beforeEach(async () => {
    // Create temp directories
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-resources-'));
    projectDir = path.join(tempDir, 'project');
    userDir = path.join(tempDir, 'user');

    await fs.mkdir(path.join(projectDir, '.ollama-code', 'test-resources'), {
      recursive: true,
    });
    await fs.mkdir(path.join(userDir, '.ollama-code', 'test-resources'), {
      recursive: true,
    });

    mockConfig = createMockConfig(projectDir);
    // Pass custom home directory to avoid mocking os.homedir()
    manager = new TestResourceManager(mockConfig, userDir);
  });

  afterEach(async () => {
    manager.stopWatching();
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('listResources', () => {
    it('should return empty array when no resources exist', async () => {
      const resources = await manager.listResources();
      expect(resources).toEqual([]);
    });

    it('should list resources from project level', async () => {
      const resourcePath = path.join(
        projectDir,
        '.ollama-code',
        'test-resources',
        'test1.md',
      );
      await fs.writeFile(
        resourcePath,
        'name: test1\ndescription: Test 1\ntestField: value1',
      );

      const resources = await manager.listResources();
      expect(resources).toHaveLength(1);
      expect(resources[0]?.name).toBe('test1');
      expect(resources[0]?.level).toBe('project');
    });

    it('should list resources from user level', async () => {
      const resourcePath = path.join(
        userDir,
        '.ollama-code',
        'test-resources',
        'test2.md',
      );
      await fs.writeFile(
        resourcePath,
        'name: test2\ndescription: Test 2\ntestField: value2',
      );

      const resources = await manager.listResources();
      expect(resources).toHaveLength(1);
      expect(resources[0]?.name).toBe('test2');
      expect(resources[0]?.level).toBe('user');
    });

    it('should list builtin resources', async () => {
      manager.setBuiltinResources([
        {
          name: 'builtin1',
          description: 'Builtin 1',
          level: 'builtin',
          testField: 'b1',
        },
      ]);

      const resources = await manager.listResources();
      expect(resources).toHaveLength(1);
      expect(resources[0]?.name).toBe('builtin1');
      expect(resources[0]?.isBuiltin).toBe(true);
    });

    it('should list session resources', async () => {
      manager.loadSessionResources([
        {
          name: 'session1',
          description: 'Session 1',
          level: 'session',
          testField: 's1',
        },
      ]);

      const resources = await manager.listResources();
      expect(resources).toHaveLength(1);
      expect(resources[0]?.name).toBe('session1');
      expect(resources[0]?.level).toBe('session');
    });

    it('should prioritize session over project resources', async () => {
      // Create project resource
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'same-name.md'),
        'name: same-name\ndescription: Project Version\ntestField: project',
      );

      // Load session resource with same name
      manager.loadSessionResources([
        {
          name: 'same-name',
          description: 'Session Version',
          level: 'session',
          testField: 'session',
        },
      ]);

      const resources = await manager.listResources();
      expect(resources).toHaveLength(1);
      expect(resources[0]?.testField).toBe('session');
    });

    it('should prioritize project over user resources', async () => {
      // Create project resource
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'same-name.md'),
        'name: same-name\ndescription: Project Version\ntestField: project',
      );

      // Create user resource with same name
      await fs.writeFile(
        path.join(userDir, '.ollama-code', 'test-resources', 'same-name.md'),
        'name: same-name\ndescription: User Version\ntestField: user',
      );

      const resources = await manager.listResources();
      expect(resources).toHaveLength(1);
      expect(resources[0]?.testField).toBe('project');
    });

    it('should filter by level', async () => {
      await fs.writeFile(
        path.join(
          projectDir,
          '.ollama-code',
          'test-resources',
          'project-res.md',
        ),
        'name: project-res\ndescription: Project\ntestField: p',
      );
      await fs.writeFile(
        path.join(userDir, '.ollama-code', 'test-resources', 'user-res.md'),
        'name: user-res\ndescription: User\ntestField: u',
      );

      const projectResources = await manager.listResources({
        level: 'project',
      });
      expect(projectResources).toHaveLength(1);
      expect(projectResources[0]?.name).toBe('project-res');

      const userResources = await manager.listResources({ level: 'user' });
      expect(userResources).toHaveLength(1);
      expect(userResources[0]?.name).toBe('user-res');
    });

    it('should sort resources by name', async () => {
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'zebra.md'),
        'name: zebra\ndescription: Z\ntestField: z',
      );
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'alpha.md'),
        'name: alpha\ndescription: A\ntestField: a',
      );

      const resources = await manager.listResources({ sortBy: 'name' });
      expect(resources[0]?.name).toBe('alpha');
      expect(resources[1]?.name).toBe('zebra');
    });

    it('should sort resources by name descending', async () => {
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'zebra.md'),
        'name: zebra\ndescription: Z\ntestField: z',
      );
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'alpha.md'),
        'name: alpha\ndescription: A\ntestField: a',
      );

      const resources = await manager.listResources({
        sortBy: 'name',
        sortOrder: 'desc',
      });
      expect(resources[0]?.name).toBe('zebra');
      expect(resources[1]?.name).toBe('alpha');
    });
  });

  describe('loadResource', () => {
    it('should load resource by name', async () => {
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'test.md'),
        'name: test\ndescription: Test Resource\ntestField: value',
      );

      const resource = await manager.loadResource('test');
      expect(resource).not.toBeNull();
      expect(resource?.name).toBe('test');
      expect(resource?.testField).toBe('value');
    });

    it('should return null for non-existent resource', async () => {
      const resource = await manager.loadResource('nonexistent');
      expect(resource).toBeNull();
    });

    it('should load resource from specific level', async () => {
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'test.md'),
        'name: test\ndescription: Project\ntestField: project',
      );
      await fs.writeFile(
        path.join(userDir, '.ollama-code', 'test-resources', 'test.md'),
        'name: test\ndescription: User\ntestField: user',
      );

      const userResource = await manager.loadResource('test', 'user');
      expect(userResource?.testField).toBe('user');

      const projectResource = await manager.loadResource('test', 'project');
      expect(projectResource?.testField).toBe('project');
    });
  });

  describe('createResource', () => {
    it('should create a new resource at project level', async () => {
      const config: TestResourceConfig = {
        name: 'new-resource',
        description: 'New Resource',
        level: 'project',
        testField: 'new',
      };

      await manager.createResource(config, { level: 'project' });

      const resource = await manager.loadResource('new-resource');
      expect(resource).not.toBeNull();
      expect(resource?.level).toBe('project');
    });

    it('should create a new resource at user level', async () => {
      const config: TestResourceConfig = {
        name: 'new-resource',
        description: 'New Resource',
        level: 'user',
        testField: 'new',
      };

      await manager.createResource(config, { level: 'user' });

      const resource = await manager.loadResource('new-resource');
      expect(resource).not.toBeNull();
      expect(resource?.level).toBe('user');
    });

    it('should throw error for invalid config', async () => {
      const config = {
        name: '',
        description: '',
        testField: '',
      } as TestResourceConfig;

      await expect(
        manager.createResource(config, { level: 'project' }),
      ).rejects.toThrow('Invalid test-resource configuration');
    });

    it('should throw error for session level creation', async () => {
      const config: TestResourceConfig = {
        name: 'session-resource',
        description: 'Session Resource',
        level: 'session',
        testField: 'session',
      };

      await expect(
        manager.createResource(config, { level: 'session' }),
      ).rejects.toThrow('Cannot create session-level');
    });

    it('should throw error for duplicate resource', async () => {
      const config: TestResourceConfig = {
        name: 'duplicate',
        description: 'Duplicate',
        level: 'project',
        testField: 'dup',
      };

      await manager.createResource(config, { level: 'project' });

      await expect(
        manager.createResource(config, { level: 'project' }),
      ).rejects.toThrow('already exists');
    });

    it('should overwrite existing resource when overwrite is true', async () => {
      const config: TestResourceConfig = {
        name: 'overwrite-test',
        description: 'Original',
        level: 'project',
        testField: 'original',
      };

      await manager.createResource(config, { level: 'project' });

      const updatedConfig: TestResourceConfig = {
        name: 'overwrite-test',
        description: 'Updated',
        level: 'project',
        testField: 'updated',
      };

      await manager.createResource(updatedConfig, {
        level: 'project',
        overwrite: true,
      });

      const resource = await manager.loadResource('overwrite-test');
      expect(resource?.testField).toBe('updated');
    });
  });

  describe('updateResource', () => {
    it('should update an existing resource', async () => {
      const config: TestResourceConfig = {
        name: 'update-test',
        description: 'Original',
        level: 'project',
        testField: 'original',
      };

      await manager.createResource(config, { level: 'project' });
      await manager.updateResource('update-test', { testField: 'updated' });

      const resource = await manager.loadResource('update-test');
      expect(resource?.testField).toBe('updated');
    });

    it('should throw error for non-existent resource', async () => {
      await expect(
        manager.updateResource('nonexistent', { testField: 'updated' }),
      ).rejects.toThrow('not found');
    });

    it('should throw error for builtin resource', async () => {
      manager.setBuiltinResources([
        {
          name: 'builtin-res',
          description: 'Builtin',
          level: 'builtin',
          testField: 'b',
        },
      ]);

      await expect(
        manager.updateResource('builtin-res', { testField: 'updated' }),
      ).rejects.toThrow('Cannot update built-in');
    });

    it('should throw error for session resource', async () => {
      manager.setSessionResources([
        {
          name: 'session-res',
          description: 'Session',
          level: 'session',
          testField: 's',
        },
      ]);

      await expect(
        manager.updateResource('session-res', { testField: 'updated' }),
      ).rejects.toThrow('Cannot update session-level');
    });
  });

  describe('deleteResource', () => {
    it('should delete an existing resource', async () => {
      const config: TestResourceConfig = {
        name: 'delete-test',
        description: 'To Delete',
        level: 'project',
        testField: 'delete',
      };

      await manager.createResource(config, { level: 'project' });
      await manager.deleteResource('delete-test');

      const resource = await manager.loadResource('delete-test');
      expect(resource).toBeNull();
    });

    it('should throw error for non-existent resource', async () => {
      await expect(manager.deleteResource('nonexistent')).rejects.toThrow(
        'not found',
      );
    });

    it('should throw error for builtin resource', async () => {
      manager.setBuiltinResources([
        {
          name: 'builtin-res',
          description: 'Builtin',
          level: 'builtin',
          testField: 'b',
        },
      ]);

      await expect(manager.deleteResource('builtin-res')).rejects.toThrow(
        'Cannot delete built-in',
      );
    });
  });

  describe('change listeners', () => {
    it('should notify listeners on create', async () => {
      const listener = vi.fn();
      manager.addChangeListener(listener);

      const config: TestResourceConfig = {
        name: 'listener-test',
        description: 'Test',
        level: 'project',
        testField: 'test',
      };

      await manager.createResource(config, { level: 'project' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create',
          source: 'user',
        }),
      );
    });

    it('should notify listeners on update', async () => {
      const config: TestResourceConfig = {
        name: 'listener-test',
        description: 'Test',
        level: 'project',
        testField: 'test',
      };

      await manager.createResource(config, { level: 'project' });

      const listener = vi.fn();
      manager.addChangeListener(listener);

      await manager.updateResource('listener-test', { testField: 'updated' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update',
          source: 'user',
        }),
      );
    });

    it('should notify listeners on delete', async () => {
      const config: TestResourceConfig = {
        name: 'listener-test',
        description: 'Test',
        level: 'project',
        testField: 'test',
      };

      await manager.createResource(config, { level: 'project' });

      const listener = vi.fn();
      manager.addChangeListener(listener);

      await manager.deleteResource('listener-test');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'delete',
          source: 'user',
        }),
      );
    });

    it('should remove listener when dispose function is called', async () => {
      const listener = vi.fn();
      const dispose = manager.addChangeListener(listener);

      dispose();

      const config: TestResourceConfig = {
        name: 'listener-test',
        description: 'Test',
        level: 'project',
        testField: 'test',
      };

      await manager.createResource(config, { level: 'project' });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cache', () => {
    it('should cache resources after first load', async () => {
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'test.md'),
        'name: test\ndescription: Test\ntestField: value',
      );

      // First load - should populate cache
      await manager.listResources();
      const stats1 = manager.getStats();

      // Second load - should use cache
      await manager.listResources();
      const stats2 = manager.getStats();

      expect(stats2.lastRefresh).toBe(stats1.lastRefresh);
    });

    it('should force refresh when force option is true', async () => {
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'test.md'),
        'name: test\ndescription: Test\ntestField: value',
      );

      await manager.listResources();

      // Add new file after cache is populated
      await fs.writeFile(
        path.join(projectDir, '.ollama-code', 'test-resources', 'test2.md'),
        'name: test2\ndescription: Test 2\ntestField: value2',
      );

      // Without force, should use cache
      const resources1 = await manager.listResources();
      expect(resources1).toHaveLength(1);

      // With force, should reload from disk
      const resources2 = await manager.listResources({ force: true });
      expect(resources2).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await fs.writeFile(
        path.join(
          projectDir,
          '.ollama-code',
          'test-resources',
          'project-res.md',
        ),
        'name: project-res\ndescription: P\ntestField: p',
      );
      await fs.writeFile(
        path.join(userDir, '.ollama-code', 'test-resources', 'user-res.md'),
        'name: user-res\ndescription: U\ntestField: u',
      );

      manager.setBuiltinResources([
        {
          name: 'builtin-res',
          description: 'B',
          level: 'builtin',
          testField: 'b',
        },
      ]);

      await manager.listResources();

      const stats = manager.getStats();
      expect(stats.totalResources).toBe(3);
      expect(stats.resourcesByLevel.project).toBe(1);
      expect(stats.resourcesByLevel.user).toBe(1);
      expect(stats.resourcesByLevel.builtin).toBe(1);
      expect(stats.lastRefresh).not.toBeNull();
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = manager.validateConfig({
        name: 'valid',
        description: 'Valid resource',
        testField: 'value',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid config', () => {
      const result = manager.validateConfig({
        name: '',
        description: '',
        testField: '',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Description is required');
    });

    it('should return warnings for missing optional fields', () => {
      const result = manager.validateConfig({
        name: 'test',
        description: 'Test resource',
        testField: '',
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('testField is recommended');
    });
  });

  describe('path helpers', () => {
    it('should return correct project path', () => {
      const result = manager.testGetBaseDir('project');
      expect(result).toBe(
        path.join(projectDir, '.ollama-code', 'test-resources'),
      );
    });

    it('should return correct user path', () => {
      const result = manager.testGetBaseDir('user');
      expect(result).toBe(path.join(userDir, '.ollama-code', 'test-resources'));
    });

    it('should return correct resource path', () => {
      const result = manager.testGetResourcePath('my-resource', 'project');
      expect(result).toBe(
        path.join(
          projectDir,
          '.ollama-code',
          'test-resources',
          'my-resource.md',
        ),
      );
    });

    it('should return virtual path for builtin', () => {
      const result = manager.testGetResourcePath('builtin-res', 'builtin');
      expect(result).toBe('<builtin:builtin-res>');
    });

    it('should return virtual path for session', () => {
      const result = manager.testGetResourcePath('session-res', 'session');
      expect(result).toBe('<session:session-res>');
    });
  });
});
