/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * System Prompt Optimizer
 * 
 * This module optimizes system prompts and tool definitions to reduce token usage:
 * 1. Caches static parts of system prompt
 * 2. Filters tools based on context
 * 3. Compresses prompts for smaller context models
 */

import { createHash } from 'node:crypto';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('PROMPT_OPTIMIZER');

/**
 * Tool categories for context-based filtering
 */
export const ToolCategories = {
  // Core tools - always needed
  core: [
    'read_file',
    'read_many_files',
    'write_file',
    'edit',
    'run_shell_command',
    'grep_search',
    'glob',
    'list_directory',
  ],

  // Task management
  taskManagement: ['todo_write'],

  // Memory and context
  memory: ['save_memory'],

  // Subagent delegation
  delegation: ['task', 'skill'],

  // Development tools by language
  python: ['python_dev'],
  nodejs: ['nodejs_dev'],
  golang: ['golang_dev'],
  rust: ['rust_dev'],
  java: ['java_dev'],
  cpp: ['cpp_dev'],
  swift: ['swift_dev'],

  // Database and data
  database: ['redis', 'database'],

  // Web and API
  web: ['web_fetch', 'web_search'],

  // Diagrams and visualization
  visualization: ['diagram_generator'],

  // Code analysis
  analysis: ['code_analyzer', 'api_tester'],

  // Git advanced
  git: ['git_advanced'],
} as const;

export type ToolCategory = keyof typeof ToolCategories;

/**
 * Task type detection patterns
 */
const TaskPatterns = {
  web: /\b(web|http|api|fetch|request|url|endpoint|rest|graphql)\b/i,
  database: /\b(database|sql|redis|postgres|mysql|mongodb|query|table)\b/i,
  python: /\b(python|py|pip|django|flask|fastapi|pytest)\b/i,
  nodejs: /\b(node|npm|javascript|typescript|react|vue|express|next\.?js)\b/i,
  golang: /\b(golang|go\s|go\.mod|goroutine|channel)\b/i,
  rust: /\b(rust|cargo|rustc|crates)\b/i,
  git: /\b(git|commit|push|pull|branch|merge|rebase)\b/i,
  analysis: /\b(analyze|refactor|review|audit|inspect)\b/i,
} as const;

/**
 * System prompt cache entry
 */
interface CachedPrompt {
  hash: string;
  staticPart: string;
  tokenCount: number;
  timestamp: number;
}

/**
 * Prompt Optimizer class
 */
export class SystemPromptOptimizer {
  private static instance: SystemPromptOptimizer | null = null;
  private cachedStaticPrompt: CachedPrompt | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SystemPromptOptimizer {
    if (!this.instance) {
      this.instance = new SystemPromptOptimizer();
    }
    return this.instance;
  }

  /**
   * Split system prompt into static and dynamic parts
   * Static part can be cached, dynamic part changes per session
   */
  splitPrompt(prompt: string): { staticPart: string; dynamicPart: string } {
    // Find dynamic sections by markers
    const dynamicMarkers = [
      '## Environment',
      '# Tool Learning Context',
      '# Tool Call Format',
    ];

    let splitIndex = prompt.length;

    for (const marker of dynamicMarkers) {
      const idx = prompt.indexOf(marker);
      if (idx !== -1 && idx < splitIndex) {
        splitIndex = idx;
      }
    }

    return {
      staticPart: prompt.slice(0, splitIndex),
      dynamicPart: prompt.slice(splitIndex),
    };
  }

  /**
   * Get cached static prompt or compute new one
   */
  getCachedStaticPrompt(prompt: string): { hash: string; staticPart: string; isNew: boolean } {
    const { staticPart } = this.splitPrompt(prompt);
    const hash = this.computeHash(staticPart);

    // Check if cache is valid
    if (
      this.cachedStaticPrompt &&
      this.cachedStaticPrompt.hash === hash &&
      Date.now() - this.cachedStaticPrompt.timestamp < this.CACHE_TTL
    ) {
      debugLogger.debug('Using cached static prompt');
      return {
        hash,
        staticPart: this.cachedStaticPrompt.staticPart,
        isNew: false,
      };
    }

    // Cache new static part
    this.cachedStaticPrompt = {
      hash,
      staticPart,
      tokenCount: this.estimateTokens(staticPart),
      timestamp: Date.now(),
    };

    debugLogger.debug('Cached new static prompt', {
      tokenCount: this.cachedStaticPrompt.tokenCount,
    });

    return {
      hash,
      staticPart,
      isNew: true,
    };
  }

  /**
   * Estimate token count for a string
   * Uses simple heuristic: ~4 chars per token for English
   */
  estimateTokens(text: string): number {
    // More accurate estimation considering:
    // - Code has fewer tokens per char
    // - Whitespace is often merged
    // - Special tokens for structure

    const codeChars = (text.match(/[{}[\]()<>;/]=/g) || []).length;
    const normalChars = text.length - codeChars;

    // Code tokens are denser (~3 chars/token)
    // Normal text ~4 chars/token
    return Math.ceil(codeChars / 3 + normalChars / 4);
  }

  /**
   * Compute hash for caching
   */
  private computeHash(text: string): string {
    return createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  /**
   * Detect task categories from user message
   */
  detectTaskCategories(userMessage: string): ToolCategory[] {
    const categories: ToolCategory[] = ['core', 'taskManagement'];

    for (const [category, pattern] of Object.entries(TaskPatterns)) {
      if (pattern.test(userMessage)) {
        categories.push(category as ToolCategory);
      }
    }

    // Always add memory tools for persistent context
    if (!categories.includes('memory')) {
      categories.push('memory');
    }

    return [...new Set(categories)]; // Dedupe
  }

  /**
   * Get tool names for detected categories
   */
  getToolsForCategories(categories: ToolCategory[]): string[] {
    const tools: string[] = [];

    for (const category of categories) {
      const categoryTools = ToolCategories[category];
      if (categoryTools) {
        tools.push(...categoryTools);
      }
    }

    return [...new Set(tools)];
  }

  /**
   * Get optimized tool list based on context
   * Returns filtered tool names for the given user message
   */
  getOptimizedToolNames(
    userMessage: string,
    allToolNames: string[],
    options?: {
      includeAll?: boolean;
      maxTools?: number;
    }
  ): string[] {
    // If explicitly requested all tools, return all
    if (options?.includeAll) {
      return allToolNames;
    }

    // Detect relevant categories
    const categories = this.detectTaskCategories(userMessage);
    const relevantTools = this.getToolsForCategories(categories);

    // Filter to only include tools that actually exist
    const availableTools = relevantTools.filter((tool) =>
      allToolNames.includes(tool)
    );

    // If we filtered too aggressively, include more tools
    if (availableTools.length < 5 && allToolNames.length > 10) {
      // Add delegation tools for complex tasks
      if (!availableTools.includes('task')) {
        availableTools.push('task');
      }
      if (!availableTools.includes('skill')) {
        availableTools.push('skill');
      }
    }

    // Apply max tools limit if specified
    if (options?.maxTools && availableTools.length > options.maxTools) {
      return availableTools.slice(0, options.maxTools);
    }

    debugLogger.debug('Optimized tool selection', {
      total: allToolNames.length,
      selected: availableTools.length,
      categories,
    });

    return availableTools;
  }

  /**
   * Estimate token savings from optimization
   */
  estimateSavings(
    originalPrompt: string,
    originalToolCount: number,
    optimizedToolCount: number
  ): {
    promptTokensSaved: number;
    toolTokensSaved: number;
    totalSaved: number;
  } {
    const promptTokens = this.estimateTokens(originalPrompt);

    // Rough estimate: ~100 tokens per tool definition
    const avgToolTokens = 100;
    const toolTokensSaved =
      (originalToolCount - optimizedToolCount) * avgToolTokens;

    // When using cache, we save on repeated prompts
    const promptTokensSaved = this.cachedStaticPrompt
      ? Math.floor(promptTokens * 0.3)
      : 0; // ~30% savings with cache

    return {
      promptTokensSaved,
      toolTokensSaved,
      totalSaved: promptTokensSaved + toolTokensSaved,
    };
  }

  /**
   * Get statistics about current optimization
   */
  getStats(): {
    hasCache: boolean;
    cachedTokenCount: number;
    cacheAge: number;
  } {
    return {
      hasCache: !!this.cachedStaticPrompt,
      cachedTokenCount: this.cachedStaticPrompt?.tokenCount ?? 0,
      cacheAge: this.cachedStaticPrompt
        ? Date.now() - this.cachedStaticPrompt.timestamp
        : 0,
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cachedStaticPrompt = null;
    debugLogger.debug('Cleared prompt cache');
  }
}

/**
 * Get singleton instance
 */
export function getPromptOptimizer(): SystemPromptOptimizer {
  return SystemPromptOptimizer.getInstance();
}

/**
 * Quick helper to get optimized tools
 */
export function getOptimizedToolsForMessage(
  userMessage: string,
  allToolNames: string[]
): string[] {
  const optimizer = getPromptOptimizer();
  return optimizer.getOptimizedToolNames(userMessage, allToolNames);
}
