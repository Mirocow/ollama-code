/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Knowledge Base Core
 * Semantic storage using Ollama embeddings with HNSWLib vector database
 */

import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';

import type {
  KnowledgeEntry,
  KnowledgeNamespace,
  KnowledgeMetadata,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
  KnowledgeBaseConfig,
} from './types.js';
import { DEFAULT_KNOWLEDGE_BASE_CONFIG } from './types.js';
import { getOllamaDir } from '../utils/paths.js';
import { createDebugLogger } from '../utils/debugLogger.js';

// HNSWLib imports from embedjs
import { HNSWDb } from '@llm-tools/embedjs-hnswlib';

const debugLogger = createDebugLogger('KNOWLEDGE_BASE');

// ============================================================================
// Types for HNSWLib integration
// ============================================================================

interface VectorEntry {
  id: string;
  namespace: KnowledgeNamespace;
  key?: string;
  content: string;
  metadata: KnowledgeMetadata;
}

// Metadata for HNSWLib - must match embedjs Metadata type
type HNSWLibMetadata = Record<string, string | number | boolean>;

// ============================================================================
// Knowledge Base Class
// ============================================================================

/**
 * Knowledge Base - Semantic storage using Ollama embeddings and HNSWLib
 */
export class KnowledgeBase {
  private config: KnowledgeBaseConfig;
  private vectorDb: HNSWDb;
  private entries: Map<string, VectorEntry> = new Map();
  private entriesByNamespace: Map<KnowledgeNamespace, Set<string>> = new Map();
  private initialized = false;
  private ollamaBaseUrl: string;
  private vectorDbPath: string;
  private entriesPath: string;
  private dimensions: number = 768; // Default for nomic-embed-text

  constructor(config: Partial<KnowledgeBaseConfig> = {}) {
    this.config = { ...DEFAULT_KNOWLEDGE_BASE_CONFIG, ...config };
    
    this.vectorDbPath = this.config.vectorDbPath || 
      path.join(getOllamaDir(), 'knowledge');
    
    this.ollamaBaseUrl = this.config.ollamaBaseUrl || 'http://localhost:11434';
    this.entriesPath = path.join(this.vectorDbPath, 'entries.json');
    
    // Initialize HNSWLib
    this.vectorDb = new HNSWDb();

    debugLogger.info(`[KnowledgeBase] Created with config:`, {
      ollamaBaseUrl: this.ollamaBaseUrl,
      embeddingModel: this.config.embeddingModel,
      vectorDbPath: this.vectorDbPath,
    });
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      debugLogger.info('[KnowledgeBase] Initializing...');

      // Ensure directory exists
      await fs.mkdir(this.vectorDbPath, { recursive: true });

      // Initialize HNSWLib
      await this.vectorDb.init({ dimensions: this.dimensions });

      // Load existing entries metadata
      await this.loadEntries();

      this.initialized = true;
      debugLogger.info('[KnowledgeBase] Initialized successfully with HNSWLib');
    } catch (error) {
      debugLogger.error('[KnowledgeBase] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load entries metadata from JSON file
   */
  private async loadEntries(): Promise<void> {
    try {
      const content = await fs.readFile(this.entriesPath, 'utf-8');
      const data = JSON.parse(content) as VectorEntry[];
      
      for (const entry of data) {
        this.entries.set(entry.id, entry);
        
        if (!this.entriesByNamespace.has(entry.namespace)) {
          this.entriesByNamespace.set(entry.namespace, new Set());
        }
        this.entriesByNamespace.get(entry.namespace)!.add(entry.id);
      }
      
      debugLogger.info(`[KnowledgeBase] Loaded ${this.entries.size} entries`);
    } catch {
      debugLogger.info('[KnowledgeBase] No existing entries, starting fresh');
    }
  }

  /**
   * Save entries metadata to JSON file
   */
  private async saveEntries(): Promise<void> {
    const data = Array.from(this.entries.values());
    await fs.writeFile(this.entriesPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Add content with embedding to HNSWLib
   */
  async add(
    content: string,
    namespace: KnowledgeNamespace,
    options?: {
      key?: string;
      tags?: string[];
      metadata?: Partial<KnowledgeMetadata>;
    }
  ): Promise<KnowledgeEntry> {
    await this.ensureInitialized();

    const id = this.generateId();
    const now = new Date().toISOString();

    const metadata: KnowledgeMetadata = {
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: options?.tags,
      source: 'model',
      ...options?.metadata,
    };

    // Generate embedding using Ollama
    const embedding = await this.generateEmbedding(content);

    // Prepare metadata for HNSWLib - only primitive values allowed
    const storedMetadata: HNSWLibMetadata = {
      entryId: id,
      namespace: namespace,
      key: options?.key || '',
      createdAt: now,
      // Store tags as JSON string since arrays not allowed
      tags: options?.tags ? options.tags.join(',') : '',
    };

    // Insert into HNSWLib
    await this.vectorDb.insertChunks([{
      vector: embedding,
      pageContent: content,
      metadata: {
        ...storedMetadata,
        id: id,
        uniqueLoaderId: `kb_${namespace}_${id}`,
        source: `knowledge:${namespace}`,
      },
    }]);

    // Store entry metadata
    const entry: VectorEntry = {
      id,
      namespace,
      key: options?.key,
      content,
      metadata,
    };

    this.entries.set(id, entry);
    
    if (!this.entriesByNamespace.has(namespace)) {
      this.entriesByNamespace.set(namespace, new Set());
    }
    this.entriesByNamespace.get(namespace)!.add(id);

    // Persist
    await this.saveEntries();

    debugLogger.info(`[KnowledgeBase] Added entry ${id} to namespace ${namespace} with HNSWLib`);

    return {
      id,
      content,
      namespace,
      key: options?.key,
      metadata,
    };
  }

  /**
   * Get entry by ID or key
   */
  async get(idOrKey: string, namespace?: KnowledgeNamespace): Promise<KnowledgeEntry | null> {
    await this.ensureInitialized();

    // Try by ID first
    let entry = this.entries.get(idOrKey);
    
    // Try by key within namespace
    if (!entry && namespace) {
      for (const e of this.entries.values()) {
        if (e.namespace === namespace && e.key === idOrKey) {
          entry = e;
          break;
        }
      }
    }

    if (!entry) return null;

    return {
      id: entry.id,
      content: entry.content,
      namespace: entry.namespace,
      key: entry.key,
      metadata: entry.metadata,
    };
  }

  /**
   * Delete entry
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const entry = this.entries.get(id);
    if (!entry) return false;

    this.entries.delete(id);
    this.entriesByNamespace.get(entry.namespace)?.delete(id);
    
    await this.saveEntries();
    
    // Note: HNSWLib doesn't support individual deletion, would need to rebuild index
    
    debugLogger.info(`[KnowledgeBase] Deleted entry ${id}`);
    return true;
  }

  /**
   * List entries in namespace
   */
  async list(namespace?: KnowledgeNamespace): Promise<KnowledgeEntry[]> {
    await this.ensureInitialized();
    
    const entries: KnowledgeEntry[] = [];
    
    for (const entry of this.entries.values()) {
      if (!namespace || entry.namespace === namespace) {
        entries.push({
          id: entry.id,
          content: entry.content,
          namespace: entry.namespace,
          key: entry.key,
          metadata: entry.metadata,
        });
      }
    }
    
    return entries;
  }

  // ============================================================================
  // Search Operations
  // ============================================================================

  /**
   * Semantic search using HNSWLib
   */
  async search(params: KnowledgeSearchParams): Promise<KnowledgeSearchResult[]> {
    await this.ensureInitialized();

    const { query, namespaces, limit = 10, threshold = 0.7, includeMetadata = true } = params;

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Search in HNSWLib
    const results = await this.vectorDb.similaritySearch(queryEmbedding, limit * 2);

    // Filter and transform results
    const searchResults: KnowledgeSearchResult[] = [];

    for (const result of results) {
      const meta = result.metadata as Record<string, any>;
      
      // Filter by namespace
      if (namespaces && !namespaces.includes(meta['namespace'] as KnowledgeNamespace)) {
        continue;
      }

      // Calculate similarity score (HNSWLib returns distance, convert to similarity)
      const score = 1 - result.score; // Assuming cosine distance
      
      // Filter by threshold
      if (score < threshold) continue;

      const entry = this.entries.get(meta['entryId'] as string);

      searchResults.push({
        id: meta['entryId'] as string,
        content: result.pageContent,
        namespace: meta['namespace'] as KnowledgeNamespace,
        score,
        key: meta['key'] as string | undefined,
        metadata: includeMetadata && entry ? entry.metadata : undefined,
      });

      if (searchResults.length >= limit) break;
    }

    return searchResults;
  }

  /**
   * Find similar entries using HNSWLib
   */
  async findSimilar(
    entryId: string,
    options?: {
      limit?: number;
      threshold?: number;
      sameNamespace?: boolean;
    }
  ): Promise<KnowledgeSearchResult[]> {
    await this.ensureInitialized();

    const entry = this.entries.get(entryId);
    if (!entry) return [];

    // Generate embedding for the entry content
    const embedding = await this.generateEmbedding(entry.content);

    // Search
    const limit = options?.limit || 5;
    const results = await this.vectorDb.similaritySearch(embedding, limit + 1);

    const namespaces = options?.sameNamespace ? [entry.namespace] : undefined;

    const searchResults: KnowledgeSearchResult[] = [];

    for (const result of results) {
      const meta = result.metadata as Record<string, any>;
      
      // Exclude self
      if (meta['entryId'] === entryId) continue;

      // Filter by namespace
      if (namespaces && !namespaces.includes(meta['namespace'] as KnowledgeNamespace)) {
        continue;
      }

      const score = 1 - result.score;
      
      if (options?.threshold && score < options.threshold) continue;

      searchResults.push({
        id: meta['entryId'] as string,
        content: result.pageContent,
        namespace: meta['namespace'] as KnowledgeNamespace,
        score,
        key: meta['key'] as string | undefined,
      });

      if (searchResults.length >= limit) break;
    }

    return searchResults;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  async stats(): Promise<{
    totalEntries: number;
    entriesByNamespace: Record<string, number>;
    totalSize: number;
    vectorCount: number;
  }> {
    await this.ensureInitialized();

    const entriesByNamespace: Record<string, number> = {};
    
    for (const [namespace, ids] of this.entriesByNamespace) {
      entriesByNamespace[namespace] = ids.size;
    }

    let totalSize = 0;
    for (const entry of this.entries.values()) {
      totalSize += entry.content.length;
    }

    const vectorCount = await this.vectorDb.getVectorCount();

    return {
      totalEntries: this.entries.size,
      entriesByNamespace,
      totalSize,
      vectorCount,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private generateId(): string {
    return `kb_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Generate embedding using Ollama API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.embeddingModel || 'nomic-embed-text',
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json() as { embedding?: number[] };
      
      if (!data.embedding) {
        throw new Error('No embedding in response');
      }

      // Update dimensions if needed
      if (data.embedding.length !== this.dimensions) {
        this.dimensions = data.embedding.length;
        debugLogger.info(`[KnowledgeBase] Updated dimensions to ${this.dimensions}`);
      }

      return data.embedding;
    } catch (error) {
      debugLogger.error('[KnowledgeBase] Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Close and cleanup
   */
  async close(): Promise<void> {
    await this.saveEntries();
    await this.vectorDb.reset();
    this.initialized = false;
    debugLogger.info('[KnowledgeBase] Closed');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let knowledgeBaseInstance: KnowledgeBase | null = null;

export function getKnowledgeBase(config?: Partial<KnowledgeBaseConfig>): KnowledgeBase {
  if (!knowledgeBaseInstance) {
    knowledgeBaseInstance = new KnowledgeBase(config);
  }
  return knowledgeBaseInstance;
}

export async function initializeKnowledgeBase(config?: Partial<KnowledgeBaseConfig>): Promise<KnowledgeBase> {
  const kb = getKnowledgeBase(config);
  await kb.initialize();
  return kb;
}

export default KnowledgeBase;
