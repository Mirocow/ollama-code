/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import { watch as watchFs, type FSWatcher } from 'chokidar';
import type { Config } from '../config/config.js';
import { createLogger } from '../services/structuredLogger.js';
import type {
  BaseResourceConfig,
  ResourceLevel,
  ListResourcesOptions,
  CreateResourceOptions,
  ValidationResult,
  ResourceChangeEvent,
  ResourceChangeListener,
  ResourceManagerStats,
  IResourceManager,
} from './types.js';
import { ResourceError, ResourceErrorCode } from './types.js';

/**
 * Abstract base class for resource managers (Skills, Agents, Subagents).
 * Provides common functionality for:
 * - Caching and cache invalidation
 * - File watching
 * - Change notification
 * - Level-based storage
 * - Statistics tracking
 */
export abstract class BaseResourceManager<T extends BaseResourceConfig>
  implements IResourceManager<T>
{
  /** Logger instance for this manager */
  protected readonly logger;

  /** Cache of resources by level */
  protected cache: Map<ResourceLevel, T[]> | null = null;

  /** Registered change listeners */
  protected readonly changeListeners: Set<ResourceChangeListener<T>> =
    new Set();

  /** File watchers by path */
  protected readonly watchers: Map<string, FSWatcher> = new Map();

  /** Whether watching has been started */
  protected watchStarted = false;

  /** Timer for debounced refresh */
  protected refreshTimer: NodeJS.Timeout | null = null;

  /** Statistics */
  protected stats = {
    cacheHits: 0,
    cacheMisses: 0,
    lastRefresh: null as string | null,
  };

  /** Ollama Code config directory name */
  protected readonly OLLAMA_DIR = '.ollama-code';

  constructor(
    protected readonly config: Config,
    readonly resourceType: string,
    protected readonly configSubdir: string,
  ) {
    this.logger = createLogger(`${resourceType.toUpperCase()}_MANAGER`);
  }

  // Abstract methods that must be implemented by subclasses

  /** Parse resource content from string */
  protected abstract parseContent(
    content: string,
    filePath: string,
    level: ResourceLevel,
  ): T;

  /** Serialize resource to string for file writing */
  protected abstract serializeContent(resource: T): string;

  /** Get the file name for a resource (may differ from resource name) */
  protected abstract getFileName(resourceName: string): string;

  /** Validate resource configuration */
  abstract validateConfig(config: Partial<T>): ValidationResult;

  /** Get built-in resources */
  protected abstract getBuiltinResources(): T[];

  // Implemented common methods

  /**
   * Lists all available resources.
   */
  async listResources(options: ListResourcesOptions = {}): Promise<T[]> {
    this.logger.debug(`Listing ${this.resourceType} resources`, { options });

    const resources: T[] = [];
    const seenNames = new Set<string>();

    const levelsToCheck: ResourceLevel[] = options.level
      ? [options.level]
      : this.getDefaultLevels();

    // Check if we should use cache or force refresh
    const shouldUseCache = !options.force && this.cache !== null;

    if (!shouldUseCache) {
      await this.refreshCache();
    }

    // Collect resources from each level (higher priority first)
    for (const level of levelsToCheck) {
      const levelResources = this.cache?.get(level) || [];

      for (const resource of levelResources) {
        // Skip if we've already seen this name (precedence)
        if (seenNames.has(resource.name)) {
          continue;
        }

        resources.push(resource);
        seenNames.add(resource.name);
      }
    }

    // Sort results if requested
    if (options.sortBy) {
      this.sortResources(resources, options.sortBy, options.sortOrder);
    }

    this.logger.info(
      `Listed ${resources.length} ${this.resourceType} resources`,
    );
    return resources;
  }

  /**
   * Loads a resource by name.
   */
  async loadResource(name: string, level?: ResourceLevel): Promise<T | null> {
    this.logger.debug(`Loading ${this.resourceType}: ${name}`, { level });

    if (level) {
      const resource = await this.findByNameAtLevel(name, level);
      return resource;
    }

    // Try each level in priority order
    for (const lvl of this.getDefaultLevels()) {
      const resource = await this.findByNameAtLevel(name, lvl);
      if (resource) {
        this.logger.debug(`Found ${this.resourceType} ${name} at ${lvl} level`);
        return resource;
      }
    }

    this.logger.debug(`${this.resourceType} ${name} not found`);
    return null;
  }

  /**
   * Creates a new resource.
   */
  async createResource(
    resourceConfig: T,
    options: CreateResourceOptions,
  ): Promise<void> {
    // Validate configuration
    const validation = this.validateConfig(resourceConfig);
    if (!validation.isValid) {
      throw new ResourceError(
        `Invalid ${this.resourceType} configuration: ${validation.errors.join(', ')}`,
        ResourceErrorCode.VALIDATION_ERROR,
        resourceConfig.name,
        this.resourceType,
      );
    }

    // Prevent creating session-level resources
    if (options.level === 'session') {
      throw new ResourceError(
        `Cannot create session-level ${this.resourceType}. Session resources are read-only.`,
        ResourceErrorCode.PERMISSION_DENIED,
        resourceConfig.name,
        this.resourceType,
      );
    }

    // Determine file path
    const filePath =
      options.customPath ||
      this.getResourcePath(resourceConfig.name, options.level);

    // Check if file already exists
    if (!options.overwrite) {
      try {
        await fs.access(filePath);
        throw new ResourceError(
          `${this.resourceType} "${resourceConfig.name}" already exists at ${filePath}`,
          ResourceErrorCode.ALREADY_EXISTS,
          resourceConfig.name,
          this.resourceType,
        );
      } catch (caughtError) {
        if (caughtError instanceof ResourceError) throw caughtError;
        // File doesn't exist, which is what we want
      }
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Update config with actual file path and level
    const finalConfig: T = {
      ...resourceConfig,
      level: options.level,
      filePath,
    } as T;

    // Serialize and write the file
    const content = this.serializeContent(finalConfig);

    try {
      await fs.writeFile(filePath, content, 'utf8');
      await this.refreshCache();
      this.notifyChangeListeners({
        type: 'create',
        resource: finalConfig,
        source: 'user',
      });
      this.logger.info(`Created ${this.resourceType}: ${resourceConfig.name}`);
    } catch (caughtError) {
      throw new ResourceError(
        `Failed to write ${this.resourceType} file: ${caughtError instanceof Error ? caughtError.message : 'Unknown error'}`,
        ResourceErrorCode.FILE_ERROR,
        resourceConfig.name,
        this.resourceType,
      );
    }
  }

  /**
   * Updates an existing resource.
   */
  async updateResource(
    name: string,
    updates: Partial<T>,
    level?: ResourceLevel,
  ): Promise<void> {
    const existing = await this.loadResource(name, level);
    if (!existing) {
      throw new ResourceError(
        `${this.resourceType} "${name}" not found`,
        ResourceErrorCode.NOT_FOUND,
        name,
        this.resourceType,
      );
    }

    // Prevent updating built-in resources
    if (existing.isBuiltin) {
      throw new ResourceError(
        `Cannot update built-in ${this.resourceType} "${name}"`,
        ResourceErrorCode.PERMISSION_DENIED,
        name,
        this.resourceType,
      );
    }

    // Prevent updating session-level resources
    if (existing.level === 'session') {
      throw new ResourceError(
        `Cannot update session-level ${this.resourceType} "${name}"`,
        ResourceErrorCode.PERMISSION_DENIED,
        name,
        this.resourceType,
      );
    }

    // Merge updates with existing configuration
    const updatedConfig = this.mergeConfigurations(existing, updates);

    // Validate the updated configuration
    const validation = this.validateConfig(updatedConfig);
    if (!validation.isValid) {
      throw new ResourceError(
        `Invalid ${this.resourceType} configuration: ${validation.errors.join(', ')}`,
        ResourceErrorCode.VALIDATION_ERROR,
        name,
        this.resourceType,
      );
    }

    // Ensure filePath exists for file-based resources
    if (!existing.filePath) {
      throw new ResourceError(
        `Cannot update ${this.resourceType} "${name}": no file path available`,
        ResourceErrorCode.FILE_ERROR,
        name,
        this.resourceType,
      );
    }

    // Write the updated configuration
    const content = this.serializeContent(updatedConfig);

    try {
      await fs.writeFile(existing.filePath, content, 'utf8');
      await this.refreshCache();
      this.notifyChangeListeners({
        type: 'update',
        resource: updatedConfig,
        source: 'user',
      });
      this.logger.info(`Updated ${this.resourceType}: ${name}`);
    } catch (caughtError) {
      throw new ResourceError(
        `Failed to update ${this.resourceType} file: ${caughtError instanceof Error ? caughtError.message : 'Unknown error'}`,
        ResourceErrorCode.FILE_ERROR,
        name,
        this.resourceType,
      );
    }
  }

  /**
   * Deletes a resource.
   */
  async deleteResource(name: string, level?: ResourceLevel): Promise<void> {
    const existing = await this.loadResource(name, level);
    if (!existing) {
      throw new ResourceError(
        `${this.resourceType} "${name}" not found`,
        ResourceErrorCode.NOT_FOUND,
        name,
        this.resourceType,
      );
    }

    // Prevent deleting built-in resources
    if (existing.isBuiltin) {
      throw new ResourceError(
        `Cannot delete built-in ${this.resourceType} "${name}"`,
        ResourceErrorCode.PERMISSION_DENIED,
        name,
        this.resourceType,
      );
    }

    // Prevent deleting session-level resources
    if (existing.level === 'session') {
      throw new ResourceError(
        `Cannot delete session-level ${this.resourceType} "${name}"`,
        ResourceErrorCode.PERMISSION_DENIED,
        name,
        this.resourceType,
      );
    }

    // Delete the file
    if (existing.filePath) {
      try {
        await fs.unlink(existing.filePath);
      } catch (caughtError) {
        // File might not exist or be inaccessible
        this.logger.warn(`Failed to delete file: ${existing.filePath}`, {
          error: caughtError,
        });
      }
    }

    await this.refreshCache();
    this.notifyChangeListeners({
      type: 'delete',
      resource: existing,
      source: 'user',
    });
    this.logger.info(`Deleted ${this.resourceType}: ${name}`);
  }

  /**
   * Refreshes the cache from disk.
   */
  async refreshCache(): Promise<void> {
    this.logger.debug(`Refreshing ${this.resourceType} cache...`);
    const newCache = new Map<ResourceLevel, T[]>();

    const levels: ResourceLevel[] = ['project', 'user', 'builtin', 'extension'];
    let totalResources = 0;

    for (const level of levels) {
      const levelResources = await this.loadResourcesAtLevel(level);
      newCache.set(level, levelResources);
      totalResources += levelResources.length;
    }

    this.cache = newCache;
    this.stats.lastRefresh = new Date().toISOString();

    this.logger.info(
      `${this.resourceType} cache refreshed: ${totalResources} resources loaded`,
    );

    this.notifyChangeListeners({
      type: 'refresh',
      source: 'system',
    });
  }

  /**
   * Adds a change listener.
   * Returns a function to remove the listener.
   */
  addChangeListener(listener: ResourceChangeListener<T>): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  /**
   * Removes a change listener.
   */
  removeChangeListener(listener: ResourceChangeListener<T>): void {
    this.changeListeners.delete(listener);
  }

  /**
   * Gets manager statistics.
   */
  getStats(): ResourceManagerStats {
    const resourcesByLevel: Record<ResourceLevel, number> = {
      session: this.cache?.get('session')?.length || 0,
      project: this.cache?.get('project')?.length || 0,
      user: this.cache?.get('user')?.length || 0,
      extension: this.cache?.get('extension')?.length || 0,
      builtin: this.cache?.get('builtin')?.length || 0,
    };

    const totalResources = Object.values(resourcesByLevel).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      totalResources,
      resourcesByLevel,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      lastRefresh: this.stats.lastRefresh,
    };
  }

  /**
   * Starts watching resource directories for changes.
   */
  async startWatching(): Promise<void> {
    if (this.watchStarted) {
      this.logger.debug(`${this.resourceType} watching already started`);
      return;
    }

    this.logger.info(`Starting ${this.resourceType} directory watchers...`);
    this.watchStarted = true;
    await this.refreshCache();
    this.updateWatchers();
    this.logger.info(`${this.resourceType} directory watchers started`);
  }

  /**
   * Stops watching resource directories.
   */
  stopWatching(): void {
    this.logger.info(`Stopping ${this.resourceType} directory watchers...`);
    for (const watcher of this.watchers.values()) {
      void watcher.close().catch((error) => {
        this.logger.warn(`Failed to close watcher`, { error });
      });
    }
    this.watchers.clear();
    this.watchStarted = false;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.logger.info(`${this.resourceType} directory watchers stopped`);
  }

  // Protected helper methods

  /**
   * Gets the default levels to search when no level is specified.
   */
  protected getDefaultLevels(): ResourceLevel[] {
    return ['session', 'project', 'user', 'extension', 'builtin'];
  }

  /**
   * Gets the base directory for resources at a specific level.
   */
  protected getBaseDir(level: ResourceLevel): string {
    if (level === 'project') {
      return path.join(
        this.config.getProjectRoot(),
        this.OLLAMA_DIR,
        this.configSubdir,
      );
    }
    return path.join(os.homedir(), this.OLLAMA_DIR, this.configSubdir);
  }

  /**
   * Gets the full path for a resource file.
   */
  protected getResourcePath(name: string, level: ResourceLevel): string {
    if (level === 'builtin') {
      return `<builtin:${name}>`;
    }
    if (level === 'session') {
      return `<session:${name}>`;
    }
    const baseDir = this.getBaseDir(level);
    return path.join(baseDir, this.getFileName(name));
  }

  /**
   * Loads resources at a specific level.
   */
  protected async loadResourcesAtLevel(level: ResourceLevel): Promise<T[]> {
    // Handle built-in resources
    if (level === 'builtin') {
      return this.getBuiltinResources();
    }

    // Handle extension resources
    if (level === 'extension') {
      return this.getExtensionResources();
    }

    // Handle session resources
    if (level === 'session') {
      return this.getSessionResources();
    }

    const projectRoot = this.config.getProjectRoot();
    const homeDir = os.homedir();
    const isHomeDirectory = path.resolve(projectRoot) === path.resolve(homeDir);

    // Skip project level if in home directory
    if (level === 'project' && isHomeDirectory) {
      this.logger.debug(
        `Skipping project-level ${this.resourceType}: project root is home directory`,
      );
      return [];
    }

    const baseDir = this.getBaseDir(level);
    return this.loadResourcesFromDir(baseDir, level);
  }

  /**
   * Loads resources from a directory.
   */
  protected async loadResourcesFromDir(
    dir: string,
    level: ResourceLevel,
  ): Promise<T[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const resources: T[] = [];

      for (const entry of entries) {
        if (!this.isValidResourceEntry(entry)) {
          continue;
        }

        const filePath = path.join(dir, entry.name);

        try {
          const content = await fs.readFile(filePath, 'utf8');
          const resource = this.parseContent(content, filePath, level);
          resources.push(resource);
        } catch (error) {
          this.logger.warn(
            `Failed to parse ${this.resourceType} at ${filePath}`,
            { error },
          );
        }
      }

      return resources;
    } catch (_error) {
      // Directory doesn't exist or can't be read
      this.logger.debug(`Cannot read ${this.resourceType} directory: ${dir}`);
      return [];
    }
  }

  /**
   * Checks if a directory entry is a valid resource.
   */
  protected isValidResourceEntry(entry: fsSync.Dirent): boolean {
    // Default: check for .md files
    return entry.isFile() && entry.name.endsWith('.md');
  }

  /**
   * Finds a resource by name at a specific level.
   */
  protected async findByNameAtLevel(
    name: string,
    level: ResourceLevel,
  ): Promise<T | null> {
    await this.ensureLevelCache(level);
    const levelResources = this.cache?.get(level) || [];
    return levelResources.find((r) => r.name === name) || null;
  }

  /**
   * Ensures the cache is populated for a specific level.
   */
  protected async ensureLevelCache(level: ResourceLevel): Promise<void> {
    if (!this.cache) {
      this.cache = new Map();
    }

    if (!this.cache.has(level)) {
      const levelResources = await this.loadResourcesAtLevel(level);
      this.cache.set(level, levelResources);
    }
  }

  /**
   * Merges partial updates with an existing configuration.
   */
  protected mergeConfigurations(base: T, updates: Partial<T>): T {
    return {
      ...base,
      ...updates,
    };
  }

  /**
   * Gets extension-provided resources.
   */
  protected getExtensionResources(): T[] {
    // Subclasses should override this if they support extensions
    // Note: this.config.getActiveExtensions() can be used to get extension resources
    return [];
  }

  /**
   * Gets session-level resources.
   */
  protected getSessionResources(): T[] {
    // Subclasses should override this if they support session-level resources
    return [];
  }

  /**
   * Sorts resources by the specified field.
   */
  protected sortResources(
    resources: T[],
    sortBy: 'name' | 'lastModified' | 'level',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): void {
    const levelOrder: Record<ResourceLevel, number> = {
      session: 0,
      project: 1,
      user: 2,
      extension: 3,
      builtin: 4,
    };

    resources.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'level':
          comparison = (levelOrder[a.level] ?? 5) - (levelOrder[b.level] ?? 5);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Notifies all registered change listeners.
   */
  protected notifyChangeListeners(event: ResourceChangeEvent<T>): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger.warn(
          `${this.resourceType} change listener threw an error`,
          {
            error,
          },
        );
      }
    }
  }

  /**
   * Updates file watchers based on current cache.
   */
  protected updateWatchers(): void {
    const watchTargets = new Set<string>(
      (['project', 'user'] as const)
        .map((level) => this.getBaseDir(level))
        .filter((dir) => fsSync.existsSync(dir)),
    );

    // Remove old watchers
    for (const existingPath of this.watchers.keys()) {
      if (!watchTargets.has(existingPath)) {
        void this.watchers
          .get(existingPath)
          ?.close()
          .catch((error) => {
            this.logger.warn(`Failed to close watcher for ${existingPath}`, {
              error,
            });
          });
        this.watchers.delete(existingPath);
      }
    }

    // Add new watchers
    for (const watchPath of watchTargets) {
      if (this.watchers.has(watchPath)) {
        continue;
      }

      try {
        const watcher = watchFs(watchPath, {
          ignoreInitial: true,
        })
          .on('all', () => {
            this.scheduleRefresh();
          })
          .on('error', (error) => {
            this.logger.warn(`Watcher error for ${watchPath}`, { error });
          });
        this.watchers.set(watchPath, watcher);
      } catch (error) {
        this.logger.warn(`Failed to watch directory: ${watchPath}`, { error });
      }
    }
  }

  /**
   * Schedules a debounced refresh.
   */
  protected scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      void this.refreshCache().then(() => this.updateWatchers());
    }, 150);
  }
}
