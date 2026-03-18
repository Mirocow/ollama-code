/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Initialize default MD files in storage
 * These files are user-editable and synced to model storage
 *
 * Now includes Memory Bank pattern from kilo.ai:
 * - projectbrief.md: The "North Star" - what are we building
 * - systemPatterns.md: The "Architecture" - design patterns
 * - techContext.md: The "Constraints" - tech stack
 * - activeContext.md: The "RAM" - current focus
 * - progress.md: The "Map" - completed features
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getOllamaDir } from '../utils/paths.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('INIT_STORAGE_MD');

const MD_TEMPLATES: Record<string, { content: string; description: string }> = {
  'knowledge/project_conventions.md': {
    description: 'Project coding conventions and standards',
    content: `# Project Conventions

<!--
@storage: true
@namespace: knowledge
@key: project_conventions
@editable: true
-->

## Naming Conventions

### Files
- Components: PascalCase.tsx
- Utilities: camelCase.ts
- Constants: SCREAMING_SNAKE_CASE.ts

### Code
- Classes: PascalCase
- Functions: camelCase
- Variables: camelCase
- Constants: SCREAMING_SNAKE_CASE

## Project Structure

\`\`\`
src/
├── components/   # UI components
├── services/     # Business logic
├── utils/        # Helper functions
├── types/        # TypeScript types
└── tests/        # Test files
\`\`\`

## Testing

- Framework: vitest
- Location: Same directory with .test.ts
- Coverage goal: 80%+

<!-- Add your project-specific conventions below -->
`,
  },

  'knowledge/api_patterns.md': {
    description: 'API patterns and endpoint conventions',
    content: `# API Patterns

<!--
@storage: true
@namespace: knowledge
@key: api_patterns
@editable: true
-->

## Standard Response Format

\`\`\`typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
\`\`\`

## Authentication

- Type: JWT Bearer tokens
- Header: Authorization: Bearer <token>
- Refresh: Implemented via refresh tokens

## Error Handling

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

<!-- Add your API patterns below -->
`,
  },

  'knowledge/user_preferences.md': {
    description: 'User preferences and decisions',
    content: `# User Preferences

<!--
@storage: true
@namespace: knowledge
@key: user_preferences
@editable: true
-->

## Coding Style

- Editor: [Your preferred editor]
- Formatter: [prettier/eslint]
- Quotes: single/double
- Semicolons: yes/no

## Commit Style

- Format: conventional commits
- Example: feat: add authentication

## Preferences

<!-- Add your personal preferences below -->
`,
  },

  'learning/error_solutions.md': {
    description: 'Solutions to common errors',
    content: `# Error Solutions

<!--
@storage: true
@namespace: learning
@key: error_solutions
@editable: true
-->

This file contains solutions to errors encountered during development.

## Template

\`\`\`
### Error: [Error Name]

**Problem:**
[Description of the error]

**Solution:**
[How to fix it]

**Prevention:**
[How to avoid in future]
\`\`\`

<!-- Add your error solutions below -->
`,
  },

  'roadmap/current_milestone.md': {
    description: 'Current milestone and progress',
    content: `# Current Milestone

<!--
@storage: true
@namespace: roadmap
@key: current_milestone
@editable: true
-->

## Goal

[Describe current milestone goal]

## Progress

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Blockers

[Current blockers if any]

## Notes

[Additional notes]

<!-- Update as you progress -->
`,
  },

  // ============================================================
  // Memory Bank Files (based on kilo.ai Memory Bank pattern)
  // ============================================================

  'memory-bank/projectbrief.md': {
    description: 'The "North Star" - what are we building, for whom',
    content: `<!--
@memory-bank: true
@file: projectbrief
@update-frequency: rarely
@ai-editable: false
@user-editable: true

The "North Star" - immutable core of the project.
Update this file rarely - only when project scope fundamentally changes.
-->

# Project Brief

## What Are We Building?

[Describe what you are building - be specific and clear]

## Who Is It For?

[Describe your target users/audience]

## Core Value Proposition

[What unique value does this project provide?]

## Goals

- [Goal 1 - specific, measurable outcome]
- [Goal 2]
- [Goal 3]

## Non-Goals

What we are NOT building (important for scope):

- [Non-goal 1]
- [Non-goal 2]

## Success Criteria

How will we know when we've succeeded?

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Notes

[Any additional context, constraints, or important information]

---
*This file defines the project's purpose. Update rarely.*
`,
  },

  'memory-bank/systemPatterns.md': {
    description: 'The "Architecture" - design patterns and decisions',
    content: `<!--
@memory-bank: true
@file: systemPatterns
@update-frequency: sometimes
@ai-editable: true
@user-editable: true

The "Architecture" - design patterns, architectural decisions, rules of the road.
Update when making significant architectural decisions.
-->

# System Patterns

## Design Patterns

### [Pattern Name 1]

**When to use:**
[When this pattern is appropriate]

**Implementation:**
\`\`\`
[Example code or description]
\`\`\`

## Architectural Decisions

### Decision: [Decision Name]

**What was decided:**
[The decision made]

**Why:**
[Rationale - this is crucial for future reference]

**Consequences:**
[What this means for the project]

## Rules of the Road

1. [Rule 1 - coding guideline]
2. [Rule 2]
3. [Rule 3]

## Code Conventions

### Naming
- Variables: \`camelCase\`
- Constants: \`SCREAMING_SNAKE_CASE\`
- Classes: \`PascalCase\`
- Files: \`[convention]\`

### File Structure
\`\`\`
src/
├── components/   # [purpose]
├── services/     # [purpose]
├── utils/        # [purpose]
└── types/        # [purpose]
\`\`\`

### Testing
- Framework: [testing framework]
- Location: [where tests go]
- Coverage goal: [X]%

---
*This file captures how the system is built. Update when making architectural decisions.*
`,
  },

  'memory-bank/techContext.md': {
    description: 'The "Constraints" - tech stack, dependencies, versions',
    content: `<!--
@memory-bank: true
@file: techContext
@update-frequency: sometimes
@ai-editable: true
@user-editable: true

The "Constraints" - tech stack, dependencies, versions, environment setup.
Update when adding/removing major dependencies.
-->

# Technical Context

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Language | [e.g., TypeScript] | [version] |
| Runtime | [e.g., Node.js] | [version] |
| Framework | [e.g., React] | [version] |
| Database | [e.g., PostgreSQL] | [version] |

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| [package-name] | [version] | [what it does] |

## Environment Setup

### Prerequisites
- [Requirement 1, e.g., Node.js >= 18]
- [Requirement 2]

### Installation
\`\`\`bash
# Clone and setup
git clone [repo]
cd [project]
npm install
\`\`\`

### Configuration
\`\`\`bash
# Environment variables needed
cp .env.example .env
# Edit .env with your values
\`\`\`

## Build & Run

\`\`\`bash
# Development
npm run dev

# Build
npm run build

# Test
npm test
\`\`\`

## Deployment

[Deployment process and requirements]

## Development Tools

| Tool | Purpose |
|------|---------|
| [IDE] | [purpose] |
| [Linter] | [purpose] |
| [Formatter] | [purpose] |

---
*This file captures technical constraints. Update when changing tech stack.*
`,
  },

  'memory-bank/activeContext.md': {
    description: 'The "RAM" - current focus, decisions, next steps',
    content: `<!--
@memory-bank: true
@file: activeContext
@update-frequency: constantly
@ai-editable: true
@user-editable: true

The "RAM" - current focus, active decisions, open questions, immediate next step.
This file changes CONSTANTLY - update after every significant change.
-->

# Active Context

## Current Focus

[What are you working on RIGHT NOW? Be specific.]

## Active Tasks

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| [Task description] | 🔄 in_progress | high | [notes] |
| [Another task] | ⏳ pending | medium | [notes] |
| [Blocked task] | 🚫 blocked | high | blocked by: [what] |

## Recent Decisions

- **[Date]**: [Decision made] - because [reason]

## Open Questions

- [ ] [Question 1?]
- [ ] [Question 2?]

## Next Steps

1. [Immediate next step - be specific]
2. [Following step]
3. [After that]

## Current Blockers

| Blocker | Impact | Possible Solution |
|---------|--------|-------------------|
| [What's blocked] | [Impact] | [How to resolve] |

---
*Last Updated: ${new Date().toISOString()}*
*This file changes constantly. Keep it updated!*
`,
  },

  'memory-bank/progress.md': {
    description: 'The "Map" - completed features, issues, roadmap',
    content: `<!--
@memory-bank: true
@file: progress
@update-frequency: frequently
@ai-editable: true
@user-editable: true

The "Map" - completed features, known issues, roadmap.
Update when completing tasks or discovering issues.
-->

# Progress

## Completed ✅

| Feature | Completed | Notes |
|---------|-----------|-------|
| [Feature name] | [Date] | [Brief notes] |

## In Progress 🔄

| Feature | Started | Progress | Blocker |
|---------|---------|----------|---------|
| [Feature name] | [Date] | [X]% | [if any] |

## Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| [Issue description] | medium | open | [workaround if any] |

## Roadmap

### Current Milestone: [Milestone Name]

- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

### Upcoming

1. **[Next Milestone]** - [Brief description]
2. **[Future Milestone]** - [Brief description]

## Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| [Milestone 1] | [Date] | ✅ completed |
| [Milestone 2] | [Date] | 🔄 in_progress |
| [Milestone 3] | [Date] | 📋 planned |

## Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Test Coverage | [X]% | [Y]% |
| Open Issues | [X] | [Y] |

---
*This file tracks the journey. Update when completing tasks or discovering issues.*
`,
  },
};

/**
 * Initialize MD files in storage directory
 */
export async function initializeStorageMDFiles(): Promise<void> {
  const storageDir = path.join(getOllamaDir(), 'storage', 'md');

  debugLogger.info(`Initializing storage MD files in: ${storageDir}`);

  for (const [relativePath, template] of Object.entries(MD_TEMPLATES)) {
    const fullPath = path.join(storageDir, relativePath);
    const dir = path.dirname(fullPath);

    try {
      await fs.mkdir(dir, { recursive: true });

      // Check if file exists
      try {
        await fs.access(fullPath);
        debugLogger.debug(`Skipped (exists): ${relativePath}`);
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(fullPath, template.content, 'utf-8');
        debugLogger.info(`Created: ${relativePath} - ${template.description}`);
      }
    } catch (error) {
      debugLogger.error(`Failed to create ${relativePath}:`, error);
    }
  }

  debugLogger.info('Storage MD files initialization complete');
}

/**
 * Create a user-editable MD file
 */
export async function createEditableMDFile(
  namespace: string,
  key: string,
  content: string,
): Promise<string> {
  const storageDir = path.join(getOllamaDir(), 'storage', 'md');
  const filePath = path.join(storageDir, namespace, `${key}.md`);

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const header = `<!--
@storage: true
@namespace: ${namespace}
@key: ${key}
@generated: ${new Date().toISOString()}
@editable: true

This file is part of the model's knowledge storage.
You can edit this file directly - changes will be detected automatically.
-->
`;

  const fullContent = header + '\n' + content;
  await fs.writeFile(filePath, fullContent, 'utf-8');

  debugLogger.info(`Created editable MD file: ${filePath}`);
  return filePath;
}

/**
 * Read an editable MD file
 */
export async function readEditableMDFile(
  namespace: string,
  key: string,
): Promise<string | null> {
  const storageDir = path.join(getOllamaDir(), 'storage', 'md');
  const filePath = path.join(storageDir, namespace, `${key}.md`);

  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Update an editable MD file
 */
export async function updateEditableMDFile(
  namespace: string,
  key: string,
  content: string,
): Promise<void> {
  const storageDir = path.join(getOllamaDir(), 'storage', 'md');
  const filePath = path.join(storageDir, namespace, `${key}.md`);

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`MD file not found: ${namespace}/${key}`);
  }

  // Remove header and write new content
  await fs.writeFile(filePath, content, 'utf-8');

  debugLogger.info(`Updated MD file: ${filePath}`);
}

/**
 * List all editable MD files
 */
export async function listEditableMDFiles(): Promise<
  Array<{ namespace: string; key: string; path: string }>
> {
  const storageDir = path.join(getOllamaDir(), 'storage', 'md');
  const files: Array<{ namespace: string; key: string; path: string }> = [];

  try {
    const namespaces = await fs.readdir(storageDir);

    for (const namespace of namespaces) {
      const nsDir = path.join(storageDir, namespace);

      try {
        const mdFiles = await fs.readdir(nsDir);

        for (const file of mdFiles) {
          if (file.endsWith('.md')) {
            const key = file.replace('.md', '');
            files.push({
              namespace,
              key,
              path: path.join(nsDir, file),
            });
          }
        }
      } catch {
        // Directory read error, skip
      }
    }
  } catch {
    // Storage directory doesn't exist yet
  }

  return files;
}

export { MD_TEMPLATES };
