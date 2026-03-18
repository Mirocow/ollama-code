/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory Bank Manager
 *
 * Implements the Memory Bank pattern for AI agent long-term memory.
 * Based on the pattern described by kilo.ai and Osvaldo J.
 *
 * Protocol:
 * 1. Startup Read - At beginning of every session: "Read the Memory Bank files"
 * 2. Execution Reference - Check systemPatterns.md before suggesting solutions
 * 3. Write-Back - At end of task/session: "Update activeContext.md and progress.md"
 *
 * Benefits:
 * - Token efficiency: 5 summarized MD files vs 50 full files
 * - Fast onboarding: Humans can read Memory Bank in 15 minutes
 * - Governance: Forces agreement on architecture before coding
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';
import { getOllamaDir } from '../utils/paths.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import {
  MemoryBankFileType,
  getFileConfig,
  getAllFileConfigs,
} from './types.js';
import type {
  MemoryBankState,
  MemoryBankReadOptions,
  MemoryBankWriteOptions,
  MemoryBankInitOptions,
  ProjectBrief,
  ActiveContext,
  Progress,
} from './types.js';

const debugLogger = createDebugLogger('MEMORY_BANK');

// ============================================================================
// Memory Bank Manager Class
// ============================================================================

export class MemoryBankManager extends EventEmitter {
  private memoryBankDir: string;
  private storageDir: string;
  private state: MemoryBankState = {
    initialized: false,
    existingFiles: [],
    modifiedFiles: [],
    hasPendingChanges: false,
  };
  private fileCache: Map<MemoryBankFileType, string> = new Map();

  constructor() {
    super();
    const ollamaDir = getOllamaDir();
    this.storageDir = path.join(ollamaDir, 'storage');
    this.memoryBankDir = path.join(this.storageDir, 'md', 'memory-bank');
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize the Memory Bank for a project
   */
  async initialize(options: MemoryBankInitOptions = {}): Promise<boolean> {
    debugLogger.info('[MemoryBank] Initializing...', options);

    try {
      // Ensure directory exists
      await fs.mkdir(this.memoryBankDir, { recursive: true });

      // Create each memory bank file if it doesn't exist
      for (const config of getAllFileConfigs()) {
        const filePath = this.getFilePath(config.type);
        const exists = await this.fileExists(filePath);

        if (!exists || options.force) {
          await this.createFile(config.type, options);
          debugLogger.info(`[MemoryBank] Created: ${config.filename}.md`);
        }
      }

      // Update state
      this.state.initialized = true;
      this.state.existingFiles = await this.getExistingFiles();
      this.state.lastRead = new Date().toISOString();

      this.emit('initialized', { timestamp: new Date().toISOString() });
      debugLogger.info('[MemoryBank] Initialization complete');

      return true;
    } catch (error) {
      debugLogger.error('[MemoryBank] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if memory bank is initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      const files = await this.getExistingFiles();
      return files.length >= 5; // All 5 core files exist
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Reading - The Startup Read Protocol
  // ============================================================================

  /**
   * Read all memory bank files (Startup Read Protocol)
   *
   * At the beginning of every session, call this to understand project context.
   */
  async readAll(options: MemoryBankReadOptions = {}): Promise<Map<MemoryBankFileType, string>> {
    debugLogger.info('[MemoryBank] Reading all files...');

    const result = new Map<MemoryBankFileType, string>();
    const filesToRead = options.files ?? getAllFileConfigs().map(c => c.type);

    // Sort by read order
    const sortedFiles = filesToRead.sort((a, b) => {
      return getFileConfig(a).readOrder - getFileConfig(b).readOrder;
    });

    for (const type of sortedFiles) {
      const content = await this.readFile(type);
      if (content) {
        result.set(type, content);
        this.fileCache.set(type, content);
      }
    }

    this.state.lastRead = new Date().toISOString();
    this.emit('read', { timestamp: new Date().toISOString(), files: Array.from(result.keys()) });

    return result;
  }

  /**
   * Read a single memory bank file
   */
  async readFile(type: MemoryBankFileType): Promise<string | null> {
    const filePath = this.getFilePath(type);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch {
      debugLogger.debug(`[MemoryBank] File not found: ${type}`);
      return null;
    }
  }

  /**
   * Quick start read - essential files only for fast resume
   */
  async quickStartRead(): Promise<{
    activeContext: ActiveContext | null;
    progress: Progress | null;
    projectBrief: ProjectBrief | null;
  }> {
    const [activeContextContent, progressContent, projectBriefContent] = await Promise.all([
      this.readFile(MemoryBankFileType.ACTIVE_CONTEXT),
      this.readFile(MemoryBankFileType.PROGRESS),
      this.readFile(MemoryBankFileType.PROJECT_BRIEF),
    ]);

    return {
      activeContext: activeContextContent ? this.parseActiveContext(activeContextContent) : null,
      progress: progressContent ? this.parseProgress(progressContent) : null,
      projectBrief: projectBriefContent ? this.parseProjectBrief(projectBriefContent) : null,
    };
  }

  // ============================================================================
  // Writing - The Write-Back Protocol
  // ============================================================================

  /**
   * Write to a memory bank file (Write-Back Protocol)
   *
   * At the end of a task or session, update activeContext.md and progress.md
   */
  async writeFile(type: MemoryBankFileType, content: string, options: Omit<MemoryBankWriteOptions, 'file'> = {}): Promise<boolean> {
    debugLogger.info(`[MemoryBank] Writing to ${type}...`);

    try {
      const filePath = this.getFilePath(type);
      const config = getFileConfig(type);

      // Create backup if requested
      if (options.backup) {
        await this.createBackup(type);
      }

      let finalContent = content;

      // Merge with existing if requested
      if (options.merge) {
        const existing = await this.readFile(type);
        if (existing) {
          finalContent = this.mergeContent(existing, content, type);
        }
      }

      // Add timestamp if requested
      if (options.timestamp) {
        finalContent = this.addTimestamp(finalContent);
      }

      // Ensure header
      finalContent = this.ensureHeader(finalContent, type);

      await fs.writeFile(filePath, finalContent, 'utf-8');

      // Update cache
      this.fileCache.set(type, finalContent);
      this.state.lastWrite = new Date().toISOString();
      this.state.hasPendingChanges = false;

      // Track modified files
      if (!this.state.modifiedFiles.includes(type)) {
        this.state.modifiedFiles.push(type);
      }

      this.emit('written', { file: type, timestamp: new Date().toISOString() });
      debugLogger.info(`[MemoryBank] Written: ${config.filename}.md`);

      return true;
    } catch (error) {
      debugLogger.error(`[MemoryBank] Write failed for ${type}:`, error);
      return false;
    }
  }

  /**
   * Update active context - should be called frequently during work
   */
  async updateActiveContext(updates: Partial<ActiveContext>): Promise<boolean> {
    const existing = await this.readFile(MemoryBankFileType.ACTIVE_CONTEXT);
    const current = existing ? this.parseActiveContext(existing) : {};

    // Merge updates
    const updated: ActiveContext = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    const content = this.serializeActiveContext(updated);
    return this.writeFile(MemoryBankFileType.ACTIVE_CONTEXT, content, { merge: false, timestamp: true });
  }

  /**
   * Update progress - should be called when tasks complete
   */
  async updateProgress(updates: Partial<Progress>): Promise<boolean> {
    const existing = await this.readFile(MemoryBankFileType.PROGRESS);
    const current = existing ? this.parseProgress(existing) : {};

    // Merge updates
    const updated: Progress = {
      ...current,
      ...updates,
    };

    const content = this.serializeProgress(updated);
    return this.writeFile(MemoryBankFileType.PROGRESS, content, { merge: false, timestamp: true });
  }

  /**
   * Add a completed item to progress
   */
  async addCompletedItem(name: string, notes?: string): Promise<boolean> {
    const existing = await this.readFile(MemoryBankFileType.PROGRESS);
    const current = existing ? this.parseProgress(existing) : {};

    const completed = current.completed || [];
    completed.push({
      name,
      status: 'completed',
      completedAt: new Date().toISOString(),
      notes,
    });

    return this.updateProgress({ completed });
  }

  /**
   * Add a known issue
   */
  async addKnownIssue(issue: { description: string; severity: 'critical' | 'high' | 'medium' | 'low'; workaround?: string }): Promise<boolean> {
    const existing = await this.readFile(MemoryBankFileType.PROGRESS);
    const current = existing ? this.parseProgress(existing) : {};

    const knownIssues = current.knownIssues || [];
    knownIssues.push({
      ...issue,
      status: 'open',
    });

    return this.updateProgress({ knownIssues });
  }

  // ============================================================================
  // Context Generation for Model
  // ============================================================================

  /**
   * Get formatted context for model injection
   */
  async getContextForModel(): Promise<string> {
    const files = await this.readAll();

    if (files.size === 0) {
      return this.getEmptyContextMessage();
    }

    const lines: string[] = [
      '<memory-bank>',
      '# 📚 Memory Bank - Project Context',
      '',
      'Your Memory Bank has been loaded. This is your "brain" that persists across sessions.',
      '',
    ];

    for (const [type, content] of files) {
      const config = getFileConfig(type);
      lines.push(`## ${config.displayName}`);
      lines.push(`*${config.description}*`);
      lines.push('');
      lines.push(content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    lines.push('</memory-bank>');

    return lines.join('\n');
  }

  /**
   * Get startup prompt - should be injected at session start
   */
  getStartupPrompt(): string {
    return `<memory-bank-protocol>
## Memory Bank Protocol

You have access to a Memory Bank - structured markdown files that serve as your long-term memory.

### Files in Memory Bank:

| File | Purpose | Update Frequency |
|------|---------|------------------|
| projectbrief.md | The "North Star" - what are we building, for whom | Rarely |
| systemPatterns.md | The "Architecture" - design patterns, decisions | Sometimes |
| techContext.md | The "Constraints" - tech stack, dependencies | Sometimes |
| activeContext.md | The "RAM" - current focus, next steps | Constantly |
| progress.md | The "Map" - completed, issues, roadmap | Frequently |

### Protocol:

1. **Startup Read** ✅ - Already done for you at session start
2. **Execution Reference** - Before making changes, check systemPatterns.md
3. **Write-Back** - At end of task, update activeContext.md and progress.md

### Commands:

\`\`\`json
// Read specific file
model_storage operation=get namespace=memory-bank key="activeContext"

// Update active context
model_storage operation=set namespace=memory-bank key="activeContext" value="..."

// Mark task complete
model_storage operation=merge namespace=memory-bank key="progress" value='{"completed": [...]}'
\`\`\`

### When to Update:

- **activeContext.md**: After every significant change, decision, or when blocked
- **progress.md**: When completing tasks, discovering issues, or planning next steps
- **systemPatterns.md**: When making architectural decisions
- **techContext.md**: When adding/removing dependencies

**Remember**: Your Memory Bank persists across sessions. Keep it updated!
</memory-bank-protocol>`;
  }

  /**
   * Get session end prompt - should be shown before session ends
   */
  getSessionEndPrompt(): string {
    return `<memory-bank-reminder priority="high">
## 📤 Session Ending - Update Your Memory Bank

Before ending, update your memory files:

### 1. Update activeContext.md:
\`\`\`json
model_storage operation=merge namespace=memory-bank key="activeContext" value='{
  "currentFocus": "...",
  "nextSteps": ["...", "..."],
  "lastUpdated": "<timestamp>"
}'
\`\`\`

### 2. Update progress.md:
\`\`\`json
model_storage operation=merge namespace=memory-bank key="progress" value='{
  "completed": [...],
  "knownIssues": [...]
}'
\`\`\`

### What to Save:
- ✅ What was accomplished this session
- ✅ Any discoveries or patterns found
- ✅ Decisions made and why
- ✅ Next steps for next session
- ✅ Any blockers or open questions

**Your Memory Bank is your brain. Keep it updated!**
</memory-bank-reminder>`;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  getState(): MemoryBankState {
    return { ...this.state };
  }

  async getExistingFiles(): Promise<MemoryBankFileType[]> {
    const existing: MemoryBankFileType[] = [];

    for (const config of getAllFileConfigs()) {
      const filePath = this.getFilePath(config.type);
      if (await this.fileExists(filePath)) {
        existing.push(config.type);
      }
    }

    return existing;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getFilePath(type: MemoryBankFileType): string {
    const config = getFileConfig(type);
    return path.join(this.memoryBankDir, `${config.filename}.md`);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async createFile(type: MemoryBankFileType, options: MemoryBankInitOptions = {}): Promise<void> {
    const template = this.getFileTemplate(type, options);
    const filePath = this.getFilePath(type);
    await fs.writeFile(filePath, template, 'utf-8');
  }

  private getFileTemplate(type: MemoryBankFileType, options: MemoryBankInitOptions = {}): string {
    const config = getFileConfig(type);
    const header = this.generateHeader(type);

    switch (type) {
      case MemoryBankFileType.PROJECT_BRIEF:
        return this.generateProjectBriefTemplate(header, options.projectBrief);

      case MemoryBankFileType.SYSTEM_PATTERNS:
        return this.generateSystemPatternsTemplate(header);

      case MemoryBankFileType.TECH_CONTEXT:
        return this.generateTechContextTemplate(header);

      case MemoryBankFileType.ACTIVE_CONTEXT:
        return this.generateActiveContextTemplate(header);

      case MemoryBankFileType.PROGRESS:
        return this.generateProgressTemplate(header);

      default:
        return `${header}\n\n# ${config.displayName}\n\n<!-- Add content here -->\n`;
    }
  }

  private generateHeader(type: MemoryBankFileType): string {
    const config = getFileConfig(type);
    return `<!--
@memory-bank: true
@file: ${config.filename}
@type: ${config.displayName}
@update-frequency: ${config.updateFrequency}
@ai-editable: ${config.aiEditable}
@user-editable: ${config.userEditable}
@generated: ${new Date().toISOString()}

${config.description}
-->`;
  }

  private generateProjectBriefTemplate(header: string, brief?: Partial<ProjectBrief>): string {
    return `${header}

# Project Brief

> The "North Star" - Immutable core of the project

## What Are We Building?

${brief?.what || '[Describe what you are building]'}

## Who Is It For?

${brief?.who || '[Describe your target users]'}

## Core Value Proposition

${brief?.value || '[What value does this provide?]'}

## Goals

- [Goal 1]
- [Goal 2]
- [Goal 3]

## Non-Goals

What we are NOT building:
- [Non-goal 1]
- [Non-goal 2]

## Notes

[Additional context, constraints, or important information]

---
*This file defines the project's purpose. Update rarely.*
`;
  }

  private generateSystemPatternsTemplate(header: string): string {
    return `${header}

# System Patterns

> The "Architecture" - Design patterns, decisions, and rules of the road

## Design Patterns

### Pattern 1: [Pattern Name]

**When to use:**
[When this pattern is appropriate]

**Implementation:**
\`\`\`
[Example code or description]
\`\`\`

## Architectural Decisions

### Decision: [Decision Name]

**Decision:**
[What was decided]

**Rationale:**
[Why this decision was made]

**Consequences:**
[What this means for the project]

## Rules of the Road

1. [Rule 1]
2. [Rule 2]
3. [Rule 3]

## Code Conventions

### Naming
- Variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Classes: PascalCase

### File Structure
\`\`\`
src/
├── components/
├── services/
├── utils/
└── types/
\`\`\`

### Testing
- Framework: [testing framework]
- Coverage goal: [X]%

---
*This file captures how the system is built. Update when making architectural decisions.*
`;
  }

  private generateTechContextTemplate(header: string): string {
    return `${header}

# Technical Context

> The "Constraints" - Tech stack, dependencies, and environment

## Tech Stack

- **Languages:** [e.g., TypeScript, Python]
- **Frameworks:** [e.g., React, FastAPI]
- **Databases:** [e.g., PostgreSQL, Redis]

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| [package] | [version] | [what it does] |

## Environment Setup

### Prerequisites
- Node.js >= 18
- [Other requirements]

### Installation
\`\`\`bash
[installation commands]
\`\`\`

### Configuration
\`\`\`bash
[configuration steps]
\`\`\`

## Build & Deploy

### Build
\`\`\`bash
npm run build
\`\`\`

### Deploy
[Deployment process]

## Development Tools

- **IDE:** [Your IDE]
- **Linting:** [ESLint/Ruff/etc]
- **Formatting:** [Prettier/Black/etc]

---
*This file captures technical constraints. Update when adding/removing dependencies.*
`;
  }

  private generateActiveContextTemplate(header: string): string {
    return `${header}

# Active Context

> The "RAM" - Current focus, active decisions, next steps

## Current Focus

[What are you working on right now?]

## Active Tasks

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| [Task 1] | 🔄 in_progress | high | [notes] |
| [Task 2] | ⏳ pending | medium | [notes] |

## Recent Decisions

- **[Date]:** [Decision made and why]

## Open Questions

- [ ] [Question 1?]
- [ ] [Question 2?]

## Next Steps

1. [Immediate next step]
2. [Following step]
3. [After that]

## Current Blockers

| Blocker | Impact | Possible Solution |
|---------|--------|-------------------|
| [Issue] | [What's blocked] | [How to resolve] |

---
*Last Updated: ${new Date().toISOString()}*
*This file changes constantly. Keep it updated!*
`;
  }

  private generateProgressTemplate(header: string): string {
    return `${header}

# Progress

> The "Map" - Completed features, known issues, roadmap

## Completed ✅

| Feature | Completed | Notes |
|---------|-----------|-------|
| [Feature 1] | [Date] | [Notes] |

## In Progress 🔄

| Feature | Started | Progress | Notes |
|---------|---------|----------|-------|
| [Feature 1] | [Date] | [X]% | [Notes] |

## Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| [Issue 1] | medium | open | [Workaround] |

## Roadmap

### Current Milestone: [Milestone Name]

- [ ] [Task 1]
- [ ] [Task 2]

### Upcoming

1. **[Milestone 2]** - [Description]
2. **[Milestone 3]** - [Description]

## Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| [Milestone 1] | [Date] | ✅ completed |
| [Milestone 2] | [Date] | 🔄 in_progress |
| [Milestone 3] | [Date] | 📋 planned |

---
*This file tracks the journey. Update when completing tasks or discovering issues.*
`;
  }

  private ensureHeader(content: string, type: MemoryBankFileType): string {
    // Check if content already has our header
    if (content.includes('@memory-bank: true')) {
      return content;
    }

    // Add header
    const header = this.generateHeader(type);
    return `${header}\n\n${content}`;
  }

  private addTimestamp(content: string): string {
    const timestamp = new Date().toISOString();

    // Try to update existing timestamp
    if (content.includes('*Last Updated:')) {
      return content.replace(
        /\*Last Updated:.*\*/,
        `*Last Updated: ${timestamp}*`
      );
    }

    // Add timestamp at end
    return `${content}\n\n---\n*Last Updated: ${timestamp}*\n`;
  }

  private mergeContent(existing: string, newContent: string, type: MemoryBankFileType): string {
    // For now, simple append strategy
    // In future, could implement smart merging based on file type
    const separator = '\n\n---\n\n### Update\n\n';
    return existing + separator + newContent;
  }

  private async createBackup(type: MemoryBankFileType): Promise<void> {
    const filePath = this.getFilePath(type);
    const backupPath = `${filePath}.backup-${Date.now()}`;

    try {
      await fs.copyFile(filePath, backupPath);
    } catch {
      // File might not exist
    }
  }

  // Parsing methods
  private parseProjectBrief(content: string): ProjectBrief {
    // Simple markdown parsing - in future could use proper MD parser
    const sections = this.extractSections(content);

    return {
      what: sections.get('What Are We Building?') || '',
      who: sections.get('Who Is It For?') || '',
      value: sections.get('Core Value Proposition') || '',
      goals: this.extractListItems(content, 'Goals'),
      nonGoals: this.extractListItems(content, 'Non-Goals'),
      notes: sections.get('Notes') || '',
    };
  }

  private parseActiveContext(content: string): ActiveContext {
    const sections = this.extractSections(content);

    return {
      currentFocus: sections.get('Current Focus') || '',
      nextSteps: this.extractListItems(content, 'Next Steps'),
      lastUpdated: this.extractLastUpdated(content),
    };
  }

  private parseProgress(content: string): Progress {
    return {
      completed: [], // Could parse from tables
      knownIssues: [],
    };
  }

  private extractSections(content: string): Map<string, string> {
    const sections = new Map<string, string>();
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections.set(currentSection, currentContent.join('\n').trim());
        }
        currentSection = line.replace('## ', '').trim();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      sections.set(currentSection, currentContent.join('\n').trim());
    }

    return sections;
  }

  private extractListItems(content: string, sectionName: string): string[] {
    const items: string[] = [];
    const sections = this.extractSections(content);
    const sectionContent = sections.get(sectionName) || '';

    for (const line of sectionContent.split('\n')) {
      const match = line.match(/^[-*]\s+(.+)$/);
      if (match) {
        items.push(match[1]);
      }
    }

    return items;
  }

  private extractLastUpdated(content: string): string | undefined {
    const match = content.match(/\*Last Updated: ([^*]+)\*/);
    return match ? match[1].trim() : undefined;
  }

  // Serializing methods
  private serializeActiveContext(context: ActiveContext): string {
    const lines: string[] = [
      `# Active Context`,
      '',
      '> The "RAM" - Current focus, active decisions, next steps',
      '',
      `## Current Focus`,
      '',
      context.currentFocus || '[What are you working on right now?]',
      '',
      `## Active Tasks`,
      '',
    ];

    if (context.activeTasks?.length) {
      lines.push('| Task | Status | Priority | Notes |');
      lines.push('|------|--------|----------|-------|');
      for (const task of context.activeTasks) {
        const statusIcon = task.status === 'in_progress' ? '🔄' : task.status === 'completed' ? '✅' : '⏳';
        lines.push(`| ${task.description} | ${statusIcon} ${task.status} | ${task.priority || 'medium'} | |`);
      }
    }

    lines.push('', '## Next Steps', '');
    if (context.nextSteps?.length) {
      for (const step of context.nextSteps) {
        lines.push(`1. ${step}`);
      }
    }

    if (context.lastUpdated) {
      lines.push('', '---', `*Last Updated: ${context.lastUpdated}*`);
    }

    return lines.join('\n');
  }

  private serializeProgress(progress: Progress): string {
    const lines: string[] = [
      `# Progress`,
      '',
      '> The "Map" - Completed features, known issues, roadmap',
      '',
    ];

    if (progress.completed?.length) {
      lines.push('## Completed ✅', '');
      lines.push('| Feature | Completed | Notes |');
      lines.push('|---------|-----------|-------|');
      for (const item of progress.completed) {
        lines.push(`| ${item.name} | ${item.completedAt || ''} | ${item.notes || ''} |`);
      }
      lines.push('');
    }

    if (progress.knownIssues?.length) {
      lines.push('## Known Issues', '');
      lines.push('| Issue | Severity | Status | Workaround |');
      lines.push('|-------|----------|--------|------------|');
      for (const issue of progress.knownIssues) {
        lines.push(`| ${issue.description} | ${issue.severity} | ${issue.status} | ${issue.workaround || ''} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private getEmptyContextMessage(): string {
    return `<memory-bank-empty>
📚 **Memory Bank Not Initialized**

Your Memory Bank is empty. Initialize it to start building long-term memory.

\`\`\`json
// Initialize memory bank
model_storage operation=init namespace=memory-bank
\`\`\`

Or create the memory bank files manually in:
${this.memoryBankDir}

Required files:
- projectbrief.md - What are we building?
- systemPatterns.md - How is it built?
- techContext.md - What are the constraints?
- activeContext.md - What's happening now?
- progress.md - Where are we?
</memory-bank-empty>`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let memoryBankInstance: MemoryBankManager | null = null;

export function getMemoryBank(): MemoryBankManager {
  if (!memoryBankInstance) {
    memoryBankInstance = new MemoryBankManager();
  }
  return memoryBankInstance;
}

export async function initializeMemoryBank(options?: MemoryBankInitOptions): Promise<MemoryBankManager> {
  const manager = getMemoryBank();
  await manager.initialize(options);
  return manager;
}

export default MemoryBankManager;
