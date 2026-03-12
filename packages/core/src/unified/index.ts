/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified resource management system for Skills, Agents, and Subagents.
 * Provides common interfaces, base classes, and utilities.
 */

// Types
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

// Classes
export { ResourceError, ResourceErrorCode } from './types.js';
export { BaseResourceManager } from './baseResourceManager.js';
