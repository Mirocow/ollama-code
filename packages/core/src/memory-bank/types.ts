/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory Bank Types
 *
 * Based on the Memory Bank pattern from kilo.ai
 * A structured file system for AI agent long-term memory.
 *
 * Core files:
 * - projectbrief.md: The "North Star" - what are we building, who is it for
 * - systemPatterns.md: The "Architecture" - design patterns, architectural decisions
 * - techContext.md: The "Constraints" - tech stack, dependencies, versions
 * - activeContext.md: The "RAM" - current focus, active decisions, next steps
 * - progress.md: The "Map" - completed features, known issues, roadmap
 */

// ============================================================================
// Memory Bank File Types
// ============================================================================

export enum MemoryBankFileType {
  PROJECT_BRIEF = 'projectbrief',
  SYSTEM_PATTERNS = 'systemPatterns',
  TECH_CONTEXT = 'techContext',
  ACTIVE_CONTEXT = 'activeContext',
  PROGRESS = 'progress',
  TODO = 'todo',
  TASKS = 'tasks',
  CONTEXT = 'context',
}

export interface MemoryBankFileMeta {
  /** File type */
  type: MemoryBankFileType;
  /** File name without extension */
  filename: string;
  /** Display name */
  displayName: string;
  /** Description of file purpose */
  description: string;
  /** How often this file should be updated */
  updateFrequency: 'rarely' | 'sometimes' | 'frequently' | 'constantly';
  /** Whether AI should update this file */
  aiEditable: boolean;
  /** Whether user should update this file */
  userEditable: boolean;
  /** Order for reading (lower = higher priority) */
  readOrder: number;
}

export const MEMORY_BANK_FILE_CONFIGS: Record<MemoryBankFileType, MemoryBankFileMeta> = {
  [MemoryBankFileType.PROJECT_BRIEF]: {
    type: MemoryBankFileType.PROJECT_BRIEF,
    filename: 'projectbrief',
    displayName: 'Project Brief',
    description: 'The "North Star" - immutable core: what are we building, who is it for, core value proposition',
    updateFrequency: 'rarely',
    aiEditable: false,
    userEditable: true,
    readOrder: 1,
  },
  [MemoryBankFileType.SYSTEM_PATTERNS]: {
    type: MemoryBankFileType.SYSTEM_PATTERNS,
    filename: 'systemPatterns',
    displayName: 'System Patterns',
    description: 'The "Architecture" - design patterns, architectural decisions, "rules of the road"',
    updateFrequency: 'sometimes',
    aiEditable: true,
    userEditable: true,
    readOrder: 2,
  },
  [MemoryBankFileType.TECH_CONTEXT]: {
    type: MemoryBankFileType.TECH_CONTEXT,
    filename: 'techContext',
    displayName: 'Technical Context',
    description: 'The "Constraints" - tech stack, dependencies, versions, environment setup',
    updateFrequency: 'sometimes',
    aiEditable: true,
    userEditable: true,
    readOrder: 3,
  },
  [MemoryBankFileType.ACTIVE_CONTEXT]: {
    type: MemoryBankFileType.ACTIVE_CONTEXT,
    filename: 'activeContext',
    displayName: 'Active Context',
    description: 'The "RAM" - current focus, active decisions, open questions, immediate next step',
    updateFrequency: 'constantly',
    aiEditable: true,
    userEditable: true,
    readOrder: 4,
  },
  [MemoryBankFileType.PROGRESS]: {
    type: MemoryBankFileType.PROGRESS,
    filename: 'progress',
    displayName: 'Progress',
    description: 'The "Map" - completed features, known issues, roadmap',
    updateFrequency: 'frequently',
    aiEditable: true,
    userEditable: true,
    readOrder: 5,
  },
  [MemoryBankFileType.TODO]: {
    type: MemoryBankFileType.TODO,
    filename: 'todo',
    displayName: 'TODO List',
    description: 'The "Plan" - tasks to do, in progress, completed. Use "create work plan" to generate.',
    updateFrequency: 'constantly',
    aiEditable: true,
    userEditable: true,
    readOrder: 6,
  },
  [MemoryBankFileType.TASKS]: {
    type: MemoryBankFileType.TASKS,
    filename: 'tasks',
    displayName: 'Tasks',
    description: 'The "Queue" - current tasks queue with priorities and status',
    updateFrequency: 'constantly',
    aiEditable: true,
    userEditable: true,
    readOrder: 7,
  },
  [MemoryBankFileType.CONTEXT]: {
    type: MemoryBankFileType.CONTEXT,
    filename: 'context',
    displayName: 'Context',
    description: 'The "State" - project context, what was studied, current session info',
    updateFrequency: 'constantly',
    aiEditable: true,
    userEditable: true,
    readOrder: 8,
  },
};

// ============================================================================
// Memory Bank Content Types
// ============================================================================

export interface ProjectBrief {
  /** Project name */
  projectName?: string;
  /** What are we building? */
  what: string;
  /** Who is it for? */
  who: string;
  /** Core value proposition */
  value: string;
  /** Project goals */
  goals?: string[];
  /** Non-goals (what we're NOT building) */
  nonGoals?: string[];
  /** Additional context */
  notes?: string;
}

export interface SystemPattern {
  /** Pattern name */
  name: string;
  /** Pattern description */
  description: string;
  /** When to use */
  whenToUse?: string;
  /** Example or code snippet */
  example?: string;
}

export interface SystemPatterns {
  /** Design patterns used */
  patterns?: SystemPattern[];
  /** Architectural decisions */
  architecturalDecisions?: Array<{
    decision: string;
    rationale: string;
    consequences?: string;
  }>;
  /** Rules of the road */
  rules?: string[];
  /** Code conventions */
  conventions?: {
    naming?: string;
    fileStructure?: string;
    testing?: string;
    [key: string]: string | undefined;
  };
}

export interface TechContext {
  /** Primary tech stack */
  techStack?: string[];
  /** Languages */
  languages?: string[];
  /** Frameworks */
  frameworks?: string[];
  /** Databases */
  databases?: string[];
  /** Key dependencies */
  dependencies?: Array<{
    name: string;
    version?: string;
    purpose?: string;
  }>;
  /** Environment setup */
  environmentSetup?: string;
  /** Build tools */
  buildTools?: string[];
  /** Deployment info */
  deployment?: string;
}

export interface ActiveTask {
  /** Task description */
  description: string;
  /** Status */
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';
  /** Priority */
  priority?: 'high' | 'medium' | 'low';
  /** Files involved */
  files?: string[];
  /** Blocking issues */
  blockedBy?: string[];
}

export interface ActiveContext {
  /** Current focus */
  currentFocus?: string;
  /** Active tasks */
  activeTasks?: ActiveTask[];
  /** Recent decisions */
  recentDecisions?: Array<{
    decision: string;
    reason?: string;
    date?: string;
  }>;
  /** Open questions */
  openQuestions?: string[];
  /** Next steps */
  nextSteps?: string[];
  /** Current blockers */
  blockers?: string[];
  /** Last updated */
  lastUpdated?: string;
}

export interface ProgressEntry {
  /** Feature/Task name */
  name: string;
  /** Status */
  status: 'completed' | 'in_progress' | 'pending' | 'blocked';
  /** Completion date */
  completedAt?: string;
  /** Notes */
  notes?: string;
}

export interface KnownIssue {
  /** Issue description */
  description: string;
  /** Severity */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Workaround if any */
  workaround?: string;
  /** Status */
  status: 'open' | 'investigating' | 'resolved';
}

export interface Progress {
  /** Completed features */
  completed?: ProgressEntry[];
  /** In progress */
  inProgress?: ProgressEntry[];
  /** Known issues */
  knownIssues?: KnownIssue[];
  /** Roadmap items */
  roadmap?: Array<{
    item: string;
    priority: 'high' | 'medium' | 'low';
    estimatedEffort?: string;
  }>;
  /** Milestones */
  milestones?: Array<{
    name: string;
    targetDate?: string;
    status: 'planned' | 'in_progress' | 'completed';
  }>;
}

// ============================================================================
// Memory Bank State
// ============================================================================

export interface MemoryBankState {
  /** Whether memory bank is initialized */
  initialized: boolean;
  /** Last read timestamp */
  lastRead?: string;
  /** Last write timestamp */
  lastWrite?: string;
  /** Files that exist */
  existingFiles: MemoryBankFileType[];
  /** Files that have been modified since last read */
  modifiedFiles: MemoryBankFileType[];
  /** Whether there's pending context to save */
  hasPendingChanges: boolean;
}

// ============================================================================
// Memory Bank Operations
// ============================================================================

export interface MemoryBankReadOptions {
  /** Which files to read (default: all) */
  files?: MemoryBankFileType[];
  /** Include only essential files for quick start */
  quickStart?: boolean;
  /** Parse content into structured data */
  parse?: boolean;
}

export interface MemoryBankWriteOptions {
  /** Which file to write */
  file: MemoryBankFileType;
  /** Merge with existing content (default: replace) */
  merge?: boolean;
  /** Add update timestamp */
  timestamp?: boolean;
  /** Create backup before write */
  backup?: boolean;
}

export interface MemoryBankInitOptions {
  /** Project directory */
  projectDir?: string;
  /** Force reinitialize */
  force?: boolean;
  /** Initial project brief */
  projectBrief?: Partial<ProjectBrief>;
  /** Auto-detect tech context from project */
  autoDetect?: boolean;
}

// ============================================================================
// Events
// ============================================================================

export interface MemoryBankEvent {
  type: 'initialized' | 'read' | 'written' | 'modified' | 'synced';
  file?: MemoryBankFileType;
  timestamp: string;
  data?: unknown;
}

// ============================================================================
// Export Helper
// ============================================================================

export function getFileConfig(type: MemoryBankFileType): MemoryBankFileMeta {
  return MEMORY_BANK_FILE_CONFIGS[type];
}

export function getAllFileConfigs(): MemoryBankFileMeta[] {
  return Object.values(MEMORY_BANK_FILE_CONFIGS).sort((a, b) => a.readOrder - b.readOrder);
}

export function getFilesByUpdateFrequency(frequency: MemoryBankFileMeta['updateFrequency']): MemoryBankFileMeta[] {
  return Object.values(MEMORY_BANK_FILE_CONFIGS).filter(f => f.updateFrequency === frequency);
}
