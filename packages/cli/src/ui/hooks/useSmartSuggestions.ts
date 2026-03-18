/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useSuggestionEngineStore,
  getSuggestionEngine,
  type SuggestionContext,
  type ScoredSuggestion,
} from '../services/SuggestionEngine.js';
import type { Suggestion } from '../components/SuggestionsDisplay.js';
import { useRecentFiles } from './useRecentFiles.js';
import { useContextKeywords } from './useContextKeywords.js';

/**
 * Options for the useSmartSuggestions hook
 */
export interface UseSmartSuggestionsOptions {
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
  /** Minimum score threshold for suggestions */
  minScore?: number;
  /** Enable file-based suggestions */
  enableFileSuggestions?: boolean;
  /** Enable topic-based suggestions */
  enableTopicSuggestions?: boolean;
  /** Enable command-based suggestions */
  enableCommandSuggestions?: boolean;
  /** Enable project structure suggestions */
  enableProjectSuggestions?: boolean;
  /** Debounce delay for suggestion generation (ms) */
  debounceDelay?: number;
  /** Custom context providers */
  customContextProviders?: CustomContextProvider[];
}

/**
 * Custom context provider function type
 */
export type CustomContextProvider = () => Partial<SuggestionContext>;

/**
 * Return type for useSmartSuggestions hook
 */
export interface UseSmartSuggestionsReturn {
  /** Generated suggestions with scores */
  suggestions: ScoredSuggestion[];
  /** Basic suggestions without scores (for compatibility) */
  basicSuggestions: Suggestion[];
  /** Whether suggestions are being generated */
  isGenerating: boolean;
  /** Current suggestion context */
  context: SuggestionContext | null;
  /** Generate suggestions for given input */
  generateSuggestions: (input: string) => ScoredSuggestion[];
  /** Update current file context */
  setCurrentFile: (file: string | undefined) => void;
  /** Update conversation history context */
  setConversationHistory: (history: string[]) => void;
  /** Update project structure context */
  updateProjectStructure: (
    rootPath: string,
    directories: string[],
    fileTypes: Map<string, number>,
  ) => void;
  /** Record user input for learning */
  recordUserInput: (input: string, matched?: boolean) => void;
  /** Get suggestion by index */
  getSuggestionByIndex: (index: number) => ScoredSuggestion | undefined;
  /** Get top N suggestions */
  getTopSuggestions: (n: number) => ScoredSuggestion[];
  /** Clear suggestion cache */
  clearCache: () => void;
  /** Refresh suggestions with current context */
  refresh: () => void;
}

/**
 * Hook for generating smart, context-aware suggestions
 *
 * This hook combines:
 * - Recent file tracking
 * - Conversation keyword extraction
 * - Command history analysis
 * - Project structure awareness
 *
 * @example
 * ```tsx
 * const {
 *   suggestions,
 *   generateSuggestions,
 *   setCurrentFile,
 * } = useSmartSuggestions();
 *
 * // Set current file context
 * setCurrentFile('/src/components/Button.tsx');
 *
 * // Generate suggestions for user input
 * const sugs = generateSuggestions('fix');
 * console.log(sugs);
 * ```
 */
export function useSmartSuggestions(
  options: UseSmartSuggestionsOptions = {},
): UseSmartSuggestionsReturn {
  const {
    maxSuggestions = 10,
    minScore = 0.1,
    enableFileSuggestions = true,
    enableTopicSuggestions = true,
    enableCommandSuggestions = true,
    enableProjectSuggestions = true,
    debounceDelay = 100,
    customContextProviders = [],
  } = options;

  // Get store and engine
  const store = useSuggestionEngineStore();
  const engine = getSuggestionEngine();

  // Use sub-hooks for context
  const { recordFileAccess } = useRecentFiles({ limit: 20 });
  const { extractKeywords, recordTopic } = useContextKeywords();

  // Local state
  const [suggestions, setSuggestions] = useState<ScoredSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFile, setCurrentFileState] = useState<string | undefined>();
  const [conversationHistory, setConversationHistoryState] = useState<string[]>(
    [],
  );

  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputRef = useRef<string>('');
  const cacheRef = useRef<Map<string, ScoredSuggestion[]>>(new Map());

  // Track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Build the suggestion context
   */
  const buildContext = useCallback((): SuggestionContext => {
    // Get custom context from providers
    let customContext: Partial<SuggestionContext> = {};
    for (const provider of customContextProviders) {
      customContext = { ...customContext, ...provider() };
    }

    return {
      currentFile,
      recentFiles: enableFileSuggestions ? store.recentFiles : [],
      recentTopics: enableTopicSuggestions ? store.recentTopics : [],
      commandHistory: enableCommandSuggestions ? store.commandHistory : [],
      projectStructure: enableProjectSuggestions
        ? (store.projectStructure ?? undefined)
        : undefined,
      userInput: lastInputRef.current,
      conversationHistory,
      ...customContext,
    };
  }, [
    currentFile,
    conversationHistory,
    store.recentFiles,
    store.recentTopics,
    store.commandHistory,
    store.projectStructure,
    enableFileSuggestions,
    enableTopicSuggestions,
    enableCommandSuggestions,
    enableProjectSuggestions,
    customContextProviders,
  ]);

  /**
   * Generate suggestions for given input
   */
  const generateSuggestions = useCallback(
    (input: string): ScoredSuggestion[] => {
      lastInputRef.current = input;

      // Check cache
      const cacheKey = input.toLowerCase();
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        return cached.slice(0, maxSuggestions);
      }

      // Build context and generate suggestions
      const context: SuggestionContext = {
        ...buildContext(),
        userInput: input,
      };

      const allSuggestions = engine.generateSuggestions(context);

      // Filter by minimum score and limit
      const filtered = allSuggestions
        .filter((s) => s.score >= minScore)
        .slice(0, maxSuggestions);

      // Cache results
      cacheRef.current.set(cacheKey, filtered);

      return filtered;
    },
    [buildContext, engine, maxSuggestions, minScore],
  );

  /**
   * Debounced suggestion generation
   */
  const debouncedGenerate = useCallback(
    (input: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;

        setIsGenerating(true);
        const newSuggestions = generateSuggestions(input);

        if (isMountedRef.current) {
          setSuggestions(newSuggestions);
          setIsGenerating(false);
        }
      }, debounceDelay);
    },
    [generateSuggestions, debounceDelay],
  );

  /**
   * Update current file context
   */
  const setCurrentFile = useCallback(
    (file: string | undefined) => {
      setCurrentFileState(file);
      if (file) {
        recordFileAccess(file, 'current');
      }
      // Clear cache when context changes
      cacheRef.current.clear();
    },
    [recordFileAccess],
  );

  /**
   * Update conversation history context
   */
  const setConversationHistory = useCallback((history: string[]) => {
    setConversationHistoryState(history);
    // Clear cache when context changes
    cacheRef.current.clear();
  }, []);

  /**
   * Update project structure context
   */
  const updateProjectStructure = useCallback(
    (
      rootPath: string,
      directories: string[],
      fileTypes: Map<string, number>,
    ) => {
      store.updateProjectStructure({
        rootPath,
        directories,
        fileTypes,
        lastScanned: Date.now(),
      });
      // Clear cache when context changes
      cacheRef.current.clear();
    },
    [store],
  );

  /**
   * Record user input for learning
   */
  const recordUserInput = useCallback(
    (input: string, matched: boolean = false) => {
      // Extract keywords and record as topic
      const extractedKeywords = extractKeywords(input, 'user');
      if (extractedKeywords.length > 0) {
        recordTopic(
          input.slice(0, 50),
          extractedKeywords.map((k) => k.word),
          [],
        );
      }

      // Record as command usage if it looks like a command
      if (input.startsWith('/')) {
        const parts = input.slice(1).split(' ');
        const command = parts[0];
        const args = parts.slice(1).join(' ');
        store.recordCommandUsage(command, args, matched);
      }
    },
    [extractKeywords, recordTopic, store],
  );

  /**
   * Get suggestion by index
   */
  const getSuggestionByIndex = useCallback(
    (index: number): ScoredSuggestion | undefined => suggestions[index],
    [suggestions],
  );

  /**
   * Get top N suggestions
   */
  const getTopSuggestions = useCallback(
    (n: number): ScoredSuggestion[] => suggestions.slice(0, n),
    [suggestions],
  );

  /**
   * Clear suggestion cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setSuggestions([]);
  }, []);

  /**
   * Refresh suggestions with current context
   */
  const refresh = useCallback(() => {
    cacheRef.current.clear();
    if (lastInputRef.current) {
      debouncedGenerate(lastInputRef.current);
    }
  }, [debouncedGenerate]);

  /**
   * Basic suggestions without scores (for compatibility)
   */
  const basicSuggestions = useMemo((): Suggestion[] => suggestions.map((s) => ({
      label: s.label,
      value: s.value,
      description: s.description,
      matchedIndex: s.matchedIndex,
      commandKind: s.commandKind,
    })), [suggestions]);

  /**
   * Context object for external use
   */
  const context = useMemo((): SuggestionContext | null => {
    if (!lastInputRef.current && suggestions.length === 0) {
      return null;
    }
    return buildContext();
  }, [buildContext, suggestions.length]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    }, []);

  return {
    suggestions,
    basicSuggestions,
    isGenerating,
    context,
    generateSuggestions,
    setCurrentFile,
    setConversationHistory,
    updateProjectStructure,
    recordUserInput,
    getSuggestionByIndex,
    getTopSuggestions,
    clearCache,
    refresh,
  };
}

/**
 * Hook for integrating smart suggestions with existing completion systems
 *
 * @example
 * ```tsx
 * const { enhancedSuggestions, enhanceSuggestions } = useSmartCompletion({
 *   baseSuggestions: originalSuggestions,
 *   userInput: currentInput,
 * });
 * ```
 */
export function useSmartCompletion(options: {
  baseSuggestions: Suggestion[];
  maxSuggestions?: number;
}) {
  const { baseSuggestions, maxSuggestions = 10 } = options;
  const {
    suggestions: smartSuggestions,
    setCurrentFile,
    recordUserInput,
  } = useSmartSuggestions();

  /**
   * Enhance base suggestions with smart suggestions
   */
  const enhancedSuggestions = useMemo((): ScoredSuggestion[] => {
    const result: Map<string, ScoredSuggestion> = new Map();

    // Add base suggestions with default score
    for (const suggestion of baseSuggestions) {
      result.set(suggestion.value, {
        ...suggestion,
        score: 0.5, // Default score for base suggestions
        source: 'hybrid',
      });
    }

    // Merge with smart suggestions
    for (const smart of smartSuggestions) {
      const existing = result.get(smart.value);
      if (existing) {
        // Boost score for suggestions that appear in both
        result.set(smart.value, {
          ...existing,
          score: existing.score + smart.score * 0.5,
          contextReason: smart.contextReason,
        });
      } else {
        result.set(smart.value, smart);
      }
    }

    // Sort by score and limit
    return Array.from(result.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }, [baseSuggestions, smartSuggestions, maxSuggestions]);

  return {
    enhancedSuggestions,
    setCurrentFile,
    recordUserInput,
  };
}

/**
 * Hook for tracking suggestion selection patterns
 *
 * @example
 * ```tsx
 * const { recordSelection, getFrequentlySelected } = useSuggestionPatterns();
 *
 * // When user selects a suggestion
 * recordSelection(suggestion.value);
 *
 * // Get frequently selected suggestions
 * const frequent = getFrequentlySelected();
 * ```
 */
export function useSuggestionPatterns() {
  const store = useSuggestionEngineStore();

  const recordSelection = useCallback(
    (value: string) => {
      // Extract file path if it looks like one
      if (value.includes('/') || value.includes('.')) {
        store.recordFileAccess(value, 'selected');
      }

      // Check if it's a command
      if (value.startsWith('/')) {
        const parts = value.slice(1).split(' ');
        store.recordCommandUsage(parts[0], parts.slice(1).join(' '), true);
      }
    },
    [store],
  );

  const getFrequentlySelected = useCallback(
    (limit: number = 5) => store.recentFiles
        .filter((f) => f.context === 'selected')
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, limit),
    [store.recentFiles],
  );

  return {
    recordSelection,
    getFrequentlySelected,
  };
}

export default useSmartSuggestions;
