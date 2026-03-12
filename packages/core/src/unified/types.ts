/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified types for Skills, Agents, and Subagents system.
 * This module provides a common type system for all resource managers.
 */

/**
 * Base storage level for all managed resources.
 * Priority order: session > project > user > extension > builtin
 */
export type ResourceLevel =
  | 'session'    // Runtime-level, highest priority, read-only
  | 'project'    // Stored in project `.ollama-code/` directory
  | 'user'       // Stored in `~/.ollama-code/` directory
  | 'extension'  // Provided by installed extensions
  | 'builtin';   // Built into the codebase, lowest priority

/**
 * Base configuration interface shared by all managed resources.
 */
export interface BaseResourceConfig {
  /** Unique name identifier for the resource */
  name: string;

  /** Human-readable description */
  description: string;

  /** Storage level - determines where the resource is stored */
  level: ResourceLevel;

  /** Absolute path to the resource file (optional for session/builtin) */
  filePath?: string;

  /** For extension-level resources: the name of the providing extension */
  extensionName?: string;

  /** Indicates whether this is a built-in resource (read-only) */
  readonly isBuiltin?: boolean;
}

/**
 * Base validation result interface.
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;

  /** Array of error messages if validation failed */
  errors: string[];

  /** Array of warning messages (non-blocking issues) */
  warnings: string[];
}

/**
 * Options for listing resources.
 */
export interface ListResourcesOptions {
  /** Filter by storage level */
  level?: ResourceLevel;

  /** Force refresh from disk, bypassing cache */
  force?: boolean;

  /** Sort order for results */
  sortBy?: 'name' | 'lastModified' | 'level';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Options for creating a new resource.
 */
export interface CreateResourceOptions {
  /** Storage level for the new resource */
  level: ResourceLevel;

  /** Whether to overwrite existing resource with same name */
  overwrite?: boolean;

  /** Custom directory path (overrides default level-based path) */
  customPath?: string;
}

/**
 * Base error class for resource operations.
 */
export class ResourceError extends Error {
  constructor(
    message: string,
    readonly code: ResourceErrorCode,
    readonly resourceName?: string,
    readonly resourceType?: string,
  ) {
    super(message);
    this.name = 'ResourceError';
  }
}

/**
 * Common error codes for resource operations.
 */
export const ResourceErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_CONFIG: 'INVALID_CONFIG',
  INVALID_NAME: 'INVALID_NAME',
  FILE_ERROR: 'FILE_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export type ResourceErrorCode =
  (typeof ResourceErrorCode)[keyof typeof ResourceErrorCode];

/**
 * Change event emitted when resources are modified.
 */
export interface ResourceChangeEvent<T extends BaseResourceConfig> {
  /** Type of change */
  type: 'create' | 'update' | 'delete' | 'refresh';

  /** Affected resource (if applicable) */
  resource?: T;

  /** All affected resources */
  resources?: T[];

  /** Source of the change */
  source: 'user' | 'system' | 'external';
}

/**
 * Listener function for resource changes.
 */
export type ResourceChangeListener<T extends BaseResourceConfig> = (
  event: ResourceChangeEvent<T>,
) => void;

/**
 * Statistics for resource manager.
 */
export interface ResourceManagerStats {
  /** Total number of resources loaded */
  totalResources: number;

  /** Number of resources per level */
  resourcesByLevel: Record<ResourceLevel, number>;

  /** Cache hit count */
  cacheHits: number;

  /** Cache miss count */
  cacheMisses: number;

  /** Last refresh timestamp */
  lastRefresh: string | null;
}

/**
 * Interface for managing resources with common operations.
 */
export interface IResourceManager<T extends BaseResourceConfig> {
  /** Resource type name for logging and errors */
  readonly resourceType: string;

  /** Lists all available resources */
  listResources(options?: ListResourcesOptions): Promise<T[]>;

  /** Loads a resource by name */
  loadResource(name: string, level?: ResourceLevel): Promise<T | null>;

  /** Creates a new resource */
  createResource(config: T, options: CreateResourceOptions): Promise<void>;

  /** Updates an existing resource */
  updateResource(
    name: string,
    updates: Partial<T>,
    level?: ResourceLevel,
  ): Promise<void>;

  /** Deletes a resource */
  deleteResource(name: string, level?: ResourceLevel): Promise<void>;

  /** Validates a resource configuration */
  validateConfig(config: Partial<T>): ValidationResult;

  /** Refreshes the cache from disk */
  refreshCache(): Promise<void>;

  /** Adds a change listener */
  addChangeListener(listener: ResourceChangeListener<T>): () => void;

  /** Removes a change listener */
  removeChangeListener(listener: ResourceChangeListener<T>): void;

  /** Gets manager statistics */
  getStats(): ResourceManagerStats;
}
