/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extension Alias Registry
 *
 * Manages aliases for tools, commands, agents, and skills.
 * Provides a unified way to create shortcuts for frequently used features.
 */

import { createDebugLogger } from '../utils/debugLogger.js';
import type {
  ExtensionAliasDefinition,
  ExtensionAliasRegistry as IExtensionAliasRegistry,
  ExtensionV2,
} from './extension-types.js';

const debugLogger = createDebugLogger('EXTENSION_ALIASES');

// ============================================================================
// Types
// ============================================================================

/**
 * Registered alias entry in the registry.
 */
interface RegisteredAlias {
  /** Alias definition */
  definition: ExtensionAliasDefinition;

  /** Extension that owns this alias */
  extensionId: string;

  /** Extension name */
  extensionName: string;

  /** When the alias was registered */
  registeredAt: Date;
}

/**
 * Options for the ExtensionAliasRegistry.
 */
export interface ExtensionAliasRegistryOptions {
  /** Whether to allow overriding built-in aliases */
  allowOverrideBuiltin?: boolean;

  /** Maximum alias name length */
  maxAliasLength?: number;

  /** Whether to validate alias names on registration */
  validateNames?: boolean;
}

/**
 * Result of alias resolution.
 */
export interface AliasResolutionResult {
  /** Whether the alias was found */
  found: boolean;

  /** The resolved alias definition */
  alias?: ExtensionAliasDefinition;

  /** Extension that owns the alias */
  extensionId?: string;

  /** Extension name */
  extensionName?: string;
}

// ============================================================================
// Extension Alias Registry
// ============================================================================

/**
 * Registry for extension aliases.
 */
export class ExtensionAliasRegistry implements IExtensionAliasRegistry {
  private readonly aliases: Map<string, RegisteredAlias> = new Map();
  private readonly options: ExtensionAliasRegistryOptions;

  constructor(options: ExtensionAliasRegistryOptions = {}) {
    this.options = {
      allowOverrideBuiltin: false,
      maxAliasLength: 32,
      validateNames: true,
      ...options,
    };
  }

  /**
   * Register aliases from an extension.
   * @param extension The extension to register aliases from
   * @returns Array of registered alias names
   */
  registerAliasesFromExtension(extension: ExtensionV2): string[] {
    if (!extension.aliases || extension.aliases.length === 0) {
      return [];
    }

    const registered: string[] = [];

    for (const aliasDef of extension.aliases) {
      try {
        const validation = this.validateAlias(aliasDef, extension.id);
        if (!validation.valid) {
          debugLogger.warn(
            `Skipping invalid alias ${aliasDef.name}: ${validation.errors.join(', ')}`,
          );
          continue;
        }

        // Check for existing alias
        const existing = this.aliases.get(aliasDef.name.toLowerCase());
        if (existing) {
          if (existing.extensionId === 'builtin') {
            if (!this.options.allowOverrideBuiltin) {
              debugLogger.warn(
                `Cannot override built-in alias: ${aliasDef.name}`,
              );
              continue;
            }
          }
          debugLogger.debug(
            `Overriding existing alias: ${aliasDef.name} (was from ${existing.extensionName})`,
          );
        }

        this.aliases.set(aliasDef.name.toLowerCase(), {
          definition: aliasDef,
          extensionId: extension.id,
          extensionName: extension.name,
          registeredAt: new Date(),
        });

        registered.push(aliasDef.name);
        debugLogger.debug(
          `Registered alias: ${aliasDef.name} -> ${aliasDef.target}`,
        );
      } catch (error) {
        debugLogger.error(`Failed to register alias ${aliasDef.name}:`, error);
      }
    }

    return registered;
  }

  /**
   * Register a single alias.
   * @param alias The alias definition
   * @param extensionId Optional extension ID
   * @param extensionName Optional extension name
   */
  register(
    alias: ExtensionAliasDefinition,
    extensionId: string = 'unknown',
    extensionName: string = 'unknown',
  ): void {
    const validation = this.validateAlias(alias, extensionId);
    if (!validation.valid) {
      throw new Error(`Invalid alias: ${validation.errors.join(', ')}`);
    }

    this.aliases.set(alias.name.toLowerCase(), {
      definition: alias,
      extensionId,
      extensionName,
      registeredAt: new Date(),
    });

    debugLogger.debug(`Registered alias: ${alias.name} -> ${alias.target}`);
  }

  /**
   * Unregister all aliases from an extension.
   * @param extensionId The extension ID to unregister aliases from
   */
  unregisterAliasesFromExtension(extensionId: string): void {
    for (const [aliasName, alias] of this.aliases.entries()) {
      if (alias.extensionId === extensionId) {
        this.aliases.delete(aliasName);
        debugLogger.debug(`Unregistered alias: ${aliasName}`);
      }
    }
  }

  /**
   * Resolve an alias to its target.
   * @param name The alias name to resolve
   */
  resolve(name: string): ExtensionAliasDefinition | null {
    const alias = this.aliases.get(name.toLowerCase());
    return alias?.definition ?? null;
  }

  /**
   * Resolve an alias with full metadata.
   * @param name The alias name to resolve
   */
  resolveWithMetadata(name: string): AliasResolutionResult {
    const alias = this.aliases.get(name.toLowerCase());
    if (!alias) {
      return { found: false };
    }

    return {
      found: true,
      alias: alias.definition,
      extensionId: alias.extensionId,
      extensionName: alias.extensionName,
    };
  }

  /**
   * List all aliases.
   */
  list(): ExtensionAliasDefinition[] {
    return Array.from(this.aliases.values()).map((a) => a.definition);
  }

  /**
   * List aliases for a specific extension.
   */
  listByExtension(extensionId: string): ExtensionAliasDefinition[] {
    return Array.from(this.aliases.values())
      .filter((a) => a.extensionId === extensionId)
      .map((a) => a.definition);
  }

  /**
   * List aliases by target type.
   */
  listByType(
    type: ExtensionAliasDefinition['type'],
  ): ExtensionAliasDefinition[] {
    return this.list().filter((a) => a.type === type);
  }

  /**
   * Remove an alias.
   * @param name The alias name to remove
   */
  remove(name: string): void {
    const lowerName = name.toLowerCase();
    const alias = this.aliases.get(lowerName);

    if (!alias) {
      return;
    }

    if (alias.extensionId === 'builtin' && !this.options.allowOverrideBuiltin) {
      debugLogger.warn(`Cannot remove built-in alias: ${name}`);
      return;
    }

    this.aliases.delete(lowerName);
    debugLogger.debug(`Removed alias: ${name}`);
  }

  /**
   * Clear all aliases for an extension.
   * @param extensionId The extension ID
   */
  clearForExtension(extensionId: string): void {
    this.unregisterAliasesFromExtension(extensionId);
  }

  /**
   * Clear all aliases.
   */
  clear(): void {
    this.aliases.clear();
    debugLogger.debug('Cleared all aliases');
  }

  /**
   * Check if an alias exists.
   */
  has(name: string): boolean {
    return this.aliases.has(name.toLowerCase());
  }

  /**
   * Get statistics about registered aliases.
   */
  getStats(): {
    totalAliases: number;
    byType: Record<string, number>;
    extensionsWithAliases: Set<string>;
  } {
    const aliases = Array.from(this.aliases.values());

    const byType: Record<string, number> = {};
    for (const alias of aliases) {
      const type = alias.definition.type ?? 'tool';
      byType[type] = (byType[type] ?? 0) + 1;
    }

    return {
      totalAliases: aliases.length,
      byType,
      extensionsWithAliases: new Set(aliases.map((a) => a.extensionId)),
    };
  }

  // Private methods

  private validateAlias(
    alias: ExtensionAliasDefinition,
    _extensionId: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!alias.name) {
      errors.push('Alias name is required');
    } else {
      if (this.options.validateNames) {
        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(alias.name)) {
          errors.push(
            'Alias name must start with a letter and contain only letters, numbers, underscores, and dashes',
          );
        }
      }

      if (alias.name.length > (this.options.maxAliasLength ?? 32)) {
        errors.push(
          `Alias name must be ${this.options.maxAliasLength ?? 32} characters or less`,
        );
      }

      // Check for reserved names
      const reservedNames = ['help', 'exit', 'quit', 'clear', 'reset'];
      if (reservedNames.includes(alias.name.toLowerCase())) {
        errors.push(`Alias name "${alias.name}" is reserved`);
      }
    }

    // Validate target
    if (!alias.target) {
      errors.push('Alias target is required');
    }

    // Validate type
    if (alias.type) {
      const validTypes = ['tool', 'command', 'agent', 'skill'];
      if (!validTypes.includes(alias.type)) {
        errors.push(`Invalid alias type: ${alias.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// Built-in Aliases
// ============================================================================

/**
 * Register built-in aliases.
 */
export function registerBuiltinAliases(registry: ExtensionAliasRegistry): void {
  const builtinAliases: ExtensionAliasDefinition[] = [
    // Tool shortcuts
    { name: 'rf', target: 'read_file', type: 'tool', description: 'Read file' },
    {
      name: 'wf',
      target: 'write_file',
      type: 'tool',
      description: 'Write file',
    },
    { name: 'ef', target: 'edit_file', type: 'tool', description: 'Edit file' },
    {
      name: 'ls',
      target: 'list_directory',
      type: 'tool',
      description: 'List directory',
    },
    {
      name: 'grep',
      target: 'search_files',
      type: 'tool',
      description: 'Search in files',
    },
    {
      name: 'sh',
      target: 'run_shell_command',
      type: 'tool',
      description: 'Run shell command',
    },

    // Agent shortcuts
    {
      name: 'task',
      target: 'subagent',
      type: 'agent',
      description: 'Run subagent task',
    },
  ];

  for (const alias of builtinAliases) {
    try {
      registry.register(alias, 'builtin', 'builtin');
    } catch {
      // Ignore errors for built-in aliases
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalRegistry: ExtensionAliasRegistry | null = null;

/**
 * Get the global extension alias registry instance.
 */
export function getExtensionAliasRegistry(): ExtensionAliasRegistry {
  if (!globalRegistry) {
    globalRegistry = new ExtensionAliasRegistry();
    registerBuiltinAliases(globalRegistry);
  }
  return globalRegistry;
}

/**
 * Reset the global registry (for testing).
 */
export function resetExtensionAliasRegistry(): void {
  globalRegistry = null;
}
