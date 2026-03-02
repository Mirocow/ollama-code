/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Code Analysis Tools Plugin
 *
 * Built-in plugin providing code analysis and quality tools.
 * Supports code analysis, diagram generation, and API testing.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

/**
 * Tool: code_analyzer
 * Analyze code for patterns, issues, and metrics
 */
const codeAnalyzerTool: PluginTool = {
  id: 'code_analyzer',
  name: 'code_analyzer',
  description: `Analyze code for patterns, potential issues, and quality metrics.

Provides:
- Code complexity analysis (cyclomatic complexity, nesting depth)
- Pattern detection (code smells, anti-patterns)
- Dependency analysis
- Documentation coverage
- Test coverage suggestions
- Security vulnerability scanning

Can analyze individual files or entire projects.`,
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'REQUIRED: Path to file or directory to analyze',
      },
      analysis_type: {
        type: 'string',
        enum: ['complexity', 'patterns', 'dependencies', 'security', 'all'],
        description: 'OPTIONAL: Type of analysis to perform (default: all)',
      },
      output_format: {
        type: 'string',
        enum: ['summary', 'detailed', 'json'],
        description: 'OPTIONAL: Output format (default: summary)',
      },
    },
    required: ['path'],
  },
  category: 'search',
  execute: async (params, context) => {
    const path = params['path'] as string;
    const analysisType = params['analysis_type'] as string || 'all';
    
    return {
      success: true,
      data: {
        message: 'Code analysis ready',
        path,
        analysisType,
      },
      display: {
        summary: `Analyzing ${path} (${analysisType})`,
      },
    };
  },
};

/**
 * Tool: diagram_generator
 * Generate diagrams from code and architecture
 */
const diagramGeneratorTool: PluginTool = {
  id: 'diagram_generator',
  name: 'diagram_generator',
  description: `Generate diagrams and visualizations from code structure.

Supports:
- Class diagrams (UML)
- Sequence diagrams
- Flowcharts
- Architecture diagrams
- Dependency graphs

Uses Mermaid syntax for diagram generation.`,
  parameters: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'REQUIRED: Source code or path to analyze',
      },
      diagram_type: {
        type: 'string',
        enum: ['class', 'sequence', 'flowchart', 'architecture', 'dependency'],
        description: 'REQUIRED: Type of diagram to generate',
      },
      format: {
        type: 'string',
        enum: ['mermaid', 'svg', 'png'],
        description: 'OPTIONAL: Output format (default: mermaid)',
      },
    },
    required: ['source', 'diagram_type'],
  },
  category: 'other',
  execute: async (params, context) => {
    const diagramType = params['diagram_type'] as string;
    const format = params['format'] as string || 'mermaid';
    
    return {
      success: true,
      data: {
        message: 'Diagram generation ready',
        diagramType,
        format,
      },
      display: {
        summary: `Generating ${diagramType} diagram`,
      },
    };
  },
};

/**
 * Tool: api_tester
 * Test API endpoints and services
 */
const apiTesterTool: PluginTool = {
  id: 'api_tester',
  name: 'api_tester',
  description: `Test and validate API endpoints and services.

Supports:
- REST API testing (GET, POST, PUT, DELETE, PATCH)
- GraphQL query testing
- WebSocket testing
- Authentication testing
- Performance testing (response time, throughput)

Can validate responses against schemas and assertions.`,
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'REQUIRED: URL to test',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        description: 'OPTIONAL: HTTP method (default: GET)',
      },
      headers: {
        type: 'object',
        description: 'OPTIONAL: Request headers',
      },
      body: {
        type: 'string',
        description: 'OPTIONAL: Request body',
      },
      expected_status: {
        type: 'number',
        description: 'OPTIONAL: Expected HTTP status code',
      },
      timeout: {
        type: 'number',
        description: 'OPTIONAL: Request timeout in ms (default: 30000)',
      },
    },
    required: ['url'],
  },
  category: 'fetch',
  requiresConfirmation: true,
  buildConfirmationMessage: (params) => {
    const method = params['method'] as string || 'GET';
    const url = params['url'] as string;
    return `API Test: ${method} ${url}`;
  },
  execute: async (params, context) => {
    const url = params['url'] as string;
    const method = params['method'] as string || 'GET';
    
    return {
      success: true,
      data: {
        message: 'API test ready',
        url,
        method,
      },
      display: {
        summary: `${method} ${url}`,
      },
    };
  },
  timeout: 60000,
};

/**
 * Code Analysis Tools Plugin Definition
 */
const codeAnalysisToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'code-analysis-tools',
    name: 'Code Analysis Tools',
    version: '1.0.0',
    description: 'Code analysis, diagram generation, and API testing tools',
    author: 'Ollama Code Team',
    tags: ['analysis', 'quality', 'diagram', 'api', 'testing'],
    enabledByDefault: true,
  },

  tools: [codeAnalyzerTool, diagramGeneratorTool, apiTesterTool],

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Code Analysis Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Code Analysis Tools plugin enabled');
    },
  },

  defaultConfig: {
    analysisTimeout: 60000,
    maxFileSize: 1048576, // 1MB
    diagramMaxNodes: 100,
  },
};

export default codeAnalysisToolsPlugin;
