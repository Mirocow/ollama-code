/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Prompt Templates Module
 *
 * Provides model-size-optimized system prompts for different model capacities.
 * Larger models receive more detailed instructions, smaller models get concise versions.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Model size tiers for prompt selection
 */
export type ModelSizeTier = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Size thresholds (in billions of parameters)
 */
const SIZE_THRESHOLDS = {
  small: 10, // <= 10B: 8b template
  medium: 30, // <= 30B: 14b template
  large: 60, // <= 60B: 32b template
  xlarge: Infinity, // > 60B: 70b template
} as const;

/**
 * Cache for loaded templates
 */
const templateCache = new Map<string, string>();

/**
 * Get the directory containing template files
 */
function getTemplatesDir(): string {
  // Try multiple possible locations for the templates directory
  const possiblePaths = [
    // When running from bundled cli.js (templates in dist/prompts/templates/)
    path.join(__dirname, 'prompts', 'templates'),
    // When running from dist (compiled JS with templates subdirectory)
    path.join(__dirname, 'templates'),
    // When running from src directly (templates in same directory)
    __dirname,
  ];

  for (const p of possiblePaths) {
    const testPath = path.join(p, 'system-8b.md');
    if (fs.existsSync(testPath)) {
      return p;
    }
  }

  // Log for debugging why templates weren't found
  console.warn(
    `[TEMPLATES] No templates found. __dirname=${__dirname}, checked: ${possiblePaths.map(p => path.join(p, 'system-8b.md')).join(', ')}`,
  );

  // Fallback to current directory
  return __dirname;
}

/**
 * Load a template file by name
 */
function loadTemplate(name: string): string {
  if (templateCache.has(name)) {
    return templateCache.get(name)!;
  }

  const templatesDir = getTemplatesDir();
  const filePath = path.join(templatesDir, name);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    templateCache.set(name, content);
    return content;
  } catch {
    // Return a minimal fallback template if file not found
    console.warn(`Template file not found: ${filePath}, using fallback`);
    return getFallbackTemplate(name);
  }
}

/**
 * Fallback templates when files are not available
 */
function getFallbackTemplate(name: string): string {
  const fallbacks: Record<string, string> = {
    'system-8b.md': `# Role
You are Ollama Code, a CLI agent. Be concise (<3 lines).
Follow project conventions. Use absolute paths.
{{ENVIRONMENT_INFO}}
{{TOOL_LEARNING}}
Respond in user's language.`,
    'system-14b.md': `# Role
You are Ollama Code, a CLI agent for development. Be concise (<3 lines), code/commands unchanged.
Follow project conventions. Use absolute paths: {{ROOT}} + relative.
Before changes: check tests, dependencies. After changes: run linter/tests.
{{ENVIRONMENT_INFO}}
{{TOOL_LEARNING}}
Respond in user's language.`,
    'system-32b.md': `# Role
You are Ollama Code, a CLI agent for development. Be concise (<3 lines), code/commands unchanged.
# Rules
- Follow project conventions
- Use absolute paths: {{ROOT}} + relative
- Before changes: check tests, dependencies
- After changes: run linter/tests
- Never commit without request
{{ENVIRONMENT_INFO}}
{{TOOL_LEARNING}}
Respond in user's language.`,
    'system-70b.md': `# Role
You are Ollama Code, a CLI agent for development. Be concise (<3 lines), code/commands unchanged.
# Rules
- Follow project conventions
- Use absolute paths: {{ROOT}} + relative
- Before changes: check tests, dependencies
- After changes: run linter/tests
- Never commit without request
- For current info: USE web_search tool
{{ENVIRONMENT_INFO}}
{{TOOL_LEARNING}}
Respond in user's language.`,
    'storage-instructions.md': `# Storage
Use model_storage tool for persistent data across sessions.`,
  };
  return fallbacks[name] || fallbacks['system-14b.md'];
}

/**
 * Get the system prompt template for a model size tier
 */
function getTemplateByTier(tier: ModelSizeTier): string {
  const templateMap: Record<ModelSizeTier, string> = {
    small: 'system-8b.md',
    medium: 'system-14b.md',
    large: 'system-32b.md',
    xlarge: 'system-70b.md',
  };
  return loadTemplate(templateMap[tier]);
}

/**
 * Extract model size from model name
 *
 * @param modelName - Model name (e.g., "qwen2.5-coder:7b", "llama3.2:3b")
 * @returns Estimated size in billions of parameters, or undefined if unknown
 */
export function extractModelSize(modelName: string): number | undefined {
  if (!modelName) return undefined;

  const lowerName = modelName.toLowerCase();

  // Common patterns: "7b", "14b", "32b", "70b", etc.
  const sizeMatch = lowerName.match(/[:\-_]?(\d+(?:\.\d+)?)[bB]/);
  if (sizeMatch) {
    return parseFloat(sizeMatch[1]);
  }

  // Model-specific mappings for known models
  const knownModels: Record<string, number> = {
    // Qwen family
    'qwen2.5-coder:7b': 7,
    'qwen2.5-coder:14b': 14,
    'qwen2.5-coder:32b': 32,
    'qwen3-coder:30b': 30,
    'qwen2.5:7b': 7,
    'qwen2.5:14b': 14,
    'qwen2.5:32b': 32,
    'qwen2.5:72b': 72,

    // Llama family
    'llama3.2:1b': 1,
    'llama3.2:3b': 3,
    'llama3.1:8b': 8,
    'llama3.1:70b': 70,
    'llama3.1:405b': 405,
    'llama3:8b': 8,
    'llama3:70b': 70,

    // Mistral family
    'mistral:7b': 7,
    'mixtral:8x7b': 47, // MoE
    'mixtral:8x22b': 141, // MoE
    'mistral-nemo:12b': 12,
    'mistral-large': 123,

    // DeepSeek family
    'deepseek-r1:8b': 8,
    'deepseek-r1:14b': 14,
    'deepseek-r1:32b': 32,
    'deepseek-r1:70b': 70,
    'deepseek-coder:6.7b': 6.7,
    'deepseek-coder:33b': 33,

    // Code family
    'codellama:7b': 7,
    'codellama:13b': 13,
    'codellama:34b': 34,
    'codellama:70b': 70,

    // Phi family
    'phi3:mini': 3.8,
    'phi3:small': 7,
    'phi3:medium': 14,
    'phi3.5:3.8b': 3.8,

    // Gemma family
    'gemma:2b': 2,
    'gemma:7b': 7,
    'gemma2:9b': 9,
    'gemma2:27b': 27,
  };

  for (const [pattern, size] of Object.entries(knownModels)) {
    if (lowerName.includes(pattern.toLowerCase())) {
      return size;
    }
  }

  // Default sizes for model families
  if (lowerName.includes('tiny')) return 1;
  if (lowerName.includes('mini')) return 3;
  if (lowerName.includes('small')) return 7;
  if (lowerName.includes('medium')) return 14;
  if (lowerName.includes('large')) return 70;

  return undefined;
}

/**
 * Determine size tier for a model
 *
 * @param modelName - Model name
 * @returns Size tier for prompt selection
 */
export function getSizeTier(modelName: string): ModelSizeTier {
  const size = extractModelSize(modelName);

  if (size === undefined) {
    // Default to medium for unknown models
    return 'medium';
  }

  if (size <= SIZE_THRESHOLDS.small) return 'small';
  if (size <= SIZE_THRESHOLDS.medium) return 'medium';
  if (size <= SIZE_THRESHOLDS.large) return 'large';
  return 'xlarge';
}

/**
 * Get the system prompt template for a model
 *
 * @param modelName - Model name (optional, defaults to medium tier)
 * @returns System prompt template content
 */
export function getSystemPromptTemplate(modelName?: string): string {
  const tier = modelName ? getSizeTier(modelName) : 'medium';
  return getTemplateByTier(tier);
}

/**
 * Get storage instructions template
 *
 * @returns Storage instructions content
 */
export function getStorageInstructions(): string {
  return loadTemplate('storage-instructions.md');
}

/**
 * Get all available templates
 *
 * @returns Map of tier to template content
 */
export function getAllTemplates(): Record<ModelSizeTier, string> {
  return {
    small: getTemplateByTier('small'),
    medium: getTemplateByTier('medium'),
    large: getTemplateByTier('large'),
    xlarge: getTemplateByTier('xlarge'),
  };
}

/**
 * Clear the template cache
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

/**
 * Template placeholder types
 */
export interface TemplatePlaceholders {
  ENVIRONMENT_INFO: string;
  TOOL_LEARNING: string;
  TOOL_CALL_FORMAT: string;
  SANDBOX_INFO: string;
  GIT_INFO: string;
  ROOT: string;
}

/**
 * Fill template placeholders
 *
 * @param template - Template content
 * @param placeholders - Placeholder values
 * @returns Filled template
 */
export function fillTemplatePlaceholders(
  template: string,
  placeholders: Partial<TemplatePlaceholders>,
): string {
  let result = template;

  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  }

  // Remove any remaining placeholders
  result = result.replace(/\{\{[A-Z_]+\}\}/g, '');

  return result;
}

/**
 * Get recommended model for prompt tier
 *
 * @param tier - Size tier
 * @returns Recommended model examples
 */
export function getRecommendedModelsForTier(tier: ModelSizeTier): string[] {
  const recommendations: Record<ModelSizeTier, string[]> = {
    small: [
      'llama3.2:1b',
      'llama3.2:3b',
      'phi3:mini',
      'gemma:2b',
      'qwen2.5-coder:7b',
    ],
    medium: [
      'llama3.1:8b',
      'mistral:7b',
      'qwen2.5-coder:14b',
      'deepseek-r1:8b',
      'deepseek-r1:14b',
    ],
    large: [
      'qwen2.5-coder:32b',
      'qwen3-coder:30b',
      'deepseek-r1:32b',
      'mixtral:8x7b',
      'gemma2:27b',
    ],
    xlarge: [
      'llama3.1:70b',
      'qwen2.5:72b',
      'deepseek-r1:70b',
      'mixtral:8x22b',
      'mistral-large',
    ],
  };

  return recommendations[tier];
}

// Export template names for external use
export const TEMPLATE_FILES = {
  small: 'system-8b.md',
  medium: 'system-14b.md',
  large: 'system-32b.md',
  xlarge: 'system-70b.md',
};
export { SIZE_THRESHOLDS };
