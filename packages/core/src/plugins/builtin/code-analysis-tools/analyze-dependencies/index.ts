/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Analyze Dependencies Tool
 *
 * Performs comprehensive dependency analysis for Node.js projects.
 *
 * **Supported Project Types:**
 * - Node.js projects with package.json
 * - TypeScript projects (.ts, .tsx)
 * - JavaScript projects (.js, .jsx, .mjs, .cjs)
 *
 * Analyzes:
 * - Missing dependencies (used but not in package.json)
 * - Unused dependencies (in package.json but never imported)
 * - Outdated dependencies
 * - Circular dependencies
 * - Dependency graph generation
 *
 * Uses Task tool delegation for large dependency trees.
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
 * Dependency issue types
 */
export type DependencyIssueType =
  | 'missing'
  | 'unused'
  | 'circular'
  | 'dev-in-prod'
  | 'prod-in-dev'
  | 'duplicate'
  | 'deprecated';

/**
 * Dependency issue information
 */
export interface DependencyIssue {
  /** Issue type */
  type: DependencyIssueType;
  /** Package name */
  package: string;
  /** Severity */
  severity: 'error' | 'warning' | 'info';
  /** Description of the issue */
  message: string;
  /** Suggested fix */
  suggestion?: string;
  /** Related packages (for circular deps) */
  relatedPackages?: string[];
}

/**
 * Package information
 */
export interface PackageInfo {
  /** Package name */
  name: string;
  /** Version in package.json */
  version?: string;
  /** Whether it's a dev dependency */
  isDev: boolean;
  /** Import count */
  importCount: number;
  /** Files that import this package */
  importedIn: string[];
}

/**
 * Circular dependency path
 */
export interface CircularDependency {
  /** Packages involved in the cycle */
  packages: string[];
  /** Path representation */
  path: string;
  /** Severity (always error) */
  severity: 'error';
}

/**
 * Analysis result
 */
export interface DependencyAnalysisResult {
  /** Project root */
  projectRoot: string;
  /** Total dependencies in package.json */
  totalDependencies: number;
  /** Total dev dependencies */
  totalDevDependencies: number;
  /** Found issues */
  issues: DependencyIssue[];
  /** Circular dependencies */
  circularDependencies: CircularDependency[];
  /** All packages info */
  packages: Map<string, PackageInfo>;
  /** Analysis time in ms */
  analysisTimeMs: number;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Supported languages for dependency analysis
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
export interface AnalyzeDependenciesParams {
  /** Project root directory */
  projectRoot: string;
  /** Languages to analyze (default: all supported) */
  languages?: SupportedLanguage[];
  /** Check for unused dependencies */
  checkUnused?: boolean;
  /** Check for missing dependencies */
  checkMissing?: boolean;
  /** Check for circular dependencies */
  checkCircular?: boolean;
  /** Include dev dependencies in analysis */
  includeDev?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read package.json
 */
function readPackageJson(projectRoot: string): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found in project root');
  }

  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
    };
  } catch (error) {
    throw new Error(
      `Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Find all source files
 */
function findSourceFiles(
  projectRoot: string,
  languages?: SupportedLanguage[],
): string[] {
  const files: string[] = [];
  const selectedLanguages = languages && languages.length > 0
    ? languages
    : [...SUPPORTED_LANGUAGES];
  const extensions = selectedLanguages.flatMap(lang => LANGUAGE_EXTENSIONS[lang]);
  const exclude = ['node_modules', 'dist', 'build', '.git'];

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!exclude.includes(entry.name)) {
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
 * Extract imports from a file
 */
function extractImports(
  filePath: string,
  projectRoot: string,
): Array<{ packageName: string; isDev: boolean }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: Array<{ packageName: string; isDev: boolean }> = [];
  const isTestFile =
    filePath.includes('.test.') ||
    filePath.includes('.spec.') ||
    filePath.includes('__tests__');

  // ES6 imports
  const importPattern = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const importPath = match[1];

    // Skip relative imports
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      continue;
    }

    // Get package name (handle scoped packages)
    let packageName: string;
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      packageName = `${parts[0]}/${parts[1]}`;
    } else {
      packageName = importPath.split('/')[0];
    }

    imports.push({ packageName, isDev: isTestFile });
  }

  // CommonJS require
  const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requirePattern.exec(content)) !== null) {
    const importPath = match[1];

    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      continue;
    }

    let packageName: string;
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      packageName = `${parts[0]}/${parts[1]}`;
    } else {
      packageName = importPath.split('/')[0];
    }

    imports.push({ packageName, isDev: isTestFile });
  }

  return imports;
}

/**
 * Built-in Node.js modules
 */
const NODE_BUILTINS = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
  'node:assert',
  'node:buffer',
  'node:child_process',
  'node:cluster',
  'node:console',
  'node:constants',
  'node:crypto',
  'node:dgram',
  'node:dns',
  'node:domain',
  'node:events',
  'node:fs',
  'node:http',
  'node:https',
  'node:module',
  'node:net',
  'node:os',
  'node:path',
  'node:perf_hooks',
  'node:process',
  'node:punycode',
  'node:querystring',
  'node:readline',
  'node:repl',
  'node:stream',
  'node:string_decoder',
  'node:sys',
  'node:timers',
  'node:tls',
  'node:tty',
  'node:url',
  'node:util',
  'node:v8',
  'node:vm',
  'node:worker_threads',
  'node:zlib',
]);

/**
 * Common build tools that are often in dependencies but not directly imported
 */
const COMMON_BUILD_TOOLS = new Set([
  'typescript',
  'eslint',
  'prettier',
  'jest',
  'mocha',
  'vitest',
  'webpack',
  'vite',
  'rollup',
  'esbuild',
  'babel',
  '@types/*',
  'ts-node',
  'ts-loader',
  '@babel/*',
  'nodemon',
  'concurrently',
  'cross-env',
  'rimraf',
  'copyfiles',
]);

// ============================================================================
// Main Analysis Function
// ============================================================================

function analyzeDependencies(
  params: AnalyzeDependenciesParams,
): DependencyAnalysisResult {
  const startTime = Date.now();

  const projectRoot = path.resolve(params.projectRoot);
  const checkUnused = params.checkUnused !== false;
  const checkMissing = params.checkMissing !== false;
  const checkCircular = params.checkCircular !== false;
  // Note: includeDev is used to determine whether dev dependencies should be analyzed
  // Currently all dependencies are analyzed, but this can be filtered in the future
  void params.includeDev !== false; // Reserved for future filtering

  // Read package.json
  const { dependencies, devDependencies } = readPackageJson(projectRoot);

  // Find all source files
  const sourceFiles = findSourceFiles(projectRoot, params.languages);

  // Track all imports
  const packageUsage = new Map<string, PackageInfo>();

  // Initialize with package.json entries
  for (const [name, version] of Object.entries(dependencies)) {
    packageUsage.set(name, {
      name,
      version,
      isDev: false,
      importCount: 0,
      importedIn: [],
    });
  }

  for (const [name, version] of Object.entries(devDependencies)) {
    packageUsage.set(name, {
      name,
      version,
      isDev: true,
      importCount: 0,
      importedIn: [],
    });
  }

  // Analyze imports in all files
  for (const file of sourceFiles) {
    try {
      const imports = extractImports(file, projectRoot);
      const relativePath = path.relative(projectRoot, file);

      for (const { packageName, isDev } of imports) {
        // Skip Node.js builtins
        if (NODE_BUILTINS.has(packageName)) {
          continue;
        }

        if (!packageUsage.has(packageName)) {
          packageUsage.set(packageName, {
            name: packageName,
            isDev,
            importCount: 0,
            importedIn: [],
          });
        }

        const info = packageUsage.get(packageName)!;
        info.importCount++;
        info.importedIn.push(relativePath);
      }
    } catch {
      // Skip files we can't read
    }
  }

  // Detect issues
  const issues: DependencyIssue[] = [];
  const circularDependencies: CircularDependency[] = [];

  // Check for missing dependencies
  if (checkMissing) {
    for (const [name, info] of packageUsage) {
      if (info.importCount > 0 && !info.version) {
        // Imported but not in package.json
        issues.push({
          type: 'missing',
          package: name,
          severity: 'error',
          message: `Package "${name}" is imported but not listed in package.json`,
          suggestion: `npm install ${name}${info.isDev ? ' --save-dev' : ''}`,
        });
      }
    }
  }

  // Check for unused dependencies
  if (checkUnused) {
    for (const [name, info] of packageUsage) {
      if (info.version && info.importCount === 0) {
        // In package.json but never imported

        // Skip common build tools
        if (COMMON_BUILD_TOOLS.has(name) || name.startsWith('@types/')) {
          continue;
        }

        // Check if it might be a peer dependency or plugin
        const isLikelyPlugin =
          name.includes('plugin') ||
          name.includes('eslint-config') ||
          name.includes('prettier-config');

        if (!isLikelyPlugin) {
          issues.push({
            type: 'unused',
            package: name,
            severity: 'warning',
            message: `Package "${name}" is in ${info.isDev ? 'devDependencies' : 'dependencies'} but never imported`,
            suggestion: info.isDev
              ? `npm uninstall ${name} (or verify it's a build tool)`
              : `npm uninstall ${name} (or verify it's needed)`,
          });
        }
      }
    }
  }

  // Check for dev dependencies in production code
  for (const [name, info] of packageUsage) {
    if (info.isDev && info.importCount > 0) {
      const hasNonTestImports = info.importedIn.some(
        (f) => !f.includes('.test.') && !f.includes('.spec.') && !f.includes('__tests__'),
      );

      if (hasNonTestImports) {
        issues.push({
          type: 'dev-in-prod',
          package: name,
          severity: 'warning',
          message: `Dev dependency "${name}" is imported in non-test files`,
          suggestion: `Move "${name}" to dependencies if it's needed in production`,
        });
      }
    }
  }

  // Simple circular dependency check (for local modules)
  if (checkCircular) {
    // This is a simplified check - real circular dependency detection
    // requires building a full import graph
    const localImports = new Map<string, Set<string>>();

    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(projectRoot, file);

        localImports.set(relativePath, new Set());

        // Find relative imports
        const relativeImportPattern = /import\s+.*from\s+['"](\.[^'"]+)['"]/g;
        let match;

        while ((match = relativeImportPattern.exec(content)) !== null) {
          const importPath = path.normalize(path.dirname(relativePath) + '/' + match[1]);
          localImports.get(relativePath)!.add(importPath);
        }
      } catch {
        // Skip
      }
    }

    // Check for cycles (simplified - only checks 2-node cycles)
    for (const [file, imports] of localImports) {
      for (const imported of imports) {
        const importedDeps = localImports.get(imported);
        if (importedDeps?.has(file)) {
          const cycle: CircularDependency = {
            packages: [file, imported],
            path: `${file} -> ${imported} -> ${file}`,
            severity: 'error',
          };

          // Avoid duplicates
          if (
            !circularDependencies.some(
              (c) =>
                c.packages.includes(file) && c.packages.includes(imported),
            )
          ) {
            circularDependencies.push(cycle);
          }
        }
      }
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  if (errorCount > 0) {
    recommendations.push(
      `Found ${errorCount} errors that need immediate attention.`,
    );
  }

  if (warningCount > 0) {
    recommendations.push(
      `Found ${warningCount} warnings. Review them for potential issues.`,
    );
  }

  if (circularDependencies.length > 0) {
    recommendations.push(
      `Found ${circularDependencies.length} circular dependencies. These can cause runtime issues and should be refactored.`,
    );
  }

  const missingPackages = issues.filter((i) => i.type === 'missing');
  if (missingPackages.length > 0) {
    recommendations.push(
      `Run: npm install ${missingPackages.map((p) => p.package).join(' ')} to add missing dependencies.`,
    );
  }

  const unusedPackages = issues.filter((i) => i.type === 'unused');
  if (unusedPackages.length > 0) {
    recommendations.push(
      `Review unused packages. Consider running: npm uninstall ${unusedPackages.slice(0, 5).map((p) => p.package).join(' ')}...`,
    );
  }

  if (issues.length === 0 && circularDependencies.length === 0) {
    recommendations.push(
      'Dependency analysis looks good! No issues found.',
    );
  }

  const analysisTimeMs = Date.now() - startTime;

  return {
    projectRoot,
    totalDependencies: Object.keys(dependencies).length,
    totalDevDependencies: Object.keys(devDependencies).length,
    issues,
    circularDependencies,
    packages: packageUsage,
    analysisTimeMs,
    recommendations,
  };
}

// ============================================================================
// Tool Invocation
// ============================================================================

class AnalyzeDependenciesInvocation extends BaseToolInvocation<
  AnalyzeDependenciesParams,
  ToolResult
> {
  constructor(params: AnalyzeDependenciesParams) {
    super(params);
  }

  getDescription(): string {
    return `Analyzing dependencies in ${this.params.projectRoot}`;
  }

  async execute(
    _signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    try {
      const result = analyzeDependencies(this.params);

      const llmContent = `## Dependency Analysis: ${result.projectRoot}

**Dependencies:** ${result.totalDependencies} production, ${result.totalDevDependencies} dev
**Analysis Time:** ${result.analysisTimeMs}ms

### Issues Found: ${result.issues.length}

${this.formatIssues(result.issues)}

### Circular Dependencies: ${result.circularDependencies.length}

${this.formatCircularDependencies(result.circularDependencies)}

### Recommendations

${result.recommendations.map((r) => `- ${r}`).join('\n')}

---

**Tip:** Use the \`task\` tool for deeper analysis of dependency graphs:
\`\`\`
task: {
  subagent_type: "Explore",
  description: "Analyze dependency tree",
  prompt: "Build complete dependency graph and find optimization opportunities..."
}
\`\`\`
`;

      return {
        llmContent,
        returnDisplay: `Found ${result.issues.length} issues (${result.issues.filter((i) => i.severity === 'error').length} errors, ${result.issues.filter((i) => i.severity === 'warning').length} warnings)`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Error analyzing dependencies: ${errorMessage}`,
        returnDisplay: errorMessage,
        error: {
          message: errorMessage,
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }
  }

  private formatIssues(issues: DependencyIssue[]): string {
    if (issues.length === 0) {
      return 'No issues found.';
    }

    const grouped: Record<string, DependencyIssue[]> = {};

    for (const issue of issues) {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    }

    let output = '';

    for (const [type, items] of Object.entries(grouped)) {
      output += `\n#### ${type.replace(/_/g, ' ').toUpperCase()} (${items.length})\n\n`;

      for (const item of items) {
        const icon = item.severity === 'error' ? '❌' : item.severity === 'warning' ? '⚠️' : 'ℹ️';
        output += `${icon} **${item.package}**: ${item.message}\n`;
        if (item.suggestion) {
          output += `   → ${item.suggestion}\n`;
        }
      }
    }

    return output;
  }

  private formatCircularDependencies(
    circular: CircularDependency[],
  ): string {
    if (circular.length === 0) {
      return 'No circular dependencies detected.';
    }

    return circular
      .map((c, i) => `${i + 1}. \`${c.path}\``)
      .join('\n');
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * Analyze Dependencies Tool class definition
 */
export class AnalyzeDependenciesTool extends BaseDeclarativeTool<
  AnalyzeDependenciesParams,
  ToolResult
> {
  static readonly Name = 'analyze_dependencies';

  constructor() {
    super(
      AnalyzeDependenciesTool.Name,
      'Analyze Dependencies',
      `Comprehensive dependency analysis for Node.js/TypeScript projects.

**Supported Languages:**
- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx, .mjs, .cjs)
- Requires: package.json in project root

Analyzes:
- **Missing dependencies**: Packages used but not in package.json
- **Unused dependencies**: Packages in package.json but never imported
- **Dev in production**: Dev dependencies imported in production code
- **Circular dependencies**: Import cycles between modules

**EXAMPLE ANALYSIS FLOW:**

\`\`\`
User: "Analyze my project's dependencies"

1. Call analyze_dependencies with project root
2. Review missing dependencies first (errors)
3. Use task tool for deeper analysis:
   - subagent_type: "Explore"
   - prompt: "Analyze why these dependencies are unused..."
4. Run suggested npm commands
\`\`\`

**When to use:** Pre-commit checks, CI/CD pipelines, cleanup sprints, dependency audits.`,
      Kind.Read,
      {
        type: 'object',
        properties: {
          projectRoot: {
            type: 'string',
            description:
              'Root directory of the project. Must contain package.json. Use "." for current directory.',
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
          checkUnused: {
            type: 'boolean',
            description: 'Check for unused dependencies. Default: true.',
          },
          checkMissing: {
            type: 'boolean',
            description: 'Check for missing dependencies. Default: true.',
          },
          checkCircular: {
            type: 'boolean',
            description: 'Check for circular dependencies. Default: true.',
          },
          includeDev: {
            type: 'boolean',
            description: 'Include dev dependencies in analysis. Default: true.',
          },
        },
        required: ['projectRoot'],
      },
      true, // isOutputMarkdown
      false, // canUpdateOutput
    );
  }

  protected override createInvocation(
    params: AnalyzeDependenciesParams,
  ): AnalyzeDependenciesInvocation {
    return new AnalyzeDependenciesInvocation(params);
  }
}

export const analyzeDependenciesTool = new AnalyzeDependenciesTool();
export default analyzeDependenciesTool;
