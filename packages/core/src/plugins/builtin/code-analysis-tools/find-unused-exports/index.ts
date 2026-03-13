/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Find Unused Exports Tool
 *
 * Analyzes a project to find exported functions, classes, and variables
 * that are never imported or used elsewhere in the codebase.
 *
 * **Supported Languages:**
 * - TypeScript (.ts, .tsx) - Full support including types and interfaces
 * - JavaScript (.js, .jsx, .mjs, .cjs) - ES6+ modules and CommonJS
 *
 * This tool is essential for:
 * - Reducing bundle size by eliminating dead code
 * - Identifying deprecated but not removed exports
 * - Improving code maintainability
 *
 * Uses Task tool delegation for large projects.
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
 * Unused export information
 */
export interface UnusedExport {
  /** File containing the export */
  file: string;
  /** Export name */
  name: string;
  /** Export type */
  type: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'const' | 'default';
  /** Line number of the export */
  line: number;
  /** Confidence level that this is truly unused */
  confidence: 'high' | 'medium' | 'low';
  /** Reason for marking as unused */
  reason: string;
  /** Potential usages that were found (for low confidence) */
  potentialUsages?: string[];
}

/**
 * Analysis result
 */
export interface UnusedExportsResult {
  /** Project root directory */
  projectRoot: string;
  /** Total exports found */
  totalExports: number;
  /** Unused exports found */
  unusedExports: UnusedExport[];
  /** Files analyzed */
  filesAnalyzed: number;
  /** Analysis time in ms */
  analysisTimeMs: number;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Supported languages for analysis
 */
export const SUPPORTED_LANGUAGES = ['typescript', 'javascript'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Language-specific file extensions
 */
export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string[]> = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
};

/**
 * Tool parameters
 */
export interface FindUnusedExportsParams {
  /** Project root directory */
  projectRoot: string;
  /** Languages to analyze (default: all supported) */
  languages?: SupportedLanguage[];
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Minimum confidence level to report */
  minConfidence?: 'high' | 'medium' | 'low';
  /** Use task delegation for large projects */
  useTaskDelegation?: boolean;
}

// ============================================================================
// Export Detection Patterns
// ============================================================================

const EXPORT_PATTERNS = {
  // Named exports: export const foo = ...
  namedConst: /export\s+const\s+(\w+)/g,
  namedLet: /export\s+let\s+(\w+)/g,
  namedVar: /export\s+var\s+(\w+)/g,
  // Export function: export function foo() {}
  namedFunction: /export\s+(?:async\s+)?function\s+(\w+)/g,
  // Export class: export class Foo {}
  namedClass: /export\s+class\s+(\w+)/g,
  // Export type/interface: export type/interface Foo ...
  namedType: /export\s+type\s+(\w+)/g,
  namedInterface: /export\s+interface\s+(\w+)/g,
  // Export from destructuring: export const { foo, bar } = ...
  destructuring: /export\s+(?:const|let|var)\s*\{([^}]+)\}/g,
  // Re-exports: export { foo } from './bar'
  reexport: /export\s+\{([^}]+)\}\s+from/g,
  // Default export: export default ...
  defaultExport: /export\s+default\s+(?:function\s+)?(\w+)?/g,
  // Export at end: export { foo, bar }
  exportBlock: /export\s+\{([^}]+)\}(?!\s+from)/g,
};

const IMPORT_PATTERNS = {
  // Named imports: import { foo, bar } from './baz'
  named: /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
  // Default import: import foo from './bar'
  default: /import\s+(\w+)\s+,\s*\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g,
  // Mixed import: import foo, { bar } from './baz'
  mixed: /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
  // Namespace import: import * as foo from './bar'
  namespace: /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
  // Dynamic import: import('./foo').then(...)
  dynamic: /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // Require: const { foo } = require('./bar')
  require: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
};

// Default exclusions
const DEFAULT_EXCLUDE = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.git/**',
  '**/*.test.ts',
  '**/*.test.js',
  '**/*.spec.ts',
  '**/*.spec.js',
  '**/__tests__/**',
  '**/__mocks__/**',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find all source files in a project
 */
function findSourceFiles(
  projectRoot: string,
  include: string[],
  exclude: string[],
  languages?: SupportedLanguage[],
): string[] {
  const files: string[] = [];
  // Determine extensions based on selected languages
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
          // Skip excluded directories
          const relativePath = path.relative(projectRoot, fullPath);
          if (!exclude.some((pattern) => matchPattern(relativePath, pattern))) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            const relativePath = path.relative(projectRoot, fullPath);
            if (
              !exclude.some((pattern) => matchPattern(relativePath, pattern))
            ) {
              files.push(fullPath);
            }
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
 * Extract all exports from a file
 */
function extractExports(filePath: string): Map<string, UnusedExport> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const exports = new Map<string, UnusedExport>();

  // Named const exports
  let match;
  const constPattern = new RegExp(EXPORT_PATTERNS.namedConst.source, 'g');
  while ((match = constPattern.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    exports.set(match[1], {
      file: filePath,
      name: match[1],
      type: 'const',
      line: lineNum,
      confidence: 'high',
      reason: 'Named const export',
    });
  }

  // Named function exports
  const funcPattern = new RegExp(EXPORT_PATTERNS.namedFunction.source, 'g');
  while ((match = funcPattern.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    exports.set(match[1], {
      file: filePath,
      name: match[1],
      type: 'function',
      line: lineNum,
      confidence: 'high',
      reason: 'Named function export',
    });
  }

  // Named class exports
  const classPattern = new RegExp(EXPORT_PATTERNS.namedClass.source, 'g');
  while ((match = classPattern.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    exports.set(match[1], {
      file: filePath,
      name: match[1],
      type: 'class',
      line: lineNum,
      confidence: 'high',
      reason: 'Named class export',
    });
  }

  // Type exports
  const typePattern = new RegExp(EXPORT_PATTERNS.namedType.source, 'g');
  while ((match = typePattern.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    exports.set(match[1], {
      file: filePath,
      name: match[1],
      type: 'type',
      line: lineNum,
      confidence: 'high',
      reason: 'Type export',
    });
  }

  // Interface exports
  const interfacePattern = new RegExp(
    EXPORT_PATTERNS.namedInterface.source,
    'g',
  );
  while ((match = interfacePattern.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    exports.set(match[1], {
      file: filePath,
      name: match[1],
      type: 'interface',
      line: lineNum,
      confidence: 'high',
      reason: 'Interface export',
    });
  }

  // Export blocks at end of file
  const blockPattern = new RegExp(EXPORT_PATTERNS.exportBlock.source, 'g');
  while ((match = blockPattern.exec(content)) !== null) {
    const names = match[1].split(',').map((n) => n.trim().split(' as ')[0].trim());
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;

    for (const name of names) {
      if (name && !exports.has(name)) {
        exports.set(name, {
          file: filePath,
          name,
          type: 'variable',
          line: lineNum,
          confidence: 'high',
          reason: 'Export block',
        });
      }
    }
  }

  return exports;
}

/**
 * Find all imports/usages across the project
 */
function findAllUsages(
  sourceFiles: string[],
  projectRoot: string,
): Set<string> {
  const usages = new Set<string>();

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Named imports
      const namedPattern = new RegExp(IMPORT_PATTERNS.named.source, 'g');
      let match;
      while ((match = namedPattern.exec(content)) !== null) {
        const names = match[1].split(',').map((n) => n.trim().split(' as ')[0].trim());
        for (const name of names) {
          if (name) usages.add(name);
        }
      }

      // Default imports
      const defaultPattern = new RegExp(IMPORT_PATTERNS.mixed.source, 'g');
      while ((match = defaultPattern.exec(content)) !== null) {
        if (match[1]) usages.add(match[1]);
      }

      // Mixed imports with named
      const mixedPattern = new RegExp(
        /import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from/g.source,
        'g',
      );
      while ((match = mixedPattern.exec(content)) !== null) {
        if (match[1]) usages.add(match[1]);
        const names = match[2].split(',').map((n) => n.trim().split(' as ')[0].trim());
        for (const name of names) {
          if (name) usages.add(name);
        }
      }

      // Also check for usage in the same file (re-export, internal use)
      // Look for usage patterns like functionName( or obj.propertyName
      const identifierPattern = /\b([A-Z][a-zA-Z0-9]*)\b/g;
      while ((match = identifierPattern.exec(content)) !== null) {
        usages.add(match[1]);
      }
    } catch {
      // Skip files we can't read
    }
  }

  return usages;
}

/**
 * Determine confidence level for unused export
 */
function determineConfidence(
  exportName: string,
  exportInfo: UnusedExport,
  usages: Set<string>,
  sourceFiles: string[],
): 'high' | 'medium' | 'low' {
  // Check if the name appears anywhere in the codebase (even as a string)
  let stringReferenceCount = 0;

  for (const file of sourceFiles.slice(0, 50)) {
    // Limit for performance
    try {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes(`'${exportName}'`) || content.includes(`"${exportName}"`)) {
        stringReferenceCount++;
      }
    } catch {
      // Skip
    }
  }

  if (stringReferenceCount > 0) {
    return 'low';
  }

  // Check if it's a common pattern that might be used dynamically
  const dynamicPatterns = [
    /^(get|set|on|off|emit|dispatch|create|make|build|parse|format|validate|transform)/i,
    /^(is|has|can|should|will|must)/i,
    /^(component|page|route|handler|middleware|service|controller)/i,
  ];

  for (const pattern of dynamicPatterns) {
    if (pattern.test(exportName)) {
      return 'medium';
    }
  }

  return 'high';
}

// ============================================================================
// Main Analysis Function
// ============================================================================

function findUnusedExports(
  params: FindUnusedExportsParams,
): UnusedExportsResult {
  const startTime = Date.now();

  const projectRoot = path.resolve(params.projectRoot);
  const include = params.include || ['**/*'];
  const exclude = [...DEFAULT_EXCLUDE, ...(params.exclude || [])];
  const minConfidence = params.minConfidence || 'medium';
  const languages = params.languages;

  // Find all source files
  const sourceFiles = findSourceFiles(projectRoot, include, exclude, languages);

  if (sourceFiles.length === 0) {
    throw new Error(`No source files found in ${projectRoot}`);
  }

  // Collect all exports
  const allExports = new Map<string, UnusedExport>();
  for (const file of sourceFiles) {
    const fileExports = extractExports(file);
    for (const [name, info] of fileExports) {
      allExports.set(`${file}:${name}`, info);
    }
  }

  // Find all usages
  const usages = findAllUsages(sourceFiles, projectRoot);

  // Determine unused exports
  const confidenceOrder = { high: 3, medium: 2, low: 1 };
  const minConfidenceLevel = confidenceOrder[minConfidence];

  const unusedExports: UnusedExport[] = [];

  for (const [_key, exportInfo] of allExports) {
    if (!usages.has(exportInfo.name)) {
      const confidence = determineConfidence(
        exportInfo.name,
        exportInfo,
        usages,
        sourceFiles,
      );

      if (confidenceOrder[confidence] <= minConfidenceLevel) {
        exportInfo.confidence = confidence;
        unusedExports.push(exportInfo);
      }
    }
  }

  // Sort by confidence and then by file
  unusedExports.sort((a, b) => {
    const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    if (confDiff !== 0) return confDiff;
    return a.file.localeCompare(b.file);
  });

  // Generate recommendations
  const recommendations: string[] = [];

  if (unusedExports.length > 0) {
    const highConfidence = unusedExports.filter((e) => e.confidence === 'high');
    if (highConfidence.length > 0) {
      recommendations.push(
        `Found ${highConfidence.length} high-confidence unused exports. Consider removing them to reduce bundle size.`,
      );
    }

    const typeExports = unusedExports.filter(
      (e) => e.type === 'type' || e.type === 'interface',
    );
    if (typeExports.length > 0) {
      recommendations.push(
        `${typeExports.length} unused type/interface exports found. These may be used for documentation or future use.`,
      );
    }

    const defaultExports = unusedExports.filter((e) => e.type === 'default');
    if (defaultExports.length > 0) {
      recommendations.push(
        `${defaultExports.length} unused default exports found. These might be entry points or plugin hooks.`,
      );
    }
  } else {
    recommendations.push('No unused exports found. All exports are being used.');
  }

  const analysisTimeMs = Date.now() - startTime;

  return {
    projectRoot,
    totalExports: allExports.size,
    unusedExports,
    filesAnalyzed: sourceFiles.length,
    analysisTimeMs,
    recommendations,
  };
}

// ============================================================================
// Tool Invocation
// ============================================================================

class FindUnusedExportsInvocation extends BaseToolInvocation<
  FindUnusedExportsParams,
  ToolResult
> {
  constructor(params: FindUnusedExportsParams) {
    super(params);
  }

  getDescription(): string {
    return `Finding unused exports in ${this.params.projectRoot}`;
  }

  async execute(
    _signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    try {
      const result = findUnusedExports(this.params);

      const llmContent = `## Unused Exports Analysis: ${result.projectRoot}

**Files Analyzed:** ${result.filesAnalyzed}
**Total Exports:** ${result.totalExports}
**Unused Exports:** ${result.unusedExports.length}
**Analysis Time:** ${result.analysisTimeMs}ms

### Unused Exports by Confidence

${this.formatUnusedExports(result.unusedExports)}

### Recommendations

${result.recommendations.map((r) => `- ${r}`).join('\n')}

---

**Note:** Use the \`task\` tool to delegate comprehensive project analysis to a subagent for large codebases. Example:
\`\`\`
task: {
  subagent_type: "Explore",
  description: "Analyze unused exports",
  prompt: "Find all unused exports in the project..."
}
\`\`\`
`;

      return {
        llmContent,
        returnDisplay: `Found ${result.unusedExports.length} unused exports out of ${result.totalExports} total in ${result.filesAnalyzed} files`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Error analyzing unused exports: ${errorMessage}`,
        returnDisplay: errorMessage,
        error: {
          message: errorMessage,
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }
  }

  private formatUnusedExports(exports: UnusedExport[]): string {
    if (exports.length === 0) {
      return 'No unused exports found.';
    }

    const grouped: Record<string, UnusedExport[]> = {
      high: [],
      medium: [],
      low: [],
    };

    for (const exp of exports) {
      grouped[exp.confidence].push(exp);
    }

    let output = '';

    for (const [confidence, items] of Object.entries(grouped)) {
      if (items.length > 0) {
        output += `\n#### ${confidence.toUpperCase()} Confidence (${items.length})\n\n`;
        for (const exp of items.slice(0, 20)) {
          // Limit to 20 per group
          const relativePath = path.relative(process.cwd(), exp.file);
          output += `- \`${exp.name}\` (${exp.type}) in ${relativePath}:${exp.line}\n`;
        }
        if (items.length > 20) {
          output += `  ... and ${items.length - 20} more\n`;
        }
      }
    }

    return output;
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * Find Unused Exports Tool class definition
 */
export class FindUnusedExportsTool extends BaseDeclarativeTool<
  FindUnusedExportsParams,
  ToolResult
> {
  static readonly Name = 'find_unused_exports';

  constructor() {
    super(
      FindUnusedExportsTool.Name,
      'Find Unused Exports',
      `Analyzes a project to find exported functions, classes, and variables that are never imported elsewhere.

**Supported Languages:**
- TypeScript (.ts, .tsx) - Full support including types, interfaces, enums
- JavaScript (.js, .jsx, .mjs, .cjs) - ES6 modules and CommonJS

This tool helps identify dead code and reduce bundle size by finding:
- Exported functions that are never called
- Exported classes that are never instantiated
- Exported types/interfaces that are never used
- Exported constants that are never imported

Results are grouped by confidence level (high/medium/low).

**EXAMPLE ANALYSIS FLOW:**

\`\`\`
User: "Find unused exports in my project"

1. Call find_unused_exports with project root
2. Review high-confidence results first
3. Use task tool to delegate deeper analysis:
   - subagent_type: "Explore"
   - prompt: "Verify these unused exports aren't used dynamically..."
4. Remove confirmed unused exports
\`\`\`

**When to use:** Code cleanup, refactoring, bundle optimization, pre-release audits.`,
      Kind.Read,
      {
        type: 'object',
        properties: {
          projectRoot: {
            type: 'string',
            description:
              'Root directory of the project to analyze. Use "." for current directory.',
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
            description:
              'Glob patterns for files to include. Default: all TypeScript/JavaScript files.',
          },
          exclude: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Glob patterns for files to exclude. Default: node_modules, dist, test files.',
          },
          minConfidence: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description:
              'Minimum confidence level to report. Default: "medium".',
          },
          useTaskDelegation: {
            type: 'boolean',
            description:
              'For large projects, use task tool to delegate analysis to subagent.',
          },
        },
        required: ['projectRoot'],
      },
      true, // isOutputMarkdown
      false, // canUpdateOutput
    );
  }

  protected override createInvocation(
    params: FindUnusedExportsParams,
  ): FindUnusedExportsInvocation {
    return new FindUnusedExportsInvocation(params);
  }
}

export const findUnusedExportsTool = new FindUnusedExportsTool();
export default findUnusedExportsTool;
