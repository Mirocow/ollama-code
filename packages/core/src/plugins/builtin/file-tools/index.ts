/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File Tools Plugin
 *
 * Built-in plugin providing file system operations.
 */

import type { PluginDefinition } from '../../types.js';
import type { Config } from '../../../config/config.js';
import { ReadFileTool } from './read-file/index.js';
import { WriteFileTool } from './write-file/index.js';
import { EditTool } from './edit/index.js';
import { LSTool } from './ls/index.js';
import { GlobTool } from './glob/index.js';
import { ReadManyFilesTool } from './read-many-files/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  READ_FILE: 'read_file',
  WRITE_FILE: 'write_file',
  EDIT: 'edit',
  LIST_DIRECTORY: 'list_directory',
  GLOB: 'glob',
  READ_MANY_FILES: 'read_many_files',
} as const;

/**
 * Create file tools plugin with config
 */
export function createFileToolsPlugin(): PluginDefinition {
  return {
    metadata: {
      id: 'file-tools',
      name: 'File Tools',
      version: '1.0.0',
      description: 'File system operations: read, write, edit, list, glob',
      author: 'Ollama Code Team',
      tags: ['core', 'builtin', 'file', 'filesystem'],
      enabledByDefault: true,
    },

    // Unified tools array - factory functions for tools that need Config
    tools: [
      (config: unknown) => new ReadFileTool(config as Config),
      (config: unknown) => new WriteFileTool(config as Config),
      (config: unknown) => new EditTool(config as Config),
      (config: unknown) => new LSTool(config as Config),
      (config: unknown) => new GlobTool(config as Config),
      (config: unknown) => new ReadManyFilesTool(config as Config),
    ],

    // Tool aliases - short names that resolve to canonical tool names
    // Includes common model hallucinations and variations
    aliases: [
      // ═══════════════════════════════════════════════════════════════════
      // read_file aliases
      // ═══════════════════════════════════════════════════════════════════
      {
        alias: 'read',
        canonicalName: 'read_file',
        description: 'Read file content',
      },
      {
        alias: 'read_file',
        canonicalName: 'read_file',
        description: 'Read file content',
      },
      {
        alias: 'read-file',
        canonicalName: 'read_file',
        description: 'Read file content',
      },
      {
        alias: 'cat_file',
        canonicalName: 'read_file',
        description: 'Display file content',
      },
      {
        alias: 'open',
        canonicalName: 'read_file',
        description: 'Open and read file',
      },
      {
        alias: 'view',
        canonicalName: 'read_file',
        description: 'View file content',
      },
      {
        alias: 'ReadFile',
        canonicalName: 'read_file',
        description: 'Read file content',
      },
      {
        alias: 'Read-File',
        canonicalName: 'read_file',
        description: 'Read file content',
      },
      {
        alias: 'readFile',
        canonicalName: 'read_file',
        description: 'Read file content',
      },
      // ═══════════════════════════════════════════════════════════════════
      // write_file aliases
      // ═══════════════════════════════════════════════════════════════════
      {
        alias: 'write',
        canonicalName: 'write_file',
        description: 'Write content to file',
      },
      {
        alias: 'create',
        canonicalName: 'write_file',
        description: 'Create new file',
      },
      {
        alias: 'write_file',
        canonicalName: 'write_file',
        description: 'Write content to file',
      },
      {
        alias: 'write-file',
        canonicalName: 'write_file',
        description: 'Write content to file',
      },
      {
        alias: 'save_file',
        canonicalName: 'write_file',
        description: 'Save content to file',
      },
      {
        alias: 'new_file',
        canonicalName: 'write_file',
        description: 'Create new file',
      },
      {
        alias: 'WriteFile',
        canonicalName: 'write_file',
        description: 'Write content to file',
      },
      {
        alias: 'Write-File',
        canonicalName: 'write_file',
        description: 'Write content to file',
      },
      {
        alias: 'writeFile',
        canonicalName: 'write_file',
        description: 'Write content to file',
      },
      // ═══════════════════════════════════════════════════════════════════
      // edit aliases (including common model hallucinations)
      // ═══════════════════════════════════════════════════════════════════
      {
        alias: 'edit',
        canonicalName: 'edit',
        description: 'Edit file content',
      },
      {
        alias: 'Edit',
        canonicalName: 'edit',
        description: 'Edit file content',
      },
      {
        alias: 'edit-file',
        canonicalName: 'edit',
        description: 'Edit file content',
      },
      {
        alias: 'edit_file',
        canonicalName: 'edit',
        description: 'Edit file content',
      },
      {
        alias: 'replace',
        canonicalName: 'edit',
        description: 'Replace text in file',
      },
      {
        alias: 'modify',
        canonicalName: 'edit',
        description: 'Modify file content',
      },
      {
        alias: 'patch',
        canonicalName: 'edit',
        description: 'Patch file content',
      },
      { alias: 'sed', canonicalName: 'edit', description: 'Stream edit file' },
      // ═══════════════════════════════════════════════════════════════════
      // list_directory aliases (including common model hallucinations)
      // ═══════════════════════════════════════════════════════════════════
      {
        alias: 'ls',
        canonicalName: 'list_directory',
        description: 'List directory contents',
      },
      {
        alias: 'list',
        canonicalName: 'list_directory',
        description: 'List files and directories',
      },
      {
        alias: 'dir',
        canonicalName: 'list_directory',
        description: 'Show directory contents',
      },
      {
        alias: 'list_directory',
        canonicalName: 'list_directory',
        description: 'List directory contents',
      },
      {
        alias: 'list_dir',
        canonicalName: 'list_directory',
        description: 'List directory contents',
      },
      {
        alias: 'list_files',
        canonicalName: 'list_directory',
        description: 'List files',
      },
      {
        alias: 'ListFiles',
        canonicalName: 'list_directory',
        description: 'List files',
      },
      {
        alias: 'list-files',
        canonicalName: 'list_directory',
        description: 'List files',
      },
      {
        alias: 'List-Files',
        canonicalName: 'list_directory',
        description: 'List files',
      },
      {
        alias: 'ListDirectory',
        canonicalName: 'list_directory',
        description: 'List directory',
      },
      {
        alias: 'list-directory',
        canonicalName: 'list_directory',
        description: 'List directory',
      },
      // Legacy display name (was ToolDisplayNamesMigration)
      {
        alias: 'ReadFolder',
        canonicalName: 'list_directory',
        description: 'Read folder (legacy display name)',
      },
      // ═══════════════════════════════════════════════════════════════════
      // glob aliases
      // ═══════════════════════════════════════════════════════════════════
      {
        alias: 'glob',
        canonicalName: 'glob',
        description: 'Find files by pattern',
      },
      {
        alias: 'files',
        canonicalName: 'glob',
        description: 'Find files by pattern',
      },
      {
        alias: 'find_files',
        canonicalName: 'glob',
        description: 'Find files matching pattern',
      },
      {
        alias: 'glob_search',
        canonicalName: 'glob',
        description: 'Search files by glob pattern',
      },
      {
        alias: 'pattern',
        canonicalName: 'glob',
        description: 'Search files by pattern',
      },
      // Legacy display name (was ToolDisplayNamesMigration)
      {
        alias: 'FindFiles',
        canonicalName: 'glob',
        description: 'Find files (legacy display name)',
      },
      // ═══════════════════════════════════════════════════════════════════
      // read_many_files aliases
      // ═══════════════════════════════════════════════════════════════════
      {
        alias: 'readmany',
        canonicalName: 'read_many_files',
        description: 'Read multiple files at once',
      },
      {
        alias: 'read_all',
        canonicalName: 'read_many_files',
        description: 'Read all specified files',
      },
      {
        alias: 'cat',
        canonicalName: 'read_many_files',
        description: 'Concatenate files',
      },
      {
        alias: 'read_many',
        canonicalName: 'read_many_files',
        description: 'Read many files',
      },
      {
        alias: 'read_files',
        canonicalName: 'read_many_files',
        description: 'Read multiple files',
      },
    ],

    // Context-aware prompts for model guidance
    prompts: [
      {
        priority: 1,
        content:
          'File tools: list_directory (use to LIST FILES in a folder), glob (use to FIND FILES by pattern like **/*.ts), read_file (read single file), write_file (create/overwrite), edit (precise replacements), read_many_files (read multiple files). NEVER use grep_search to list files - grep_search searches FILE CONTENTS, not file names.',
      },
      {
        priority: 2,
        content:
          'GETTING FILE LIST: Use list_directory to see what files exist in a folder. Use glob to find files matching a pattern. Example: list_directory path="/src/utils" shows all files in that folder. glob pattern="**/*.ts" finds all TypeScript files.',
      },
      {
        priority: 3,
        content:
          'EDIT TOOL: Use for precise replacements. Provide old_string (must match exactly) and new_string. For large changes, use write_file instead. Always read file first to see exact content.',
      },
      {
        priority: 4,
        content:
          'GLOB patterns: **/*.ts matches all .ts files recursively, src/**/*.js matches in src folder, *.json matches in current directory. Use list_directory first to understand project structure.',
      },
      {
        priority: 5,
        content:
          'Use read_many_files when you need to read multiple files - it is more efficient than multiple read_file calls. Provide array of file paths. Good for analyzing code structure across multiple files.',
      },
    ],

    // Plugin capabilities
    capabilities: {
      canReadFiles: true,
      canWriteFiles: true,
      canExecuteCommands: false,
      canAccessNetwork: false,
      canUseStorage: true,
      canUsePrompts: true,
    },

    hooks: {
      onLoad: async (context) => {
        context.logger.info('File Tools plugin loaded');
      },

      onEnable: async (context) => {
        context.logger.info('File Tools plugin enabled');
      },
    },
  };
}

/**
 * File Tools Plugin Definition (default export for backward compatibility)
 */
const fileToolsPlugin: PluginDefinition = createFileToolsPlugin();

export default fileToolsPlugin;

// Also export tool classes for direct imports
export { ReadFileTool } from './read-file/index.js';
export { WriteFileTool } from './write-file/index.js';
export { EditTool } from './edit/index.js';
export { LSTool } from './ls/index.js';
export { GlobTool } from './glob/index.js';
export { ReadManyFilesTool } from './read-many-files/index.js';
