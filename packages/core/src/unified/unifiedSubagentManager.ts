/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified Subagent Manager
 *
 * Manages subagent configurations using the unified resource management system.
 * Extends BaseResourceManager for consistent behavior across all resource types.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Config } from '../config/config.js';
import type {
  SubagentConfig,
  SubagentLevel,
  SubagentRuntimeConfig,
  CreateSubagentOptions,
  ListSubagentsOptions,
  PromptConfig,
  ModelConfig,
  RunConfig,
  ToolConfig,
} from '../subagents/types.js';
import { SubagentError, SubagentErrorCode } from '../subagents/types.js';
import { SubagentValidator } from '../subagents/validation.js';
import { SubAgentScope } from '../subagents/subagent.js';
import { BuiltinAgentRegistry } from '../subagents/builtin-agents.js';
import {
  parse as parseYaml,
  stringify as stringifyYaml,
} from '../utils/yaml-parser.js';
import { resolveToolAlias } from '../tools/tool-names.js';
import { BaseResourceManager } from './baseResourceManager.js';
import type {
  ResourceLevel,
  CreateResourceOptions,
  ValidationResult,
} from './types.js';

/**
 * Subagent configuration directory
 */
const AGENT_CONFIG_DIR = 'agents';

/**
 * Converts a SubagentLevel to a ResourceLevel
 */
function subagentLevelToResourceLevel(level: SubagentLevel): ResourceLevel {
  return level as ResourceLevel;
}

/**
 * Converts a ResourceLevel to a SubagentLevel
 */
function resourceLevelToSubagentLevel(level: ResourceLevel): SubagentLevel {
  return level as SubagentLevel;
}

/**
 * Unified Subagent Manager
 *
 * Provides subagent management using the unified resource system.
 * This is a bridge between the new unified system and the existing SubagentManager API.
 */
export class UnifiedSubagentManager extends BaseResourceManager<SubagentConfig> {
  private readonly validator: SubagentValidator;

  constructor(config: Config) {
    super(config, 'subagent', AGENT_CONFIG_DIR);
    this.validator = new SubagentValidator();
  }

  /**
   * Lists all available subagents.
   * This is an alias for listResources() for backward compatibility.
   */
  async listSubagents(
    options: ListSubagentsOptions = {},
  ): Promise<SubagentConfig[]> {
    // Convert options format
    const listOptions: import('./types.js').ListResourcesOptions = {
      level: options.level
        ? subagentLevelToResourceLevel(options.level)
        : undefined,
      force: options.force,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    };

    // Handle hasTool filter separately
    const result = await this.listResources(listOptions);

    if (options.hasTool) {
      return result.filter(
        (subagent) =>
          subagent.tools && subagent.tools.includes(options.hasTool!),
      );
    }

    return result;
  }

  /**
   * Loads a subagent by name.
   * This is an alias for loadResource() for backward compatibility.
   */
  async loadSubagent(
    name: string,
    level?: SubagentLevel,
  ): Promise<SubagentConfig | null> {
    return this.loadResource(
      name,
      level ? subagentLevelToResourceLevel(level) : undefined,
    );
  }

  /**
   * Creates a new subagent.
   */
  async createSubagent(
    config: SubagentConfig,
    options: CreateSubagentOptions,
  ): Promise<void> {
    // Convert options format
    const createOptions: CreateResourceOptions = {
      level: subagentLevelToResourceLevel(options.level),
      overwrite: options.overwrite,
      customPath: options.customPath,
    };

    return this.createResource(config, createOptions);
  }

  /**
   * Updates an existing subagent.
   */
  async updateSubagent(
    name: string,
    updates: Partial<SubagentConfig>,
    level?: SubagentLevel,
  ): Promise<void> {
    return this.updateResource(
      name,
      updates,
      level ? subagentLevelToResourceLevel(level) : undefined,
    );
  }

  /**
   * Deletes a subagent.
   */
  async deleteSubagent(
    name: string,
    level?: SubagentLevel,
    extensionName?: string,
  ): Promise<void> {
    // Handle extension level specially
    if (level === 'extension' && extensionName) {
      throw new SubagentError(
        `Cannot delete subagent "${name}" in extension "${extensionName}". If needed, uninstall the extension directly.`,
        SubagentErrorCode.INVALID_CONFIG,
        name,
      );
    }

    return this.deleteResource(
      name,
      level ? subagentLevelToResourceLevel(level) : undefined,
    );
  }

  /**
   * Finds a subagent by name and returns its metadata.
   */
  async findSubagentByName(
    name: string,
    level?: SubagentLevel,
  ): Promise<SubagentConfig | null> {
    return this.loadSubagent(name, level);
  }

  /**
   * Loads session-level subagents into the cache.
   */
  loadSessionSubagents(subagents: SubagentConfig[]): void {
    if (!this.cache) {
      this.cache = new Map();
    }

    const sessionSubagents = subagents.map((config) => ({
      ...config,
      level: 'session' as SubagentLevel,
      filePath: `<session:${config.name}>`,
    }));

    this.cache.set('session', sessionSubagents);
    this.notifyChangeListeners({
      type: 'refresh',
      source: 'system',
    });
  }

  /**
   * Gets the file path for a subagent at a specific level.
   */
  getSubagentPath(name: string, level: SubagentLevel): string {
    return this.getResourcePath(name, subagentLevelToResourceLevel(level));
  }

  /**
   * Validates that a subagent name is available.
   */
  async isNameAvailable(name: string, level?: SubagentLevel): Promise<boolean> {
    const existing = await this.loadSubagent(name, level);
    if (!existing) {
      return true;
    }
    if (level && existing.level !== level) {
      return true;
    }
    return false;
  }

  /**
   * Creates a SubAgentScope from a subagent configuration.
   */
  async createSubagentScope(
    config: SubagentConfig,
    runtimeContext: Config,
    options?: {
      eventEmitter?: import('../subagents/subagent-events.js').SubAgentEventEmitter;
      hooks?: import('../subagents/subagent-hooks.js').SubagentHooks;
    },
  ): Promise<SubAgentScope> {
    try {
      const runtimeConfig = this.convertToRuntimeConfig(config);

      return await SubAgentScope.create(
        config.name,
        runtimeContext,
        runtimeConfig.promptConfig,
        runtimeConfig.modelConfig,
        runtimeConfig.runConfig,
        runtimeConfig.toolConfig,
        options?.eventEmitter,
        options?.hooks,
      );
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        throw new SubagentError(
          `Failed to create SubAgentScope: ${caughtError.message}`,
          SubagentErrorCode.INVALID_CONFIG,
          config.name,
        );
      }
      throw caughtError;
    }
  }

  /**
   * Converts a file-based SubagentConfig to runtime configuration.
   */
  convertToRuntimeConfig(config: SubagentConfig): SubagentRuntimeConfig {
    // Build prompt configuration
    const promptConfig: PromptConfig = {
      systemPrompt: config.systemPrompt,
    };

    // Build model configuration
    const modelConfig: ModelConfig = {
      ...config.modelConfig,
    };

    // Build run configuration
    const runConfig: RunConfig = {
      ...config.runConfig,
    };

    // Build tool configuration if tools are specified
    let toolConfig: ToolConfig | undefined;
    if (config.tools && config.tools.length > 0) {
      const toolNames = this.transformToToolNames(config.tools);
      toolConfig = {
        tools: toolNames,
      };
    }

    return {
      promptConfig,
      modelConfig,
      runConfig,
      toolConfig,
    };
  }

  // Abstract method implementations

  protected override parseContent(
    content: string,
    filePath: string,
    level: ResourceLevel,
  ): SubagentConfig {
    try {
      // Split frontmatter and content
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);

      if (!match) {
        throw new Error('Invalid format: missing YAML frontmatter');
      }

      const [, frontmatterYaml, systemPrompt] = match;

      // Parse YAML frontmatter
      const frontmatter = parseYaml(frontmatterYaml) as Record<string, unknown>;

      // Extract required fields
      const nameRaw = frontmatter['name'];
      const descriptionRaw = frontmatter['description'];

      if (nameRaw == null || nameRaw === '') {
        throw new Error('Missing "name" in frontmatter');
      }

      if (descriptionRaw == null || descriptionRaw === '') {
        throw new Error('Missing "description" in frontmatter');
      }

      const name = String(nameRaw);
      const description = String(descriptionRaw);

      // Extract optional fields
      const tools = frontmatter['tools'] as string[] | undefined;
      const modelConfig = frontmatter['modelConfig'] as
        | Record<string, unknown>
        | undefined;
      const runConfig = frontmatter['runConfig'] as
        | Record<string, unknown>
        | undefined;
      const color = frontmatter['color'] as string | undefined;

      const config: SubagentConfig = {
        name,
        description,
        tools,
        systemPrompt: systemPrompt.trim(),
        filePath,
        modelConfig: modelConfig as Partial<ModelConfig>,
        runConfig: runConfig as Partial<RunConfig>,
        color,
        level: resourceLevelToSubagentLevel(level),
      };

      // Validate the parsed configuration
      const validation = this.validator.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      this.logger.debug(`Successfully parsed subagent: ${name}`, {
        level,
        filePath,
      });
      return config;
    } catch (caughtError) {
      throw new SubagentError(
        `Failed to parse subagent file: ${caughtError instanceof Error ? caughtError.message : 'Unknown error'}`,
        SubagentErrorCode.INVALID_CONFIG,
      );
    }
  }

  protected override serializeContent(subagent: SubagentConfig): string {
    // Build frontmatter object
    const frontmatter: Record<string, unknown> = {
      name: subagent.name,
      description: subagent.description,
    };

    if (subagent.tools && subagent.tools.length > 0) {
      frontmatter['tools'] = subagent.tools;
    }

    if (subagent.modelConfig) {
      frontmatter['modelConfig'] = subagent.modelConfig;
    }

    if (subagent.runConfig) {
      frontmatter['runConfig'] = subagent.runConfig;
    }

    if (subagent.color && subagent.color !== 'auto') {
      frontmatter['color'] = subagent.color;
    }

    // Serialize to YAML
    const yamlContent = stringifyYaml(frontmatter, {
      lineWidth: 0,
      minContentWidth: 0,
    }).trim();

    // Combine frontmatter and system prompt
    return `---\n${yamlContent}\n---\n\n${subagent.systemPrompt}\n`;
  }

  protected override getFileName(resourceName: string): string {
    return `${resourceName}.md`;
  }

  override validateConfig(config: Partial<SubagentConfig>): ValidationResult {
    // Create a minimal valid config for validation
    const fullConfig: SubagentConfig = {
      name: config.name ?? '',
      description: config.description ?? '',
      systemPrompt: config.systemPrompt ?? '',
      level: config.level ?? 'project',
      ...config,
    } as SubagentConfig;
    return this.validator.validateConfig(fullConfig);
  }

  protected override getBuiltinResources(): SubagentConfig[] {
    return BuiltinAgentRegistry.getBuiltinAgents();
  }

  protected override getExtensionResources(): SubagentConfig[] {
    const extensions = this.config.getActiveExtensions();
    return extensions.flatMap((extension) => extension.agents || []);
  }

  protected override getSessionResources(): SubagentConfig[] {
    return this.cache?.get('session') || [];
  }

  // Override mergeConfigurations for nested objects

  protected override mergeConfigurations(
    base: SubagentConfig,
    updates: Partial<SubagentConfig>,
  ): SubagentConfig {
    return {
      ...base,
      ...updates,
      modelConfig: updates.modelConfig
        ? { ...base.modelConfig, ...updates.modelConfig }
        : base.modelConfig,
      runConfig: updates.runConfig
        ? { ...base.runConfig, ...updates.runConfig }
        : base.runConfig,
    };
  }

  // Private helper methods

  private transformToToolNames(tools: string[]): string[] {
    const toolRegistry = this.config.getToolRegistry();
    if (!toolRegistry) {
      return tools;
    }

    const allTools = toolRegistry.getAllTools();
    const result: string[] = [];

    for (const toolIdentifier of tools) {
      // Resolve aliases
      const resolvedName = resolveToolAlias(toolIdentifier);

      // Try exact name match
      const exactNameMatch = allTools.find(
        (tool) => tool.name === resolvedName || tool.name === toolIdentifier,
      );
      if (exactNameMatch) {
        result.push(exactNameMatch.name);
        continue;
      }

      // Try display name match
      const displayNameMatch = allTools.find(
        (tool) =>
          tool.displayName === toolIdentifier ||
          tool.displayName === resolvedName,
      );
      if (displayNameMatch) {
        result.push(displayNameMatch.name);
        continue;
      }

      // Preserve original if no match
      result.push(toolIdentifier);
      this.logger.warn(
        `Tool "${toolIdentifier}" not found in tool registry, preserving as-is`,
      );
    }

    return result;
  }
}

/**
 * Loads subagents from a directory (for extension use)
 */
export async function loadSubagentFromDir(
  baseDir: string,
): Promise<SubagentConfig[]> {
  try {
    const files = await fs.readdir(baseDir);
    const subagents: SubagentConfig[] = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(baseDir, file);

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const validator = new SubagentValidator();

        // Parse frontmatter
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        if (!match) continue;

        const [, frontmatterYaml, systemPrompt] = match;
        const frontmatter = parseYaml(frontmatterYaml) as Record<
          string,
          unknown
        >;

        const nameRaw = frontmatter['name'];
        const descriptionRaw = frontmatter['description'];

        if (nameRaw == null || descriptionRaw == null) continue;

        const config: SubagentConfig = {
          name: String(nameRaw),
          description: String(descriptionRaw),
          tools: frontmatter['tools'] as string[] | undefined,
          systemPrompt: systemPrompt.trim(),
          filePath,
          modelConfig: frontmatter['modelConfig'] as Partial<ModelConfig>,
          runConfig: frontmatter['runConfig'] as Partial<RunConfig>,
          color: frontmatter['color'] as string | undefined,
          level: 'extension',
        };

        const validation = validator.validateConfig(config);
        if (validation.isValid) {
          subagents.push(config);
        }
      } catch {
        continue;
      }
    }

    return subagents;
  } catch {
    return [];
  }
}
