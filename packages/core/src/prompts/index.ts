/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Prompts Module
 * 
 * Provides system prompts for different model sizes:
 * - 8b: Compact for small models (<= 10B parameters)
 * - 14b: Standard for medium models (<= 30B parameters)
 * - 32b: Extended for large models (<= 60B parameters)
 * - 70b: Full for extra-large models (> 60B parameters)
 */

export {
  // Template management
  getSystemPromptTemplate,
  getAllTemplates,
  fillTemplatePlaceholders,
  clearTemplateCache,
  
  // Model size utilities
  extractModelSize,
  getSizeTier,
  getRecommendedModelsForTier,
  
  // Types
  type ModelSizeTier,
  type TemplatePlaceholders,
  
  // Constants
  TEMPLATE_FILES,
  SIZE_THRESHOLDS,
} from './templates/index.js';
