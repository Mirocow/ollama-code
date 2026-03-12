/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified resource management system for Skills, Agents, and Subagents.
 * Provides common interfaces, base classes, and utilities.
 */

// ============================================================================
// Types
// ============================================================================

export type {
  ResourceLevel,
  BaseResourceConfig,
  ValidationResult,
  ListResourcesOptions,
  CreateResourceOptions,
  ResourceChangeEvent,
  ResourceChangeListener,
  ResourceManagerStats,
  IResourceManager,
} from './types.js';

export { ResourceError, ResourceErrorCode } from './types.js';

// ============================================================================
// Base Manager
// ============================================================================

export { BaseResourceManager } from './baseResourceManager.js';

// ============================================================================
// Unified Managers
// ============================================================================

export {
  UnifiedSkillManager,
  type ListSkillsOptions,
} from './unifiedSkillManager.js';
export {
  UnifiedSubagentManager,
  loadSubagentFromDir,
} from './unifiedSubagentManager.js';

// ============================================================================
// Resource Factory
// ============================================================================

import type { Config } from '../config/config.js';
import { UnifiedSkillManager } from './unifiedSkillManager.js';
import { UnifiedSubagentManager } from './unifiedSubagentManager.js';
import type { SkillConfig } from '../skills/types.js';
import type { SubagentConfig } from '../subagents/types.js';
import type { IResourceManager, BaseResourceConfig } from './types.js';

/**
 * Resource type identifiers
 */
export type ResourceType = 'skill' | 'subagent';

/**
 * Resource config type map
 */
export interface ResourceConfigMap {
  skill: SkillConfig;
  subagent: SubagentConfig;
}

/**
 * Manager type map
 */
export interface ResourceManagerMap {
  skill: UnifiedSkillManager;
  subagent: UnifiedSubagentManager;
}

/**
 * Unified Resource Factory
 *
 * Provides centralized access to all resource managers.
 * Uses lazy initialization for efficient resource usage.
 */
export class UnifiedResourceFactory {
  private readonly managers: Map<
    ResourceType,
    IResourceManager<BaseResourceConfig>
  > = new Map();

  constructor(private readonly config: Config) {}

  /**
   * Gets the skill manager.
   */
  getSkillManager(): UnifiedSkillManager {
    return this.getManager('skill') as UnifiedSkillManager;
  }

  /**
   * Gets the subagent manager.
   */
  getSubagentManager(): UnifiedSubagentManager {
    return this.getManager('subagent') as UnifiedSubagentManager;
  }

  /**
   * Gets a resource manager by type.
   */
  getManager<K extends ResourceType>(type: K): ResourceManagerMap[K] {
    if (!this.managers.has(type)) {
      this.managers.set(type, this.createManager(type));
    }
    return this.managers.get(type) as ResourceManagerMap[K];
  }

  /**
   * Checks if a manager is initialized.
   */
  hasManager(type: ResourceType): boolean {
    return this.managers.has(type);
  }

  /**
   * Disposes all managers.
   */
  dispose(): void {
    for (const manager of this.managers.values()) {
      if (
        'stopWatching' in manager &&
        typeof manager.stopWatching === 'function'
      ) {
        (manager as { stopWatching: () => void }).stopWatching();
      }
    }
    this.managers.clear();
  }

  /**
   * Gets statistics for all managers.
   */
  getStats(): Record<
    ResourceType,
    import('./types.js').ResourceManagerStats | null
  > {
    return {
      skill: this.managers.get('skill')?.getStats() || null,
      subagent: this.managers.get('subagent')?.getStats() || null,
    };
  }

  /**
   * Refreshes all manager caches.
   */
  async refreshAll(): Promise<void> {
    const promises: Array<Promise<void>> = [];

    for (const manager of this.managers.values()) {
      promises.push(manager.refreshCache());
    }

    await Promise.all(promises);
  }

  /**
   * Starts watching for all managers.
   */
  async startWatching(): Promise<void> {
    const promises: Array<Promise<void>> = [];

    for (const manager of this.managers.values()) {
      if (
        'startWatching' in manager &&
        typeof manager.startWatching === 'function'
      ) {
        promises.push(
          (manager as { startWatching: () => Promise<void> }).startWatching(),
        );
      }
    }

    await Promise.all(promises);
  }

  /**
   * Stops watching for all managers.
   */
  stopWatching(): void {
    for (const manager of this.managers.values()) {
      if (
        'stopWatching' in manager &&
        typeof manager.stopWatching === 'function'
      ) {
        (manager as { stopWatching: () => void }).stopWatching();
      }
    }
  }

  // Private methods

  private createManager(
    type: ResourceType,
  ): IResourceManager<BaseResourceConfig> {
    switch (type) {
      case 'skill':
        return new UnifiedSkillManager(
          this.config,
        ) as unknown as IResourceManager<BaseResourceConfig>;
      case 'subagent':
        return new UnifiedSubagentManager(
          this.config,
        ) as unknown as IResourceManager<BaseResourceConfig>;
      default:
        throw new Error(`Unknown resource type: ${type}`);
    }
  }
}

// Singleton instance
let factoryInstance: UnifiedResourceFactory | null = null;

/**
 * Gets the singleton UnifiedResourceFactory instance.
 */
export function getUnifiedResourceFactory(
  config: Config,
): UnifiedResourceFactory {
  if (!factoryInstance) {
    factoryInstance = new UnifiedResourceFactory(config);
  }
  return factoryInstance;
}

/**
 * Resets the factory singleton (useful for testing).
 */
export function resetUnifiedResourceFactory(): void {
  if (factoryInstance) {
    factoryInstance.dispose();
    factoryInstance = null;
  }
}
