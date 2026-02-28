/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Self-Learning System for Ollama Code
 *
 * This system allows the model to learn from user interactions and improve
 * its responses over time. Learning data is stored in ~/.ollama-code/learning/
 *
 * Features:
 * - Learn from user corrections
 * - Store successful patterns
 * - Track tool usage statistics
 * - Improve suggestions based on context
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Storage } from '../config/storage.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('SELF_LEARNING');

export interface LearningEntry {
  id: string;
  timestamp: string;
  type: 'correction' | 'success' | 'pattern';
  context: {
    userMessage: string;
    modelResponse: string;
    correctedResponse?: string;
    toolCalls?: Array<{
      name: string;
      params: Record<string, unknown>;
      success: boolean;
    }>;
    projectType?: string;
    language?: string;
  };
  feedback: {
    rating?: number;
    accepted?: boolean;
    edited?: boolean;
  };
  tags: string[];
}

export interface ToolUsageLearningStats {
  toolName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastUsed: string;
}

export interface ProjectPattern {
  projectType: string;
  languages: string[];
  frameworks: string[];
  buildTools: string[];
}

const LEARNING_DIR = 'learning';
const ENTRIES_FILE = 'entries.json';
const STATS_FILE = 'tool_stats.json';

function getLearningDir(): string {
  return path.join(Storage.getGlobalOllamaDir(), LEARNING_DIR);
}

/**
 * Self-Learning Manager
 */
export class SelfLearningManager {
  private static instance: SelfLearningManager;
  private entries: LearningEntry[] = [];
  private toolStats: Map<string, ToolUsageLearningStats> = new Map();
  private dirty = false;
  private saveInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SelfLearningManager {
    if (!SelfLearningManager.instance) {
      SelfLearningManager.instance = new SelfLearningManager();
    }
    return SelfLearningManager.instance;
  }

  async initialize(): Promise<void> {
    await this.ensureDir();
    await this.load();
    this.startAutoSave();
    debugLogger.info('Self-learning system initialized');
  }

  private async ensureDir(): Promise<void> {
    const dir = getLearningDir();
    await fs.mkdir(dir, { recursive: true });
  }

  private async load(): Promise<void> {
    try {
      const dir = getLearningDir();

      const entriesPath = path.join(dir, ENTRIES_FILE);
      try {
        const data = await fs.readFile(entriesPath, 'utf-8');
        this.entries = JSON.parse(data);
      } catch {
        this.entries = [];
      }

      const statsPath = path.join(dir, STATS_FILE);
      try {
        const data = await fs.readFile(statsPath, 'utf-8');
        this.toolStats = new Map(Object.entries(JSON.parse(data)));
      } catch {
        this.toolStats = new Map();
      }

      debugLogger.debug(`Loaded ${this.entries.length} entries`);
    } catch (error) {
      debugLogger.error('Load failed:', error);
    }
  }

  async save(): Promise<void> {
    try {
      await this.ensureDir();
      const dir = getLearningDir();

      await fs.writeFile(
        path.join(dir, ENTRIES_FILE),
        JSON.stringify(this.entries.slice(-1000), null, 2),
      );

      await fs.writeFile(
        path.join(dir, STATS_FILE),
        JSON.stringify(Object.fromEntries(this.toolStats), null, 2),
      );

      this.dirty = false;
    } catch (error) {
      debugLogger.error('Save failed:', error);
    }
  }

  private startAutoSave(): void {
    this.saveInterval = setInterval(() => {
      if (this.dirty) this.save().catch(() => {});
    }, 60000);
  }

  async shutdown(): Promise<void> {
    if (this.saveInterval) clearInterval(this.saveInterval);
    if (this.dirty) await this.save();
  }

  recordCorrection(
    userMessage: string,
    modelResponse: string,
    correctedResponse: string,
    context?: {
      toolCalls?: LearningEntry['context']['toolCalls'];
      language?: string;
    },
  ): void {
    this.entries.push({
      id: `corr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'correction',
      context: { userMessage, modelResponse, correctedResponse, ...context },
      feedback: { edited: true },
      tags: ['correction', context?.language || 'unknown'],
    });
    this.dirty = true;
  }

  recordSuccess(
    userMessage: string,
    modelResponse: string,
    toolCalls: LearningEntry['context']['toolCalls'],
    rating?: number,
  ): void {
    this.entries.push({
      id: `succ_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      context: { userMessage, modelResponse, toolCalls },
      feedback: { rating, accepted: true },
      tags: ['success'],
    });

    for (const call of toolCalls || []) {
      this.updateToolStats(call.name, call.success);
    }
    this.dirty = true;
  }

  private updateToolStats(toolName: string, success: boolean): void {
    const stats = this.toolStats.get(toolName) || {
      toolName,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastUsed: new Date().toISOString(),
    };
    stats.totalCalls++;
    if (success) stats.successfulCalls++;
    else stats.failedCalls++;
    stats.lastUsed = new Date().toISOString();
    this.toolStats.set(toolName, stats);
  }

  getLearningSummary(): string {
    const lines: string[] = ['## Learning Summary'];

    // Top tools
    const topTools = Array.from(this.toolStats.values())
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, 5);

    if (topTools.length > 0) {
      lines.push('\n### Most Used Tools');
      for (const t of topTools) {
        const rate = ((t.successfulCalls / t.totalCalls) * 100).toFixed(0);
        lines.push(
          `- **${t.toolName}**: ${rate}% success (${t.totalCalls} uses)`,
        );
      }
    }

    // Recent corrections
    const corrections = this.entries
      .filter((e) => e.type === 'correction')
      .slice(-3);

    if (corrections.length > 0) {
      lines.push('\n### Recent Corrections');
      for (const c of corrections) {
        lines.push(
          `- [${c.context.language || 'unknown'}] ${c.tags.join(', ')}`,
        );
      }
    }

    return lines.join('\n');
  }

  async export(): Promise<string> {
    return JSON.stringify(
      {
        version: '1.0',
        entries: this.entries,
        toolStats: Object.fromEntries(this.toolStats),
      },
      null,
      2,
    );
  }

  async import(data: string): Promise<void> {
    const parsed = JSON.parse(data);
    this.entries = parsed.entries || [];
    this.toolStats = new Map(Object.entries(parsed.toolStats || {}));
    this.dirty = true;
    await this.save();
  }

  async clear(): Promise<void> {
    this.entries = [];
    this.toolStats = new Map();
    await this.save();
  }
}

export function getSelfLearningManager(): SelfLearningManager {
  return SelfLearningManager.getInstance();
}
