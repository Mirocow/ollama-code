/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory Bank Module
 *
 * Implements the Memory Bank pattern for AI agent long-term memory.
 * Based on the pattern described by kilo.ai and Osvaldo J.
 *
 * Usage:
 * ```typescript
 * import { getMemoryBank, MemoryBankFileType } from './memory-bank';
 *
 * // Initialize
 * const mb = getMemoryBank();
 * await mb.initialize();
 *
 * // Read all files (Startup Read Protocol)
 * const context = await mb.readAll();
 *
 * // Get context for model injection
 * const prompt = await mb.getContextForModel();
 *
 * // Update active context (Write-Back Protocol)
 * await mb.updateActiveContext({
 *   currentFocus: 'Implementing feature X',
 *   nextSteps: ['Write tests', 'Update docs'],
 * });
 * ```
 */

export * from './types.js';
export * from './memory-bank-manager.js';
