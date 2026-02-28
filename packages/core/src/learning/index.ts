/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Self-Learning Module
 *
 * This module provides the self-learning capabilities for Ollama Code.
 * It allows the AI model to learn from user interactions and improve over time.
 *
 * ## How it works
 *
 * 1. **Corrections**: When a user corrects the model's response, the correction
 *    is stored with context for future reference.
 *
 * 2. **Success Tracking**: Successful interactions are recorded to build
 *    statistics about which tools and approaches work best.
 *
 * 3. **Pattern Recognition**: The system identifies patterns in user behavior
 *    and project types to provide better suggestions.
 *
 * ## Data Storage
 *
 * All learning data is stored in `~/.ollama-code/learning/`:
 * - `entries.json`: Learning entries (corrections, successes)
 * - `tool_stats.json`: Tool usage statistics
 *
 * ## Privacy
 *
 * Learning data is stored locally and never sent to external servers.
 * Users can export, import, or clear their learning data at any time.
 *
 * ## Usage in Model Context
 *
 * The learning summary is included in the model's system context to help
 * it make better decisions based on past interactions.
 *
 * @example
 * ```typescript
 * import { getSelfLearningManager } from './learning/index.js';
 *
 * const learning = getSelfLearningManager();
 * await learning.initialize();
 *
 * // Record a correction
 * learning.recordCorrection(
 *   'Create a React component',
 *   'Created with class component',
 *   'Should use functional component with hooks',
 *   { language: 'typescript' }
 * );
 *
 * // Get learning summary for context
 * const summary = learning.getLearningSummary();
 * ```
 */

export {
  SelfLearningManager,
  getSelfLearningManager,
  type LearningEntry,
  type ToolUsageStats,
  type ProjectPattern,
} from './self-learning.js';
