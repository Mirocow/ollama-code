/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Knowledge Base Types
 * Types for the intelligent knowledge storage and retrieval system
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Knowledge entry - a single piece of knowledge stored in the system
 */
export interface KnowledgeEntry {
  /** Unique identifier */
  id: string;
  /** Content text */
  content: string;
  /** Namespace for organization */
  namespace: KnowledgeNamespace;
  /** Optional key for direct access */
  key?: string;
  /** Metadata */
  metadata: KnowledgeMetadata;
  /** Embedding vector (optional, stored separately) */
  embedding?: number[];
}

/**
 * Predefined namespaces for knowledge organization
 */
export type KnowledgeNamespace =
  | 'roadmap'     // Project plans and milestones
  | 'knowledge'   // Learned facts and patterns
  | 'context'     // Current task context
  | 'session'     // Temporary session data
  | 'learning'    // AI learning and corrections
  | 'code'        // Code snippets and patterns
  | 'entities'    // Extracted entities
  | 'plans'       // Active plans
  | 'todos'       // Todo items
  | 'custom';     // User-defined namespaces

/**
 * Metadata for knowledge entries
 */
export interface KnowledgeMetadata {
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Version number */
  version: number;
  /** Tags for categorization */
  tags?: string[];
  /** Source of the knowledge */
  source?: 'user' | 'model' | 'extracted' | 'imported';
  /** Confidence level (0-1) */
  confidence?: number;
  /** TTL in seconds */
  ttl?: number;
  /** Expiration timestamp */
  expiresAt?: string;
  /** Related entities */
  relatedEntities?: string[];
  /** Custom properties */
  custom?: Record<string, unknown>;
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * Search mode
 */
export type SearchMode = 'semantic' | 'keyword' | 'hybrid';

/**
 * Search parameters
 */
export interface KnowledgeSearchParams {
  /** Search query */
  query: string;
  /** Namespaces to search in (all if not specified) */
  namespaces?: KnowledgeNamespace[];
  /** Search mode */
  mode?: SearchMode;
  /** Maximum results */
  limit?: number;
  /** Similarity threshold for semantic search (0-1) */
  threshold?: number;
  /** Filter by tags */
  tags?: string[];
  /** Filter by date range */
  dateRange?: {
    from?: string;
    to?: string;
  };
  /** Include metadata in results */
  includeMetadata?: boolean;
  /** Include embeddings in results */
  includeEmbeddings?: boolean;
}

/**
 * Search result
 */
export interface KnowledgeSearchResult {
  /** Entry ID */
  id: string;
  /** Content */
  content: string;
  /** Namespace */
  namespace: KnowledgeNamespace;
  /** Similarity/relevance score (0-1) */
  score: number;
  /** Key if available */
  key?: string;
  /** Metadata */
  metadata?: KnowledgeMetadata;
  /** Highlighted snippets */
  highlights?: string[];
  /** Embedding vector */
  embedding?: number[];
}

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Entity types that can be extracted from content
 */
export type EntityType =
  | 'function'
  | 'class'
  | 'variable'
  | 'file'
  | 'module'
  | 'api'
  | 'config'
  | 'concept'
  | 'pattern'
  | 'error'
  | 'dependency';

/**
 * Extracted entity
 */
export interface KnowledgeEntity {
  /** Entity ID */
  id: string;
  /** Entity type */
  type: EntityType;
  /** Entity name */
  name: string;
  /** Entity value/description */
  value?: string;
  /** Context where entity was found */
  context?: string;
  /** Confidence level */
  confidence: number;
  /** Source entry ID */
  sourceId: string;
  /** Source namespace */
  sourceNamespace: KnowledgeNamespace;
  /** Related entities */
  relations?: EntityRelation[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Relation between entities
 */
export interface EntityRelation {
  /** Target entity ID */
  targetId: string;
  /** Relation type */
  type: 'calls' | 'imports' | 'depends_on' | 'implements' | 'extends' | 'references' | 'contains';
  /** Weight/strength of relation */
  weight?: number;
  /** Context of relation */
  context?: string;
}

// ============================================================================
// Verification Types
// ============================================================================

/**
 * Verification step for tasks
 */
export interface VerificationStep {
  /** Step ID */
  id: string;
  /** Description */
  description: string;
  /** Step type */
  type: VerificationType;
  /** Parameters for verification */
  params: Record<string, unknown>;
  /** Current status */
  status: VerificationStatus;
  /** Result message */
  result?: string;
  /** Timestamp */
  timestamp?: string;
}

/**
 * Types of verification
 */
export type VerificationType =
  | 'file_exists'      // Check if file exists
  | 'file_contains'    // Check if file contains text
  | 'command_success'  // Run command and check exit code
  | 'test_pass'        // Run tests
  | 'lint_pass'        // Run linter
  | 'type_check'       // Run type checker
  | 'build_success'    // Run build
  | 'custom';          // Custom verification

/**
 * Verification status
 */
export type VerificationStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

/**
 * Verification result
 */
export interface VerificationResult {
  /** Overall status */
  status: VerificationStatus;
  /** Completed steps */
  completedSteps: number;
  /** Total steps */
  totalSteps: number;
  /** Individual step results */
  steps: VerificationStep[];
  /** Summary message */
  summary?: string;
  /** Timestamp */
  timestamp: string;
}

// ============================================================================
// Plan Types
// ============================================================================

/**
 * Enhanced plan with verification
 */
export interface KnowledgePlan {
  /** Plan ID */
  id: string;
  /** Plan content/description */
  plan: string;
  /** Status */
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  /** Creation timestamp */
  createdAt: string;
  /** Update timestamp */
  updatedAt: string;
  /** Completion timestamp */
  completedAt?: string;
  /** Session ID */
  sessionId: string;
  /** Progress percentage */
  progress?: number;
  /** Linked todos */
  todos?: KnowledgeTodo[];
  /** Verification configuration */
  verification?: PlanVerification;
  /** Checkpoints */
  checkpoints?: PlanCheckpoint[];
}

/**
 * Plan verification configuration
 */
export interface PlanVerification {
  /** Auto-verify on completion */
  autoVerify: boolean;
  /** Commands to run for verification */
  checkCommands: string[];
  /** Required files that must exist */
  requiredFiles: string[];
  /** Test commands */
  testCommands: string[];
}

/**
 * Plan checkpoint
 */
export interface PlanCheckpoint {
  /** Checkpoint ID */
  id: string;
  /** Step number */
  step: number;
  /** Description */
  description: string;
  /** Timestamp */
  timestamp: string;
  /** Verification passed */
  verified: boolean;
  /** Files modified at checkpoint */
  files: string[];
  /** Notes */
  notes?: string;
}

// ============================================================================
// Todo Types
// ============================================================================

/**
 * Enhanced todo with verification
 */
export interface KnowledgeTodo {
  /** Todo ID */
  id: string;
  /** Content */
  content: string;
  /** Status */
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  /** Priority */
  priority?: 'high' | 'medium' | 'low';
  /** Linked plan ID */
  planId?: string;
  /** Verification steps */
  verification?: VerificationStep[];
  /** Verification result */
  verificationResult?: VerificationResult;
  /** Creation timestamp */
  createdAt: string;
  /** Update timestamp */
  updatedAt: string;
  /** Estimated effort */
  estimatedEffort?: 'small' | 'medium' | 'large';
  /** Dependencies */
  dependsOn?: string[];
  /** Assignee notes */
  notes?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Knowledge base configuration
 */
export interface KnowledgeBaseConfig {
  /** Ollama base URL */
  ollamaBaseUrl?: string;
  /** Embedding model */
  embeddingModel?: string;
  /** Vector DB path */
  vectorDbPath?: string;
  /** Maximum chunk size for splitting */
  maxChunkSize?: number;
  /** Chunk overlap */
  chunkOverlap?: number;
  /** Enable entity extraction */
  enableEntityExtraction?: boolean;
  /** Auto-generate embeddings */
  autoGenerateEmbeddings?: boolean;
  /** Similarity threshold for search */
  defaultSimilarityThreshold?: number;
  /** Maximum search results */
  defaultSearchLimit?: number;
  /** Enable persistence */
  persistent?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_KNOWLEDGE_BASE_CONFIG: KnowledgeBaseConfig = {
  ollamaBaseUrl: 'http://localhost:11434',
  embeddingModel: 'nomic-embed-text',
  vectorDbPath: undefined, // Will be set to ~/.ollama-code/knowledge
  maxChunkSize: 1000,
  chunkOverlap: 200,
  enableEntityExtraction: true,
  autoGenerateEmbeddings: true,
  defaultSimilarityThreshold: 0.7,
  defaultSearchLimit: 10,
  persistent: true,
};
