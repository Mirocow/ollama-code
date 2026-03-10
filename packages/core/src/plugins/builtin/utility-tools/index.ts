/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility Tools Plugin
 *
 * Built-in plugin providing utility tools for code analysis and diagram generation.
 */

import type { PluginDefinition } from '../../types.js';
import type { Config } from '../../../config/config.js';
import { codeAnalyzerTool } from './code-analyzer/index.js';
import { DiagramGeneratorTool } from './diagram-generator/index.js';

/**
 * Utility Tools Plugin Definition
 */
const utilityToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'utility-tools',
    name: 'Utility Tools',
    version: '1.0.0',
    description: 'Utility tools: code analyzer, diagram generator',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'utility', 'analysis'],
    enabledByDefault: true,
  },

  // Unified tools array - mix of tool instances and factory functions
  tools: [
    codeAnalyzerTool,  // Already instantiated tool instance
    (config: unknown) => new DiagramGeneratorTool(config as Config),  // Factory function
  ],

  // Tool aliases - short names that resolve to canonical tool names
  aliases: [
    // diagram_generator aliases
    { alias: 'diagram', canonicalName: 'diagram_generator', description: 'Generate diagrams' },
    { alias: 'draw', canonicalName: 'diagram_generator', description: 'Draw diagrams' },
    { alias: 'chart', canonicalName: 'diagram_generator', description: 'Create charts' },
    // code_analyzer aliases
    { alias: 'analyze', canonicalName: 'code_analyzer', description: 'Analyze code' },
    { alias: 'analyze_project', canonicalName: 'code_analyzer', description: 'Analyze code' },
    { alias: 'lint', canonicalName: 'code_analyzer', description: 'Lint code' },
    { alias: 'check', canonicalName: 'code_analyzer', description: 'Check code quality' },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content: 'Utility tools: code_analyzer for static analysis, diagram_generator for visual diagrams. Use code_analyzer to check code quality, diagram_generator to create visualizations.',
    },
    {
      priority: 2,
      content: 'CODE_ANALYZER: Static code analysis - complexity, maintainability, potential issues. Provides metrics and recommendations. Good for code review preparation.',
    },
    {
      priority: 3,
      content: 'DIAGRAM_GENERATOR: Create diagrams from descriptions. Supports flowcharts, sequence diagrams, class diagrams. Describe what you want in natural language.',
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
      context.logger.info('Utility Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Utility Tools plugin enabled');
    },
  },
};

export default utilityToolsPlugin;

export { codeAnalyzerTool } from './code-analyzer/index.js';
export { DiagramGeneratorTool, createDiagramGeneratorTool } from './diagram-generator/index.js';
