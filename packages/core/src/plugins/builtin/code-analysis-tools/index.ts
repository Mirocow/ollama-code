/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Code Analysis Tools Plugin
 *
 * Comprehensive plugin providing deep code analysis capabilities:
 * - code_analyzer: Static analysis (complexity, security, patterns)
 * - find_unused_exports: Find exports that are never imported
 * - analyze_dependencies: Analyze package dependencies
 * - detect_dead_code: Find unreachable and unused code
 * - diagram_generator: Create visual diagrams
 *
 * This plugin integrates with the Task tool for delegating complex analysis
 * to subagents, enabling efficient processing of large codebases.
 */

import type { PluginDefinition } from '../../types.js';
import type { Config } from '../../../config/config.js';
import { codeAnalyzerTool } from './code-analyzer/index.js';
import { DiagramGeneratorTool } from './diagram-generator/index.js';
import { findUnusedExportsTool } from './find-unused-exports/index.js';
import { analyzeDependenciesTool } from './analyze-dependencies/index.js';
import { detectDeadCodeTool } from './detect-dead-code/index.js';

// ============================================================================
// Plugin Definition
// ============================================================================

/**
 * Code Analysis Tools Plugin Definition
 */
const codeAnalysisToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'code-analysis-tools',
    name: 'Code Analysis Tools',
    version: '1.0.0',
    description:
      'Comprehensive code analysis: static analysis, unused exports, dependencies, dead code, diagrams',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'analysis', 'code-quality', 'cleanup'],
    enabledByDefault: true,
  },

  // Tool instances
  tools: [
    codeAnalyzerTool,
    (config: unknown) => new DiagramGeneratorTool(config as Config),
    findUnusedExportsTool,
    analyzeDependenciesTool,
    detectDeadCodeTool,
  ],

  // Tool aliases for convenience
  aliases: [
    // code_analyzer aliases
    { alias: 'analyze', canonicalName: 'code_analyzer', description: 'Analyze code' },
    { alias: 'lint', canonicalName: 'code_analyzer', description: 'Lint code' },
    { alias: 'check', canonicalName: 'code_analyzer', description: 'Check code quality' },
    // diagram_generator aliases
    { alias: 'diagram', canonicalName: 'diagram_generator', description: 'Generate diagrams' },
    { alias: 'draw', canonicalName: 'diagram_generator', description: 'Draw diagrams' },
    // find_unused_exports aliases
    { alias: 'unused', canonicalName: 'find_unused_exports', description: 'Find unused exports' },
    { alias: 'exports', canonicalName: 'find_unused_exports', description: 'Find unused exports' },
    // analyze_dependencies aliases
    { alias: 'deps', canonicalName: 'analyze_dependencies', description: 'Analyze dependencies' },
    { alias: 'dependencies', canonicalName: 'analyze_dependencies', description: 'Analyze dependencies' },
    // detect_dead_code aliases
    { alias: 'deadcode', canonicalName: 'detect_dead_code', description: 'Detect dead code' },
    { alias: 'zombie', canonicalName: 'detect_dead_code', description: 'Find zombie code' },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content: `CODE ANALYSIS TOOLS: Five specialized tools for code quality analysis.

1. **code_analyzer**: Static analysis - complexity, security, patterns, maintainability.
2. **find_unused_exports**: Find exported functions/classes/variables that are never imported.
3. **analyze_dependencies**: Check for missing, unused, or circular dependencies.
4. **detect_dead_code**: Find unreachable code, unused variables, commented blocks.
5. **diagram_generator**: Create flowcharts, sequence diagrams, class diagrams.

All tools support Task tool delegation for large projects. Use subagent_type: "Explore" for analysis tasks.`,
    },
    {
      priority: 2,
      content: `CODE ANALYSIS WORKFLOW:

When user asks for code analysis, follow this workflow:

\`\`\`
Step 1: Quick Scan
Use code_analyzer for overall quality:
{
  "file": "src/important-file.ts",
  "analysis": ["complexity", "security", "patterns"]
}

Step 2: Dependency Check
Use analyze_dependencies for package health:
{
  "projectRoot": ".",
  "checkUnused": true,
  "checkMissing": true
}

Step 3: Dead Code Detection
Use detect_dead_code + find_unused_exports:
{
  "projectRoot": ".",
  "minSeverity": "warning"
}

Step 4: Visualization (optional)
Use diagram_generator for architecture:
{
  "description": "Create a flowchart of the main application flow"
}
\`\`\``,
    },
    {
      priority: 3,
      content: `TASK TOOL INTEGRATION:

All code analysis tools support delegation to subagents for better performance on large codebases.

**When to delegate:**
- Project has 100+ source files
- Analysis takes more than 10 seconds
- User requests comprehensive cleanup
- Multiple analysis types needed

**How to delegate:**

\`\`\`javascript
{
  "subagent_type": "Explore",
  "description": "Comprehensive code analysis",
  "prompt": "Perform comprehensive code analysis:

1. Use code_analyzer on main files
2. Use find_unused_exports to identify dead exports
3. Use analyze_dependencies to find package issues
4. Use detect_dead_code to find unreachable code

Return a prioritized cleanup plan."
}
\`\`\``,
    },
    {
      priority: 4,
      content: `QUICK REFERENCE - Tool Selection:

| User Request | Tool |
|-------------|------|
| "Analyze this file" | code_analyzer |
| "Check my dependencies" | analyze_dependencies |
| "Find unused exports" | find_unused_exports |
| "Find dead code" | detect_dead_code |
| "Draw a diagram" | diagram_generator |
| "Clean up my project" | All tools (use Task delegation) |
| "Bundle size optimization" | find_unused_exports + analyze_dependencies |`,
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
    canSpawnAgents: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Code Analysis Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Code Analysis Tools plugin enabled');
    },
  },
};

// ============================================================================
// Exports
// ============================================================================

export default codeAnalysisToolsPlugin;

export { codeAnalyzerTool } from './code-analyzer/index.js';
export { DiagramGeneratorTool, createDiagramGeneratorTool } from './diagram-generator/index.js';
export { findUnusedExportsTool } from './find-unused-exports/index.js';
export { analyzeDependenciesTool } from './analyze-dependencies/index.js';
export { detectDeadCodeTool } from './detect-dead-code/index.js';

// Re-export types for external use
export type {
  CodeAnalyzerParams,
  CodeIssue,
  ComplexityMetrics,
  CodeAnalysisResult,
} from './code-analyzer/index.js';

export type {
  UnusedExport,
  UnusedExportsResult,
  FindUnusedExportsParams,
} from './find-unused-exports/index.js';

export type {
  DependencyIssue,
  DependencyAnalysisResult,
  AnalyzeDependenciesParams,
} from './analyze-dependencies/index.js';

export type {
  DeadCodeIssue,
  DeadCodeAnalysisResult,
  DetectDeadCodeParams,
} from './detect-dead-code/index.js';
