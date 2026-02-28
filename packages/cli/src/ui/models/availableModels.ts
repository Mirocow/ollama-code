/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthType,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_VISION_MODEL,
  supportsVision,
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

export const MAINLINE_VLM = DEFAULT_VISION_MODEL;
export const MAINLINE_CODER = DEFAULT_OLLAMA_MODEL;

/**
 * Predefined list of popular Ollama models for UI display.
 * isVision is computed dynamically using supportsVision() from model-definitions.
 */
export const AVAILABLE_MODELS_OLLAMA: AvailableModel[] = [
  {
    id: MAINLINE_CODER,
    label: MAINLINE_CODER,
    get description() {
      return t('Llama 3.2 — excellent for coding tasks');
    },
    get isVision() {
      return supportsVision(MAINLINE_CODER);
    },
  },
  {
    id: 'llama3.2',
    label: 'llama3.2',
    get description() {
      return t('Meta Llama 3.2 — versatile model');
    },
    get isVision() {
      return supportsVision('llama3.2');
    },
  },
  {
    id: MAINLINE_VLM,
    label: MAINLINE_VLM,
    get description() {
      return t('LLaVA — vision-language model for image understanding');
    },
    get isVision() {
      return supportsVision(MAINLINE_VLM);
    },
  },
  {
    id: 'deepseek-coder-v2',
    label: 'deepseek-coder-v2',
    get description() {
      return t('DeepSeek Coder V2 — powerful coding model');
    },
    get isVision() {
      return supportsVision('deepseek-coder-v2');
    },
  },
  {
    id: 'mistral',
    label: 'mistral',
    get description() {
      return t('Mistral — fast and efficient model');
    },
    get isVision() {
      return supportsVision('mistral');
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
        get isVision() {
          return supportsVision(id);
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
    isVision:
      coreModel.isVision ??
      coreModel.capabilities?.vision ??
      supportsVision(coreModel.id),
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

// Re-export from core for backward compatibility
export {
  getDefaultVisionModel,
  supportsVision as isVisionModel,
} from '@ollama-code/ollama-code-core';
