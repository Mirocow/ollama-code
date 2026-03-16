/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Suggestion } from '../components/SuggestionsDisplay.js';

/**
 * File access record for tracking recent files
 */
export interface FileAccessRecord {
  path: string;
  lastAccessed: number;
  accessCount: number;
  context?: string; // What context the file was used in
}

/**
 * Conversation topic record for tracking discussed topics
 */
export interface TopicRecord {
  topic: string;
  keywords: string[];
  lastMentioned: number;
  mentionCount: number;
  relatedFiles: string[];
}

/**
 * Command usage record for learning from user patterns
 */
export interface CommandUsageRecord {
  command: string;
  args?: string;
  lastUsed: number;
  useCount: number;
  successRate: number;
  context?: string;
}

/**
 * Project structure information
 */
export interface ProjectStructureInfo {
  rootPath: string;
  fileTypes: Map<string, number>;
  directories: string[];
  lastScanned: number;
}

/**
 * Context information for suggestions
 */
export interface SuggestionContext {
  currentFile?: string;
  recentFiles: FileAccessRecord[];
  recentTopics: TopicRecord[];
  commandHistory: CommandUsageRecord[];
  projectStructure?: ProjectStructureInfo;
  userInput: string;
  conversationHistory?: string[];
}

/**
 * Suggestion with relevance scoring
 */
export interface ScoredSuggestion extends Suggestion {
  score: number;
  source: 'file' | 'topic' | 'command' | 'project' | 'hybrid';
  contextReason?: string;
}

/**
 * Suggestion engine state
 */
interface SuggestionEngineState {
  recentFiles: FileAccessRecord[];
  recentTopics: TopicRecord[];
  commandHistory: CommandUsageRecord[];
  projectStructure: ProjectStructureInfo | null;
  maxRecentFiles: number;
  maxRecentTopics: number;
  maxCommandHistory: number;

  // Actions
  recordFileAccess: (path: string, context?: string) => void;
  recordTopic: (topic: string, keywords: string[], relatedFiles?: string[]) => void;
  recordCommandUsage: (command: string, args?: string, success?: boolean, context?: string) => void;
  updateProjectStructure: (info: ProjectStructureInfo) => void;
  getRecentFiles: (limit?: number) => FileAccessRecord[];
  getRecentTopics: (limit?: number) => TopicRecord[];
  getCommandHistory: (limit?: number) => CommandUsageRecord[];
  clearHistory: () => void;
}

/**
 * Suggestion Engine Store
 */
export const suggestionEngineStore = create<SuggestionEngineState>()(
  subscribeWithSelector((set, get) => ({
    recentFiles: [],
    recentTopics: [],
    commandHistory: [],
    projectStructure: null,
    maxRecentFiles: 50,
    maxRecentTopics: 30,
    maxCommandHistory: 100,

    recordFileAccess: (path: string, context?: string) => {
      set((state) => {
        const now = Date.now();
        const existingIndex = state.recentFiles.findIndex(f => f.path === path);
        
        let newFiles: FileAccessRecord[];
        if (existingIndex >= 0) {
          // Update existing record
          const existing = state.recentFiles[existingIndex];
          newFiles = [...state.recentFiles];
          newFiles[existingIndex] = {
            ...existing,
            lastAccessed: now,
            accessCount: existing.accessCount + 1,
            context: context ?? existing.context,
          };
        } else {
          // Add new record
          newFiles = [
            { path, lastAccessed: now, accessCount: 1, context },
            ...state.recentFiles,
          ].slice(0, state.maxRecentFiles);
        }

        // Sort by last accessed (most recent first)
        newFiles.sort((a, b) => b.lastAccessed - a.lastAccessed);

        return { recentFiles: newFiles };
      });
    },

    recordTopic: (topic: string, keywords: string[], relatedFiles: string[] = []) => {
      set((state) => {
        const now = Date.now();
        const normalizedTopic = topic.toLowerCase();
        const existingIndex = state.recentTopics.findIndex(
          t => t.topic.toLowerCase() === normalizedTopic
        );

        let newTopics: TopicRecord[];
        if (existingIndex >= 0) {
          // Update existing topic
          const existing = state.recentTopics[existingIndex];
          const mergedKeywords = [...new Set([...existing.keywords, ...keywords])];
          const mergedFiles = [...new Set([...existing.relatedFiles, ...relatedFiles])];
          
          newTopics = [...state.recentTopics];
          newTopics[existingIndex] = {
            ...existing,
            keywords: mergedKeywords,
            lastMentioned: now,
            mentionCount: existing.mentionCount + 1,
            relatedFiles: mergedFiles,
          };
        } else {
          // Add new topic
          newTopics = [
            { topic, keywords, lastMentioned: now, mentionCount: 1, relatedFiles },
            ...state.recentTopics,
          ].slice(0, state.maxRecentTopics);
        }

        // Sort by last mentioned (most recent first)
        newTopics.sort((a, b) => b.lastMentioned - a.lastMentioned);

        return { recentTopics: newTopics };
      });
    },

    recordCommandUsage: (command: string, args?: string, success: boolean = true, context?: string) => {
      set((state) => {
        const now = Date.now();
        const existingIndex = state.commandHistory.findIndex(
          c => c.command === command && c.args === args
        );

        let newHistory: CommandUsageRecord[];
        if (existingIndex >= 0) {
          // Update existing record
          const existing = state.commandHistory[existingIndex];
          const newSuccessRate = success
            ? Math.min(1, existing.successRate + 0.05)
            : Math.max(0, existing.successRate - 0.1);

          newHistory = [...state.commandHistory];
          newHistory[existingIndex] = {
            ...existing,
            lastUsed: now,
            useCount: existing.useCount + 1,
            successRate: newSuccessRate,
            context: context ?? existing.context,
          };
        } else {
          // Add new record
          newHistory = [
            { command, args, lastUsed: now, useCount: 1, successRate: success ? 1 : 0, context },
            ...state.commandHistory,
          ].slice(0, state.maxCommandHistory);
        }

        // Sort by last used (most recent first)
        newHistory.sort((a, b) => b.lastUsed - a.lastUsed);

        return { commandHistory: newHistory };
      });
    },

    updateProjectStructure: (info: ProjectStructureInfo) => {
      set({ projectStructure: { ...info, lastScanned: Date.now() } });
    },

    getRecentFiles: (limit?: number) => {
      const { recentFiles } = get();
      return limit ? recentFiles.slice(0, limit) : recentFiles;
    },

    getRecentTopics: (limit?: number) => {
      const { recentTopics } = get();
      return limit ? recentTopics.slice(0, limit) : recentTopics;
    },

    getCommandHistory: (limit?: number) => {
      const { commandHistory } = get();
      return limit ? commandHistory.slice(0, limit) : commandHistory;
    },

    clearHistory: () => {
      set({
        recentFiles: [],
        recentTopics: [],
        commandHistory: [],
        projectStructure: null,
      });
    },
  }))
);

/**
 * Hook for using the suggestion engine store
 */
export const useSuggestionEngineStore = suggestionEngineStore;

/**
 * Context-Aware Suggestion Engine
 * 
 * This class provides intelligent suggestions based on:
 * - Recently accessed files
 * - Conversation topics
 * - Command usage patterns
 * - Project structure
 */
export class ContextAwareSuggestionEngine {
  private static instance: ContextAwareSuggestionEngine | null = null;
  
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ContextAwareSuggestionEngine {
    if (!ContextAwareSuggestionEngine.instance) {
      ContextAwareSuggestionEngine.instance = new ContextAwareSuggestionEngine();
    }
    return ContextAwareSuggestionEngine.instance;
  }

  /**
   * Generate context-aware suggestions
   */
  generateSuggestions(context: SuggestionContext): ScoredSuggestion[] {
    const suggestions: Map<string, ScoredSuggestion> = new Map();

    // Get suggestions from different sources
    const fileSuggestions = this.getFileSuggestions(context);
    const topicSuggestions = this.getTopicSuggestions(context);
    const commandSuggestions = this.getCommandSuggestions(context);
    const projectSuggestions = this.getProjectSuggestions(context);

    // Merge and deduplicate suggestions
    for (const suggestion of fileSuggestions) {
      suggestions.set(suggestion.value, suggestion);
    }

    for (const suggestion of topicSuggestions) {
      const existing = suggestions.get(suggestion.value);
      if (existing) {
        // Boost score for suggestions that appear in multiple sources
        suggestions.set(suggestion.value, {
          ...existing,
          score: existing.score + suggestion.score * 0.5,
          source: 'hybrid',
          contextReason: `${existing.contextReason}; ${suggestion.contextReason}`,
        });
      } else {
        suggestions.set(suggestion.value, suggestion);
      }
    }

    for (const suggestion of commandSuggestions) {
      const existing = suggestions.get(suggestion.value);
      if (existing) {
        suggestions.set(suggestion.value, {
          ...existing,
          score: existing.score + suggestion.score * 0.3,
          source: 'hybrid',
        });
      } else {
        suggestions.set(suggestion.value, suggestion);
      }
    }

    for (const suggestion of projectSuggestions) {
      const existing = suggestions.get(suggestion.value);
      if (existing) {
        suggestions.set(suggestion.value, {
          ...existing,
          score: existing.score + suggestion.score * 0.2,
          source: 'hybrid',
        });
      } else {
        suggestions.set(suggestion.value, suggestion);
      }
    }

    // Sort by score (highest first)
    return Array.from(suggestions.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Generate suggestions based on recently accessed files
   */
  private getFileSuggestions(context: SuggestionContext): ScoredSuggestion[] {
    const suggestions: ScoredSuggestion[] = [];
    const { userInput, recentFiles, currentFile } = context;
    const normalizedInput = userInput.toLowerCase();

    for (const file of recentFiles) {
      const normalizedPath = file.path.toLowerCase();
      let score = 0;
      let reason = '';

      // Check if user input matches file path
      if (normalizedPath.includes(normalizedInput) || normalizedInput.includes(normalizedPath)) {
        score += 0.5;
        reason = 'Matches input';
      }

      // Boost for recently accessed files
      const ageMs = Date.now() - file.lastAccessed;
      const ageMinutes = ageMs / (1000 * 60);
      const recencyScore = Math.max(0, 1 - ageMinutes / 60); // Decay over 60 minutes
      score += recencyScore * 0.3;
      if (recencyScore > 0.5) {
        reason += reason ? '; Recently accessed' : 'Recently accessed';
      }

      // Boost for frequently accessed files
      const frequencyScore = Math.min(1, file.accessCount / 10);
      score += frequencyScore * 0.2;

      // Boost if file is related to current file (same directory)
      if (currentFile && file.path !== currentFile) {
        const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
        const fileDir = file.path.substring(0, file.path.lastIndexOf('/'));
        if (currentDir === fileDir) {
          score += 0.2;
          reason += reason ? '; Same directory' : 'Same directory';
        }
      }

      // Boost if file context matches user input
      if (file.context && normalizedInput.includes(file.context.toLowerCase())) {
        score += 0.3;
        reason += reason ? '; Context match' : 'Context match';
      }

      if (score > 0.1) {
        suggestions.push({
          label: file.path,
          value: file.path,
          description: reason || undefined,
          score,
          source: 'file',
          contextReason: reason,
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on conversation topics
   */
  private getTopicSuggestions(context: SuggestionContext): ScoredSuggestion[] {
    const suggestions: ScoredSuggestion[] = [];
    const { userInput, recentTopics } = context;
    const normalizedInput = userInput.toLowerCase();

    for (const topic of recentTopics) {
      let score = 0;
      let reason = '';

      // Check if any keywords match user input
      const matchingKeywords = topic.keywords.filter(kw =>
        normalizedInput.includes(kw.toLowerCase()) ||
        kw.toLowerCase().includes(normalizedInput)
      );

      if (matchingKeywords.length > 0) {
        score += 0.4 * (matchingKeywords.length / topic.keywords.length);
        reason = `Keywords: ${matchingKeywords.slice(0, 3).join(', ')}`;
      }

      // Check if topic itself matches
      if (
        normalizedInput.includes(topic.topic.toLowerCase()) ||
        topic.topic.toLowerCase().includes(normalizedInput)
      ) {
        score += 0.3;
        reason += reason ? '; Topic match' : 'Topic match';
      }

      // Boost for recent topics
      const ageMs = Date.now() - topic.lastMentioned;
      const ageMinutes = ageMs / (1000 * 60);
      const recencyScore = Math.max(0, 1 - ageMinutes / 30); // Decay over 30 minutes
      score += recencyScore * 0.2;

      // Add suggestions for related files
      for (const relatedFile of topic.relatedFiles) {
        if (!suggestions.find(s => s.value === relatedFile)) {
          suggestions.push({
            label: relatedFile,
            value: relatedFile,
            description: `Related to topic: ${topic.topic}`,
            score: score * 0.8,
            source: 'topic',
            contextReason: `Related to discussed topic: ${topic.topic}`,
          });
        }
      }

      // Add topic as a suggestion context
      if (score > 0.1) {
        suggestions.push({
          label: topic.topic,
          value: topic.topic,
          description: reason || 'Recent discussion topic',
          score,
          source: 'topic',
          contextReason: reason,
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on command history
   */
  private getCommandSuggestions(context: SuggestionContext): ScoredSuggestion[] {
    const suggestions: ScoredSuggestion[] = [];
    const { userInput, commandHistory } = context;
    const normalizedInput = userInput.toLowerCase();

    for (const cmd of commandHistory) {
      let score = 0;
      let reason = '';

      const fullCommand = cmd.args ? `${cmd.command} ${cmd.args}` : cmd.command;
      const normalizedCommand = fullCommand.toLowerCase();

      // Check if user input matches command
      if (
        normalizedCommand.includes(normalizedInput) ||
        normalizedInput.includes(normalizedCommand)
      ) {
        score += 0.4;
        reason = 'Matches input';
      }

      // Boost for frequently used commands
      const frequencyScore = Math.min(1, cmd.useCount / 5);
      score += frequencyScore * 0.3;

      // Boost for successful commands
      score += cmd.successRate * 0.2;

      // Boost for recently used commands
      const ageMs = Date.now() - cmd.lastUsed;
      const ageMinutes = ageMs / (1000 * 60);
      const recencyScore = Math.max(0, 1 - ageMinutes / 60);
      score += recencyScore * 0.2;

      if (score > 0.2) {
        suggestions.push({
          label: fullCommand,
          value: fullCommand,
          description: reason || 'Frequently used',
          score,
          source: 'command',
          contextReason: reason,
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on project structure
   */
  private getProjectSuggestions(context: SuggestionContext): ScoredSuggestion[] {
    const suggestions: ScoredSuggestion[] = [];
    const { userInput, projectStructure, currentFile } = context;

    if (!projectStructure) {
      return suggestions;
    }

    const normalizedInput = userInput.toLowerCase();

    // Suggest based on file types in project
    const relevantTypes: string[] = [];
    projectStructure.fileTypes.forEach((count, type) => {
      if (normalizedInput.includes(type.toLowerCase()) || count > 5) {
        relevantTypes.push(type);
      }
    });

    // Suggest directories that might be relevant
    for (const dir of projectStructure.directories) {
      const normalizedDir = dir.toLowerCase();
      if (
        normalizedInput.includes(normalizedDir) ||
        normalizedDir.includes(normalizedInput)
      ) {
        suggestions.push({
          label: dir,
          value: dir,
          description: 'Project directory',
          score: 0.3,
          source: 'project',
          contextReason: 'Project directory',
        });
      }
    }

    // Suggest based on current file context
    if (currentFile) {
      const currentExt = currentFile.substring(currentFile.lastIndexOf('.'));
      if (projectStructure.fileTypes.has(currentExt)) {
        // Find other files with same extension
        const count = projectStructure.fileTypes.get(currentExt) || 0;
        if (count > 1) {
          suggestions.push({
            label: `*.${currentExt.substring(1)}`,
            value: `*.${currentExt.substring(1)}`,
            description: `Similar files (${count} in project)`,
            score: 0.25,
            source: 'project',
            contextReason: `Same file type as current (${count} files)`,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
      'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'where', 'when', 'why',
      'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }

    // Return top keywords by frequency
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Calculate relevance score for a suggestion
   */
  calculateRelevanceScore(suggestion: Suggestion, context: SuggestionContext): number {
    let score = 0;
    const { userInput, recentFiles, recentTopics, commandHistory } = context;
    const normalizedValue = suggestion.value.toLowerCase();
    const normalizedInput = userInput.toLowerCase();

    // Base score for text match
    if (normalizedValue.includes(normalizedInput) || normalizedInput.includes(normalizedValue)) {
      score += 0.3;
    }

    // Boost for file recency
    const fileMatch = recentFiles.find(f => f.path === suggestion.value);
    if (fileMatch) {
      const ageMinutes = (Date.now() - fileMatch.lastAccessed) / (1000 * 60);
      score += Math.max(0, 0.3 * (1 - ageMinutes / 60));
    }

    // Boost for topic relevance
    for (const topic of recentTopics) {
      if (topic.keywords.some(kw => normalizedValue.includes(kw.toLowerCase()))) {
        score += 0.2;
      }
    }

    // Boost for command usage
    const cmdMatch = commandHistory.find(
      c => `${c.command} ${c.args || ''}`.trim() === suggestion.value
    );
    if (cmdMatch) {
      score += 0.2 * cmdMatch.successRate;
    }

    return Math.min(1, score);
  }
}

// Export singleton instance getter
export const getSuggestionEngine = () => ContextAwareSuggestionEngine.getInstance();
