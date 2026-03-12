/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  UnifiedResourceFactory,
  getUnifiedResourceFactory,
  resetUnifiedResourceFactory,
} from '../index.js';
import type { Config } from '../../config/config.js';

// Mock config
function createMockConfig(): Config {
  return {
    getProjectRoot: () => '/test/project',
    getActiveExtensions: () => [],
  } as unknown as Config;
}

describe('UnifiedResourceFactory', () => {
  let factory: UnifiedResourceFactory;
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = createMockConfig();
    resetUnifiedResourceFactory();
    factory = new UnifiedResourceFactory(mockConfig);
  });

  afterEach(() => {
    factory.dispose();
    resetUnifiedResourceFactory();
  });

  describe('getManager', () => {
    it('should return UnifiedSkillManager for skill type', () => {
      const manager = factory.getManager('skill');
      expect(manager).toBeDefined();
      expect(manager.resourceType).toBe('skill');
    });

    it('should return UnifiedSubagentManager for subagent type', () => {
      const manager = factory.getManager('subagent');
      expect(manager).toBeDefined();
      expect(manager.resourceType).toBe('subagent');
    });

    it('should return same instance on subsequent calls', () => {
      const manager1 = factory.getManager('skill');
      const manager2 = factory.getManager('skill');
      expect(manager1).toBe(manager2);
    });
  });

  describe('getSkillManager', () => {
    it('should return skill manager', () => {
      const manager = factory.getSkillManager();
      expect(manager).toBeDefined();
      expect(manager.resourceType).toBe('skill');
    });
  });

  describe('getSubagentManager', () => {
    it('should return subagent manager', () => {
      const manager = factory.getSubagentManager();
      expect(manager).toBeDefined();
      expect(manager.resourceType).toBe('subagent');
    });
  });

  describe('hasManager', () => {
    it('should return false before manager is created', () => {
      expect(factory.hasManager('skill')).toBe(false);
    });

    it('should return true after manager is created', () => {
      factory.getManager('skill');
      expect(factory.hasManager('skill')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return null for uninitialized managers', () => {
      const stats = factory.getStats();
      expect(stats.skill).toBeNull();
      expect(stats.subagent).toBeNull();
    });

    it('should return stats for initialized managers', () => {
      factory.getManager('skill');
      factory.getManager('subagent');

      const stats = factory.getStats();
      expect(stats.skill).not.toBeNull();
      expect(stats.subagent).not.toBeNull();
    });
  });

  describe('dispose', () => {
    it('should clear all managers', () => {
      factory.getManager('skill');
      factory.getManager('subagent');

      expect(factory.hasManager('skill')).toBe(true);
      expect(factory.hasManager('subagent')).toBe(true);

      factory.dispose();

      expect(factory.hasManager('skill')).toBe(false);
      expect(factory.hasManager('subagent')).toBe(false);
    });
  });
});

describe('Singleton functions', () => {
  beforeEach(() => {
    resetUnifiedResourceFactory();
  });

  afterEach(() => {
    resetUnifiedResourceFactory();
  });

  describe('getUnifiedResourceFactory', () => {
    it('should create singleton instance', () => {
      const config = createMockConfig();
      const factory1 = getUnifiedResourceFactory(config);
      const factory2 = getUnifiedResourceFactory(config);

      expect(factory1).toBe(factory2);
    });
  });

  describe('resetUnifiedResourceFactory', () => {
    it('should reset singleton instance', () => {
      const config = createMockConfig();
      const factory1 = getUnifiedResourceFactory(config);

      resetUnifiedResourceFactory();

      const factory2 = getUnifiedResourceFactory(config);
      expect(factory1).not.toBe(factory2);
    });

    it('should dispose factory when resetting', () => {
      const config = createMockConfig();
      const factory = getUnifiedResourceFactory(config);
      const disposeSpy = vi.spyOn(factory, 'dispose');

      resetUnifiedResourceFactory();

      expect(disposeSpy).toHaveBeenCalled();
    });
  });
});
