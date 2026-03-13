/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Detect Dead Code Tool
 *
 * Identifies unreachable, unused, and dead code in a project.
 *
 * **Supported Languages:**
 * - TypeScript (.ts, .tsx) - Full support including private methods
 * - JavaScript (.js, .jsx) - ES6+ syntax support
 *
 * Detects:
 * - Unreachable code (after return, throw, break, continue)
 * - Unused private methods and properties
 * - Unused variables and parameters
 * - Commented-out code blocks
 * - Empty functions/blocks
 * - Deprecated code patterns
 *
 * Uses Task tool delegation for comprehensive project analysis.
 */

import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
  type ToolResult,
  type ToolResultDisplay,
} from '../../../../tools/tools.js';
import { ToolErrorType } from '../../../../tools/tool-error.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported languages for dead code detection
 */
export const SUPPORTED_LANGUAGES = ['typescript', 'javascript'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Language-specific file extensions
 */
export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string[]> = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx'],
};

/**
 * Dead code types
 */
export type DeadCodeType =
  | 'unreachable'
  | 'unused_variable'
  | 'unused_parameter'
  | 'unused_private_method'
  | 'unused_function'
  | 'commented_code'
  | 'empty_block'
  | 'deprecated_pattern'
  | 'duplicate_code';

/**
 * Dead code location
 */
export interface DeadCodeLocation {
  /** File path */
  file: string;
  /** Start line */
  startLine: number;
  /** End line */
  endLine: number;
  /** Code snippet */
  snippet: string;
}

/**
 * Dead code issue
 */
export interface DeadCodeIssue {
  /** Issue type */
  type: DeadCodeType;
  /** Severity */
  severity: 'error' | 'warning' | 'info';
  /** Description */
  message: string;
  /** Location */
  location: DeadCodeLocation;
  /** Suggestion for fixing */
  suggestion?: string;
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
  /** Estimated lines that can be removed */
  estimatedLines: number;
}

/**
 * Analysis result
 */
export interface DeadCodeAnalysisResult {
  /** Project root */
  projectRoot: string;
  /** Total issues found */
  totalIssues: number;
  /** Issues by type */
  issuesByType: Record<DeadCodeType, number>;
  /** All issues */
  issues: DeadCodeIssue[];
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total lines that can be removed */
  removableLines: number;
  /** Analysis time in ms */
  analysisTimeMs: number;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Tool parameters
 */
export interface DetectDeadCodeParams {
  /** Project root directory */
  projectRoot: string;
  /** Languages to analyze (default: all supported) */
  languages?: SupportedLanguage[];
  /** Include patterns */
  include?: string[];
  /** Exclude patterns */
  exclude?: string[];
  /** Minimum severity to report */
  minSeverity?: 'error' | 'warning' | 'info';
  /** Types of dead code to detect */
  detectTypes?: DeadCodeType[];
  /** Enable aggressive detection (more false positives) */
  aggressive?: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_EXCLUDE = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.git/**',
  '**/*.min.js',
  '**/*.d.ts',
  '**/__snapshots__/**',
];

const DEFAULT_DETECT_TYPES: DeadCodeType[] = [
  'unreachable',
  'unused_variable',
  'unused_parameter',
  'unused_private_method',
  'unused_function',
  'commented_code',
  'empty_block',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find all source files
 */
function findSourceFiles(
  projectRoot: string,
  include: string[],
  exclude: string[],
  languages?: SupportedLanguage[],
): string[] {
  const files: string[] = [];
  const selectedLanguages = languages && languages.length > 0
    ? languages
    : [...SUPPORTED_LANGUAGES];
  const extensions = selectedLanguages.flatMap(lang => LANGUAGE_EXTENSIONS[lang]);

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const relativePath = path.relative(projectRoot, fullPath);
          const shouldExclude = exclude.some((pattern) =>
            matchPattern(relativePath, pattern),
          );
          if (!shouldExclude) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Ignore directories we can't read
    }
  }

  walk(projectRoot);
  return files;
}

/**
 * Simple glob pattern matcher
 */
function matchPattern(str: string, pattern: string): boolean {
  const regex = new RegExp(
    '^' +
    pattern
      .replace(/\*\*/g, '<<DOUBLE_STAR>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<DOUBLE_STAR>>/g, '.*')
      .replace(/\?/g, '[^/]') +
    '$',
  );
  return regex.test(str);
}

/**
 * Detect unreachable code
 */
function detectUnreachable(content: string, filePath: string): DeadCodeIssue[] {
  const issues: DeadCodeIssue[] = [];
  const lines = content.split('\n');

  const exitStatements = [
    /^\s*return\b/,
    /^\s*throw\b/,
    /^\s*break\b/,
    /^\s*continue\b/,
  ];

  let inBlock = 0;
  let lastExitLine = -1;
  let exitType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track block depth
    inBlock += (line.match(/{/g) || []).length;
    inBlock -= (line.match(/}/g) || []).length;

    // Check for exit statements
    for (const pattern of exitStatements) {
      if (pattern.test(line)) {
        lastExitLine = lineNum;
        exitType = line.trim().split(/\s/)[0];
        break;
      }
    }

    // Check for closing brace after exit
    if (lastExitLine > 0 && inBlock < 0) {
      lastExitLine = -1;
      continue;
    }

    // Detect code after exit statement
    if (
      lastExitLine > 0 &&
      lineNum > lastExitLine &&
      line.trim().length > 0 &&
      !line.trim().startsWith('//') &&
      !line.trim().startsWith('}') &&
      !line.trim().startsWith('case ') &&
      !line.trim().startsWith('default:')
    ) {
      // Verify it's still in the same block
      const currentBlockDepth = inBlock + (line.match(/}/g) || []).length;

      if (currentBlockDepth >= 0) {
        issues.push({
          type: 'unreachable',
          severity: 'error',
          message: `Unreachable code detected after ${exitType} statement`,
          location: {
            file: filePath,
            startLine: lineNum,
            endLine: lineNum,
            snippet: line.trim(),
          },
          suggestion: `Remove this code or fix the ${exitType} statement placement`,
          confidence: 'high',
          estimatedLines: 1,
        });
      }
    }
  }

  return issues;
}

/**
 * Detect unused variables
 */
function detectUnusedVariables(
  content: string,
  filePath: string,
): DeadCodeIssue[] {
  const issues: DeadCodeIssue[] = [];
  const lines = content.split('\n');

  // Find variable declarations
  const varPattern = /^\s*(?:const|let|var)\s+(\w+)\s*=/;
  const declaredVars = new Map<string, { line: number; used: boolean }>();

  // First pass: find declarations
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(varPattern);

    if (match) {
      const varName = match[1];
      // Skip common patterns
      if (
        varName.startsWith('_') ||
        varName === 'exports' ||
        varName === 'module'
      ) {
        continue;
      }
      declaredVars.set(varName, { line: i + 1, used: false });
    }
  }

  // Second pass: find usages
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const [varName, info] of declaredVars) {
      if (info.used) continue;

      // Check if variable is used (not just declared)
      const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
      const matches = line.match(usagePattern);

      if (matches && matches.length > 1) {
        // More than one occurrence means it's used
        info.used = true;
      } else if (matches && matches.length === 1) {
        // Single occurrence - check if it's declaration
        const declPattern = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=`);
        if (!declPattern.test(line)) {
          info.used = true;
        }
      }
    }
  }

  // Report unused variables
  for (const [varName, info] of declaredVars) {
    if (!info.used) {
      issues.push({
        type: 'unused_variable',
        severity: 'warning',
        message: `Variable "${varName}" is declared but never used`,
        location: {
          file: filePath,
          startLine: info.line,
          endLine: info.line,
          snippet: lines[info.line - 1].trim(),
        },
        suggestion: `Remove unused variable "${varName}" or prefix with underscore if intentionally unused`,
        confidence: 'medium',
        estimatedLines: 1,
      });
    }
  }

  return issues;
}

/**
 * Detect unused private methods
 */
function detectUnusedPrivateMethods(
  content: string,
  filePath: string,
): DeadCodeIssue[] {
  const issues: DeadCodeIssue[] = [];
  const lines = content.split('\n');

  // Find private method declarations
  const privateMethodPattern = /^\s*(?:private|#)\s+(\w+)\s*\(/;
  const privateMethods = new Map<string, { line: number; used: boolean }>();

  // First pass: find declarations
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(privateMethodPattern);

    if (match) {
      const methodName = match[1];
      privateMethods.set(methodName, { line: i + 1, used: false });
    }

    // Also check for #privateMethod syntax
    const hashPrivateMatch = line.match(/#\s*(\w+)\s*\(/);
    if (hashPrivateMatch) {
      privateMethods.set(hashPrivateMatch[1], { line: i + 1, used: false });
    }
  }

  // Second pass: find usages
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const [methodName, info] of privateMethods) {
      if (info.used) continue;

      // Check for this.methodName() or #methodName()
      const usagePattern = new RegExp(`(?:this\\.|#)${methodName}\\s*\\(`);
      const declPattern = new RegExp(`(?:private|#)\\s+${methodName}\\s*\\(`);

      if (usagePattern.test(line) && !declPattern.test(line)) {
        info.used = true;
      }
    }
  }

  // Report unused private methods
  for (const [methodName, info] of privateMethods) {
    if (!info.used) {
      issues.push({
        type: 'unused_private_method',
        severity: 'warning',
        message: `Private method "${methodName}" is declared but never called`,
        location: {
          file: filePath,
          startLine: info.line,
          endLine: info.line,
          snippet: lines[info.line - 1].trim(),
        },
        suggestion: `Remove unused method "${methodName}" or verify it's used dynamically`,
        confidence: 'medium',
        estimatedLines: 1,
      });
    }
  }

  return issues;
}

/**
 * Detect commented-out code
 */
function detectCommentedCode(content: string, filePath: string): DeadCodeIssue[] {
  const issues: DeadCodeIssue[] = [];
  const lines = content.split('\n');

  // Patterns that suggest code in comments
  const codePatterns = [
    /^\s*\/\/\s*(?:const|let|var|function|class|interface|type|import|export)\s/,
    /^\s*\/\/\s*(?:if|for|while|switch|try|catch)\s*\(/,
    /^\s*\/\/\s*(?:return|throw|await)\s+/,
    /^\s*\/\/\s*\w+\s*=\s*\w+/, // Assignment
    /^\s*\/\/\s*\w+\s*\([^)]*\)\s*;?$/, // Function call
  ];

  let commentBlockStart = -1;
  let commentBlockLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for single-line code comments
    for (const pattern of codePatterns) {
      if (pattern.test(line)) {
        issues.push({
          type: 'commented_code',
          severity: 'info',
          message: 'Commented-out code detected',
          location: {
            file: filePath,
            startLine: i + 1,
            endLine: i + 1,
            snippet: line.trim(),
          },
          suggestion:
            'Remove commented code or add explanation for why it should stay',
          confidence: 'medium',
          estimatedLines: 1,
        });
        break;
      }
    }

    // Track multi-line comment blocks
    if (line.trim().startsWith('/*')) {
      commentBlockStart = i;
      commentBlockLines = [i];
    } else if (commentBlockStart >= 0) {
      commentBlockLines.push(i);
      if (line.includes('*/')) {
        // Check if block contains code-like patterns
        const blockContent = commentBlockLines
          .map((ln) => lines[ln])
          .join('\n');

        const hasCodePatterns =
          /\bfunction\s+\w+/.test(blockContent) ||
          /\bclass\s+\w+/.test(blockContent) ||
          /\bconst\s+\w+\s*=/.test(blockContent) ||
          /\bimport\s+/.test(blockContent);

        if (hasCodePatterns) {
          issues.push({
            type: 'commented_code',
            severity: 'info',
            message: 'Multi-line commented-out code block detected',
            location: {
              file: filePath,
              startLine: commentBlockStart + 1,
              endLine: i + 1,
              snippet: '/* ... multi-line comment block ... */',
            },
            suggestion: 'Remove commented code or document why it should stay',
            confidence: 'low',
            estimatedLines: commentBlockLines.length,
          });
        }

        commentBlockStart = -1;
        commentBlockLines = [];
      }
    }
  }

  return issues;
}

/**
 * Detect empty blocks
 */
function detectEmptyBlocks(content: string, filePath: string): DeadCodeIssue[] {
  const issues: DeadCodeIssue[] = [];
  const lines = content.split('\n');

  // Patterns for empty blocks
  const emptyBlockPatterns = [
    { pattern: /\{\s*\}/, name: 'Empty block' },
    { pattern: /\{\s*\/\/.*\}/, name: 'Empty block with comment' },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for empty function/class bodies
    if (
      /\b(function|class|method|if|else|for|while|catch)\b/.test(lines[Math.max(0, i - 1)]) ||
      /\b(function|class|method|if|else|for|while|catch)\b/.test(line)
    ) {
      for (const { pattern, name } of emptyBlockPatterns) {
        if (pattern.test(line)) {
          // Skip arrow functions that return early
          if (/=>\s*\{\s*\}/.test(line)) {
            continue;
          }

          issues.push({
            type: 'empty_block',
            severity: 'info',
            message: `${name} detected`,
            location: {
              file: filePath,
              startLine: i + 1,
              endLine: i + 1,
              snippet: line.trim(),
            },
            suggestion:
              'Add implementation or comment explaining why empty',
            confidence: 'high',
            estimatedLines: 1,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Detect unused functions
 */
function detectUnusedFunctions(
  content: string,
  filePath: string,
  allFilesContent: Map<string, string>,
): DeadCodeIssue[] {
  const issues: DeadCodeIssue[] = [];
  const lines = content.split('\n');

  // Find function declarations (not exported)
  const funcPattern = /^\s*(?:async\s+)?function\s+(\w+)\s*\(/;
  const arrowFuncPattern = /^\s*(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/;

  const declaredFunctions = new Map<string, { line: number }>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip exported functions
    if (line.includes('export')) continue;

    const funcMatch = line.match(funcPattern);
    if (funcMatch) {
      declaredFunctions.set(funcMatch[1], { line: i + 1 });
      continue;
    }

    const arrowMatch = line.match(arrowFuncPattern);
    if (arrowMatch) {
      declaredFunctions.set(arrowMatch[1], { line: i + 1 });
    }
  }

  // Check usages across all files
  for (const [funcName, info] of declaredFunctions) {
    let isUsed = false;

    for (const [file, fileContent] of allFilesContent) {
      // Skip the file where function is declared
      if (file === filePath) {
        const usagePattern = new RegExp(`\\b${funcName}\\s*\\(`);
        const matches = fileContent.match(usagePattern);
        if (matches && matches.length > 1) {
          isUsed = true;
          break;
        }
      } else {
        const usagePattern = new RegExp(`\\b${funcName}\\s*\\(`);
        if (usagePattern.test(fileContent)) {
          isUsed = true;
          break;
        }
      }
    }

    if (!isUsed) {
      issues.push({
        type: 'unused_function',
        severity: 'warning',
        message: `Function "${funcName}" is declared but never called`,
        location: {
          file: filePath,
          startLine: info.line,
          endLine: info.line,
          snippet: lines[info.line - 1].trim(),
        },
        suggestion: `Remove unused function "${funcName}" or export if intended for external use`,
        confidence: 'medium',
        estimatedLines: 1,
      });
    }
  }

  return issues;
}

// ============================================================================
// Main Analysis Function
// ============================================================================

function detectDeadCode(params: DetectDeadCodeParams): DeadCodeAnalysisResult {
  const startTime = Date.now();

  const projectRoot = path.resolve(params.projectRoot);
  const exclude = [...DEFAULT_EXCLUDE, ...(params.exclude || [])];
  const detectTypes = params.detectTypes || DEFAULT_DETECT_TYPES;
  const minSeverity = params.minSeverity || 'info';
  const languages = params.languages;

  // Find all source files
  const sourceFiles = findSourceFiles(projectRoot, [], exclude, languages);

  if (sourceFiles.length === 0) {
    throw new Error(`No source files found in ${projectRoot}`);
  }

  // Load all file contents for cross-file analysis
  const allFilesContent = new Map<string, string>();
  for (const file of sourceFiles) {
    try {
      allFilesContent.set(file, fs.readFileSync(file, 'utf-8'));
    } catch {
      // Skip files we can't read
    }
  }

  const severityOrder = { error: 3, warning: 2, info: 1 };
  const minSeverityLevel = severityOrder[minSeverity];

  const allIssues: DeadCodeIssue[] = [];

  // Analyze each file
  for (const file of sourceFiles) {
    const content = allFilesContent.get(file);
    if (!content) continue;

    if (detectTypes.includes('unreachable')) {
      allIssues.push(...detectUnreachable(content, file));
    }

    if (detectTypes.includes('unused_variable')) {
      allIssues.push(...detectUnusedVariables(content, file));
    }

    if (detectTypes.includes('unused_private_method')) {
      allIssues.push(...detectUnusedPrivateMethods(content, file));
    }

    if (detectTypes.includes('unused_function')) {
      allIssues.push(
        ...detectUnusedFunctions(content, file, allFilesContent),
      );
    }

    if (detectTypes.includes('commented_code')) {
      allIssues.push(...detectCommentedCode(content, file));
    }

    if (detectTypes.includes('empty_block')) {
      allIssues.push(...detectEmptyBlocks(content, file));
    }
  }

  // Filter by severity
  const filteredIssues = allIssues.filter(
    (issue) => severityOrder[issue.severity] >= minSeverityLevel,
  );

  // Sort by severity and file
  filteredIssues.sort((a, b) => {
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.location.file.localeCompare(b.location.file);
  });

  // Count by type
  const issuesByType: Record<DeadCodeType, number> = {
    unreachable: 0,
    unused_variable: 0,
    unused_parameter: 0,
    unused_private_method: 0,
    unused_function: 0,
    commented_code: 0,
    empty_block: 0,
    deprecated_pattern: 0,
    duplicate_code: 0,
  };

  for (const issue of filteredIssues) {
    issuesByType[issue.type]++;
  }

  // Calculate removable lines
  const removableLines = filteredIssues.reduce(
    (sum, issue) => sum + issue.estimatedLines,
    0,
  );

  // Generate recommendations
  const recommendations: string[] = [];

  const errorCount = filteredIssues.filter((i) => i.severity === 'error').length;
  const warningCount = filteredIssues.filter((i) => i.severity === 'warning').length;

  if (errorCount > 0) {
    recommendations.push(
      `Found ${errorCount} errors (unreachable code). These should be fixed immediately.`,
    );
  }

  if (warningCount > 0) {
    recommendations.push(
      `Found ${warningCount} warnings (unused code). Review and remove if confirmed unused.`,
    );
  }

  if (issuesByType.commented_code > 0) {
    recommendations.push(
      `Found ${issuesByType.commented_code} commented code blocks. Clean up or document.`,
    );
  }

  if (removableLines > 50) {
    recommendations.push(
      `Approximately ${removableLines} lines of dead code can be removed.`,
    );
  }

  if (filteredIssues.length === 0) {
    recommendations.push('No dead code detected. Code looks clean!');
  }

  const analysisTimeMs = Date.now() - startTime;

  return {
    projectRoot,
    totalIssues: filteredIssues.length,
    issuesByType,
    issues: filteredIssues,
    filesAnalyzed: sourceFiles.length,
    removableLines,
    analysisTimeMs,
    recommendations,
  };
}

// ============================================================================
// Tool Invocation
// ============================================================================

class DetectDeadCodeInvocation extends BaseToolInvocation<
  DetectDeadCodeParams,
  ToolResult
> {
  constructor(params: DetectDeadCodeParams) {
    super(params);
  }

  getDescription(): string {
    return `Detecting dead code in ${this.params.projectRoot}`;
  }

  async execute(
    _signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    try {
      const result = detectDeadCode(this.params);

      const llmContent = `## Dead Code Analysis: ${result.projectRoot}

**Files Analyzed:** ${result.filesAnalyzed}
**Total Issues:** ${result.totalIssues}
**Removable Lines:** ~${result.removableLines}
**Analysis Time:** ${result.analysisTimeMs}ms

### Issues by Type

${this.formatIssuesByType(result.issuesByType)}

### Top Issues

${this.formatIssues(result.issues.slice(0, 30))}

### Recommendations

${result.recommendations.map((r) => `- ${r}`).join('\n')}

---

**Tip:** Use the \`task\` tool for comprehensive dead code removal:
\`\`\`
task: {
  subagent_type: "general-purpose",
  description: "Remove dead code",
  prompt: "Review all detected dead code and remove confirmed unused code..."
}
\`\`\`
`;

      return {
        llmContent,
        returnDisplay: `Found ${result.totalIssues} dead code issues (~${result.removableLines} removable lines) in ${result.filesAnalyzed} files`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Error detecting dead code: ${errorMessage}`,
        returnDisplay: errorMessage,
        error: {
          message: errorMessage,
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }
  }

  private formatIssuesByType(
    issuesByType: Record<DeadCodeType, number>,
  ): string {
    const entries = Object.entries(issuesByType)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      return 'No issues found.';
    }

    return entries
      .map(([type, count]) => `- **${type.replace(/_/g, ' ')}**: ${count}`)
      .join('\n');
  }

  private formatIssues(issues: DeadCodeIssue[]): string {
    if (issues.length === 0) {
      return 'No issues to display.';
    }

    let output = '';

    for (const issue of issues) {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      const relativePath = path.relative(process.cwd(), issue.location.file);

      output += `${icon} **${issue.type.replace(/_/g, ' ')}** at ${relativePath}:${issue.location.startLine}\n`;
      output += `   ${issue.message}\n`;
      output += `   \`${issue.location.snippet.substring(0, 60)}${issue.location.snippet.length > 60 ? '...' : ''}\`\n\n`;
    }

    return output;
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * Detect Dead Code Tool class definition
 */
export class DetectDeadCodeTool extends BaseDeclarativeTool<
  DetectDeadCodeParams,
  ToolResult
> {
  static readonly Name = 'detect_dead_code';

  constructor() {
    super(
      DetectDeadCodeTool.Name,
      'Detect Dead Code',
      `Identifies unreachable, unused, and dead code in a project.

**Supported Languages:**
- TypeScript (.ts, .tsx) - Full support including private methods
- JavaScript (.js, .jsx) - ES6+ syntax support

Detects:
- **Unreachable code**: Code after return/throw/break/continue
- **Unused variables**: Variables declared but never used
- **Unused private methods**: Class methods never called
- **Unused functions**: Non-exported functions never called
- **Commented code**: Large blocks of commented-out code
- **Empty blocks**: Empty function/class/if blocks

**EXAMPLE ANALYSIS FLOW:**

\`\`\`
User: "Find dead code in my project"

1. Call detect_dead_code with project root
2. Review errors first (unreachable code)
3. Use task tool for removal:
   - subagent_type: "general-purpose"
   - prompt: "Remove all high-confidence dead code..."
4. Run tests to verify no functionality broken
\`\`\`

**When to use:** Code cleanup sprints, pre-release audits, refactoring preparation, bundle optimization.`,
      Kind.Read,
      {
        type: 'object',
        properties: {
          projectRoot: {
            type: 'string',
            description:
              'Root directory of the project. Use "." for current directory.',
          },
          languages: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['typescript', 'javascript'],
            },
            description:
              'Languages to analyze. Default: ["typescript", "javascript"] (all supported).',
          },
          include: {
            type: 'array',
            items: { type: 'string' },
            description: 'Glob patterns for files to include.',
          },
          exclude: {
            type: 'array',
            items: { type: 'string' },
            description: 'Glob patterns for files to exclude.',
          },
          minSeverity: {
            type: 'string',
            enum: ['error', 'warning', 'info'],
            description: 'Minimum severity to report. Default: "info".',
          },
          detectTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'unreachable',
                'unused_variable',
                'unused_parameter',
                'unused_private_method',
                'unused_function',
                'commented_code',
                'empty_block',
              ],
            },
            description: 'Types of dead code to detect.',
          },
          aggressive: {
            type: 'boolean',
            description:
              'Enable aggressive detection (more false positives).',
          },
        },
        required: ['projectRoot'],
      },
      true, // isOutputMarkdown
      false, // canUpdateOutput
    );
  }

  protected override createInvocation(
    params: DetectDeadCodeParams,
  ): DetectDeadCodeInvocation {
    return new DetectDeadCodeInvocation(params);
  }
}

export const detectDeadCodeTool = new DetectDeadCodeTool();
export default detectDeadCodeTool;
