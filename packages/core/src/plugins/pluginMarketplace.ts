/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plugin Marketplace
 *
 * Provides functionality to search, install, update, and manage plugins
 * from the Ollama Code plugin registry (npm-based).
 */

import * as childProcess from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import axios from 'axios';
import { createDebugLogger } from '../utils/debugLogger.js';
import type { PluginManifest } from './types.js';

const debugLogger = createDebugLogger('PLUGIN_MARKETPLACE');

/**
 * Marketplace plugin metadata
 */
export interface MarketplacePlugin {
  /** Unique plugin ID */
  id: string;
  /** Package name on npm */
  packageName: string;
  /** Display name */
  name: string;
  /** Plugin description */
  description: string;
  /** Version */
  version: string;
  /** Author information */
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  /** Keywords for search */
  keywords: string[];
  /** Download count */
  downloads?: number;
  /** GitHub stars */
  stars?: number;
  /** License */
  license?: string;
  /** Repository URL */
  repository?: string;
  /** Homepage URL */
  homepage?: string;
  /** Installation path */
  installedPath?: string;
  /** Whether the plugin is installed */
  installed: boolean;
  /** Installed version (if different from latest) */
  installedVersion?: string;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Plugin manifest (if installed) */
  manifest?: PluginManifest;
  /** Security trust level */
  trustLevel: 'verified' | 'community' | 'unverified';
  /** Verification badge */
  verified: boolean;
  /** Last updated date */
  updatedAt?: string;
  /** Creation date */
  createdAt?: string;
}

/**
 * Search options for marketplace
 */
export interface MarketplaceSearchOptions {
  /** Search query */
  query?: string;
  /** Filter by keywords */
  keywords?: string[];
  /** Filter by author */
  author?: string;
  /** Filter by trust level */
  trustLevel?: Array<'verified' | 'community' | 'unverified'>;
  /** Sort by: 'downloads' | 'stars' | 'updated' | 'name' */
  sortBy?: 'downloads' | 'stars' | 'updated' | 'name';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Maximum results */
  limit?: number;
  /** Include installed plugins */
  includeInstalled?: boolean;
}

/**
 * Install options
 */
export interface PluginInstallOptions {
  /** Specific version to install */
  version?: string;
  /** Install globally (user-level) */
  global?: boolean;
  /** Force reinstall if already installed */
  force?: boolean;
  /** Skip trust verification */
  skipVerification?: boolean;
  /** Dry run - don't actually install */
  dryRun?: boolean;
}

/**
 * Update options
 */
export interface PluginUpdateOptions {
  /** Update to specific version */
  version?: string;
  /** Update all installed plugins */
  all?: boolean;
  /** Check for updates only (don't install) */
  checkOnly?: boolean;
  /** Dry run */
  dryRun?: boolean;
}

/**
 * Marketplace registry response
 */
interface RegistryResponse {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description?: string;
      author?: { name: string; email?: string };
      keywords?: string[];
      date: string;
      links?: {
        repository?: string;
        homepage?: string;
      };
      publisher?: {
        username: string;
      };
    };
    score: {
      detail: {
        popularity: number;
        quality: number;
      };
    };
  }>;
  total: number;
}

/**
 * Plugin Marketplace - Search, install, and manage plugins
 */
export class PluginMarketplace {
  private readonly userPluginsDir: string;
  private readonly projectPluginsDir: string;
  private readonly npmRegistry = 'https://registry.npmjs.org';
  private readonly searchEndpoint = 'https://registry.npmjs.org/-/v1/search';

  // Cache for marketplace data
  private cache: Map<string, { data: MarketplacePlugin; timestamp: number }> =
    new Map();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(projectRoot?: string) {
    this.userPluginsDir = path.join(os.homedir(), '.ollama-code', 'plugins');
    this.projectPluginsDir = projectRoot
      ? path.join(projectRoot, '.ollama-code', 'plugins')
      : '';
  }

  /**
   * Search for plugins in the marketplace
   */
  async search(
    options: MarketplaceSearchOptions = {},
  ): Promise<MarketplacePlugin[]> {
    const {
      query = '',
      keywords = [],
      author,
      sortBy = 'downloads',
      sortOrder = 'desc',
      limit = 20,
      includeInstalled = true,
    } = options;

    debugLogger.info(`Searching marketplace: "${query}"`);

    try {
      // Build search query
      const searchTerms = ['ollama-code-plugin'];
      if (query) searchTerms.push(query);
      if (keywords.length > 0)
        searchTerms.push(...keywords.map((k) => `keywords:${k}`));
      if (author) searchTerms.push(`author:${author}`);

      const searchQuery = searchTerms.join(' ');
      const url = `${this.searchEndpoint}?text=${encodeURIComponent(searchQuery)}&size=${Math.min(limit * 2, 100)}`;

      // Fetch from npm registry using axios
      const response = await axios.get<RegistryResponse>(url);
      const data = response.data;

      // Transform results
      let plugins = data.objects.map((obj) =>
        this.transformRegistryPackage(obj),
      );

      // Filter and sort
      plugins = this.applyFilters(plugins, options);
      plugins = this.applySorting(plugins, sortBy, sortOrder);

      // Add installation status
      plugins = await this.addInstallationStatus(plugins);

      // Filter out installed if requested
      if (!includeInstalled) {
        plugins = plugins.filter((p) => !p.installed);
      }

      // Limit results
      plugins = plugins.slice(0, limit);

      debugLogger.info(`Found ${plugins.length} plugins`);
      return plugins;
    } catch (error) {
      debugLogger.error('Marketplace search failed:', error);
      // Return empty results on error (offline mode)
      return this.getInstalledPlugins();
    }
  }

  /**
   * Get plugin details by ID or package name
   */
  async getPlugin(pluginId: string): Promise<MarketplacePlugin | null> {
    // Check cache first
    const cached = this.cache.get(pluginId);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      // Try as package name first
      const packageName = pluginId.startsWith('ollama-code-plugin-')
        ? pluginId
        : `ollama-code-plugin-${pluginId}`;

      try {
        const response = await axios.get(`${this.npmRegistry}/${packageName}`);
        const plugin = this.transformPackageManifest(response.data);
        this.cache.set(pluginId, { data: plugin, timestamp: Date.now() });
        return plugin;
      } catch {
        // Try as scoped package
        try {
          const scopedResponse = await axios.get(
            `${this.npmRegistry}/@ollama-code/${pluginId}`,
          );
          return this.transformPackageManifest(scopedResponse.data);
        } catch {
          return null;
        }
      }
    } catch (error) {
      debugLogger.error(`Failed to get plugin ${pluginId}:`, error);
      return null;
    }
  }

  /**
   * Install a plugin
   */
  async install(
    pluginId: string,
    options: PluginInstallOptions = {},
  ): Promise<{
    success: boolean;
    message: string;
    plugin?: MarketplacePlugin;
  }> {
    const {
      version,
      global = true,
      force = false,
      skipVerification = false,
      dryRun = false,
    } = options;

    debugLogger.info(
      `Installing plugin: ${pluginId}${version ? `@${version}` : ''}`,
    );

    try {
      // Get plugin info
      const plugin = await this.getPlugin(pluginId);
      if (!plugin) {
        return {
          success: false,
          message: `Plugin "${pluginId}" not found in marketplace`,
        };
      }

      // Check if already installed
      if (plugin.installed && !force) {
        return {
          success: false,
          message: `Plugin "${pluginId}" is already installed. Use --force to reinstall.`,
        };
      }

      // Security check
      if (!skipVerification && plugin.trustLevel === 'unverified') {
        return {
          success: false,
          message: `Plugin "${pluginId}" is unverified. Use --skip-verification to install anyway.`,
        };
      }

      if (dryRun) {
        return {
          success: true,
          message: `[DRY RUN] Would install ${plugin.packageName}@${version || 'latest'}`,
          plugin,
        };
      }

      // Determine installation directory
      const installDir = global ? this.userPluginsDir : this.projectPluginsDir;
      if (!fs.existsSync(installDir)) {
        fs.mkdirSync(installDir, { recursive: true });
      }

      // Install via npm
      const packageName = plugin.packageName;
      const packageSpec = version
        ? `${packageName}@${version}`
        : `${packageName}@latest`;

      const result = childProcess.spawnSync(
        'npm',
        ['install', '--prefix', installDir, '--save', packageSpec],
        {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );

      if (result.status !== 0) {
        throw new Error(`npm install failed: ${result.stderr}`);
      }

      debugLogger.info(`Plugin ${pluginId} installed successfully`);

      return {
        success: true,
        message: `Plugin "${plugin.name}" v${plugin.version} installed successfully`,
        plugin: {
          ...plugin,
          installed: true,
          installedVersion: plugin.version,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      debugLogger.error(`Failed to install plugin ${pluginId}:`, error);
      return { success: false, message: `Installation failed: ${message}` };
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(
    pluginId: string,
    options: { global?: boolean } = {},
  ): Promise<{ success: boolean; message: string }> {
    const { global = true } = options;

    debugLogger.info(`Uninstalling plugin: ${pluginId}`);

    try {
      // Determine installation directory
      const installDir = global ? this.userPluginsDir : this.projectPluginsDir;

      // Get package name
      const packageName = pluginId.startsWith('ollama-code-plugin-')
        ? pluginId
        : `ollama-code-plugin-${pluginId}`;

      // Check if installed
      const pluginPath = path.join(installDir, 'node_modules', packageName);
      if (!fs.existsSync(pluginPath)) {
        return {
          success: false,
          message: `Plugin "${pluginId}" is not installed`,
        };
      }

      // Uninstall via npm
      const result = childProcess.spawnSync(
        'npm',
        ['uninstall', '--prefix', installDir, packageName],
        {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );

      if (result.status !== 0) {
        throw new Error(`npm uninstall failed: ${result.stderr}`);
      }

      debugLogger.info(`Plugin ${pluginId} uninstalled successfully`);

      return {
        success: true,
        message: `Plugin "${pluginId}" uninstalled successfully`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Uninstallation failed: ${message}` };
    }
  }

  /**
   * Update a plugin
   */
  async update(
    pluginId: string,
    options: PluginUpdateOptions = {},
  ): Promise<{ success: boolean; message: string; updated?: boolean }> {
    const { version, checkOnly = false, dryRun = false } = options;

    debugLogger.info(`Updating plugin: ${pluginId}`);

    try {
      // Get installed plugin
      const installed = await this.getInstalledPlugin(pluginId);
      if (!installed) {
        return {
          success: false,
          message: `Plugin "${pluginId}" is not installed`,
        };
      }

      // Get latest version from marketplace
      const latest = await this.getPlugin(pluginId);
      if (!latest) {
        return {
          success: false,
          message: `Plugin "${pluginId}" not found in marketplace`,
        };
      }

      // Check if update needed
      const currentVersion = installed.installedVersion || installed.version;
      const targetVersion = version || latest.version;

      if (currentVersion === targetVersion) {
        return {
          success: true,
          message: `Plugin "${pluginId}" is already up to date`,
          updated: false,
        };
      }

      if (checkOnly || dryRun) {
        return {
          success: true,
          message: `[${dryRun ? 'DRY RUN' : 'CHECK'}] Update available: ${currentVersion} → ${targetVersion}`,
          updated: false,
        };
      }

      // Perform update
      const result = await this.install(pluginId, {
        version: targetVersion,
        force: true,
      });

      return {
        success: result.success,
        message: result.success
          ? `Plugin "${pluginId}" updated: ${currentVersion} → ${targetVersion}`
          : result.message,
        updated: result.success,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Update failed: ${message}` };
    }
  }

  /**
   * Update all installed plugins
   */
  async updateAll(
    options: PluginUpdateOptions = {},
  ): Promise<Array<{ pluginId: string; success: boolean; message: string }>> {
    const { checkOnly = false, dryRun = false } = options;

    debugLogger.info('Updating all plugins');

    const installed = await this.getInstalledPlugins();
    const results = [];

    for (const plugin of installed) {
      const result = await this.update(plugin.id, { checkOnly, dryRun });
      results.push({ pluginId: plugin.id, ...result });
    }

    return results;
  }

  /**
   * Get list of installed plugins
   */
  async getInstalledPlugins(): Promise<MarketplacePlugin[]> {
    const plugins: MarketplacePlugin[] = [];

    // Check user-level plugins
    const userPlugins = await this.scanPluginDirectory(
      this.userPluginsDir,
      'user',
    );
    plugins.push(...userPlugins);

    // Check project-level plugins
    if (this.projectPluginsDir) {
      const projectPlugins = await this.scanPluginDirectory(
        this.projectPluginsDir,
        'project',
      );
      plugins.push(...projectPlugins);
    }

    return plugins;
  }

  /**
   * Get a single installed plugin
   */
  private async getInstalledPlugin(
    pluginId: string,
  ): Promise<MarketplacePlugin | null> {
    const installed = await this.getInstalledPlugins();
    return (
      installed.find((p) => p.id === pluginId || p.packageName === pluginId) ||
      null
    );
  }

  /**
   * Scan a directory for installed plugins
   */
  private async scanPluginDirectory(
    dir: string,
    _type: 'user' | 'project',
  ): Promise<MarketplacePlugin[]> {
    const plugins: MarketplacePlugin[] = [];

    const nodeModulesDir = path.join(dir, 'node_modules');
    if (!fs.existsSync(nodeModulesDir)) {
      return plugins;
    }

    const entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Check for scoped packages
      if (entry.name.startsWith('@')) {
        const scopedDir = path.join(nodeModulesDir, entry.name);
        const scopedEntries = fs.readdirSync(scopedDir, {
          withFileTypes: true,
        });

        for (const scopedEntry of scopedEntries) {
          if (scopedEntry.name.startsWith('ollama-code-plugin-')) {
            const pluginPath = path.join(scopedDir, scopedEntry.name);
            const plugin = this.readInstalledPlugin(pluginPath);
            if (plugin) plugins.push(plugin);
          }
        }
      }
      // Unscoped packages
      else if (entry.name.startsWith('ollama-code-plugin-')) {
        const pluginPath = path.join(nodeModulesDir, entry.name);
        const plugin = this.readInstalledPlugin(pluginPath);
        if (plugin) plugins.push(plugin);
      }
    }

    return plugins;
  }

  /**
   * Read installed plugin info from directory
   */
  private readInstalledPlugin(pluginPath: string): MarketplacePlugin | null {
    try {
      const packageJsonPath = path.join(pluginPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) return null;

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const manifestPath = path.join(pluginPath, 'plugin.json');

      let manifest: PluginManifest | undefined;
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      }

      return {
        id:
          manifest?.metadata.id ||
          packageJson.name.replace(/^ollama-code-plugin-/, ''),
        packageName: packageJson.name,
        name: manifest?.metadata.name || packageJson.name,
        description: packageJson.description || '',
        version: packageJson.version,
        author:
          typeof packageJson.author === 'string'
            ? { name: packageJson.author }
            : packageJson.author,
        keywords: packageJson.keywords || [],
        license: packageJson.license,
        repository:
          typeof packageJson.repository === 'string'
            ? packageJson.repository
            : packageJson.repository?.url,
        homepage: packageJson.homepage,
        installedPath: pluginPath,
        installed: true,
        installedVersion: packageJson.version,
        updateAvailable: false, // Will be updated when compared with marketplace
        manifest,
        trustLevel: 'community', // Default
        verified: false,
      };
    } catch (error) {
      debugLogger.error(`Failed to read plugin from ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Transform registry search result to MarketplacePlugin
   */
  private transformRegistryPackage(
    obj: RegistryResponse['objects'][0],
  ): MarketplacePlugin {
    const pkg = obj.package;
    const id = pkg.name
      .replace(/^ollama-code-plugin-/, '')
      .replace(/^@ollama-code\//, '');

    return {
      id,
      packageName: pkg.name,
      name: pkg.name,
      description: pkg.description || '',
      version: pkg.version,
      author: pkg.author,
      keywords: pkg.keywords || [],
      downloads: Math.round(obj.score.detail.popularity * 10000),
      license: undefined,
      repository: pkg.links?.repository,
      homepage: pkg.links?.homepage,
      installed: false,
      updateAvailable: false,
      trustLevel: 'community',
      verified: false,
      updatedAt: pkg.date,
    };
  }

  /**
   * Transform full package manifest to MarketplacePlugin
   */
  private transformPackageManifest(
    data: Record<string, unknown>,
  ): MarketplacePlugin {
    const name = data['name'] as string;
    const distTags = data['dist-tags'] as Record<string, string> | undefined;
    const latest = distTags?.['latest'];
    const versions = data['versions'] as
      | Record<string, Record<string, unknown>>
      | undefined;
    const version = latest || (versions ? Object.keys(versions)[0] : '0.0.0');
    const versionData = versions?.[version] || {};

    const id = name
      .replace(/^ollama-code-plugin-/, '')
      .replace(/^@ollama-code\//, '');

    const time = data['time'] as Record<string, string> | undefined;

    return {
      id,
      packageName: name,
      name: (versionData['name'] as string) || name,
      description:
        (versionData['description'] as string) ||
        (data['description'] as string) ||
        '',
      version,
      author:
        (versionData['author'] as { name: string }) ||
        (data['author'] as { name: string }),
      keywords:
        ((versionData['keywords'] || data['keywords']) as string[]) || [],
      license: (versionData['license'] || data['license']) as string,
      repository:
        typeof versionData['repository'] === 'string'
          ? (versionData['repository'] as string)
          : (versionData['repository'] as { url: string } | undefined)?.url ||
            (data['repository'] as string),
      homepage: (versionData['homepage'] || data['homepage']) as string,
      installed: false,
      updateAvailable: false,
      trustLevel: 'community',
      verified: false,
      createdAt: time?.['created'],
      updatedAt: time?.['modified'],
    };
  }

  /**
   * Apply filters to plugin list
   */
  private applyFilters(
    plugins: MarketplacePlugin[],
    options: MarketplaceSearchOptions,
  ): MarketplacePlugin[] {
    let filtered = plugins;

    // Filter by trust level
    if (options.trustLevel?.length) {
      filtered = filtered.filter((p) =>
        options.trustLevel!.includes(p.trustLevel),
      );
    }

    return filtered;
  }

  /**
   * Apply sorting to plugin list
   */
  private applySorting(
    plugins: MarketplacePlugin[],
    sortBy: 'downloads' | 'stars' | 'updated' | 'name',
    sortOrder: 'asc' | 'desc',
  ): MarketplacePlugin[] {
    const sorted = [...plugins].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'downloads':
          comparison = (a.downloads || 0) - (b.downloads || 0);
          break;
        case 'stars':
          comparison = (a.stars || 0) - (b.stars || 0);
          break;
        case 'updated':
          comparison =
            new Date(a.updatedAt || 0).getTime() -
            new Date(b.updatedAt || 0).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          // Default sort by name
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Add installation status to plugin list
   */
  private async addInstallationStatus(
    plugins: MarketplacePlugin[],
  ): Promise<MarketplacePlugin[]> {
    const installed = await this.getInstalledPlugins();
    const installedMap = new Map(installed.map((p) => [p.packageName, p]));

    return plugins.map((plugin) => {
      const installedInfo = installedMap.get(plugin.packageName);
      if (installedInfo) {
        return {
          ...plugin,
          installed: true,
          installedVersion: installedInfo.installedVersion,
          installedPath: installedInfo.installedPath,
          manifest: installedInfo.manifest,
          updateAvailable: plugin.version !== installedInfo.installedVersion,
        };
      }
      return plugin;
    });
  }
}

/**
 * Create a marketplace instance
 */
export function createPluginMarketplace(
  projectRoot?: string,
): PluginMarketplace {
  return new PluginMarketplace(projectRoot);
}
