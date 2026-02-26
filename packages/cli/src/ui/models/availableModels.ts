/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthType,
  DEFAULT_OLLAMA_MODEL,
  type Config,
  type AvailableModel as CoreAvailableModel,
} from '@ollama-code/ollama-code-core';
import { t } from '../../i18n/index.js';

export type AvailableModel = {
  id: string;
  label: string;
  description?: string;
  isVision?: boolean;
};

export const MAINLINE_VLM = 'llava';
export const MAINLINE_CODER = DEFAULT_OLLAMA_MODEL;

export const AVAILABLE_MODELS_OLLAMA: AvailableModel[] = [
  {
    id: MAINLINE_CODER,
    label: MAINLINE_CODER,
    get description() {
      return t('Qwen 2.5 Coder — excellent for coding tasks');
    },
  },
  {
    id: 'llama3.2',
    label: 'llama3.2',
    get description() {
      return t('Meta Llama 3.2 — versatile model');
    },
  },
  {
    id: MAINLINE_VLM,
    label: MAINLINE_VLM,
    get description() {
      return t('LLaVA — vision-language model for image understanding');
    },
    isVision: true,
  },
  {
    id: 'deepseek-coder-v2',
    label: 'deepseek-coder-v2',
    get description() {
      return t('DeepSeek Coder V2 — powerful coding model');
    },
  },
  {
    id: 'mistral',
    label: 'mistral',
    get description() {
      return t('Mistral — fast and efficient model');
    },
  },
];

/**
 * Get available Ollama models filtered by vision model preview setting
 */
export function getFilteredOllamaModels(
  visionModelPreviewEnabled: boolean,
): AvailableModel[] {
  if (visionModelPreviewEnabled) {
    return AVAILABLE_MODELS_OLLAMA;
  }
  return AVAILABLE_MODELS_OLLAMA.filter((model) => !model.isVision);
}

/**
 * Get available Ollama model from environment variable
 */
export function getOllamaAvailableModelFromEnv(): AvailableModel | null {
  const id = process.env['OLLAMA_MODEL']?.trim();
  return id
    ? {
        id,
        label: id,
        get description() {
          return t('Configured via OLLAMA_MODEL environment variable');
        },
      }
    : null;
}

/**
 * Convert core AvailableModel to CLI AvailableModel format
 */
function convertCoreModelToCliModel(
  coreModel: CoreAvailableModel,
): AvailableModel {
  return {
    id: coreModel.id,
    label: coreModel.label,
    description: coreModel.description,
    isVision: coreModel.isVision ?? coreModel.capabilities?.vision ?? false,
  };
}

/**
 * Get available models for the given authType.
 *
 * For Ollama, returns models from config or default list.
 */
export function getAvailableModelsForAuthType(
  authType: AuthType,
  config?: Config,
): AvailableModel[] {
  // Only Ollama is supported
  if (authType !== AuthType.USE_OLLAMA) {
    return [];
  }

  // Use config's model registry when available
  if (config) {
    try {
      const models = config.getAvailableModelsForAuthType(authType);
      if (models.length > 0) {
        return models.map(convertCoreModelToCliModel);
      }
    } catch {
      // If config throws (e.g., not initialized), fall back to defaults
    }
  }

  // Fall back to environment variable or default list
  const envModel = getOllamaAvailableModelFromEnv();
  if (envModel) {
    return [envModel];
  }

  return AVAILABLE_MODELS_OLLAMA;
}

/**
 * Default vision model for Ollama
 */
export function getDefaultVisionModel(): string {
  return MAINLINE_VLM;
}

export function isVisionModel(modelId: string): boolean {
  return AVAILABLE_MODELS_OLLAMA.some(
    (model) => model.id === modelId && model.isVision,
  );
}
