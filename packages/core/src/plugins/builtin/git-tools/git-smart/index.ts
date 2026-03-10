/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Git Smart Tool - Enhanced Git operations with intelligent context
 *
 * Provides advanced git analysis features:
 * - git_diff_smart: Intelligent diff with context awareness
 * - git_blame_analysis: Code authorship analysis
 * - git_history_search: Search through commit history
 */

import { execSync, type ExecException } from 'node:child_process';
import type { Config } from '../../../../config/config.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
  type ToolInvocation,
  type ToolResult,
  type ToolResultDisplay,
} from '../../../../tools/tools.js';
import { ToolErrorType } from '../../../../tools/tool-error.js';
import { uiTelemetryService } from '../../../../services/uiTelemetryService.js';

// ============================================================================
// Type Definitions
// ============================================================================

export type GitSmartOperation =
  | 'diff_smart'
  | 'blame_analysis'
  | 'history_search'
  | 'file_history'
  | 'author_stats'
  | 'hotspots';

export interface GitSmartToolParams {
  operation: GitSmartOperation;
  args: Record<string, unknown>;
  directory?: string;
}

interface GitOperationResult {
  success: boolean;
  output: string;
  error?: string;
}

// ============================================================================
// Git Operation Handlers
// ============================================================================

function executeGitCommand(command: string, cwd: string): GitOperationResult {
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    const execError = error as ExecException & { stderr?: string };
    return {
      success: false,
      output: '',
      error: execError.stderr || execError.message || 'Unknown error',
    };
  }
}

/**
 * Smart diff with context
 */
function diffSmart(args: Record<string, unknown>, cwd: string): GitOperationResult {
  const file = args['file'] as string;
  const branch1 = args['branch1'] as string;
  const branch2 = args['branch2'] as string;
  const contextLines = (args['contextLines'] as number) || 5;
  const ignoreWhitespace = args['ignoreWhitespace'] as boolean;
  const statOnly = args['stat'] as boolean;

  let command = 'git diff';

  if (ignoreWhitespace) {
    command += ' -w';
  }

  if (statOnly) {
    command += ' --stat';
  } else {
    command += ` -U${contextLines}`;
  }

  command += ' --color=never';

  if (branch1 && branch2) {
    command += ` ${branch1}..${branch2}`;
    if (file) {
      command += ` -- "${file}"`;
    }
  } else if (branch1) {
    command += ` ${branch1}`;
    if (file) {
      command += ` -- "${file}"`;
    }
  } else if (file) {
    command += ` HEAD -- "${file}"`;
  } else {
    command += ' HEAD';
  }

  const result = executeGitCommand(command, cwd);
  if (!result.success) return result;

  // Parse and format
  const lines = result.output.split('\n');
  const formatted: string[] = [];
  let currentFile = '';
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (currentFile && (additions > 0 || deletions > 0)) {
        formatted.push(`  Changes: +${additions} -${deletions}`);
        formatted.push('');
      }
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      currentFile = match ? match[2] : '';
      additions = 0;
      deletions = 0;
      formatted.push(`\n📄 ${currentFile}`);
      formatted.push('─'.repeat(50));
    } else if (line.startsWith('@@')) {
      formatted.push(`\n${line}`);
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
      formatted.push(`  ${line}`);
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
      formatted.push(`  ${line}`);
    }
  }

  if (currentFile && (additions > 0 || deletions > 0)) {
    formatted.push(`  Changes: +${additions} -${deletions}`);
  }

  return {
    success: true,
    output: formatted.join('\n') || 'No changes detected',
  };
}

/**
 * Blame analysis for code authorship
 */
function blameAnalysis(args: Record<string, unknown>, cwd: string): GitOperationResult {
  const file = args['file'] as string;
  if (!file) {
    return { success: false, output: '', error: 'File path is required' };
  }

  const startLine = args['startLine'] as number;
  const endLine = args['endLine'] as number;
  const showEmail = args['showEmail'] as boolean;

  let command = `git blame --line-porcelain`;
  if (startLine && endLine) {
    command += ` -L ${startLine},${endLine}`;
  }
  command += ` -- "${file}"`;

  const blameResult = executeGitCommand(command, cwd);
  if (!blameResult.success) return blameResult;

  // Parse blame output
  const lines = blameResult.output.split('\n');
  const authorStats: Record<string, { lines: number; firstCommit: string; lastCommit: string }> = {};
  let currentAuthor = '';
  let currentTime = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^[a-f0-9]{40}/)) {
      // Commit hash line
    } else if (line.startsWith('author ')) {
      currentAuthor = line.substring(7);
    } else if (line.startsWith('author-time ')) {
      currentTime = line.substring(12);
    } else if (line.startsWith('author-mail ')) {
      const email = line.substring(12);
      if (showEmail) {
        currentAuthor += ` <${email}>`;
      }

      if (!authorStats[currentAuthor]) {
        authorStats[currentAuthor] = {
          lines: 0,
          firstCommit: currentTime,
          lastCommit: currentTime,
        };
      }
      authorStats[currentAuthor].lines++;
      if (currentTime < authorStats[currentAuthor].firstCommit) {
        authorStats[currentAuthor].firstCommit = currentTime;
      }
      if (currentTime > authorStats[currentAuthor].lastCommit) {
        authorStats[currentAuthor].lastCommit = currentTime;
      }
    }
  }

  // Format output
  const sorted = Object.entries(authorStats)
    .sort((a, b) => b[1].lines - a[1].lines);

  const totalLines = sorted.reduce((sum, [, stats]) => sum + stats.lines, 0);
  const output: string[] = [
    `# Blame Analysis: ${file}`,
    '',
    `Total lines: ${totalLines}`,
    `Authors: ${sorted.length}`,
    '',
    '## Author Contribution',
    '',
  ];

  for (const [author, stats] of sorted) {
    const percentage = ((stats.lines / totalLines) * 100).toFixed(1);
    const barLength = Math.round((stats.lines / totalLines) * 20);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

    const firstDate = new Date(parseInt(stats.firstCommit) * 1000).toLocaleDateString();
    const lastDate = new Date(parseInt(stats.lastCommit) * 1000).toLocaleDateString();

    output.push(`### ${author}`);
    output.push(`  Lines: ${stats.lines} (${percentage}%)`);
    output.push(`  ${bar}`);
    output.push(`  Active: ${firstDate} - ${lastDate}`);
    output.push('');
  }

  return { success: true, output: output.join('\n') };
}

/**
 * Search through commit history
 */
function historySearch(args: Record<string, unknown>, cwd: string): GitOperationResult {
  const query = args['query'] as string;
  const author = args['author'] as string;
  const since = args['since'] as string;
  const until = args['until'] as string;
  const file = args['file'] as string;
  const maxResults = (args['maxResults'] as number) || 20;
  const grepPattern = args['grep'] as string;

  let command = 'git log';
  command += ' --pretty=format:"%h|%an|%ad|%s" --date=short';

  if (query) {
    command += ` -S "${query}"`;
  }

  if (grepPattern) {
    command += ` --grep="${grepPattern}"`;
  }

  if (author) {
    command += ` --author="${author}"`;
  }

  if (since) {
    command += ` --since="${since}"`;
  }

  if (until) {
    command += ` --until="${until}"`;
  }

  if (file) {
    command += ` -- "${file}"`;
  }

  command += ` -n ${maxResults}`;

  const result = executeGitCommand(command, cwd);
  if (!result.success) return result;

  const commits = result.output.split('\n').filter(Boolean);
  const output: string[] = [
    '# Git History Search',
    '',
    `Found ${commits.length} commits`,
    '',
  ];

  for (const commit of commits) {
    const [hash, authorName, date, message] = commit.split('|');
    output.push(`## ${hash}`);
    output.push(`  Author: ${authorName}`);
    output.push(`  Date: ${date}`);
    output.push(`  Message: ${message}`);
    output.push('');
  }

  return { success: true, output: output.join('\n') };
}

/**
 * File history with detailed changes
 */
function fileHistory(args: Record<string, unknown>, cwd: string): GitOperationResult {
  const file = args['file'] as string;
  if (!file) {
    return { success: false, output: '', error: 'File path is required' };
  }

  const maxCommits = (args['maxCommits'] as number) || 20;
  const showPatches = args['showPatches'] as boolean;

  let command = `git log --follow --pretty=format:"%h|%an|%ad|%s" --date=short -n ${maxCommits}`;
  if (showPatches) {
    command += ' -p';
  }
  command += ` -- "${file}"`;

  const result = executeGitCommand(command, cwd);
  if (!result.success) return result;

  const lines = result.output.split('\n');
  const output: string[] = [
    `# File History: ${file}`,
    '',
  ];

  let commitCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^[a-f0-9]{7}\|/)) {
      commitCount++;
      const [hash, author, date, message] = line.split('|');
      output.push(`## ${hash}`);
      output.push(`  Author: ${author}`);
      output.push(`  Date: ${date}`);
      output.push(`  ${message}`);
      output.push('');
    } else if (showPatches && line.startsWith('+')) {
      output.push(`  ${line}`);
    }
  }

  output.unshift(`Commits: ${commitCount}`);

  return { success: true, output: output.join('\n') };
}

/**
 * Author statistics
 */
function authorStats(args: Record<string, unknown>, cwd: string): GitOperationResult {
  const since = args['since'] as string;
  const until = args['until'] as string;
  const byFileType = args['byFileType'] as boolean;

  let command = 'git shortlog -sne --all';

  if (since) {
    command += ` --since="${since}"`;
  }
  if (until) {
    command += ` --until="${until}"`;
  }

  const result = executeGitCommand(command, cwd);
  if (!result.success) return result;

  const lines = result.output.split('\n').filter(Boolean);
  const output: string[] = [
    '# Author Statistics',
    '',
  ];

  let rank = 1;
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+(.+)\s+<(.+)>/);
    if (match) {
      const [, commits, name, email] = match;
      output.push(`${rank}. ${name} <${email}>`);
      output.push(`   Commits: ${commits}`);
      output.push('');
      rank++;
    }
  }

  if (byFileType) {
    const extCommand = "git ls-files | sed 's/.*\\.//' | sort | uniq -c | sort -rn | head -20";
    const extResult = executeGitCommand(extCommand, cwd);

    if (extResult.success) {
      output.push('## File Types');
      output.push('');
      output.push(extResult.output);
    }
  }

  return { success: true, output: output.join('\n') };
}

/**
 * Code hotspots analysis
 */
function hotspots(args: Record<string, unknown>, cwd: string): GitOperationResult {
  const maxFiles = (args['maxFiles'] as number) || 20;
  const since = args['since'] as string;

  let command = `git log --name-only --pretty=format:`;

  if (since) {
    command += ` --since="${since}"`;
  }

  command += ' | grep -v "^$" | sort | uniq -c | sort -rn | head ' + maxFiles;

  const result = executeGitCommand(command, cwd);
  if (!result.success) return result;

  const lines = result.output.split('\n').filter(Boolean);
  const output: string[] = [
    '# Code Hotspots',
    '',
    'Files with most changes (potential refactoring candidates):',
    '',
  ];

  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+(.+)$/);
    if (match) {
      const [, count, file] = match;
      const barLength = Math.min(Math.round(parseInt(count) / 5), 20);
      const bar = '█'.repeat(barLength);
      output.push(`${file}`);
      output.push(`  Changes: ${count} ${bar}`);
      output.push('');
    }
  }

  return { success: true, output: output.join('\n') };
}

// Handler map
const gitSmartHandlers: Record<GitSmartOperation, (args: Record<string, unknown>, cwd: string) => GitOperationResult> = {
  diff_smart: diffSmart,
  blame_analysis: blameAnalysis,
  history_search: historySearch,
  file_history: fileHistory,
  author_stats: authorStats,
  hotspots: hotspots,
};

// ============================================================================
// Tool Invocation
// ============================================================================

class GitSmartToolInvocation extends BaseToolInvocation<GitSmartToolParams, ToolResult> {
  constructor(
    params: GitSmartToolParams,
    private readonly config: Config,
  ) {
    super(params);
  }

  getDescription(): string {
    const { operation, args } = this.params;

    let desc = `git ${operation.replace(/_/g, ' ')}`;

    if (args['file']) desc += ` (${args['file']})`;
    if (args['query']) desc += ` "${args['query']}"`;

    desc += ` [in ${this.config.getTargetDir()}]`;

    return desc;
  }

  async execute(
    _signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    const cwd = this.params.directory || this.config.getTargetDir();
    const { operation, args } = this.params;

    if (!gitSmartHandlers[operation]) {
      return {
        llmContent: `Unknown operation: ${operation}`,
        returnDisplay: `Unknown operation: ${operation}`,
        error: {
          message: `Unknown git smart operation: ${operation}`,
          type: ToolErrorType.INVALID_TOOL_PARAMS,
        },
      };
    }

    const result = gitSmartHandlers[operation](args, cwd);
    uiTelemetryService.recordGitOperation(operation, result.success);

    if (!result.success) {
      return {
        llmContent: `# Git ${operation} - Failed\n\nError: ${result.error}`,
        returnDisplay: `❌ Git ${operation} failed: ${result.error}`,
        error: {
          message: result.error || 'Git operation failed',
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }

    return {
      llmContent: result.output,
      returnDisplay: `✅ Git ${operation.replace(/_/g, ' ')} completed`,
    };
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

const gitSmartToolSchema = {
  type: 'object',
  properties: {
    operation: {
      type: 'string',
      enum: [
        'diff_smart',
        'blame_analysis',
        'history_search',
        'file_history',
        'author_stats',
        'hotspots',
      ],
      description: 'Type of git smart operation',
    },
    args: {
      type: 'object',
      description: 'Arguments for the operation',
      additionalProperties: true,
    },
    directory: {
      type: 'string',
      description: 'Working directory (optional)',
    },
  },
  required: ['operation'],
};

function getGitSmartToolDescription(): string {
  return `Enhanced Git analysis with intelligent context.

## Operations

### diff_smart - Smart Diff with Context
Analyze changes with context awareness.
- \`file\`: File path to diff
- \`branch1\`, \`branch2\`: Compare branches
- \`contextLines\`: Lines of context (default: 5)
- \`ignoreWhitespace\`: Ignore whitespace changes
- \`stat\`: Show stats only

### blame_analysis - Code Authorship
Analyze who wrote what code.
- \`file\`: File to analyze (required)
- \`startLine\`, \`endLine\`: Line range
- \`showEmail\`: Include email addresses

### history_search - Search Commit History
Search through git history.
- \`query\`: Code search (S search)
- \`grep\`: Commit message search
- \`author\`: Filter by author
- \`since\`, \`until\`: Date range
- \`file\`: Specific file
- \`maxResults\`: Max results (default: 20)

### file_history - Detailed File History
Complete history of a file.
- \`file\`: File path (required)
- \`maxCommits\`: Max commits (default: 20)
- \`showPatches\`: Show diff patches

### author_stats - Contributor Statistics
See who contributes most.
- \`since\`, \`until\`: Date range
- \`byFileType\`: Include file type breakdown

### hotspots - Code Hotspots
Find files with most changes.
- \`maxFiles\`: Max files (default: 20)
- \`since\`: Date range start`;
}

export class GitSmartTool extends BaseDeclarativeTool<GitSmartToolParams, ToolResult> {
  static Name = 'git_smart';

  constructor(private readonly config: Config) {
    super(
      GitSmartTool.Name,
      'GitSmart',
      getGitSmartToolDescription(),
      Kind.Execute,
      gitSmartToolSchema,
      true, // output is markdown
      false, // output cannot be updated
    );
  }

  /**
   * Validates the parameter values beyond JSON schema.
   */
  protected override validateToolParamValues(params: GitSmartToolParams): string | null {
    if (params.operation === 'blame_analysis' && !params.args?.['file']) {
      return 'file is required for blame_analysis';
    }

    if (params.operation === 'file_history' && !params.args?.['file']) {
      return 'file is required for file_history';
    }

    return null;
  }

  /**
   * Creates the tool invocation instance.
   */
  protected createInvocation(
    params: GitSmartToolParams,
  ): ToolInvocation<GitSmartToolParams, ToolResult> {
    return new GitSmartToolInvocation(params, this.config);
  }
}
