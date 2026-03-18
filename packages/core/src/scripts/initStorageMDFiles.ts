/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Initialize default MD files in storage
 * These files are user-editable and synced to model storage
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
