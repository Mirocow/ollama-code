/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useSuggestionEngineStore,
  type TopicRecord,
} from '../services/SuggestionEngine.js';
import type { HistoryItemWithoutId } from '../types.js';

/**
 * Extracted keyword with metadata
 */
export interface ExtractedKeyword {
  word: string;
  frequency: number;
  positions: number[];
  context: 'user' | 'assistant' | 'code' | 'command';
}

/**
 * Keyword extraction options
 */
export interface KeywordExtractionOptions {
  /** Minimum word length to consider */
  minWordLength?: number;
  /** Maximum number of keywords to extract */
  maxKeywords?: number;
  /** Include code identifiers (camelCase, snake_case) */
  includeCodeIdentifiers?: boolean;
  /** Include file paths */
  includeFilePaths?: boolean;
  /** Custom stop words to exclude */
  customStopWords?: string[];
}

/**
 * Options for useContextKeywords hook
 */
export interface UseContextKeywordsOptions {
  /** Maximum number of topics to track */
  maxTopics?: number;
  /** Time window for recent context (ms) */
  contextWindow?: number;
  /** Keyword extraction options */
  extractionOptions?: KeywordExtractionOptions;
  /** Auto-extract from conversation history */
  autoExtract?: boolean;
}

/**
 * Return type for useContextKeywords hook
 */
export interface UseContextKeywordsReturn {
  /** Current keywords from conversation */
  keywords: ExtractedKeyword[];
  /** Recent topics discussed */
  recentTopics: TopicRecord[];
  /** Extract keywords from text */
  extractKeywords: (
    text: string,
    context?: 'user' | 'assistant' | 'code' | 'command',
  ) => ExtractedKeyword[];
  /** Record a topic discussion */
  recordTopic: (
    topic: string,
    keywords: string[],
    relatedFiles?: string[],
  ) => void;
  /** Get keywords matching a pattern */
  getMatchingKeywords: (pattern: string | RegExp) => ExtractedKeyword[];
  /** Get topics related to a keyword */
  getTopicsForKeyword: (keyword: string) => TopicRecord[];
  /** Clear keyword history */
  clearKeywords: () => void;
  /** Get keyword frequency map */
  getKeywordFrequency: () => Map<string, number>;
  /** Check if keyword is relevant to current context */
  isRelevantKeyword: (keyword: string) => boolean;
}

// Default stop words
const DEFAULT_STOP_WORDS = new Set([
  // Common English words
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'shall',
  'can',
  'need',
  'dare',
  'ought',
  'used',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'what',
  'which',
  'who',
  'whom',
  'where',
  'when',
  'why',
  'how',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'also',
  'now',
  'here',
  'there',
  'then',
  'once',
  // Common coding filler words
  'function',
  'const',
  'let',
  'var',
  'return',
  'if',
  'else',
  'true',
  'false',
  'null',
  'undefined',
  'new',
  'class',
  'import',
  'export',
  'default',
  'type',
  'interface',
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'void',
]);

/**
 * Hook for extracting and managing context keywords from conversations
 *
 * This hook provides utilities for:
 * - Extracting meaningful keywords from text
 * - Tracking conversation topics
 * - Identifying relevant context for suggestions
 *
 * @example
 * ```tsx
 * const { keywords, extractKeywords, recordTopic } = useContextKeywords();
 *
 * // Extract keywords from user message
 * const extracted = extractKeywords('I want to fix the Button component');
 *
 * // Record a topic
 * recordTopic('Button component', ['Button', 'component', 'fix']);
 * ```
 */
export function useContextKeywords(
  options: UseContextKeywordsOptions = {},
): UseContextKeywordsReturn {
  const {
    maxTopics = 30,
    extractionOptions = {},
    autoExtract = true,
  } = options;

  const store = useSuggestionEngineStore();

  // Track keywords state
  const [keywords, setKeywords] = useState<ExtractedKeyword[]>([]);
  const keywordFrequencyRef = useRef<Map<string, ExtractedKeyword>>(new Map());

  // Track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Extract keywords from text
   */
  const extractKeywords = useCallback(
    (
      text: string,
      context: 'user' | 'assistant' | 'code' | 'command' = 'user',
    ): ExtractedKeyword[] => {
      const {
        minWordLength = 3,
        maxKeywords = 15,
        includeCodeIdentifiers = true,
        includeFilePaths = true,
        customStopWords = [],
      } = extractionOptions;

      const stopWords = new Set([...DEFAULT_STOP_WORDS, ...customStopWords]);

      // Tokenize text
      const tokens: Array<{ word: string; position: number }> = [];

      // Extract regular words
      const wordPattern = /\b([a-zA-Z][a-zA-Z0-9]*)\b/g;
      let match;

      while ((match = wordPattern.exec(text)) !== null) {
        const word = match[1];
        if (
          word.length >= minWordLength &&
          !stopWords.has(word.toLowerCase())
        ) {
          tokens.push({ word: word.toLowerCase(), position: match.index });
        }
      }

      // Extract code identifiers (camelCase, PascalCase, snake_case)
      if (includeCodeIdentifiers) {
        const identifierPattern =
          /\b([A-Z][a-z]+(?:[A-Z][a-z]+)+|[a-z]+(?:_[a-z]+)+)\b/g;
        while ((match = identifierPattern.exec(text)) !== null) {
          const identifier = match[1];
          // Split camelCase and snake_case
          const parts = identifier
            .split(/(?=[A-Z])|_/)
            .filter((p) => p.length >= minWordLength);
          for (const part of parts) {
            if (!stopWords.has(part.toLowerCase())) {
              tokens.push({ word: part.toLowerCase(), position: match.index });
            }
          }
        }
      }

      // Extract file paths
      if (includeFilePaths) {
        const pathPattern =
          /['"`]?([./][a-zA-Z0-9_\-./]+(?:\.[a-zA-Z0-9]+)?)['"`]?/g;
        while ((match = pathPattern.exec(text)) !== null) {
          const path = match[1];
          if (path.length >= minWordLength) {
            tokens.push({ word: path, position: match.index });
          }
        }
      }

      // Count word frequency and positions
      const keywordMap = new Map<
        string,
        { frequency: number; positions: number[] }
      >();

      for (const token of tokens) {
        const existing = keywordMap.get(token.word);
        if (existing) {
          existing.frequency++;
          existing.positions.push(token.position);
        } else {
          keywordMap.set(token.word, {
            frequency: 1,
            positions: [token.position],
          });
        }
      }

      // Sort by frequency and return top keywords
      const result = Array.from(keywordMap.entries())
        .sort((a, b) => b[1].frequency - a[1].frequency)
        .slice(0, maxKeywords)
        .map(([word, data]) => ({
          word,
          frequency: data.frequency,
          positions: data.positions,
          context,
        }));

      return result;
    },
    [extractionOptions],
  );

  /**
   * Record a topic discussion
   */
  const recordTopic = useCallback(
    (topic: string, keywords: string[], relatedFiles: string[] = []) => {
      if (!isMountedRef.current) return;
      store.recordTopic(topic, keywords, relatedFiles);
    },
    [store],
  );

  /**
   * Get recent topics
   */
  const recentTopics = useMemo(() => store.getRecentTopics(maxTopics), [store.recentTopics, maxTopics]);

  /**
   * Get keywords matching a pattern
   */
  const getMatchingKeywords = useCallback(
    (pattern: string | RegExp): ExtractedKeyword[] => {
      const regex =
        typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
      return keywords.filter((k) => regex.test(k.word));
    },
    [keywords],
  );

  /**
   * Get topics related to a keyword
   */
  const getTopicsForKeyword = useCallback(
    (keyword: string): TopicRecord[] => {
      const normalizedKeyword = keyword.toLowerCase();
      return recentTopics.filter(
        (topic) =>
          topic.keywords.some((kw) =>
            kw.toLowerCase().includes(normalizedKeyword),
          ) || topic.topic.toLowerCase().includes(normalizedKeyword),
      );
    },
    [recentTopics],
  );

  /**
   * Clear keyword history
   */
  const clearKeywords = useCallback(() => {
    keywordFrequencyRef.current.clear();
    setKeywords([]);
    store.clearHistory();
  }, [store]);

  /**
   * Get keyword frequency map
   */
  const getKeywordFrequency = useCallback((): Map<string, number> => {
    const frequency = new Map<string, number>();
    for (const keyword of keywords) {
      frequency.set(keyword.word, keyword.frequency);
    }
    return frequency;
  }, [keywords]);

  /**
   * Check if keyword is relevant to current context
   */
  const isRelevantKeyword = useCallback(
    (keyword: string): boolean => {
      const normalizedKeyword = keyword.toLowerCase();

      // Check if keyword appears in recent topics
      if (
        recentTopics.some((topic) =>
          topic.keywords.some((kw) =>
            kw.toLowerCase().includes(normalizedKeyword),
          ),
        )
      ) {
        return true;
      }

      // Check if keyword appears with high frequency
      const keywordData = keywordFrequencyRef.current.get(normalizedKeyword);
      if (keywordData && keywordData.frequency >= 2) {
        return true;
      }

      return false;
    },
    [recentTopics],
  );

  /**
   * Update internal keyword state when store changes
   */
  useEffect(() => {
    if (!autoExtract) return;

    // Re-extract keywords from recent topics
    const allKeywords: Map<string, ExtractedKeyword> = new Map();

    for (const topic of store.recentTopics) {
      for (const kw of topic.keywords) {
        const existing = allKeywords.get(kw.toLowerCase());
        if (existing) {
          existing.frequency++;
        } else {
          allKeywords.set(kw.toLowerCase(), {
            word: kw.toLowerCase(),
            frequency: 1,
            positions: [],
            context: 'user',
          });
        }
      }
    }

    keywordFrequencyRef.current = allKeywords;
    setKeywords(
      Array.from(allKeywords.values()).sort(
        (a, b) => b.frequency - a.frequency,
      ),
    );
  }, [store.recentTopics, autoExtract]);

  return {
    keywords,
    recentTopics,
    extractKeywords,
    recordTopic,
    getMatchingKeywords,
    getTopicsForKeyword,
    clearKeywords,
    getKeywordFrequency,
    isRelevantKeyword,
  };
}

/**
 * Hook for extracting context from conversation history
 *
 * @example
 * ```tsx
 * const { processHistory, getContextSummary } = useConversationContext();
 *
 * // Process conversation history
 * processHistory(historyItems);
 *
 * // Get context summary
 * console.log(getContextSummary());
 * ```
 */
export function useConversationContext() {
  const { extractKeywords, recordTopic, keywords, recentTopics } =
    useContextKeywords();
  const { recordFileAccess } = useSuggestionEngineStore();

  /**
   * Process conversation history to extract context
   */
  const processHistory = useCallback(
    (history: HistoryItemWithoutId[]) => {
      const allKeywords: Map<string, { count: number; files: string[] }> =
        new Map();
      let lastUserMessage = '';

      for (const item of history) {
        if (item.type === 'user' && item.text) {
          lastUserMessage = item.text;
          const extracted = extractKeywords(item.text, 'user');
          for (const kw of extracted) {
            const existing = allKeywords.get(kw.word);
            if (existing) {
              existing.count++;
            } else {
              allKeywords.set(kw.word, { count: 1, files: [] });
            }
          }
        }

        if (item.type === 'ollama' && item.text) {
          const extracted = extractKeywords(item.text, 'assistant');
          for (const kw of extracted) {
            const existing = allKeywords.get(kw.word);
            if (existing) {
              existing.count++;
            } else {
              allKeywords.set(kw.word, { count: 1, files: [] });
            }
          }
        }

        // Extract file paths from tool groups
        if (item.type === 'tool_group') {
          for (const tool of item.tools) {
            if (
              tool.name === 'read_file' ||
              tool.name === 'edit_file' ||
              tool.name === 'write_file'
            ) {
              // File path extraction would need proper type support
              // The IndividualToolCallDisplay type doesn't have args property
              // For now, skip file path extraction from tool calls
            }
          }
        }
      }

      // Record topics from top keywords
      const topKeywords = Array.from(allKeywords.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      if (topKeywords.length > 0 && lastUserMessage) {
        const topicWords = topKeywords.map(([word]) => word);
        const relatedFiles = topKeywords.flatMap(([, data]) => data.files);

        // Generate topic name from last user message
        const topicName = lastUserMessage.slice(0, 50);
        recordTopic(topicName, topicWords, relatedFiles);
      }
    },
    [extractKeywords, recordTopic, recordFileAccess],
  );

  /**
   * Get a summary of current context
   */
  const getContextSummary = useCallback(() => ({
      keywordCount: keywords.length,
      topicCount: recentTopics.length,
      topKeywords: keywords.slice(0, 5).map((k) => k.word),
      recentTopics: recentTopics.slice(0, 3).map((t) => t.topic),
    }), [keywords, recentTopics]);

  return {
    processHistory,
    getContextSummary,
    keywords,
    recentTopics,
  };
}

export default useContextKeywords;
