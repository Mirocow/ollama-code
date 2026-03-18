/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import type { Suggestion } from '../components/SuggestionsDisplay.js';
import { MAX_SUGGESTIONS_TO_SHOW } from '../components/SuggestionsDisplay.js';
import {
  useSmartSuggestions,
  type UseSmartSuggestionsOptions,
} from './useSmartSuggestions.js';
import { type ScoredSuggestion } from '../services/SuggestionEngine.js';
import { useSuggestionEngineStore } from '../services/SuggestionEngine.js';

/**
 * Options for useCompletion hook with smart suggestions support
 */
export interface UseCompletionOptions {
  /** Enable smart/context-aware suggestions */
  enableSmartSuggestions?: boolean;
  /** Options for smart suggestions */
  smartSuggestionOptions?: Omit<UseSmartSuggestionsOptions, 'maxSuggestions'>;
  /** Current user input for context */
  userInput?: string;
  /** Current file being edited */
  currentFile?: string;
  /** Callback when smart suggestions are generated */
  onSmartSuggestionsGenerated?: (suggestions: ScoredSuggestion[]) => void;
}

export interface UseCompletionReturn {
  suggestions: Suggestion[];
  activeSuggestionIndex: number;
  visibleStartIndex: number;
  showSuggestions: boolean;
  isLoadingSuggestions: boolean;
  isPerfectMatch: boolean;
  setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
  setActiveSuggestionIndex: React.Dispatch<React.SetStateAction<number>>;
  setVisibleStartIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsLoadingSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPerfectMatch: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  resetCompletionState: () => void;
  navigateUp: () => void;
  navigateDown: () => void;
  // New smart suggestion features
  smartSuggestions: ScoredSuggestion[];
  isGeneratingSmartSuggestions: boolean;
  enhanceWithSmartSuggestions: (baseSuggestions: Suggestion[]) => Suggestion[];
  setCurrentFileContext: (file: string | undefined) => void;
  recordSuggestionSelection: (suggestion: Suggestion) => void;
}

/**
 * Enhanced completion hook with context-aware suggestion support
 *
 * This hook provides:
 * - Basic suggestion state management
 * - Navigation (up/down) with wrap-around
 * - Smart suggestion enhancement when enabled
 * - Context tracking for better suggestions
 *
 * @example
 * ```tsx
 * const {
 *   suggestions,
 *   navigateUp,
 *   navigateDown,
 *   enhanceWithSmartSuggestions,
 * } = useCompletion({
 *   enableSmartSuggestions: true,
 *   currentFile: '/src/App.tsx',
 * });
 *
 * // Enhance base suggestions with context-aware ones
 * const enhanced = enhanceWithSmartSuggestions(baseSuggestions);
 * ```
 */
export function useCompletion(
  options: UseCompletionOptions = {},
): UseCompletionReturn {
  const {
    enableSmartSuggestions = false,
    smartSuggestionOptions = {},
    userInput = '',
    currentFile,
    onSmartSuggestionsGenerated,
  } = options;

  // Basic state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] =
    useState<number>(-1);
  const [visibleStartIndex, setVisibleStartIndex] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] =
    useState<boolean>(false);
  const [isPerfectMatch, setIsPerfectMatch] = useState<boolean>(false);

  // Track current file context
  const currentFileRef = useRef<string | undefined>(currentFile);

  // Smart suggestions integration
  const {
    suggestions: smartSuggestions,
    isGenerating: isGeneratingSmartSuggestions,
    setCurrentFile,
    recordUserInput,
  } = useSmartSuggestions({
    ...smartSuggestionOptions,
    maxSuggestions: MAX_SUGGESTIONS_TO_SHOW,
  });

  // Store reference for recording selections
  const store = useSuggestionEngineStore();

  /**
   * Update current file context when prop changes
   */
  useEffect(() => {
    if (currentFile !== currentFileRef.current) {
      currentFileRef.current = currentFile;
      if (enableSmartSuggestions) {
        setCurrentFile(currentFile);
      }
    }
  }, [currentFile, enableSmartSuggestions, setCurrentFile]);

  /**
   * Record user input for learning patterns
   */
  useEffect(() => {
    if (enableSmartSuggestions && userInput) {
      recordUserInput(userInput);
    }
  }, [userInput, enableSmartSuggestions, recordUserInput]);

  /**
   * Notify when smart suggestions are generated
   */
  useEffect(() => {
    if (
      enableSmartSuggestions &&
      onSmartSuggestionsGenerated &&
      smartSuggestions.length > 0
    ) {
      onSmartSuggestionsGenerated(smartSuggestions);
    }
  }, [smartSuggestions, enableSmartSuggestions, onSmartSuggestionsGenerated]);

  /**
   * Reset completion state
   */
  const resetCompletionState = useCallback(() => {
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setVisibleStartIndex(0);
    setShowSuggestions(false);
    setIsLoadingSuggestions(false);
    setIsPerfectMatch(false);
  }, []);

  /**
   * Navigate up through suggestions
   */
  const navigateUp = useCallback(() => {
    if (suggestions.length === 0) return;

    setActiveSuggestionIndex((prevActiveIndex) => {
      // Calculate new active index, handling wrap-around
      const newActiveIndex =
        prevActiveIndex <= 0 ? suggestions.length - 1 : prevActiveIndex - 1;

      // Adjust scroll position based on the new active index
      setVisibleStartIndex((prevVisibleStart) => {
        // Case 1: Wrapped around to the last item
        if (
          newActiveIndex === suggestions.length - 1 &&
          suggestions.length > MAX_SUGGESTIONS_TO_SHOW
        ) {
          return Math.max(0, suggestions.length - MAX_SUGGESTIONS_TO_SHOW);
        }
        // Case 2: Scrolled above the current visible window
        if (newActiveIndex < prevVisibleStart) {
          return newActiveIndex;
        }
        // Otherwise, keep the current scroll position
        return prevVisibleStart;
      });

      return newActiveIndex;
    });
  }, [suggestions.length]);

  /**
   * Navigate down through suggestions
   */
  const navigateDown = useCallback(() => {
    if (suggestions.length === 0) return;

    setActiveSuggestionIndex((prevActiveIndex) => {
      // Calculate new active index, handling wrap-around
      const newActiveIndex =
        prevActiveIndex >= suggestions.length - 1 ? 0 : prevActiveIndex + 1;

      // Adjust scroll position based on the new active index
      setVisibleStartIndex((prevVisibleStart) => {
        // Case 1: Wrapped around to the first item
        if (
          newActiveIndex === 0 &&
          suggestions.length > MAX_SUGGESTIONS_TO_SHOW
        ) {
          return 0;
        }
        // Case 2: Scrolled below the current visible window
        const visibleEndIndex = prevVisibleStart + MAX_SUGGESTIONS_TO_SHOW;
        if (newActiveIndex >= visibleEndIndex) {
          return newActiveIndex - MAX_SUGGESTIONS_TO_SHOW + 1;
        }
        // Otherwise, keep the current scroll position
        return prevVisibleStart;
      });

      return newActiveIndex;
    });
  }, [suggestions.length]);

  /**
   * Enhance base suggestions with smart/context-aware suggestions
   */
  const enhanceWithSmartSuggestions = useCallback(
    (baseSuggestions: Suggestion[]): Suggestion[] => {
      if (!enableSmartSuggestions) {
        return baseSuggestions;
      }

      // Create a map for deduplication and score aggregation
      const suggestionMap = new Map<string, Suggestion & { score?: number }>();

      // Add base suggestions with default score
      for (const suggestion of baseSuggestions) {
        suggestionMap.set(suggestion.value, {
          ...suggestion,
          score: 0.5,
        });
      }

      // Merge with smart suggestions, boosting scores for matches
      for (const smart of smartSuggestions) {
        const existing = suggestionMap.get(smart.value);
        if (existing) {
          // Boost score for suggestions that appear in both sources
          suggestionMap.set(smart.value, {
            ...existing,
            score: (existing.score ?? 0) + smart.score * 0.5,
            description: existing.description || smart.contextReason,
          });
        } else {
          // Add new smart suggestion
          suggestionMap.set(smart.value, {
            label: smart.label,
            value: smart.value,
            description: smart.description || smart.contextReason,
            matchedIndex: smart.matchedIndex,
            commandKind: smart.commandKind,
            score: smart.score,
          });
        }
      }

      // Sort by score (descending) and return as suggestions
      return Array.from(suggestionMap.values())
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, MAX_SUGGESTIONS_TO_SHOW)
        .map(({ score: _score, ...suggestion }) => suggestion);
    },
    [enableSmartSuggestions, smartSuggestions],
  );

  /**
   * Set current file context
   */
  const setCurrentFileContext = useCallback(
    (file: string | undefined) => {
      currentFileRef.current = file;
      if (enableSmartSuggestions) {
        setCurrentFile(file);
      }
    },
    [enableSmartSuggestions, setCurrentFile],
  );

  /**
   * Record when a suggestion is selected by the user
   */
  const recordSuggestionSelection = useCallback(
    (suggestion: Suggestion) => {
      const value = suggestion.value;

      // Track if it's a file path
      if (value.includes('/') || value.includes('\\') || value.includes('.')) {
        store.recordFileAccess(value, 'selected');
      }

      // Track if it's a command
      if (value.startsWith('/')) {
        const parts = value.slice(1).split(' ');
        const command = parts[0];
        const args = parts.slice(1).join(' ');
        store.recordCommandUsage(command, args, true, 'selected');
      }
    },
    [store],
  );

  return {
    suggestions,
    activeSuggestionIndex,
    visibleStartIndex,
    showSuggestions,
    isLoadingSuggestions,
    isPerfectMatch,

    setSuggestions,
    setShowSuggestions,
    setActiveSuggestionIndex,
    setVisibleStartIndex,
    setIsLoadingSuggestions,
    setIsPerfectMatch,

    resetCompletionState,
    navigateUp,
    navigateDown,

    // New smart suggestion features
    smartSuggestions,
    isGeneratingSmartSuggestions,
    enhanceWithSmartSuggestions,
    setCurrentFileContext,
    recordSuggestionSelection,
  };
}

/**
 * Hook for managing completion state with automatic smart suggestion integration
 *
 * This is a convenience hook that automatically enhances suggestions when
 * they are set.
 *
 * @example
 * ```tsx
 * const {
 *   suggestions,
 *   setBaseSuggestions,
 *   activeSuggestionIndex,
 * } = useAutoSmartCompletion({
 *   enabled: true,
 *   currentFile: '/src/App.tsx',
 *   userInput: currentInput,
 * });
 *
 * // Set base suggestions - they will be automatically enhanced
 * setBaseSuggestions(baseSuggestions);
 * ```
 */
export function useAutoSmartCompletion(
  options: {
    enabled?: boolean;
    currentFile?: string;
    userInput?: string;
  } = {},
) {
  const { enabled = true, currentFile, userInput } = options;

  const {
    suggestions,
    setSuggestions,
    activeSuggestionIndex,
    visibleStartIndex,
    showSuggestions,
    isLoadingSuggestions,
    isPerfectMatch,
    navigateUp,
    navigateDown,
    resetCompletionState,
    smartSuggestions,
    isGeneratingSmartSuggestions,
    enhanceWithSmartSuggestions,
    setCurrentFileContext,
    recordSuggestionSelection,
    setActiveSuggestionIndex,
    setVisibleStartIndex,
    setIsLoadingSuggestions,
    setIsPerfectMatch,
    setShowSuggestions,
  } = useCompletion({
    enableSmartSuggestions: enabled,
    currentFile,
    userInput,
  });

  // Track previous base suggestions to avoid re-enhancing
  const prevBaseRef = useRef<Suggestion[]>([]);

  /**
   * Set base suggestions and automatically enhance them
   */
  const setBaseSuggestions = useCallback(
    (baseSuggestions: Suggestion[]) => {
      // Check if suggestions have changed
      const hasChanged =
        baseSuggestions.length !== prevBaseRef.current.length ||
        baseSuggestions.some(
          (s, i) => s.value !== prevBaseRef.current[i]?.value,
        );

      if (hasChanged) {
        prevBaseRef.current = baseSuggestions;

        if (enabled) {
          const enhanced = enhanceWithSmartSuggestions(baseSuggestions);
          setSuggestions(enhanced);
        } else {
          setSuggestions(baseSuggestions);
        }
      }
    },
    [enabled, enhanceWithSmartSuggestions, setSuggestions],
  );

  return {
    suggestions,
    setSuggestions,
    setBaseSuggestions,
    activeSuggestionIndex,
    visibleStartIndex,
    showSuggestions,
    isLoadingSuggestions,
    isPerfectMatch,
    navigateUp,
    navigateDown,
    resetCompletionState,
    smartSuggestions,
    isGeneratingSmartSuggestions,
    setCurrentFileContext,
    recordSuggestionSelection,
    setActiveSuggestionIndex,
    setVisibleStartIndex,
    setIsLoadingSuggestions,
    setIsPerfectMatch,
    setShowSuggestions,
  };
}

// Export types for external use
export type { ScoredSuggestion };
