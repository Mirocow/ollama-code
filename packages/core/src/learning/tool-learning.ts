/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tool Learning System for Ollama Code
 *
 * This system helps models learn correct tool names by:
 * 1. Tracking tool call errors (hallucinated tool names)
 * 2. Creating mappings from incorrect to correct tool names
 * 3. Generating training feedback for the model
 * 4. Dynamically adding aliases based on model mistakes
 *
 * ## How it works
 *
 * When a model calls a non-existent tool (e.g., `git_dev` instead of `run_shell_command`),
 * the system:
 * 1. Records the error with context
 * 2. Suggests the correct tool using fuzzy matching
 * 3. Creates a learning entry for future reference
 * 4. Optionally adds a dynamic alias to handle the mistake
 *
 * ## Integration Points
 *
 * - CoreToolScheduler: Detects tool not found errors
 * - ToolRegistry: Resolves dynamic aliases
 * - Prompts: Includes learning feedback in system context
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Storage } from '../config/storage.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { ToolNames, ToolAliases, type ToolName } from '../tools/tool-names.js';

const debugLogger = createDebugLogger('TOOL_LEARNING');

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ToolCallError {
  id: string;
  timestamp: string;
  requestedTool: string;
  suggestedTool: string;
  confidence: number; // 0-1, how confident we are in the suggestion
  context: {
    userMessage?: string;
    args?: Record<string, unknown>;
    modelId?: string;
    projectType?: string;
  };
  resolved: boolean; // Whether the model eventually used the correct tool
  resolutionAttempts: number;
}

export interface ToolLearningStats {
  toolName: string;
  totalErrors: number;
  resolvedErrors: number;
  commonMistakes: Array<{
    wrongName: string;
    count: number;
  }>;
}

export interface DynamicAlias {
  alias: string;
  canonicalName: ToolName;
  createdAt: string;
  source: 'auto' | 'manual' | 'frequent_error';
  errorCount: number;
}

export interface LearningFeedback {
  incorrectTool: string;
  correctTool: string;
  explanation: string;
  example: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const LEARNING_DIR = 'learning';
const TOOL_ERRORS_FILE = 'tool_errors.json';
const DYNAMIC_ALIASES_FILE = 'dynamic_aliases.json';
const STATS_FILE = 'tool_learning_stats.json';

// Threshold for auto-creating dynamic aliases
// Set to 1 to create alias immediately after first error
const AUTO_ALIAS_THRESHOLD = 1;

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

function getLearningDir(): string {
  return path.join(Storage.getGlobalOllamaDir(), LEARNING_DIR);
}

/**
 * Calculates similarity between two strings using Levenshtein-like scoring.
 * Returns a value between 0 and 1.
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check for substring match
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Simple Levenshtein-based similarity
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

/**
 * Common tool name patterns that models often hallucinate.
 * Maps patterns to the correct tool name.
 */
const TOOL_PATTERNS: Record<string, ToolName> = {
  // Git-related hallucinations
  git_dev: ToolNames.SHELL,
  git_tool: ToolNames.SHELL,
  git_command: ToolNames.SHELL,
  git_cmd: ToolNames.SHELL,

  // Shell-related hallucinations
  shell_dev: ToolNames.SHELL,
  bash_dev: ToolNames.SHELL,
  command_dev: ToolNames.SHELL,
  terminal_dev: ToolNames.SHELL,
  exec_dev: ToolNames.SHELL,

  // Python-related hallucinations
  python_tool: ToolNames.PYTHON,
  python_command: ToolNames.PYTHON,
  pip_dev: ToolNames.PYTHON,
  py_tool: ToolNames.PYTHON,

  // Node.js / JavaScript hallucinations
  javascript_dev: ToolNames.NODEJS,
  js_dev: ToolNames.NODEJS,
  node_tool: ToolNames.NODEJS,
  npm_dev: ToolNames.NODEJS,

  // Golang hallucinations
  go_tool: ToolNames.GOLANG,
  go_command: ToolNames.GOLANG,

  // Edit-related hallucinations
  edit_file: ToolNames.EDIT,
  file_edit: ToolNames.EDIT,
  modify_file: ToolNames.EDIT,
  replace_file: ToolNames.EDIT,

  // Read-related hallucinations
  read_file_content: ToolNames.READ_FILE,
  file_read: ToolNames.READ_FILE,
  open_file: ToolNames.READ_FILE,
  view_file: ToolNames.READ_FILE,

  // Write-related hallucinations
  write_file_content: ToolNames.WRITE_FILE,
  file_write: ToolNames.WRITE_FILE,
  create_file: ToolNames.WRITE_FILE,
  save_file_content: ToolNames.WRITE_FILE,

  // Search-related hallucinations
  search_files: ToolNames.GREP,
  find_text: ToolNames.GREP,
  search_content: ToolNames.GREP,
  grep_files: ToolNames.GREP,

  // List directory hallucinations
  list_directory: ToolNames.LS,
  list_files: ToolNames.LS,
  dir_list: ToolNames.LS,
  folder_list: ToolNames.LS,

  // Web-related hallucinations
  web_fetch_tool: ToolNames.WEB_FETCH,
  fetch_url: ToolNames.WEB_FETCH,
  web_search_tool: ToolNames.WEB_SEARCH,
  search_web: ToolNames.WEB_SEARCH,
};

/**
 * Generates a human-readable explanation for why a tool name was wrong.
 */
function generateExplanation(wrongName: string, correctName: string): string {
  const explanations: Record<string, string> = {
    [ToolNames.SHELL]: `For executing shell commands (including git, bash, etc.), use "${correctName}". There is no separate tool for specific commands like git.`,
    [ToolNames.PYTHON]: `For Python development operations, use "${correctName}". This tool handles Python, pip, pytest, and related commands.`,
    [ToolNames.NODEJS]: `For Node.js/JavaScript development, use "${correctName}". This handles npm, yarn, node, and related commands.`,
    [ToolNames.GOLANG]: `For Go development, use "${correctName}". This handles go, gofmt, and related commands.`,
    [ToolNames.EDIT]: `For editing existing files, use "${correctName}". Use "${ToolNames.WRITE_FILE}" for creating new files.`,
    [ToolNames.READ_FILE]: `For reading a single file, use "${correctName}". Use "${ToolNames.READ_MANY_FILES}" for multiple files.`,
    [ToolNames.WRITE_FILE]: `For creating or overwriting files, use "${correctName}". Use "${ToolNames.EDIT}" for modifying existing files.`,
    [ToolNames.GREP]: `For searching file contents, use "${correctName}". Use "${ToolNames.GLOB}" for finding files by name pattern.`,
    [ToolNames.LS]: `For listing directory contents, use "${correctName}".`,
    [ToolNames.WEB_FETCH]: `For fetching web content, use "${correctName}".`,
    [ToolNames.WEB_SEARCH]: `For web search, use "${correctName}".`,
  };

  return (
    explanations[correctName] ||
    `The tool "${wrongName}" does not exist. Use "${correctName}" instead.`
  );
}

/**
 * Generates an example of correct tool usage.
 */
function generateExample(correctTool: string): string {
  const examples: Record<string, string> = {
    [ToolNames.SHELL]: `${correctTool}: {"command": "git status"}`,
    [ToolNames.PYTHON]: `${correctTool}: {"command": "python script.py"}`,
    [ToolNames.NODEJS]: `${correctTool}: {"command": "npm install"}`,
    [ToolNames.GOLANG]: `${correctTool}: {"command": "go build"}`,
    [ToolNames.EDIT]: `${correctTool}: {"file_path": "/path/to/file", "old_string": "old", "new_str": "new"}`,
    [ToolNames.READ_FILE]: `${correctTool}: {"filepath": "/path/to/file"}`,
    [ToolNames.WRITE_FILE]: `${correctTool}: {"filepath": "/path/to/file", "content": "content"}`,
    [ToolNames.GREP]: `${correctTool}: {"pattern": "search_term", "path": "/path"}`,
    [ToolNames.LS]: `${correctTool}: {"path": "/path/to/dir"}`,
    [ToolNames.WEB_FETCH]: `${correctTool}: {"url": "https://example.com"}`,
    [ToolNames.WEB_SEARCH]: `${correctTool}: {"query": "search query"}`,
  };

  return examples[correctTool] || `${correctTool}: {...}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ToolLearningManager Class
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Manages tool learning and dynamic alias generation.
 */
export class ToolLearningManager {
  private static instance: ToolLearningManager;
  private errors: ToolCallError[] = [];
  private dynamicAliases: Map<string, DynamicAlias> = new Map();
  private stats: Map<string, ToolLearningStats> = new Map();
  private dirty = false;
  private saveInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ToolLearningManager {
    if (!ToolLearningManager.instance) {
      ToolLearningManager.instance = new ToolLearningManager();
    }
    return ToolLearningManager.instance;
  }

  /**
   * Initializes the learning manager, loading existing data from disk.
   */
  async initialize(): Promise<void> {
    await this.ensureDir();
    await this.load();
    this.startAutoSave();
    this.applyDynamicAliases();
    debugLogger.info('Tool learning system initialized');
  }

  private async ensureDir(): Promise<void> {
    const dir = getLearningDir();
    await fs.mkdir(dir, { recursive: true });
  }

  private async load(): Promise<void> {
    try {
      const dir = getLearningDir();

      // Load errors
      try {
        const data = await fs.readFile(
          path.join(dir, TOOL_ERRORS_FILE),
          'utf-8',
        );
        this.errors = JSON.parse(data);
      } catch {
        this.errors = [];
      }

      // Load dynamic aliases
      try {
        const data = await fs.readFile(
          path.join(dir, DYNAMIC_ALIASES_FILE),
          'utf-8',
        );
        const aliases: DynamicAlias[] = JSON.parse(data);
        this.dynamicAliases = new Map(aliases.map((a) => [a.alias, a]));
      } catch {
        this.dynamicAliases = new Map();
      }

      // Load stats
      try {
        const data = await fs.readFile(path.join(dir, STATS_FILE), 'utf-8');
        this.stats = new Map(Object.entries(JSON.parse(data)));
      } catch {
        this.stats = new Map();
      }

      debugLogger.debug(
        `Loaded ${this.errors.length} errors, ${this.dynamicAliases.size} dynamic aliases`,
      );
    } catch (error) {
      debugLogger.error('Failed to load tool learning data:', error);
    }
  }

  async save(): Promise<void> {
    try {
      await this.ensureDir();
      const dir = getLearningDir();

      await fs.writeFile(
        path.join(dir, TOOL_ERRORS_FILE),
        JSON.stringify(this.errors.slice(-500), null, 2),
      );

      await fs.writeFile(
        path.join(dir, DYNAMIC_ALIASES_FILE),
        JSON.stringify(Array.from(this.dynamicAliases.values()), null, 2),
      );

      await fs.writeFile(
        path.join(dir, STATS_FILE),
        JSON.stringify(Object.fromEntries(this.stats), null, 2),
      );

      this.dirty = false;
    } catch (error) {
      debugLogger.error('Failed to save tool learning data:', error);
    }
  }

  private startAutoSave(): void {
    this.saveInterval = setInterval(() => {
      if (this.dirty) this.save().catch(() => {});
    }, 30000); // Save every 30 seconds
  }

  async shutdown(): Promise<void> {
    if (this.saveInterval) clearInterval(this.saveInterval);
    if (this.dirty) await this.save();
  }

  /**
   * Applies dynamic aliases to the ToolAliases map.
   * This allows the system to automatically resolve learned aliases.
   */
  private applyDynamicAliases(): void {
    for (const [alias, dynamicAlias] of this.dynamicAliases) {
      // Don't overwrite existing static aliases
      if (!(alias in ToolAliases)) {
        (ToolAliases as Record<string, ToolName>)[alias] =
          dynamicAlias.canonicalName;
      }
    }
    debugLogger.debug(`Applied ${this.dynamicAliases.size} dynamic aliases`);
  }

  /**
   * Records a tool call error and generates learning feedback.
   */
  recordToolError(
    requestedTool: string,
    suggestedTool: string,
    confidence: number,
    context?: ToolCallError['context'],
  ): ToolCallError {
    const error: ToolCallError = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      requestedTool,
      suggestedTool,
      confidence,
      context: context || {},
      resolved: false,
      resolutionAttempts: 0,
    };

    this.errors.push(error);
    this.updateStats(requestedTool, suggestedTool);
    this.checkAndCreateAlias(requestedTool, suggestedTool);
    this.dirty = true;

    debugLogger.info(
      `Recorded tool error: ${requestedTool} -> ${suggestedTool}`,
    );
    return error;
  }

  private updateStats(wrongName: string, correctName: string): void {
    // Update stats for the correct tool
    const stats = this.stats.get(correctName) || {
      toolName: correctName,
      totalErrors: 0,
      resolvedErrors: 0,
      commonMistakes: [],
    };

    stats.totalErrors++;

    // Update common mistakes
    const existingMistake = stats.commonMistakes.find(
      (m) => m.wrongName === wrongName,
    );
    if (existingMistake) {
      existingMistake.count++;
    } else {
      stats.commonMistakes.push({ wrongName, count: 1 });
    }

    // Sort by count
    stats.commonMistakes.sort((a, b) => b.count - a.count);
    stats.commonMistakes = stats.commonMistakes.slice(0, 10); // Keep top 10

    this.stats.set(correctName, stats);
  }

  /**
   * Checks if we should create a dynamic alias based on error frequency.
   */
  private checkAndCreateAlias(wrongName: string, correctName: string): void {
    // Check if this exact error has occurred enough times
    const errorCount = this.errors.filter(
      (e) => e.requestedTool === wrongName && e.suggestedTool === correctName,
    ).length;

    // Don't create alias if already exists (either static or dynamic)
    const normalizedWrong = wrongName.toLowerCase().trim();
    if (normalizedWrong in ToolAliases) return;
    if (this.dynamicAliases.has(normalizedWrong)) return;

    // Create dynamic alias if threshold is reached
    if (errorCount >= AUTO_ALIAS_THRESHOLD) {
      this.addDynamicAlias(
        normalizedWrong,
        correctName as ToolName,
        'frequent_error',
      );
    }
  }

  /**
   * Manually adds a dynamic alias.
   */
  addDynamicAlias(
    alias: string,
    canonicalName: ToolName,
    source: DynamicAlias['source'] = 'manual',
  ): boolean {
    const normalizedAlias = alias.toLowerCase().trim();

    // Don't overwrite existing static aliases
    if (normalizedAlias in ToolAliases) {
      debugLogger.warn(`Alias "${alias}" already exists as static alias`);
      return false;
    }

    const dynamicAlias: DynamicAlias = {
      alias: normalizedAlias,
      canonicalName,
      createdAt: new Date().toISOString(),
      source,
      errorCount: this.errors.filter((e) => e.requestedTool === alias).length,
    };

    this.dynamicAliases.set(normalizedAlias, dynamicAlias);

    // Apply immediately
    (ToolAliases as Record<string, ToolName>)[normalizedAlias] = canonicalName;

    this.dirty = true;
    debugLogger.info(`Added dynamic alias: ${alias} -> ${canonicalName}`);
    return true;
  }

  /**
   * Marks an error as resolved (model used correct tool after feedback).
   */
  resolveError(errorId: string): void {
    const error = this.errors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;

      // Update stats
      const stats = this.stats.get(error.suggestedTool);
      if (stats) {
        stats.resolvedErrors++;
        this.stats.set(error.suggestedTool, stats);
      }

      this.dirty = true;
    }
  }

  /**
   * Finds the best matching tool for a potentially incorrect tool name.
   */
  findBestMatch(toolName: string): { name: string; confidence: number } | null {
    const normalized = toolName.toLowerCase().trim();

    // Check if it's already a valid tool name
    const validTools = Object.values(ToolNames);
    if (validTools.includes(normalized as ToolName)) {
      return { name: normalized, confidence: 1 };
    }

    // Check static aliases
    if (normalized in ToolAliases) {
      return { name: ToolAliases[normalized], confidence: 1 };
    }

    // Check dynamic aliases
    if (this.dynamicAliases.has(normalized)) {
      const alias = this.dynamicAliases.get(normalized)!;
      return { name: alias.canonicalName, confidence: 0.95 };
    }

    // Check known patterns
    if (normalized in TOOL_PATTERNS) {
      return { name: TOOL_PATTERNS[normalized], confidence: 0.9 };
    }

    // Use fuzzy matching on all available tool names
    let bestMatch: { name: string; confidence: number } | null = null;

    for (const validName of validTools) {
      const similarity = calculateSimilarity(normalized, validName);
      if (
        similarity > 0.5 &&
        (!bestMatch || similarity > bestMatch.confidence)
      ) {
        bestMatch = { name: validName, confidence: similarity };
      }
    }

    // Also check static aliases
    for (const [alias, canonical] of Object.entries(ToolAliases)) {
      const similarity = calculateSimilarity(normalized, alias);
      if (
        similarity > 0.6 &&
        (!bestMatch || similarity > bestMatch.confidence)
      ) {
        bestMatch = { name: canonical, confidence: similarity };
      }
    }

    return bestMatch;
  }

  /**
   * Generates learning feedback for the model based on recent errors.
   */
  generateLearningFeedback(): LearningFeedback[] {
    const recentUnresolved = this.errors
      .filter((e) => !e.resolved && e.confidence > 0.5)
      .slice(-5);

    return recentUnresolved.map((error) => ({
      incorrectTool: error.requestedTool,
      correctTool: error.suggestedTool,
      explanation: generateExplanation(
        error.requestedTool,
        error.suggestedTool,
      ),
      example: generateExample(error.suggestedTool),
    }));
  }

  /**
   * Generates a comprehensive learning context for the model.
   * This can be included in the system prompt.
   */
  generateLearningContext(): string {
    const lines: string[] = [];

    // Recent learning feedback
    const feedback = this.generateLearningFeedback();
    if (feedback.length > 0) {
      lines.push('## Tool Learning Feedback');
      lines.push(
        'You have made the following tool call errors recently. Learn from them:\n',
      );

      for (const f of feedback) {
        lines.push(
          `### ❌ Wrong: "${f.incorrectTool}" → ✅ Correct: "${f.correctTool}"`,
        );
        lines.push(f.explanation);
        lines.push(`Example: ${f.example}\n`);
      }
    }

    // Common mistakes summary
    const commonMistakes = this.getCommonMistakes(3);
    if (commonMistakes.length > 0) {
      lines.push('## Most Common Tool Name Mistakes');
      for (const mistake of commonMistakes) {
        lines.push(
          `- "${mistake.wrongName}" → use "${mistake.correct}" (${mistake.count} times)`,
        );
      }
    }

    // Available tools reminder
    lines.push('\n## Available Tools (use EXACT names)');
    const toolCategories = {
      'File Operations': [
        ToolNames.READ_FILE,
        ToolNames.READ_MANY_FILES,
        ToolNames.WRITE_FILE,
        ToolNames.EDIT,
      ],
      'Search & Discovery': [ToolNames.GREP, ToolNames.GLOB, ToolNames.LS],
      'Shell & Commands': [ToolNames.SHELL],
      'Development Tools': [
        ToolNames.PYTHON,
        ToolNames.NODEJS,
        ToolNames.GOLANG,
        ToolNames.PHP,
        ToolNames.JAVA,
        ToolNames.CPP,
        ToolNames.RUST,
        ToolNames.SWIFT,
        ToolNames.TYPESCRIPT,
      ],
      'Web & Network': [ToolNames.WEB_FETCH, ToolNames.WEB_SEARCH],
      'Task Management': [
        ToolNames.TODO_WRITE,
        ToolNames.TASK,
        ToolNames.SKILL,
      ],
      'Memory & State': [ToolNames.MEMORY, ToolNames.EXIT_PLAN_MODE],
    };

    for (const [category, tools] of Object.entries(toolCategories)) {
      lines.push(`\n### ${category}`);
      for (const tool of tools) {
        lines.push(`- \`${tool}\``);
      }
    }

    return lines.join('\n');
  }

  /**
   * Gets the most common mistakes across all tools.
   */
  getCommonMistakes(
    limit = 5,
  ): Array<{ wrongName: string; correct: string; count: number }> {
    const mistakes: Array<{
      wrongName: string;
      correct: string;
      count: number;
    }> = [];

    for (const [, stats] of this.stats) {
      for (const mistake of stats.commonMistakes) {
        mistakes.push({
          wrongName: mistake.wrongName,
          correct: stats.toolName,
          count: mistake.count,
        });
      }
    }

    mistakes.sort((a, b) => b.count - a.count);
    return mistakes.slice(0, limit);
  }

  /**
   * Gets statistics summary.
   */
  getStatsSummary(): string {
    const lines: string[] = ['## Tool Learning Statistics'];

    const totalErrors = this.errors.length;
    const resolvedErrors = this.errors.filter((e) => e.resolved).length;
    const resolutionRate =
      totalErrors > 0 ? ((resolvedErrors / totalErrors) * 100).toFixed(1) : '0';

    lines.push(`- Total tool errors recorded: ${totalErrors}`);
    lines.push(`- Resolved errors: ${resolvedErrors} (${resolutionRate}%)`);
    lines.push(`- Dynamic aliases created: ${this.dynamicAliases.size}`);

    const topProblematic = Array.from(this.stats.values())
      .sort((a, b) => b.totalErrors - a.totalErrors)
      .slice(0, 5);

    if (topProblematic.length > 0) {
      lines.push('\n### Tools with Most Errors');
      for (const t of topProblematic) {
        lines.push(
          `- ${t.toolName}: ${t.totalErrors} errors, ${t.commonMistakes[0]?.wrongName || 'N/A'} is common mistake`,
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Exports all learning data for backup or transfer.
   */
  async export(): Promise<string> {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        errors: this.errors,
        dynamicAliases: Array.from(this.dynamicAliases.values()),
        stats: Object.fromEntries(this.stats),
      },
      null,
      2,
    );
  }

  /**
   * Imports learning data from a previous export.
   */
  async import(data: string): Promise<void> {
    const parsed = JSON.parse(data);

    if (parsed.errors) {
      this.errors = parsed.errors;
    }

    if (parsed.dynamicAliases) {
      this.dynamicAliases = new Map(
        parsed.dynamicAliases.map((a: DynamicAlias) => [a.alias, a]),
      );
    }

    if (parsed.stats) {
      this.stats = new Map(Object.entries(parsed.stats));
    }

    this.applyDynamicAliases();
    this.dirty = true;
    await this.save();
  }

  /**
   * Clears all learning data.
   */
  async clear(): Promise<void> {
    this.errors = [];
    this.dynamicAliases = new Map();
    this.stats = new Map();
    await this.save();
  }

  /**
   * Gets all dynamic aliases.
   */
  getDynamicAliases(): DynamicAlias[] {
    return Array.from(this.dynamicAliases.values());
  }

  /**
   * Removes a dynamic alias.
   */
  removeDynamicAlias(alias: string): boolean {
    const normalized = alias.toLowerCase().trim();
    if (this.dynamicAliases.has(normalized)) {
      this.dynamicAliases.delete(normalized);
      // Remove from ToolAliases if it was added there
      delete (ToolAliases as Record<string, ToolName>)[normalized];
      this.dirty = true;
      return true;
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Singleton accessor
// ═══════════════════════════════════════════════════════════════════════════════

export function getToolLearningManager(): ToolLearningManager {
  return ToolLearningManager.getInstance();
}
