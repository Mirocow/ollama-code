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
 * ## Components
 *
 * ### 1. General Learning (self-learning.ts)
 * - Tracks user corrections
 * - Records successful patterns
 * - Maintains tool usage statistics
 *
 * ### 2. Tool Learning (tool-learning.ts)
 * - Detects tool call errors (hallucinated tool names)
 * - Creates dynamic aliases for common mistakes
 * - Generates learning feedback for the model
 *
 * ## Data Storage
 *
 * All learning data is stored in `~/.ollama-code/learning/`:
 * - `entries.json`: General learning entries
 * - `tool_stats.json`: Tool usage statistics
 * - `tool_errors.json`: Tool call error records
 * - `dynamic_aliases.json`: Dynamically created aliases
 * - `tool_learning_stats.json`: Per-tool learning statistics
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
 * import {
 *   getSelfLearningManager,
 *   getToolLearningManager
 * } from './learning/index.js';
 *
 * // Initialize learning systems
 * const learning = getSelfLearningManager();
 * const toolLearning = getToolLearningManager();
 *
 * await learning.initialize();
 * await toolLearning.initialize();
 *
 * // Record a tool error
 * const error = toolLearning.recordToolError(
 *   'git_dev',  // Wrong tool name
 *   'run_shell_command',  // Correct tool
 *   0.95,  // Confidence
 *   { modelId: 'llama3' }
 * );
 *
 * // Get learning context for system prompt
 * const context = toolLearning.generateLearningContext();
 * ```
 */

export {
  SelfLearningManager,
  getSelfLearningManager,
  type LearningEntry,
  type ToolUsageLearningStats,
  type ProjectPattern,
} from './self-learning.js';

export {
  ToolLearningManager,
  getToolLearningManager,
  type ToolCallError,
  type ToolLearningStats,
  type DynamicAlias,
  type LearningFeedback,
} from './tool-learning.js';
