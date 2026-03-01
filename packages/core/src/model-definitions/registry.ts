/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ModelCapabilities,
  ModelDefinition,
  ModelFamilyDefinition,
  ToolCallFormat,
} from './types.js';

/**
 * Default capabilities when no family matches.
 */
const DEFAULT_CAPABILITIES: ModelCapabilities = {
  tools: false,
  vision: false,
  thinking: false,
  structuredOutput: false,
};

/**
 * Model family definitions - declarative configuration.
 * Order matters: more specific families should come first.
 */
export const MODEL_FAMILIES: ModelFamilyDefinition[] = [
  // ============================================================================
  // Code/Tool-focused models
  // ============================================================================

  {
    id: 'qwen',
    displayName: 'Qwen',
    description: 'Alibaba Qwen models (qwen2.5, qwen3, qwq)',
    pattern: /qwen|qwq/i,
    defaultCapabilities: {
      tools: true,
      vision: false,
      thinking: false,
      structuredOutput: true,
    },
    defaultOutputFormat: 'qwen',
    modelOverrides: [
      { pattern: /qwen[-_]?2\.?5[-_]?coder/i, capabilities: { tools: true } },
      { pattern: /qwen[-_]?3[-_]?coder/i, capabilities: { tools: true } },
      { pattern: /qwen[-_]?3[-_]?tools/i, capabilities: { tools: true } },
      { pattern: /qwq/i, capabilities: { tools: true, thinking: true } },
      {
        pattern: /qwen[-_]?2\.?5(?![-_]?coder)/i,
        capabilities: { tools: false },
      },
      {
        pattern: /qwen[-_]?2\.?5[-_]?instruct/i,
        capabilities: { tools: true },
      },
      { pattern: /qwen[-_]?3(?![-_]?coder)/i, capabilities: { tools: true } },
    ],
    detectCapabilities: (modelName: string) => {
      const name = modelName.toLowerCase();
      // Default: instruct or tools tags enable tools
      if (/instruct|tools/i.test(name)) {
        return { tools: true };
      }
      return null;
    },
  },

  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    description: 'DeepSeek models (deepseek-coder, deepseek-r1, deepseek-v3)',
    pattern: /deepseek/i,
    defaultCapabilities: {
      tools: true,
      vision: false,
      thinking: false,
      structuredOutput: true,
    },
    defaultOutputFormat: 'deepseek',
    modelOverrides: [
      {
        pattern: /deepseek[-_]?r1/i,
        capabilities: { tools: true, thinking: true },
      },
      { pattern: /deepseek[-_]?coder/i, capabilities: { tools: true } },
      { pattern: /deepseek[-_]?v?3/i, capabilities: { tools: true } },
      { pattern: /deepseek[-_]?v?2\.?5/i, capabilities: { tools: true } },
    ],
    detectCapabilities: (modelName: string) => {
      const name = modelName.toLowerCase();
      if (/instruct|chat/i.test(name)) {
        return { tools: true };
      }
      return null;
    },
  },

  {
    id: 'command',
    displayName: 'Command',
    description: 'Cohere Command models (command-r, command-r-plus)',
    pattern: /command/i,
    defaultCapabilities: {
      tools: true,
      vision: false,
      thinking: false,
      structuredOutput: true,
    },
    defaultOutputFormat: 'native',
  },

  // ============================================================================
  // General purpose models
  // ============================================================================

  {
    id: 'llama',
    displayName: 'Llama',
    description: 'Meta Llama models (llama3.1, llama3.2, llama3.3, codellama)',
    pattern: /llama|codellama/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
    modelOverrides: [
      { pattern: /llama[-_]?3\.?1/i, capabilities: { tools: true } },
      {
        pattern: /llama[-_]?3\.?2[-_]?vision/i,
        capabilities: { tools: true, vision: true },
      },
      { pattern: /llama[-_]?3\.?3/i, capabilities: { tools: true } },
      { pattern: /codellama/i, capabilities: { tools: true } },
      {
        pattern: /llama[-_]?3\.?2(?![-_]?vision)/i,
        capabilities: { tools: true },
      },
    ],
  },

  {
    id: 'openai',
    displayName: 'OpenAI',
    description: 'OpenAI GPT models (gpt-4, gpt-3.5, o1, o3)',
    pattern: /gpt|o1|o3/i,
    defaultCapabilities: {
      tools: true,
      vision: false,
      thinking: false,
      structuredOutput: true,
    },
    defaultOutputFormat: 'native',
    modelOverrides: [
      { pattern: /gpt[-_]?4[-_]?o/i, capabilities: { vision: true } },
      { pattern: /gpt[-_]?4[-_]?turbo/i, capabilities: { vision: true } },
      { pattern: /o1/i, capabilities: { thinking: true } },
      { pattern: /o3/i, capabilities: { thinking: true, vision: true } },
    ],
  },

  {
    id: 'mistral',
    displayName: 'Mistral',
    description: 'Mistral AI models (mistral, mixtral, codestral)',
    pattern: /mistral|mixtral|codestral/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: true,
    },
    defaultOutputFormat: 'mistral',
    modelOverrides: [
      { pattern: /codestral/i, capabilities: { tools: true } },
      { pattern: /mixtral/i, capabilities: { tools: true } },
      { pattern: /mistral.*instruct/i, capabilities: { tools: true } },
      {
        pattern: /mistral[-_](?:small|medium|large)/i,
        capabilities: { tools: true },
      },
    ],
  },

  {
    id: 'gemma',
    displayName: 'Gemma',
    description: 'Google Gemma models (gemma-2, gemma-3, codegemma)',
    pattern: /gemma/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
    modelOverrides: [
      { pattern: /gemma[-_]?3/i, capabilities: { tools: true, vision: true } },
      { pattern: /codegemma/i, capabilities: { tools: true } },
      {
        pattern: /gemma.*(?:instruct|it)[-_]?(?:\d|$)/i,
        capabilities: { tools: true },
      },
    ],
  },

  {
    id: 'phi',
    displayName: 'Phi',
    description: 'Microsoft Phi models (phi-3, phi-3.5, phi-4)',
    pattern: /phi[-_]?[34]/i,
    defaultCapabilities: {
      tools: true,
      vision: false,
      thinking: false,
      structuredOutput: true,
    },
    defaultOutputFormat: 'phi',
    modelOverrides: [{ pattern: /phi[-_]?2/i, capabilities: { tools: false } }],
  },

  {
    id: 'yi',
    displayName: 'Yi',
    description: '01.ai Yi models (yi, yi-coder, yi-large)',
    pattern: /\byi\b|yi[-_]?coder|yi[-_]?large|yi[-_]?chat/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'qwen',
    modelOverrides: [
      { pattern: /yi[-_]?coder/i, capabilities: { tools: true } },
      { pattern: /yi[-_]?large/i, capabilities: { tools: true } },
      { pattern: /yi[-_]?chat/i, capabilities: { tools: true } },
    ],
  },

  {
    id: 'granite',
    displayName: 'Granite',
    description: 'IBM Granite models (granite-3b, granite-7b, granite-code)',
    pattern: /granite/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
    modelOverrides: [
      { pattern: /granite[-_]?3/i, capabilities: { tools: true } },
      { pattern: /granite[-_]?code/i, capabilities: { tools: true } },
      { pattern: /granite[-_]?instruct/i, capabilities: { tools: true } },
    ],
  },

  {
    id: 'dbrx',
    displayName: 'DBRX',
    description: 'Databricks DBRX models',
    pattern: /dbrx/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
    modelOverrides: [
      { pattern: /dbrx[-_]?instruct/i, capabilities: { tools: true } },
    ],
  },

  {
    id: 'solar',
    displayName: 'Solar',
    description: 'Upstage Solar models',
    pattern: /solar/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
    modelOverrides: [
      { pattern: /solar[-_]?pro/i, capabilities: { tools: true } },
      { pattern: /solar.*instruct/i, capabilities: { tools: true } },
    ],
  },

  // ============================================================================
  // Code-specific models (limited tool support)
  // ============================================================================

  {
    id: 'starcoder',
    displayName: 'StarCoder',
    description: 'StarCoder code models (starcoder, starcoder2)',
    pattern: /starcoder|stable[-_]?code/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
  },

  // ============================================================================
  // Additional models
  // ============================================================================

  {
    id: 'olmo',
    displayName: 'OLMo',
    description: 'AllenAI OLMo models',
    pattern: /olmo/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
    modelOverrides: [
      { pattern: /olmo[-_]?2/i, capabilities: { tools: true } },
      { pattern: /olmo[-_]?instruct/i, capabilities: { tools: true } },
    ],
  },

  {
    id: 'neural-chat',
    displayName: 'Neural Chat',
    description: 'Intel Neural Chat models',
    pattern: /neural[-_]?chat/i,
    defaultCapabilities: {
      tools: false,
      vision: false,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
    modelOverrides: [
      { pattern: /neural[-_]?chat[-_]?v?3/i, capabilities: { tools: true } },
    ],
  },

  // ============================================================================
  // Vision models (typically no tools)
  // ============================================================================

  {
    id: 'llava',
    displayName: 'LLaVA',
    description: 'LLaVA vision models (llava, bakllava, moondream, minicpm-v)',
    pattern: /llava|bakllava|moondream|minicpm[-_]?v/i,
    defaultCapabilities: {
      tools: false,
      vision: true,
      thinking: false,
      structuredOutput: false,
    },
    defaultOutputFormat: 'native',
  },
];

/**
 * Find the matching family for a model name.
 */
export function findModelFamily(
  modelName: string,
): ModelFamilyDefinition | null {
  for (const family of MODEL_FAMILIES) {
    if (family.pattern.test(modelName)) {
      return family;
    }
  }
  return null;
}

/**
 * Merge capabilities with defaults.
 */
function mergeCapabilities(
  base: Partial<ModelCapabilities>,
  override: Partial<ModelCapabilities>,
): ModelCapabilities {
  return {
    tools: override.tools ?? base.tools ?? DEFAULT_CAPABILITIES.tools,
    vision: override.vision ?? base.vision ?? DEFAULT_CAPABILITIES.vision,
    thinking:
      override.thinking ?? base.thinking ?? DEFAULT_CAPABILITIES.thinking,
    structuredOutput:
      override.structuredOutput ??
      base.structuredOutput ??
      DEFAULT_CAPABILITIES.structuredOutput,
  };
}

/**
 * Get model capabilities.
 */
export function getModelCapabilities(modelName: string): ModelCapabilities {
  const definition = getModelDefinition(modelName);
  return definition.capabilities;
}

/**
 * Get full model definition.
 */
export function getModelDefinition(modelName: string): ModelDefinition {
  const family = findModelFamily(modelName);

  if (!family) {
    return {
      modelName,
      family: {
        id: 'unknown',
        displayName: 'Unknown',
        pattern: /^$/,
        defaultCapabilities: DEFAULT_CAPABILITIES,
        defaultOutputFormat: 'auto',
      },
      capabilities: DEFAULT_CAPABILITIES,
      outputFormat: 'auto',
    };
  }

  // Start with family defaults
  let capabilities = mergeCapabilities(
    DEFAULT_CAPABILITIES,
    family.defaultCapabilities,
  );

  // Apply model overrides
  if (family.modelOverrides) {
    for (const override of family.modelOverrides) {
      if (override.pattern.test(modelName)) {
        capabilities = mergeCapabilities(capabilities, override.capabilities);
      }
    }
  }

  // Apply custom detection
  if (family.detectCapabilities) {
    const detected = family.detectCapabilities(modelName);
    if (detected) {
      capabilities = mergeCapabilities(capabilities, detected);
    }
  }

  return {
    modelName,
    family,
    capabilities,
    outputFormat: family.defaultOutputFormat,
  };
}

/**
 * Check if model supports tools.
 */
export function supportsTools(modelName: string): boolean {
  return getModelCapabilities(modelName).tools;
}

/**
 * Check if model supports vision.
 */
export function supportsVision(modelName: string): boolean {
  return getModelCapabilities(modelName).vision;
}

/**
 * Check if model supports thinking.
 */
export function supportsThinking(modelName: string): boolean {
  return getModelCapabilities(modelName).thinking;
}

/**
 * Get tool call format for model.
 */
export function getToolCallFormat(modelName: string): ToolCallFormat {
  return getModelDefinition(modelName).outputFormat;
}

/**
 * Default vision model for Ollama.
 */
export const DEFAULT_VISION_MODEL = 'llava';

/**
 * Get default vision model for Ollama.
 * Returns the model ID of the default vision-capable model.
 */
export function getDefaultVisionModel(): string {
  return DEFAULT_VISION_MODEL;
}
