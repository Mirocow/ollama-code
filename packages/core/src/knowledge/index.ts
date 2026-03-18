/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Knowledge Module
 * Intelligent knowledge storage and retrieval system using embedJs
 */

// Core
export { KnowledgeBase, getKnowledgeBase, initializeKnowledgeBase } from './knowledge-base.js';

// Types
export * from './types.js';

// Verification
export { VerificationExecutor, VerificationSteps } from './verification.js';

// Storage Integration
export {
  performSearch,
  performFindSimilar,
  performAddWithEmbedding,
  performKnowledgeStats,
} from './storage-integration.js';

// Convenience imports
import { KnowledgeBase, getKnowledgeBase, initializeKnowledgeBase } from './knowledge-base.js';
import { VerificationExecutor, VerificationSteps } from './verification.js';

/**
 * Initialize knowledge system
 */
export async function initializeKnowledgeSystem(options?: {
  ollamaBaseUrl?: string;
  embeddingModel?: string;
  persistent?: boolean;
}): Promise<{
  knowledgeBase: KnowledgeBase;
  verificationExecutor: VerificationExecutor;
}> {
  // Initialize knowledge base
  const knowledgeBase = await initializeKnowledgeBase({
    ollamaBaseUrl: options?.ollamaBaseUrl,
    embeddingModel: options?.embeddingModel,
    persistent: options?.persistent ?? true,
  });

  // Create verification executor
  const verificationExecutor = new VerificationExecutor();

  return {
    knowledgeBase,
    verificationExecutor,
  };
}

// Default export
export default {
  KnowledgeBase,
  getKnowledgeBase,
  initializeKnowledgeBase,
  VerificationExecutor,
  VerificationSteps,
  initializeKnowledgeSystem,
};
