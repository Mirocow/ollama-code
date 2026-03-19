/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Knowledge Integration for Storage Tools
 * Provides semantic search and knowledge operations for model_storage
 */

import type { ToolResult } from '../tools/tools.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { getOllamaDir } from '../utils/paths.js';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

const debugLogger = createDebugLogger('KNOWLEDGE_INTEGRATION');

// Lazy-loaded instances
let knowledgeBasePromise: Promise<any> | null = null;

/**
 * Get or initialize knowledge base lazily
 */
async function getKnowledgeBase() {
  if (!knowledgeBasePromise) {
    knowledgeBasePromise = (async () => {
      try {
        const { getKnowledgeBase: getKB } = await import('./knowledge-base.js');
        const kb = getKB();
        await kb.initialize();
        return kb;
      } catch (error) {
        debugLogger.error(
          '[KnowledgeIntegration] Failed to initialize knowledge base:',
          error,
        );
        return null;
      }
    })();
  }
  return knowledgeBasePromise;
}

// ============================================================================
// Search Operations
// ============================================================================

/**
 * Perform semantic search across storage
 */
export async function performSearch(params: {
  query?: string;
  namespaces?: string[];
  mode?: 'semantic' | 'keyword' | 'hybrid';
  limit?: number;
  threshold?: number;
  tags?: string[];
  includeMetadata?: boolean;
}): Promise<ToolResult> {
  const {
    query,
    namespaces,
    mode = 'semantic',
    limit = 10,
    threshold = 0.7,
    includeMetadata = true,
  } = params;

  if (!query) {
    return {
      llmContent: 'Error: "query" parameter is required for search operation',
      returnDisplay: 'Error: query required',
    };
  }

  debugLogger.info(`[Search] Performing ${mode} search: "${query}"`);

  try {
    const kb = await getKnowledgeBase();

    if (!kb || mode === 'keyword') {
      // Fallback to simple keyword search in JSON storage
      return performKeywordSearchFallback(query, namespaces, limit);
    }

    // Use knowledge base for semantic search
    const results = await kb.search({
      query,
      namespaces,
      mode,
      limit,
      threshold,
      includeMetadata,
    });

    if (!results || results.length === 0) {
      return {
        llmContent: `No results found for query "${query}" (threshold: ${threshold}, mode: ${mode})`,
        returnDisplay: 'No results found',
      };
    }

    // Format results
    const formattedResults = results.map((r: any, i: number) => ({
      rank: i + 1,
      id: r.id,
      namespace: r.namespace,
      key: r.key,
      score: r.score?.toFixed(3),
      content:
        r.content?.length > 300 ? r.content.slice(0, 300) + '...' : r.content,
    }));

    const llmContent = `## Search Results for "${query}"

Found ${results.length} results (mode: ${mode}, threshold: ${threshold}):

${formattedResults
  .map(
    (r: any) => `### ${r.rank}. [${r.namespace}] ${r.key || r.id}
**Score:** ${r.score}
${r.content}`,
  )
  .join('\n\n')}

---
*Use "operation": "get", "namespace": "${formattedResults[0]?.namespace}", "key": "${formattedResults[0]?.key}" to retrieve full content*`;

    return {
      llmContent,
      returnDisplay: `Found ${results.length} results`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugLogger.error('[Search] Failed:', errorMessage);

    // Fallback to keyword search
    return performKeywordSearchFallback(query, namespaces, limit);
  }
}

/**
 * Fallback keyword search in JSON storage files
 */
async function performKeywordSearchFallback(
  query: string,
  namespaces?: string[],
  limit: number = 10,
): Promise<ToolResult> {
  debugLogger.info('[Search] Using keyword fallback');

  const storageDir = path.join(getOllamaDir(), 'storage');
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  const results: Array<{
    namespace: string;
    key: string;
    score: number;
    content: string;
  }> = [];

  try {
    await fs.mkdir(storageDir, { recursive: true });
    const files = await fs.readdir(storageDir).catch(() => [] as string[]);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const namespace = file.replace('.json', '');
      if (namespaces && !namespaces.includes(namespace)) continue;

      const filePath = path.join(storageDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        for (const [key, entry] of Object.entries(
          data as Record<string, any>,
        )) {
          const entryContent = JSON.stringify(entry.value || entry);
          const entryLower = entryContent.toLowerCase();

          let matchCount = 0;
          for (const term of queryTerms) {
            if (entryLower.includes(term)) matchCount++;
          }

          if (matchCount > 0) {
            results.push({
              namespace,
              key,
              score: matchCount / queryTerms.length,
              content: entryContent.slice(0, 300),
            });
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    const limited = results.slice(0, limit);

    if (limited.length === 0) {
      return {
        llmContent: `No results found for "${query}" (keyword search)`,
        returnDisplay: 'No results found',
      };
    }

    const llmContent = `## Search Results for "${query}" (keyword mode)

Found ${limited.length} results:

${limited
  .map(
    (r, i) => `### ${i + 1}. [${r.namespace}] ${r.key}
**Relevance:** ${(r.score * 100).toFixed(0)}%
${r.content}${r.content.length >= 300 ? '...' : ''}`,
  )
  .join('\n\n')}`;

    return {
      llmContent,
      returnDisplay: `Found ${limited.length} results (keyword)`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      llmContent: `Search failed: ${errorMessage}`,
      returnDisplay: 'Search error',
    };
  }
}

/**
 * Find similar entries
 */
export async function performFindSimilar(params: {
  namespace: string;
  key?: string;
  limit?: number;
  threshold?: number;
  sameNamespace?: boolean;
}): Promise<ToolResult> {
  const {
    namespace,
    key,
    limit = 5,
    threshold = 0.8,
    sameNamespace = false,
  } = params;

  if (!key) {
    return {
      llmContent:
        'Error: "key" parameter is required for findSimilar operation',
      returnDisplay: 'Error: key required',
    };
  }

  debugLogger.info(`[FindSimilar] Finding similar to ${namespace}:${key}`);

  try {
    const kb = await getKnowledgeBase();

    if (!kb) {
      return {
        llmContent:
          'Knowledge base not available. Semantic similarity requires Ollama embeddings.',
        returnDisplay: 'Knowledge base unavailable',
      };
    }

    // Get the source entry first
    const entry = await kb.get(key, namespace);
    if (!entry) {
      return {
        llmContent: `Entry "${key}" not found in namespace "${namespace}"`,
        returnDisplay: 'Entry not found',
      };
    }

    // Find similar
    const results = await kb.findSimilar(entry.id, {
      limit,
      threshold,
      sameNamespace,
    });

    if (!results || results.length === 0) {
      return {
        llmContent: `No similar entries found for "${key}" (threshold: ${threshold})`,
        returnDisplay: 'No similar entries',
      };
    }

    const llmContent = `## Similar Entries to "${key}"

Found ${results.length} similar entries:

${results
  .map(
    (r: any, i: number) => `### ${i + 1}. [${r.namespace}] ${r.key || r.id}
**Similarity:** ${(r.score * 100).toFixed(1)}%
${r.content?.slice(0, 200)}${r.content?.length > 200 ? '...' : ''}`,
  )
  .join('\n\n')}`;

    return {
      llmContent,
      returnDisplay: `Found ${results.length} similar`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugLogger.error('[FindSimilar] Failed:', errorMessage);

    return {
      llmContent: `Find similar failed: ${errorMessage}`,
      returnDisplay: `Error: ${errorMessage}`,
    };
  }
}

/**
 * Add entry with automatic embedding generation
 */
export async function performAddWithEmbedding(
  params: {
    namespace: string;
    key?: string;
    value?: unknown;
    tags?: string[];
    autoExtractEntities?: boolean;
  },
  performSet: (p: any) => Promise<ToolResult>,
): Promise<ToolResult> {
  const { namespace, key, value, tags, autoExtractEntities = false } = params;

  if (!key) {
    return {
      llmContent:
        'Error: "key" parameter is required for addWithEmbedding operation',
      returnDisplay: 'Error: key required',
    };
  }

  if (value === undefined) {
    return {
      llmContent:
        'Error: "value" parameter is required for addWithEmbedding operation',
      returnDisplay: 'Error: value required',
    };
  }

  debugLogger.info(`[AddWithEmbedding] Adding ${namespace}:${key}`);

  try {
    // First, perform normal set operation - this always succeeds
    await performSet({
      operation: 'set',
      namespace,
      key,
      value,
      tags,
    });

    // Then try to add to knowledge base for semantic search (optional)
    let embeddingStatus = '(embedding skipped)';
    try {
      const kb = await getKnowledgeBase();

      if (kb) {
        const content =
          typeof value === 'string' ? value : JSON.stringify(value, null, 2);

        await kb.add(content, namespace, {
          key,
          tags,
        });
        embeddingStatus = '(with embedding for semantic search)';
      }
    } catch (embeddingError) {
      // Embedding failed, but data is still stored
      const errorMsg =
        embeddingError instanceof Error
          ? embeddingError.message
          : String(embeddingError);
      debugLogger.warn(
        '[AddWithEmbedding] Embedding generation failed, data stored without semantic search:',
        errorMsg,
      );
      embeddingStatus = `(embedding failed: ${errorMsg.includes('fetch') ? 'Ollama not running?' : errorMsg.slice(0, 50)})`;
    }

    let entityInfo = '';
    if (autoExtractEntities) {
      entityInfo = '\n\n*Entity extraction can be done via search operation.*';
    }

    // Add instruction for model to continue with next task
    const continueHint = embeddingStatus.includes('failed')
      ? ' Data saved successfully. Continue with the next step in your task.'
      : ' Continue with the next step in your task.';

    return {
      llmContent: `Added "${key}" to "${namespace}" ${embeddingStatus}.${entityInfo}${continueHint}`,
      returnDisplay: `Added: ${key}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugLogger.error('[AddWithEmbedding] Failed:', errorMessage);

    return {
      llmContent: `Storage error: ${errorMessage}. Try using operation "set" instead (without embedding), or check if the namespace and key are valid. Then continue with the next step.`,
      returnDisplay: `Error: ${errorMessage}`,
    };
  }
}

/**
 * Get knowledge base statistics
 */
export async function performKnowledgeStats(): Promise<ToolResult> {
  debugLogger.info('[KnowledgeStats] Getting statistics');

  try {
    const kb = await getKnowledgeBase();

    if (!kb) {
      // Return storage stats as fallback
      const storageDir = path.join(getOllamaDir(), 'storage');
      await fs.mkdir(storageDir, { recursive: true });
      const files = await fs.readdir(storageDir).catch(() => [] as string[]);

      let totalKeys = 0;
      const namespaceStats: Record<string, number> = {};

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const namespace = file.replace('.json', '');
        const filePath = path.join(storageDir, file);

        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          const keyCount = Object.keys(data).length;
          namespaceStats[namespace] = keyCount;
          totalKeys += keyCount;
        } catch {
          // Skip unreadable files
        }
      }

      const llmContent = `## Storage Statistics (JSON mode)

**Storage Type:** JSON files
**Total Entries:** ${totalKeys}

### Entries by Namespace
${
  Object.entries(namespaceStats)
    .map(([ns, count]) => `- **${ns}:** ${count} entries`)
    .join('\n') || '*No namespaces found*'
}

*Knowledge base with semantic search requires Ollama with embedding model (e.g., nomic-embed-text).*`;

      return {
        llmContent,
        returnDisplay: `${totalKeys} entries in storage`,
      };
    }

    const stats = await kb.stats();

    const llmContent = `## Knowledge Base Statistics

**Storage Type:** Vector Database (embeddings)
**Total Entries:** ${stats.totalEntries}
**Total Size:** ${(stats.totalSize / 1024).toFixed(2)} KB

### Entries by Namespace
${
  Object.entries(stats.entriesByNamespace)
    .map(([ns, count]) => `- **${ns}:** ${count} entries`)
    .join('\n') || '*No entries yet*'
}

### Capabilities
- ✅ Semantic Search (embeddings)
- ✅ Find Similar
- ✅ Vector Similarity

*Use "operation": "search" to perform semantic search.*`;

    return {
      llmContent,
      returnDisplay: `${stats.totalEntries} entries in knowledge base`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      llmContent: `Failed to get knowledge stats: ${errorMessage}`,
      returnDisplay: 'Error getting stats',
    };
  }
}

export default {
  performSearch,
  performFindSimilar,
  performAddWithEmbedding,
  performKnowledgeStats,
};
