/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Skill Tools Plugin - Created with GLM-5 from Z.AI
 */

/**
 * Skill Tools Plugin
 *
 * Built-in plugin providing skill management and execution tools.
 * Skills allow users to define reusable configurations that can be loaded
 * by the model via a dedicated Skills tool.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

/**
 * Tool: skill
 * Execute a skill within the main conversation
 */
const skillTool: PluginTool = {
  id: 'skill',
  name: 'skill',
  description: `Execute a skill within the main conversation

When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to invoke:
- Use this tool with the skill name only (no arguments)
- Examples:
  - \`skill: "pdf"\` - invoke the pdf skill
  - \`skill: "xlsx"\` - invoke the xlsx skill
  - \`skill: "ms-office-suite:pdf"\` - invoke using fully qualified name

Important:
- When a skill is relevant, you must invoke this tool IMMEDIATELY as your first action
- NEVER just announce or mention a skill in your text response without actually calling this tool
- This is a BLOCKING REQUIREMENT: invoke the relevant Skill tool BEFORE generating any other response about the task
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already running
- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)
- When executing scripts or loading referenced files, ALWAYS resolve absolute paths from skill's base directory.`,
  parameters: {
    type: 'object',
    properties: {
      skill: {
        type: 'string',
        description: 'The skill name (no arguments). E.g., "pdf" or "xlsx"',
      },
    },
    required: ['skill'],
    additionalProperties: false,
  },
  category: 'other',
  execute: async (params, context) => {
    const skillName = params['skill'] as string;

    // Note: Full implementation uses SkillTool class from tools/skill.ts
    // This is a placeholder that integrates with the plugin system
    return {
      success: true,
      data: {
        message: `Skill "${skillName}" invoked. Full implementation uses SkillTool class.`,
        skill: skillName,
      },
      display: {
        summary: `Skill: ${skillName}`,
      },
    };
  },
};

/**
 * Tool: list_skills
 * List all available skills
 */
const listSkillsTool: PluginTool = {
  id: 'list_skills',
  name: 'list_skills',
  description: 'List all available skills from project, user, and extension levels',
  parameters: {
    type: 'object',
    properties: {
      level: {
        type: 'string',
        enum: ['project', 'user', 'extension'],
        description: 'Filter by skill level (optional)',
      },
    },
  },
  category: 'read',
  execute: async (params, context) => {
    const level = params['level'] as string | undefined;

    // Note: Full implementation uses SkillManager class
    return {
      success: true,
      data: {
        message: 'Skills listed. Full implementation uses SkillManager class.',
        level: level || 'all',
      },
      display: {
        summary: `Listed skills${level ? ` at ${level} level` : ''}`,
      },
    };
  },
};

/**
 * Skill Tools Plugin Definition
 */
const skillToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'skill-tools',
    name: 'Skill Tools',
    version: '1.0.0',
    description: 'Skill management and execution tools for reusable configurations',
    author: 'Ollama Code Team',
    tags: ['core', 'skill', 'configuration', 'reusable'],
    enabledByDefault: true,
  },

  tools: [skillTool, listSkillsTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Skill Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Skill Tools plugin enabled');
    },
  },

  defaultConfig: {
    skillsDirectories: ['.ollama-code/skills', '~/.ollama-code/skills'],
    cacheEnabled: true,
    watchForChanges: true,
  },
};

export default skillToolsPlugin;

// Re-export types for external use
export type { SkillConfig, SkillLevel } from '../../../skills/types.js';
export { SkillManager } from '../../../skills/skill-manager.js';
export { SkillError, SkillErrorCode } from '../../../skills/types.js';
