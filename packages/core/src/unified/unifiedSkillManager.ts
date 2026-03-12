/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified Skill Manager
 *
 * Manages skill configurations using the unified resource management system.
 * Extends BaseResourceManager for consistent behavior across all resource types.
 */

import * as fs from 'fs/promises';
import type * as fsSync from 'fs';
import * as path from 'path';
import type { Config } from '../config/config.js';
import type {
  SkillConfig,
  SkillLevel,
  SkillValidationResult,
} from '../skills/types.js';
import { SkillError, SkillErrorCode } from '../skills/types.js';
import { validateConfig } from '../skills/skill-load.js';
import { parse as parseYaml } from '../utils/yaml-parser.js';
import { BaseResourceManager } from './baseResourceManager.js';
import type {
  ResourceLevel,
  ListResourcesOptions,
  CreateResourceOptions,
} from './types.js';

/**
 * Skill-specific configuration directory
 */
const SKILLS_CONFIG_DIR = 'skills';
const SKILL_MANIFEST_FILE = 'SKILL.md';

/**
 * Converts a SkillLevel to a ResourceLevel
 */
function skillLevelToResourceLevel(level: SkillLevel): ResourceLevel {
  return level as ResourceLevel;
}

/**
 * Converts a ResourceLevel to a SkillLevel
 */
function resourceLevelToSkillLevel(level: ResourceLevel): SkillLevel {
  // Filter out invalid levels for skills
  if (level === 'session' || level === 'builtin') {
    return 'project'; // Fallback
  }
  return level as SkillLevel;
}

/**
 * Unified Skill Manager
 *
 * Provides skill management using the unified resource system.
 * This is a bridge between the new unified system and the existing SkillManager API.
 */
export class UnifiedSkillManager extends BaseResourceManager<SkillConfig> {
  private parseErrors: Map<string, SkillError> = new Map();

  constructor(config: Config) {
    super(config, 'skill', SKILLS_CONFIG_DIR);
  }

  /**
   * Gets any parse errors that occurred during skill loading.
   */
  getParseErrors(): Map<string, SkillError> {
    return new Map(this.parseErrors);
  }

  /**
   * Lists all available skills.
   * This is an alias for listResources() for backward compatibility.
   */
  async listSkills(options: ListSkillsOptions = {}): Promise<SkillConfig[]> {
    return this.listResources(options as ListResourcesOptions);
  }

  /**
   * Loads a skill by name.
   * This is an alias for loadResource() for backward compatibility.
   */
  async loadSkill(
    name: string,
    level?: SkillLevel,
  ): Promise<SkillConfig | null> {
    return this.loadResource(
      name,
      level ? skillLevelToResourceLevel(level) : undefined,
    );
  }

  /**
   * Loads a skill for runtime use.
   */
  async loadSkillForRuntime(
    name: string,
    level?: SkillLevel,
  ): Promise<SkillConfig | null> {
    return this.loadSkill(name, level);
  }

  /**
   * Gets the base directory for skills at a specific level.
   */
  getSkillsBaseDir(level: SkillLevel): string {
    return this.getBaseDir(skillLevelToResourceLevel(level));
  }

  /**
   * Parses a SKILL.md file and returns the configuration.
   */
  async parseSkillFile(
    filePath: string,
    level: SkillLevel,
  ): Promise<SkillConfig> {
    const content = await fs.readFile(filePath, 'utf8');
    return this.parseContent(
      content,
      filePath,
      skillLevelToResourceLevel(level),
    );
  }

  /**
   * Validates a skill configuration.
   */
  validateConfig(config: Partial<SkillConfig>): SkillValidationResult {
    return validateConfig(config);
  }

  // Abstract method implementations

  protected override parseContent(
    content: string,
    filePath: string,
    level: ResourceLevel,
  ): SkillConfig {
    try {
      const normalizedContent = this.normalizeContent(content);

      // Split frontmatter and content
      const frontmatterRegex = /^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/;
      const match = normalizedContent.match(frontmatterRegex);

      if (!match) {
        throw new Error('Invalid format: missing YAML frontmatter');
      }

      const [, frontmatterYaml, body] = match;

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

      // Convert to strings
      const name = String(nameRaw);
      const description = String(descriptionRaw);

      // Extract optional fields
      const allowedToolsRaw = frontmatter['allowedTools'] as
        | unknown[]
        | undefined;
      let allowedTools: string[] | undefined;

      if (allowedToolsRaw !== undefined) {
        if (Array.isArray(allowedToolsRaw)) {
          allowedTools = allowedToolsRaw.map(String);
        } else {
          throw new Error('"allowedTools" must be an array');
        }
      }

      const config: SkillConfig = {
        name,
        description,
        allowedTools,
        level: resourceLevelToSkillLevel(level),
        filePath,
        body: body.trim(),
      };

      // Validate the parsed configuration
      const validation = this.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      this.logger.debug(`Successfully parsed skill: ${name}`, {
        level,
        filePath,
      });
      return config;
    } catch (_error) {
      const skillError = new SkillError(
        `Failed to parse skill file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        SkillErrorCode.PARSE_ERROR,
      );
      this.parseErrors.set(filePath, skillError);
      throw skillError;
    }
  }

  protected override serializeContent(skill: SkillConfig): string {
    // Build frontmatter object
    const frontmatter: Record<string, unknown> = {
      name: skill.name,
      description: skill.description,
    };

    if (skill.allowedTools && skill.allowedTools.length > 0) {
      frontmatter['allowedTools'] = skill.allowedTools;
    }

    // Build YAML frontmatter
    const yamlLines: string[] = ['---'];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yamlLines.push(`${key}:`);
        for (const item of value) {
          yamlLines.push(`  - ${item}`);
        }
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
    yamlLines.push('---');
    yamlLines.push('');

    // Combine frontmatter and body
    return yamlLines.join('\n') + (skill.body || '');
  }

  protected override getFileName(resourceName: string): string {
    // Skills are stored in directories with SKILL.md inside
    return `${resourceName}/${SKILL_MANIFEST_FILE}`;
  }

  protected override getBuiltinResources(): SkillConfig[] {
    // Skills don't have built-in resources
    return [];
  }

  protected override getExtensionResources(): SkillConfig[] {
    const extensions = this.config.getActiveExtensions();
    const skills: SkillConfig[] = [];

    for (const extension of extensions) {
      if (extension.skills) {
        for (const skill of extension.skills) {
          skills.push(skill);
        }
      }
    }

    return skills;
  }

  // Override loadResourcesFromDir for skills (they're in subdirectories)

  protected override async loadResourcesFromDir(
    dir: string,
    level: ResourceLevel,
  ): Promise<SkillConfig[]> {
    this.logger.debug(`Loading skills from directory: ${dir}`);

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const skills: SkillConfig[] = [];

      for (const entry of entries) {
        const isDirectory = entry.isDirectory();
        const isSymlink = entry.isSymbolicLink();

        if (!isDirectory && !isSymlink) {
          continue;
        }

        const skillDir = path.join(dir, entry.name);

        // For symlinks, verify the target is a directory
        if (isSymlink) {
          try {
            const targetStat = await fs.stat(skillDir);
            if (!targetStat.isDirectory()) {
              continue;
            }
          } catch {
            continue;
          }
        }

        const skillManifest = path.join(skillDir, SKILL_MANIFEST_FILE);

        try {
          await fs.access(skillManifest);
          const content = await fs.readFile(skillManifest, 'utf8');
          const skill = this.parseContent(content, skillManifest, level);
          skills.push(skill);
        } catch (_error) {
          if (error instanceof SkillError) {
            this.logger.error(
              `Failed to parse skill at ${skillDir}: ${error.message}`,
            );
          } else {
            this.logger.debug(
              `No valid SKILL.md found in ${skillDir}, skipping`,
            );
          }
        }
      }

      return skills;
    } catch (_error) {
      this.logger.debug(`Cannot read skills directory: ${dir}`);
      return [];
    }
  }

  // Override isValidResourceEntry for directories

  protected override isValidResourceEntry(entry: fsSync.Dirent): boolean {
    // Skills are stored in directories
    return entry.isDirectory() || entry.isSymbolicLink();
  }

  // Override createResource for skill-specific behavior

  override async createResource(
    resourceConfig: SkillConfig,
    options: CreateResourceOptions,
  ): Promise<void> {
    // Skills need special handling - create directory with SKILL.md inside
    const skillDir = path.dirname(
      this.getResourcePath(resourceConfig.name, options.level),
    );
    await fs.mkdir(skillDir, { recursive: true });

    // Update filePath to point to SKILL.md
    const skillConfig: SkillConfig = {
      ...resourceConfig,
      filePath: path.join(skillDir, SKILL_MANIFEST_FILE),
    };

    // Call parent implementation
    return super.createResource(skillConfig, options);
  }

  // Helper methods

  private normalizeContent(content: string): string {
    // Strip UTF-8 BOM
    let normalized = content.replace(/^\uFEFF/, '');

    // Normalize line endings
    normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    return normalized;
  }
}

/**
 * Type alias for backward compatibility
 */
export type ListSkillsOptions = {
  /** Filter by storage level */
  level?: SkillLevel;

  /** Force refresh from disk, bypassing cache */
  force?: boolean;

  /** Sort order for results */
  sortBy?: 'name' | 'lastModified' | 'level';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
};
