/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Storage Hints Service
 * 
 * Provides intelligent hints to the model about using storage effectively.
 * Periodically reminds the model to use storage instead of context.
 */

import { EventEmitter } from 'node:events';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('STORAGE_HINTS');

// ============================================================================
// Types
// ============================================================================

export interface StorageHint {
  type: 'context_overflow' | 'periodic_reminder' | 'knowledge_opportunity' | 'session_end' | 'session_start';
  priority: 'high' | 'medium' | 'low';
  message: string;
  suggestedActions: string[];
}

export interface StorageHintsConfig {
  enabled: boolean;
  contextCheckInterval: number; // ms
  contextTokenThreshold: number; // tokens
  maxContextSize: number; // tokens
}

// ============================================================================
// Storage Hints Service
// ============================================================================

export class StorageHintsService extends EventEmitter {
  private config: StorageHintsConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastHintTime = 0;
  private minHintInterval = 60000; // Minimum 1 minute between hints

  // What should be stored vs kept in context
  private readonly STORAGE_RULES = {
    shouldStore: [
      'Discovered code patterns and conventions',
      'User preferences and decisions',
      'Error solutions and fixes',
      'Project structure insights',
      'API patterns and endpoints',
      'Configuration decisions',
      'Learned behaviors',
      'Cross-session information',
      'Reference documentation',
      'Implementation patterns',
    ],
    shouldKeepInContext: [
      'Current task description',
      'Active file contents being edited',
      'Immediate next steps',
      'Current error messages',
      'User\'s last few messages',
      'Active todo items',
    ],
    shouldNotStore: [
      'Temporary variables',
      'Current function being analyzed',
      'Immediate output formatting',
      'Temporary state during operation',
    ],
  };

  constructor(config: Partial<StorageHintsConfig> = {}) {
    super();
    
    this.config = {
      enabled: config.enabled ?? true,
      contextCheckInterval: config.contextCheckInterval ?? 30000,
      contextTokenThreshold: config.contextTokenThreshold ?? 50000,
      maxContextSize: config.maxContextSize ?? 100000,
    };

    debugLogger.info('[StorageHints] Created with config:', this.config);
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start periodic hints
   */
  start(): void {
    if (this.isRunning || !this.config.enabled) return;

    this.isRunning = true;
    
    this.intervalId = setInterval(() => {
      this.checkAndEmitHint();
    }, this.config.contextCheckInterval);

    debugLogger.info('[StorageHints] Started');
    this.emit('started');
  }

  /**
   * Stop periodic hints
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    debugLogger.info('[StorageHints] Stopped');
    this.emit('stopped');
  }

  /**
   * Get hint for session start
   */
  getSessionStartHint(): StorageHint {
    return {
      type: 'session_start',
      priority: 'high',
      message: this.formatSessionStartMessage(),
      suggestedActions: [
        'model_storage operation=search query="current task progress" namespaces=["context"] limit=3',
        'model_storage operation=get namespace=plans key="current"',
        'model_storage operation=get namespace=todos key="items"',
      ],
    };
  }

  /**
   * Get hint for context overflow
   */
  getContextOverflowHint(currentTokens: number): StorageHint {
    return {
      type: 'context_overflow',
      priority: 'high',
      message: this.formatContextOverflowMessage(currentTokens),
      suggestedActions: [
        'Save current progress to storage',
        'Search storage instead of keeping in context',
        'Summarize and store old context',
        'Clear completed items from context',
      ],
    };
  }

  /**
   * Get periodic reminder hint
   */
  getPeriodicReminder(): StorageHint {
    return {
      type: 'periodic_reminder',
      priority: 'medium',
      message: this.formatPeriodicReminderMessage(),
      suggestedActions: [
        'Review what should be in storage vs context',
        'Save any discovered patterns',
        'Check for outdated context',
      ],
    };
  }

  /**
   * Get knowledge opportunity hint
   */
  getKnowledgeOpportunityHint(topic: string): StorageHint {
    return {
      type: 'knowledge_opportunity',
      priority: 'medium',
      message: this.formatKnowledgeOpportunityMessage(topic),
      suggestedActions: [
        `model_storage operation=addWithEmbedding namespace=knowledge key="${topic}" value="..." tags=["pattern"]`,
        'model_storage operation=search query="similar patterns" namespaces=["knowledge"] limit=5',
      ],
    };
  }

  /**
   * Get session end hint
   */
  getSessionEndHint(): StorageHint {
    return {
      type: 'session_end',
      priority: 'high',
      message: this.formatSessionEndMessage(),
      suggestedActions: [
        'model_storage operation=set namespace=context key="session_progress" value="{...}"',
        'model_storage operation=addWithEmbedding namespace=knowledge key="session_findings" value="..."',
        'model_storage operation=merge namespace=roadmap key="progress" value="{...}"',
      ],
    };
  }

  /**
   * Get formatted hint for injection into system prompt
   */
  getHintForPrompt(hint: StorageHint): string {
    const lines: string[] = [
      '<storage-hint priority="' + hint.priority + '">',
      hint.message,
      '',
      '**Suggested Actions:**',
    ];

    for (const action of hint.suggestedActions) {
      lines.push(`- ${action}`);
    }

    lines.push('</storage-hint>');
    return lines.join('\n');
  }

  /**
   * Get Memory Bank reminder hint
   */
  getMemoryBankReminder(): StorageHint {
    return {
      type: 'periodic_reminder',
      priority: 'medium',
      message: this.formatMemoryBankReminderMessage(),
      suggestedActions: [
        'Update activeContext.md with current focus',
        'Update progress.md with completed items',
        'Check systemPatterns.md before making architectural changes',
      ],
    };
  }

  /**
   * Get Memory Bank session end reminder
   */
  getMemoryBankSessionEndHint(): StorageHint {
    return {
      type: 'session_end',
      priority: 'high',
      message: this.formatMemoryBankSessionEndMessage(),
      suggestedActions: [
        'model_storage operation=merge namespace=memory-bank key="activeContext" value="{...}"',
        'model_storage operation=merge namespace=memory-bank key="progress" value="{...}"',
      ],
    };
  }

  /**
   * Get Memory Bank best practices prompt section
   */
  getMemoryBankBestPracticesPrompt(): string {
    return `
## Memory Bank Protocol

The Memory Bank is your "long-term brain" - structured markdown files that persist across sessions.

### Core Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| projectbrief.md | The "North Star" - what, who, why | Rarely |
| systemPatterns.md | The "Architecture" - patterns, decisions | Sometimes |
| techContext.md | The "Constraints" - stack, dependencies | Sometimes |
| activeContext.md | The "RAM" - current focus, next steps | Constantly |
| progress.md | The "Map" - completed, issues, roadmap | Frequently |

### Protocol

1. **Startup Read**: Memory Bank is loaded at session start
2. **Execution Reference**: Check systemPatterns.md before suggesting solutions
3. **Write-Back**: Update activeContext.md and progress.md at end of task/session

### When to Update

- **activeContext.md**: After every significant change, decision, or when blocked
- **progress.md**: When completing tasks, discovering issues, or planning next steps
- **systemPatterns.md**: When making architectural decisions
- **techContext.md**: When adding/removing dependencies

### Example Updates

\`\`\`json
// Update active context
model_storage operation=merge namespace=memory-bank key="activeContext" value='{
  "currentFocus": "Implementing authentication flow",
  "nextSteps": ["Add OAuth support", "Write tests"],
  "lastUpdated": "<timestamp>"
}'

// Mark task complete
model_storage operation=merge namespace=memory-bank key="progress" value='{
  "completed": [{"name": "Auth flow", "completedAt": "<date>"}]
}'
\`\`\`

### Location

Memory Bank files are stored in: \`~/.ollama-code/storage/md/memory-bank/\`

You can edit them directly - changes will be detected automatically.
`;
  }

  private formatMemoryBankReminderMessage(): string {
    return `📚 **Memory Bank Reminder**

Keep your Memory Bank updated for persistent context:

- **activeContext.md**: What are you working on RIGHT NOW?
- **progress.md**: What have you completed?

Update these files at the end of each task or session.

Use \`model_storage operation=merge namespace=memory-bank key="activeContext"\` to update.`;
  }

  private formatMemoryBankSessionEndMessage(): string {
    return `📤 **Session Ending - Update Your Memory Bank**

Before ending, update your Memory Bank files:

1. **activeContext.md** - Current focus and next steps
2. **progress.md** - What was completed this session

\`\`\`json
// Update active context
model_storage operation=merge namespace=memory-bank key="activeContext" value='{
  "currentFocus": "...",
  "nextSteps": ["...", "..."],
  "lastUpdated": "<timestamp>"
}'

// Update progress  
model_storage operation=merge namespace=memory-bank key="progress" value='{
  "completed": [...],
  "knownIssues": [...]
}'
\`\`\`

**Your Memory Bank persists across sessions. Keep it updated!**`;
  }

  /**
   * Get storage best practices prompt section
   */
  getStorageBestPracticesPrompt(): string {
    return `
## Storage Best Practices

### Use Storage, Not Context

The model has access to persistent storage through \`model_storage\`. Use it actively!

**Store in storage (not context):**
${this.STORAGE_RULES.shouldStore.map(s => `- ${s}`).join('\n')}

**Keep in context (short-term):**
${this.STORAGE_RULES.shouldKeepInContext.map(s => `- ${s}`).join('\n')}

### Context Management Rules

1. **Save Early, Save Often**: When you discover something valuable, store it immediately
2. **Search Before Asking**: Use semantic search to find relevant stored information
3. **Summarize Context**: Periodically summarize old context and store the summary
4. **Clear Completed**: Remove completed tasks from context, keep in storage

### Storage Operations by Scenario

| Scenario | Operation |
|----------|-----------|
| Start session | \`search query="current task"\` in context namespace |
| Learn pattern | \`addWithEmbedding namespace=knowledge\` with tags |
| Save progress | \`set namespace=context key="session_progress"\` |
| Find similar | \`findSimilar namespace=knowledge\` |
| End session | Save session summary + update roadmap |

### Reducing Context Usage

Instead of keeping ALL information in context:

\`\`\`json
// BAD: Keep everything in context
// (context grows, becomes slow and expensive)

// GOOD: Store in semantic storage and search when needed
model_storage operation=search query="authentication patterns" namespaces=["knowledge"] limit=5
\`\`\`

### User-Editable Knowledge

Users can edit knowledge files directly:
- Location: \`~/.ollama-code/storage/md/\`
- Format: Markdown files
- Auto-synced to storage on changes

The system will notify you when knowledge files are updated.
`;
  }

  /**
   * Get context cleanup prompt
   */
  getContextCleanupPrompt(): string {
    return `
## Context Cleanup Reminder

Your context may be getting large. Consider:

1. **Store discovered patterns**:
   \`\`\`json
   model_storage operation=addWithEmbedding namespace=knowledge key="pattern_name" value="description" tags=["pattern"]
   \`\`\`

2. **Save session progress**:
   \`\`\`json
   model_storage operation=set namespace=context key="session_progress" value='{"completed":[...],"nextSteps":[...]}'
   \`\`\`

3. **Clear old context** by summarizing:
   - What was done
   - What's pending
   - Important findings
   
   Store the summary, then focus on current task.

4. **Use semantic search** instead of keeping reference material:
   \`\`\`json
   model_storage operation=search query="reference topic" limit=5
   \`\`\`

**Remember**: Storage persists across sessions. Context does not.
`;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private checkAndEmitHint(): void {
    const now = Date.now();
    
    // Don't emit too frequently
    if (now - this.lastHintTime < this.minHintInterval) {
      return;
    }

    this.lastHintTime = now;
    
    // Emit periodic reminder
    const hint = this.getPeriodicReminder();
    this.emit('hint', hint);
  }

  private formatSessionStartMessage(): string {
    return `📂 **Session Started - Check Your Storage**

You have persistent storage available. Before starting:

1. **Check for previous work**:
   - Any active plans?
   - Unfinished tasks?
   - Important context from last session?

2. **Load project knowledge**:
   - Project conventions
   - Discovered patterns
   - User preferences

3. **Continue where you left off** - storage remembers!`;
  }

  private formatContextOverflowMessage(currentTokens: number): string {
    return `⚠️ **Context Size Warning**

Current context: ~${Math.round(currentTokens / 1000)}k tokens

Your context is getting large. This can slow down responses and increase costs.

**Immediate actions:**
1. Store discovered patterns in \`knowledge\` namespace
2. Save session progress in \`context\` namespace  
3. Summarize old conversations and store
4. Use \`search\` instead of keeping reference material

**Remember**: You can always search storage to retrieve information later.`;
  }

  private formatPeriodicReminderMessage(): string {
    return `🔄 **Storage Reminder**

Consider storing valuable information you've discovered:

- Code patterns and conventions
- User decisions and preferences
- Solutions to errors
- Project structure insights

Use \`model_storage operation=addWithEmbedding\` for semantic searchability.`;
  }

  private formatKnowledgeOpportunityMessage(topic: string): string {
    return `💡 **Knowledge Opportunity**

You've discovered valuable information about: **${topic}**

Consider storing this for future sessions using:
\`\`\`json
model_storage operation=addWithEmbedding namespace=knowledge key="${topic}" value="..." tags=["important"]
\`\`\`

This will be searchable by meaning in future sessions.`;
  }

  private formatSessionEndMessage(): string {
    return `📤 **Session Ending - Save Your Progress**

Before ending, store important information:

1. **Session Summary** - What was accomplished
2. **Discoveries** - Patterns and insights found
3. **Next Steps** - What to continue next time
4. **User Decisions** - Preferences and choices

Use \`model_storage\` operations to persist this information.

**Goodbye! Your knowledge is safe in storage.**`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storageHintsInstance: StorageHintsService | null = null;

export function getStorageHintsService(config?: Partial<StorageHintsConfig>): StorageHintsService {
  if (!storageHintsInstance) {
    storageHintsInstance = new StorageHintsService(config);
  }
  return storageHintsInstance;
}

export function startStorageHints(config?: Partial<StorageHintsConfig>): StorageHintsService {
  const service = getStorageHintsService(config);
  service.start();
  return service;
}

export function stopStorageHints(): void {
  if (storageHintsInstance) {
    storageHintsInstance.stop();
  }
}

export default StorageHintsService;
