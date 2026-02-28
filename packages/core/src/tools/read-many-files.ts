/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';

import type { PartUnion } from '../types/content.js';
import type { Config } from '../config/config.js';

/**
 * Parameters for the ReadManyFiles tool
 */
export interface ReadManyFilesToolParams {
  /**
   * An array of file paths or directory paths to read.
   * Paths are relative to the project root.
   * Glob patterns can be used directly in these paths.
   */
  paths: string[];
}

/**
 * Information about a single file that was read.
 */
export interface FileReadInfo {
  /** Absolute path to the file */
  filePath: string;
  /** Content of the file (string for text, Part for images/PDFs) */
  content: PartUnion;
  /** Whether this is a directory listing rather than file content */
  isDirectory: boolean;
}

class ReadManyFilesToolInvocation extends BaseToolInvocation<
  ReadManyFilesToolParams,
  ToolResult
> {
  constructor(
    private config: Config,
    params: ReadManyFilesToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    const pathCount = this.params.paths.length;
    if (pathCount === 1) {
      return this.params.paths[0];
    }
    return `${pathCount} files: ${this.params.paths.slice(0, 3).join(', ')}${pathCount > 3 ? '...' : ''}`;
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    const { paths } = this.params;

    if (!paths || paths.length === 0) {
      return {
        llmContent: 'No paths provided to read.',
        returnDisplay: 'No paths provided.',
      };
    }

    const readFileTool = this.config
      .getToolRegistry()
      .getTool(ToolNames.READ_FILE);

    if (!readFileTool) {
      return {
        llmContent: 'ReadFile tool not available.',
        returnDisplay: 'ReadFile tool not available.',
        error: {
          message: 'ReadFile tool not found in registry',
        },
      };
    }

    const results: string[] = [];
    const filesRead: string[] = [];
    const errors: string[] = [];

    for (const filePath of paths) {
      if (signal.aborted) {
        break;
      }

      try {
        const invocation = readFileTool.build({
          absolute_path: filePath,
        });

        const result = await invocation.execute(signal);

        if (result.error) {
          errors.push(`${filePath}: ${result.error.message}`);
        } else {
          const content =
            typeof result.llmContent === 'string'
              ? result.llmContent
              : JSON.stringify(result.llmContent);
          results.push(`\n--- ${filePath} ---\n${content}`);
          filesRead.push(filePath);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${filePath}: ${errorMessage}`);
      }
    }

    let llmContent = '';

    if (results.length > 0) {
      llmContent = `Read ${filesRead.length} file(s):\n${results.join('\n')}`;
    }

    if (errors.length > 0) {
      llmContent += `\n\nErrors:\n${errors.join('\n')}`;
    }

    if (results.length === 0 && errors.length > 0) {
      return {
        llmContent: `Failed to read all files:\n${errors.join('\n')}`,
        returnDisplay: `Failed to read ${errors.length} file(s)`,
        error: {
          message: errors.join('\n'),
        },
      };
    }

    return {
      llmContent,
      returnDisplay: `Read ${filesRead.length} file(s)`,
    };
  }
}

/**
 * Implementation of the ReadManyFiles tool logic.
 * Reads content from multiple files at once.
 */
export class ReadManyFilesTool extends BaseDeclarativeTool<
  ReadManyFilesToolParams,
  ToolResult
> {
  static readonly Name: string = ToolNames.READ_MANY_FILES;

  constructor(private config: Config) {
    super(
      ReadManyFilesTool.Name,
      ToolDisplayNames.READ_MANY_FILES,
      `Reads and returns the content of multiple files at once. Use this tool when you need to read several files in a single operation. The tool concatenates the content of all files with clear separators indicating which content belongs to which file. Supports the same file types as the read_file tool: text files, images (PNG, JPG, GIF, WEBP, SVG, BMP), and PDF files.`,
      Kind.Read,
      {
        properties: {
          paths: {
            description:
              'REQUIRED: Array of absolute file paths to read. Each path must be absolute. Example: ["/home/user/file1.ts", "/home/user/file2.ts"]',
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['paths'],
        type: 'object',
      },
    );
  }

  protected override validateToolParamValues(
    params: ReadManyFilesToolParams,
  ): string | null {
    if (!params.paths || params.paths.length === 0) {
      return "The 'paths' parameter must be a non-empty array.";
    }

    for (const path of params.paths) {
      if (typeof path !== 'string' || path.trim() === '') {
        return 'Each path must be a non-empty string.';
      }
    }

    return null;
  }

  protected createInvocation(
    params: ReadManyFilesToolParams,
  ): ToolInvocation<ReadManyFilesToolParams, ToolResult> {
    return new ReadManyFilesToolInvocation(this.config, params);
  }
}
