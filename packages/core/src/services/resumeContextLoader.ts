/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resume Context Loader Service
 *
 * Loads context from storage when resuming a session:
 * - Active plans and their progress
 * - Current tasks from todos
 * - Session context and progress
 * - Knowledge relevant to current work
 * - Memory Bank files (NEW: kilo.ai Memory Bank pattern)
 *
 * Provides hints to the model about what was being worked on.
 */

import { EventEmitter } from 'node:events';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { getOllamaDir } from '../utils/paths.js';
import { createDebugLogger } from '../utils/debugLogger.js';

// Memory Bank imports
import { getMemoryBank } from '../memory-bank/index.js';

const debugLogger = createDebugLogger('RESUME_CONTEXT');

// ============================================================================
// Types
// ============================================================================

export interface ResumedContext {
  /** Session ID being resumed */
  sessionId: string;
  /** Timestamp of last activity */
  lastActivity: string;
  /** Active plans found */
  activePlans: PlanSummary[];
  /** Current todos */
  todos: TodoSummary[];
  /** Session context */
  sessionContext: SessionContextData | null;
  /** Relevant knowledge entries */
  relevantKnowledge: KnowledgeEntry[];
  /** Memory Bank context (NEW) */
  memoryBankContext: MemoryBankContext | null;
  /** Hint for the model */
  modelHint: string;
}

export interface MemoryBankContext {
  /** Whether memory bank is initialized */
  initialized: boolean;
  /** Project brief summary */
  projectBrief?: string;
  /** Active context summary */
  activeContext?: string;
  /** Progress summary */
  progress?: string;
  /** Formatted hint for model */
  hint: string;
}

export interface PlanSummary {
  key: string;
  status: string;
  progress: number;
  priority: string;
  stepsTotal: number;
  stepsCompleted: number;
  lastUpdated: string;
}

export interface TodoSummary {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: string;
  dependencies?: string[];
  verification?: {
    status: string;
    stepsCompleted: number;
    stepsTotal: number;
  };
}

export interface SessionContextData {
  key: string;
  taskType?: string;
  description?: string;
  progress?: number;
  filesInvolved?: string[];
  nextSteps?: string[];
  lastUpdated: string;
}

export interface KnowledgeEntry {
  key: string;
  preview: string;
  tags?: string[];
  relevance?: number;
}

export interface ResumeContextConfig {
  /** Maximum knowledge entries to load */
  maxKnowledgeEntries: number;
  /** Include completed items in summary */
  includeCompleted: boolean;
  /** Generate semantic search for relevant knowledge */
  semanticSearch: boolean;
}

const DEFAULT_CONFIG: ResumeContextConfig = {
  maxKnowledgeEntries: 5,
  includeCompleted: false,
  semanticSearch: true,
};

// ============================================================================
// Resume Context Loader Class
// ============================================================================

export class ResumeContextLoader extends EventEmitter {
  private config: ResumeContextConfig;
  private storageDir: string;

  constructor(config: Partial<ResumeContextConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storageDir = path.join(getOllamaDir(), 'storage');
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Load context for resume
   */
  async loadResumeContext(sessionId?: string): Promise<ResumedContext | null> {
    debugLogger.info('[ResumeContext] Loading resume context...');

    try {
      // Load Memory Bank first (NEW - kilo.ai pattern)
      const memoryBankContext = await this.loadMemoryBankContext();
      
      // Load all relevant data from storage
      const [plans, todos, sessionContext, knowledge] = await Promise.all([
        this.loadPlans(),
        this.loadTodos(),
        this.loadSessionContext(sessionId),
        this.loadRelevantKnowledge(),
      ]);

      // Check if there's anything to resume
      if (plans.length === 0 && todos.length === 0 && !sessionContext && !memoryBankContext?.initialized) {
        debugLogger.info('[ResumeContext] No context found to resume');
        return null;
      }

      // Build model hint (now includes memory bank)
      const modelHint = this.buildModelHint(plans, todos, sessionContext, knowledge, memoryBankContext);

      const context: ResumedContext = {
        sessionId: sessionId || 'unknown',
        lastActivity: new Date().toISOString(),
        activePlans: plans,
        todos,
        sessionContext,
        relevantKnowledge: knowledge,
        memoryBankContext,
        modelHint,
      };

      debugLogger.info('[ResumeContext] Context loaded:', {
        plans: plans.length,
        todos: todos.length,
        hasContext: !!sessionContext,
        knowledge: knowledge.length,
        memoryBankInitialized: memoryBankContext?.initialized,
      });

      this.emit('context_loaded', context);
      return context;
    } catch (error) {
      debugLogger.error('[ResumeContext] Failed to load context:', error);
      return null;
    }
  }

  /**
   * Load Memory Bank context (kilo.ai pattern)
   */
  private async loadMemoryBankContext(): Promise<MemoryBankContext | null> {
    try {
      const memoryBank = getMemoryBank();
      
      // Check if memory bank is initialized
      const isInitialized = await memoryBank.isInitialized();
      
      if (!isInitialized) {
        debugLogger.info('[ResumeContext] Memory Bank not initialized');
        return {
          initialized: false,
          hint: 'Memory Bank not initialized. Initialize it for long-term context.',
        };
      }

      // Load quick start context (essential files only)
      const quickStart = await memoryBank.quickStartRead();
      
      const hint = memoryBank.getStartupPrompt();
      
      return {
        initialized: true,
        projectBrief: quickStart.projectBrief?.what || quickStart.projectBrief?.notes,
        activeContext: quickStart.activeContext?.currentFocus,
        progress: quickStart.progress?.completed?.map(c => c.name).join(', '),
        hint,
      };
    } catch (error) {
      debugLogger.error('[ResumeContext] Failed to load Memory Bank:', error);
      return null;
    }
  }

  /**
   * Get formatted hint for system prompt injection
   */
  getResumeHintForPrompt(context: ResumedContext): string {
    return this.formatResumeHint(context);
  }

  /**
   * Check if there's resumable context
   */
  async hasResumableContext(): Promise<boolean> {
    try {
      const [plans, todos, sessionContext] = await Promise.all([
        this.loadPlans(),
        this.loadTodos(),
        this.loadSessionContext(),
      ]);

      return plans.length > 0 || todos.length > 0 || sessionContext !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get quick summary for UI
   */
  async getQuickSummary(): Promise<string> {
    const plans = await this.loadPlans();
    const todos = await this.loadTodos();
    
    const parts: string[] = [];
    
    if (plans.length > 0) {
      const activePlans = plans.filter(p => p.status === 'in_progress' || p.status === 'planning');
      if (activePlans.length > 0) {
        parts.push(`📋 ${activePlans.length} active plan(s)`);
      }
    }
    
    if (todos.length > 0) {
      const pendingTodos = todos.filter(t => t.status === 'pending' || t.status === 'in_progress');
      if (pendingTodos.length > 0) {
        parts.push(`📝 ${pendingTodos.length} pending task(s)`);
      }
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'No active context found';
  }

  // ============================================================================
  // Private Methods - Data Loading
  // ============================================================================

  private async loadPlans(): Promise<PlanSummary[]> {
    const plans: PlanSummary[] = [];
    
    try {
      const plansPath = path.join(this.storageDir, 'plans.json');
      const content = await fs.readFile(plansPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Handle different storage formats
      const plansData = data.plans || data;
      
      for (const [key, value] of Object.entries(plansData)) {
        const plan = value as any;
        
        // Skip completed plans unless configured
        if (!this.config.includeCompleted && plan.status === 'completed') {
          continue;
        }
        
        const stepsTotal = plan.steps?.length || 0;
        const stepsCompleted = plan.steps?.filter((s: any) => s.status === 'completed' || s.status === 'done').length || 0;
        
        plans.push({
          key,
          status: plan.status || 'unknown',
          progress: stepsTotal > 0 ? Math.round((stepsCompleted / stepsTotal) * 100) : 0,
          priority: plan.priority || 'medium',
          stepsTotal,
          stepsCompleted,
          lastUpdated: plan.updatedAt || plan.createdAt || new Date().toISOString(),
        });
      }
    } catch {
      // Plans file doesn't exist or is invalid
      debugLogger.debug('[ResumeContext] No plans found');
    }
    
    return plans;
  }

  private async loadTodos(): Promise<TodoSummary[]> {
    const todos: TodoSummary[] = [];
    
    try {
      const todosPath = path.join(this.storageDir, 'todos.json');
      const content = await fs.readFile(todosPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Handle different storage formats
      const todosData = data.todos || data.items || data;
      
      if (Array.isArray(todosData)) {
        for (const todo of todosData) {
          // Skip completed unless configured
          if (!this.config.includeCompleted && todo.status === 'completed') {
            continue;
          }
          
          const summary: TodoSummary = {
            id: todo.id,
            content: todo.content || todo.title || 'Untitled task',
            status: todo.status || 'pending',
            priority: todo.priority || 'medium',
            dependencies: todo.dependencies,
          };
          
          if (todo.verification) {
            summary.verification = {
              status: todo.verification.status || 'pending',
              stepsCompleted: todo.verification.steps?.filter((s: any) => s.status === 'completed' || s.status === 'passed').length || 0,
              stepsTotal: todo.verification.steps?.length || 0,
            };
          }
          
          todos.push(summary);
        }
      }
    } catch {
      // Todos file doesn't exist or is invalid
      debugLogger.debug('[ResumeContext] No todos found');
    }
    
    return todos;
  }

  private async loadSessionContext(sessionId?: string): Promise<SessionContextData | null> {
    try {
      // Try to load from context namespace
      const contextPath = path.join(this.storageDir, 'context.json');
      const content = await fs.readFile(contextPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Find the most recent/relevant context
      const keys = Object.keys(data);
      
      if (keys.length === 0) {
        return null;
      }
      
      // Look for specific session context first
      if (sessionId && data[sessionId]) {
        return this.parseSessionContext(sessionId, data[sessionId]);
      }
      
      // Look for common context keys
      const contextKeys = ['current_task', 'session_progress', 'last_task', 'active_context'];
      for (const key of contextKeys) {
        if (data[key]) {
          return this.parseSessionContext(key, data[key]);
        }
      }
      
      // Fall back to most recent entry
      const mostRecentKey = keys[0];
      return this.parseSessionContext(mostRecentKey, data[mostRecentKey]);
      
    } catch {
      debugLogger.debug('[ResumeContext] No session context found');
      return null;
    }
  }

  private parseSessionContext(key: string, data: any): SessionContextData {
    const value = data.value || data;
    const metadata = data.metadata || {};
    
    return {
      key,
      taskType: value.taskType || value.type,
      description: value.description || value.task || value.summary,
      progress: value.progress,
      filesInvolved: value.filesInvolved || value.files,
      nextSteps: value.nextSteps || value.pending || value.todo,
      lastUpdated: metadata.updatedAt || metadata.createdAt || new Date().toISOString(),
    };
  }

  private async loadRelevantKnowledge(): Promise<KnowledgeEntry[]> {
    const entries: KnowledgeEntry[] = [];
    
    try {
      const knowledgePath = path.join(this.storageDir, 'knowledge.json');
      const content = await fs.readFile(knowledgePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Get most relevant/recent knowledge entries
      const keys = Object.keys(data);
      
      // Sort by last updated if metadata exists
      const sortedKeys = keys.sort((a, b) => {
        const aTime = data[a]?.metadata?.updatedAt || data[a]?.updatedAt || '';
        const bTime = data[b]?.metadata?.updatedAt || data[b]?.updatedAt || '';
        return bTime.localeCompare(aTime);
      });
      
      for (const key of sortedKeys.slice(0, this.config.maxKnowledgeEntries)) {
        const entry = data[key];
        const value = entry.value || entry;
        const metadata = entry.metadata || {};
        
        entries.push({
          key,
          preview: this.truncatePreview(typeof value === 'string' ? value : JSON.stringify(value)),
          tags: metadata.tags,
          relevance: 1.0, // Would be calculated from semantic search
        });
      }
    } catch {
      debugLogger.debug('[ResumeContext] No knowledge found');
    }
    
    return entries;
  }

  // ============================================================================
  // Private Methods - Hint Generation
  // ============================================================================

  private buildModelHint(
    plans: PlanSummary[],
    todos: TodoSummary[],
    sessionContext: SessionContextData | null,
    knowledge: KnowledgeEntry[],
    memoryBankContext?: MemoryBankContext | null,
  ): string {
    const lines: string[] = [
      '<resume-context>',
      '📂 **Session Resumed - Context Restored from Storage**',
      '',
      'Your previous work context has been loaded from persistent storage:',
      '',
    ];

    // Memory Bank section (NEW - first priority)
    if (memoryBankContext?.initialized) {
      lines.push('### 📚 Memory Bank');
      lines.push('*Your long-term memory has been restored. Key context:*');
      lines.push('');
      
      if (memoryBankContext.projectBrief) {
        lines.push(`**Project**: ${this.truncate(memoryBankContext.projectBrief, 100)}`);
      }
      if (memoryBankContext.activeContext) {
        lines.push(`**Current Focus**: ${memoryBankContext.activeContext}`);
      }
      if (memoryBankContext.progress) {
        lines.push(`**Completed**: ${this.truncate(memoryBankContext.progress, 100)}`);
      }
      lines.push('');
      lines.push('*Memory Bank Protocol: Update activeContext.md and progress.md at end of session*');
      lines.push('');
    } else if (memoryBankContext && !memoryBankContext.initialized) {
      lines.push('### 📚 Memory Bank');
      lines.push(memoryBankContext.hint);
      lines.push('');
    }

    // Plans section
    if (plans.length > 0) {
      lines.push('### 📋 Active Plans');
      for (const plan of plans.slice(0, 3)) {
        const statusIcon = plan.status === 'in_progress' ? '🔄' : plan.status === 'planning' ? '📝' : '✅';
        lines.push(`${statusIcon} **${plan.key}**: ${plan.progress}% complete (${plan.stepsCompleted}/${plan.stepsTotal} steps)`);
      }
      lines.push('');
    }

    // Todos section
    if (todos.length > 0) {
      lines.push('### 📝 Pending Tasks');
      const pendingTodos = todos.filter(t => t.status !== 'completed');
      for (const todo of pendingTodos.slice(0, 5)) {
        const statusIcon = todo.status === 'in_progress' ? '🔄' : todo.status === 'blocked' ? '🚫' : '⏳';
        let line = `${statusIcon} \`${todo.id}\`: ${this.truncate(todo.content, 50)}`;
        if (todo.dependencies?.length) {
          line += ` (depends: ${todo.dependencies.join(', ')})`;
        }
        lines.push(line);
      }
      lines.push('');
    }

    // Session context
    if (sessionContext) {
      lines.push('### 🎯 Current Work');
      lines.push(`**Task**: ${sessionContext.description || sessionContext.key}`);
      if (sessionContext.progress !== undefined) {
        lines.push(`**Progress**: ${sessionContext.progress}%`);
      }
      if (sessionContext.nextSteps?.length) {
        lines.push('**Next Steps**:');
        for (const step of sessionContext.nextSteps.slice(0, 3)) {
          lines.push(`  - ${step}`);
        }
      }
      lines.push('');
    }

    // Knowledge hint
    if (knowledge.length > 0) {
      lines.push('### 💡 Recent Knowledge');
      lines.push('Use `model_storage operation=search` to find relevant patterns.');
      lines.push('');
    }

    // Action suggestions
    lines.push('### Recommended Actions');
    lines.push('```json');
    lines.push('// Check active plan:');
    lines.push('model_storage operation=get namespace=plans key="current"');
    lines.push('');
    lines.push('// Check todos:');
    lines.push('model_storage operation=get namespace=todos key="items"');
    lines.push('');
    lines.push('// Search for relevant knowledge:');
    lines.push('model_storage operation=search query="current task patterns" namespaces=["knowledge"] limit=5');
    lines.push('```');
    lines.push('');
    lines.push('</resume-context>');

    return lines.join('\n');
  }

  private formatResumeHint(context: ResumedContext): string {
    return context.modelHint;
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private truncatePreview(text: string): string {
    return this.truncate(text, 200);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let resumeContextLoaderInstance: ResumeContextLoader | null = null;

export function getResumeContextLoader(config?: Partial<ResumeContextConfig>): ResumeContextLoader {
  if (!resumeContextLoaderInstance) {
    resumeContextLoaderInstance = new ResumeContextLoader(config);
  }
  return resumeContextLoaderInstance;
}

export async function loadResumeContext(sessionId?: string): Promise<ResumedContext | null> {
  const loader = getResumeContextLoader();
  return loader.loadResumeContext(sessionId);
}

export default ResumeContextLoader;
