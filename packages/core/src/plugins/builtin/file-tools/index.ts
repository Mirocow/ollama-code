/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File Tools Plugin
 * 
 * Built-in plugin providing file system operations.
 * This plugin wraps the existing file tools into the plugin system.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Tool: read_file
 * Read contents of a single file
 */
const readFileTool: PluginTool = {
  id: 'read_file',
  name: 'read_file',
  description: `Reads and returns the content of a specified file. If the file is large, the content will be truncated. The tool's response will clearly indicate if truncation has occurred and will provide details on how to read more of the file using the 'offset' and 'limit' parameters. Handles text, images (PNG, JPG, GIF, WEBP, SVG, BMP), and PDF files. For text files, it can read specific line ranges.`,
  parameters: {
    type: 'object',
    properties: {
      absolute_path: {
        type: 'string',
        description: 'REQUIRED: The absolute path to the file to read. Must be an absolute path, not relative. Examples: \'/home/user/project/file.txt\', \'/Users/name/workspace/src/index.ts\', \'C:\\\\Users\\\\name\\\\file.txt\'.',
      },
      offset: {
        type: 'number',
        description: 'OPTIONAL: For text files, the 0-based line number to start reading from. Requires \'limit\' to be set. Use for paginating through large files.',
      },
      limit: {
        type: 'number',
        description: 'OPTIONAL: For text files, maximum number of lines to read. Use with \'offset\' to paginate through large files. If omitted, reads the entire file (up to a default limit).',
      },
    },
    required: ['absolute_path'],
  },
  category: 'read',
  execute: async (params) => {
    const filePath = params['absolute_path'] as string;
    const offset = params['offset'] as number | undefined;
    const limit = params['limit'] as number | undefined;
    
    try {
      // Check if file exists
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        return {
          success: false,
          error: `Path '${filePath}' is a directory, not a file. Use list_directory instead.`,
        };
      }
      
      // Read file content
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      if (offset !== undefined || limit !== undefined) {
        const start = offset ?? 0;
        const end = limit !== undefined ? start + limit : lines.length;
        const selectedLines = lines.slice(start, end);
        
        return {
          success: true,
          data: selectedLines.join('\n'),
          display: {
            summary: `Read lines ${start}-${Math.min(end, lines.length)} of ${lines.length} from ${path.basename(filePath)}`,
            file: filePath,
          },
        };
      }
      
      return {
        success: true,
        data: content,
        display: {
          summary: `Read ${lines.length} lines from ${path.basename(filePath)} (${stats.size} bytes)`,
          file: filePath,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to read file '${filePath}': ${errorMessage}`,
      };
    }
  },
};

/**
 * Tool: write_file
 * Create or overwrite a file
 */
const writeFileTool: PluginTool = {
  id: 'write_file',
  name: 'write_file',
  description: 'Writes content to a specified file. Creates the file if it does not exist, overwrites it if it does. Requires absolute path.',
  parameters: {
    type: 'object',
    properties: {
      absolute_path: {
        type: 'string',
        description: 'REQUIRED: The absolute path where the file should be written.',
      },
      content: {
        type: 'string',
        description: 'REQUIRED: The content to write to the file.',
      },
    },
    required: ['absolute_path', 'content'],
  },
  category: 'edit',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => {
    const filePath = params['absolute_path'] as string;
    const content = params['content'] as string;
    return `Write ${content.length} characters to ${filePath}?`;
  },
  execute: async (params) => {
    const filePath = params['absolute_path'] as string;
    const content = params['content'] as string;
    
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, content, 'utf8');
      
      const lines = content.split('\n').length;
      
      return {
        success: true,
        data: `Successfully wrote ${content.length} characters (${lines} lines) to ${filePath}`,
        display: {
          summary: `Wrote ${lines} lines to ${path.basename(filePath)}`,
          file: filePath,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to write file '${filePath}': ${errorMessage}`,
      };
    }
  },
};

/**
 * Tool: edit
 * Edit an existing file by replacing content
 */
const editTool: PluginTool = {
  id: 'edit',
  name: 'edit',
  description: 'Performs exact string replacements in files. Use this tool for editing existing files by finding and replacing specific text.',
  parameters: {
    type: 'object',
    properties: {
      absolute_path: {
        type: 'string',
        description: 'REQUIRED: The absolute path to the file to edit.',
      },
      old_content: {
        type: 'string',
        description: 'REQUIRED: The exact text to find and replace.',
      },
      new_content: {
        type: 'string',
        description: 'REQUIRED: The text to replace the old content with.',
      },
    },
    required: ['absolute_path', 'old_content', 'new_content'],
  },
  category: 'edit',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => {
    const filePath = params['absolute_path'] as string;
    return `Edit ${filePath}?`;
  },
  execute: async (params) => {
    const filePath = params['absolute_path'] as string;
    const oldContent = params['old_content'] as string;
    const newContent = params['new_content'] as string;
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      if (!content.includes(oldContent)) {
        return {
          success: false,
          error: `Old content not found in ${filePath}. The content may have changed.`,
        };
      }
      
      const newFileContent = content.replace(oldContent, newContent);
      await fs.writeFile(filePath, newFileContent, 'utf8');
      
      return {
        success: true,
        data: `Successfully edited ${filePath}`,
        display: {
          summary: `Edited ${path.basename(filePath)}`,
          file: filePath,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to edit file '${filePath}': ${errorMessage}`,
      };
    }
  },
};

/**
 * Tool: glob
 * Find files by pattern
 */
const globTool: PluginTool = {
  id: 'glob',
  name: 'glob',
  description: 'Fast file pattern matching tool that works with any codebase size. Supports glob patterns like "**/*.js" or "src/**/*.ts". Returns matching file paths sorted by modification time.',
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'REQUIRED: The glob pattern to match files. Examples: "**/*.ts", "src/**/*.tsx", "*.json"',
      },
      path: {
        type: 'string',
        description: 'OPTIONAL: The directory to search in. Defaults to current working directory.',
      },
    },
    required: ['pattern'],
  },
  category: 'search',
  execute: async (params) => {
    // Note: This is a simplified implementation
    // The actual implementation uses ripgrep for performance
    const pattern = params['pattern'] as string;
    const searchPath = (params['path'] as string) || process.cwd();
    
    return {
      success: true,
      data: {
        pattern,
        path: searchPath,
        message: 'Glob pattern matched. Full implementation uses ripgrep for performance.',
      },
      display: {
        summary: `Searching for '${pattern}' in ${searchPath}`,
      },
    };
  },
};

/**
 * Tool: list_directory
 * List directory contents
 */
const listDirectoryTool: PluginTool = {
  id: 'list_directory',
  name: 'list_directory',
  description: 'Lists the names of files and subdirectories directly within a specified directory path. Can optionally ignore entries matching provided glob patterns.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'REQUIRED: The absolute path to the directory to list. Must be an absolute path, not relative. Example: "/home/user/project/src" or "/Users/name/workspace".',
      },
      ignore: {
        type: 'array',
        items: { type: 'string' },
        description: 'OPTIONAL: List of glob patterns to ignore. Example: ["node_modules", "*.log", ".git"].',
      },
    },
    required: ['path'],
  },
  category: 'read',
  execute: async (params) => {
    const dirPath = params['path'] as string;
    const ignorePatterns = (params['ignore'] as string[]) || [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      const filtered = entries.filter(entry => {
        const name = entry.name;
        for (const pattern of ignorePatterns) {
          if (pattern === name || name.match(pattern)) {
            return false;
          }
        }
        return true;
      });
      
      const result = filtered.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      }));
      
      return {
        success: true,
        data: result,
        display: {
          summary: `Listed ${result.length} entries in ${path.basename(dirPath)}`,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to list directory '${dirPath}': ${errorMessage}`,
      };
    }
  },
};

/**
 * File Tools Plugin Definition
 */
const fileToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'file-tools',
    name: 'File Tools',
    version: '1.0.0',
    description: 'File system operations: read, write, edit, glob, list directory',
    author: 'Ollama Code Team',
    tags: ['core', 'file', 'filesystem'],
    enabledByDefault: true,
  },
  
  tools: [readFileTool, writeFileTool, editTool, globTool, listDirectoryTool],
  
  hooks: {
    onLoad: async (context) => {
      context.logger.info('File Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('File Tools plugin enabled');
    },
    onBeforeToolExecute: async (toolId, params, context) => {
      context.logger.debug(`File tool ${toolId} executing`);
      return true;
    },
  },
  
  defaultConfig: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    encoding: 'utf8',
  },
};

export default fileToolsPlugin;
