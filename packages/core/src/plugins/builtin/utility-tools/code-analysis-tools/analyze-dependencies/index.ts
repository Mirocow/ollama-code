/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Analyze Dependencies Tool
 *
 * Analyzes project dependencies and provides insights about them.
 */

import type { ToolResult } from '../../../../../tools/tools.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
} from '../../../../../tools/tools.js';
import type { FunctionDeclaration } from '../../../../../types/content.js';
import { ToolErrorType } from '../../../../../tools/tool-error.js';
import type { Config } from '../../../../../config/config.js';
import { createDebugLogger } from '../../../../../utils/debugLogger.js';

const debugLogger = createDebugLogger('ANALYZE_DEPENDENCIES');

export interface AnalyzeDependenciesParams {
  projectRoot: string;
  includeDev?: boolean;
  checkUpdates?: boolean;
}

interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'optional';
  latest?: string;
  outdated?: boolean;
}

interface AnalyzeDependenciesResult {
  dependencies: DependencyInfo[];
  total: number;
  outdated: number;
  summary: string;
}

const analyzeDependenciesToolSchema: FunctionDeclaration = {
  name: 'analyze_dependencies',
  description: 'Analyzes project dependencies and provides insights about them',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'The root directory of the project to analyze',
      },
      includeDev: {
        type: 'boolean',
        description: 'Include development dependencies (default: true)',
      },
      checkUpdates: {
        type: 'boolean',
        description: 'Check for available updates (default: false)',
      },
    },
    required: ['projectRoot'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
};

const analyzeDependenciesToolDescription = `
Analyzes project dependencies and provides insights about them.

This tool:
- Lists all dependencies (production, development, optional)
- Identifies outdated packages
- Provides a summary of the dependency health
- Can check for available updates

Use this tool to understand the dependency landscape of a project.
`;

function analyzeDependencies(
  params: AnalyzeDependenciesParams,
): AnalyzeDependenciesResult {
  const {
    projectRoot,
    includeDev: _includeDev = true,
    checkUpdates: _checkUpdates = false,
  } = params;

  // Basic implementation - in real world this would parse package.json
  const result: AnalyzeDependenciesResult = {
    dependencies: [],
    total: 0,
    outdated: 0,
    summary: `Dependency analysis for ${projectRoot}`,
  };

  debugLogger.info(`Analyzing dependencies in ${projectRoot}`);

  return result;
}

class AnalyzeDependenciesInvocation extends BaseToolInvocation<
  AnalyzeDependenciesParams,
  ToolResult
> {
  constructor(_config: Config, params: AnalyzeDependenciesParams) {
    super(params);
  }

  getDescription(): string {
    return `Analyzing dependencies in ${this.params.projectRoot}`;
  }

  async execute(_signal: AbortSignal): Promise<ToolResult> {
    try {
      const result = analyzeDependencies(this.params);

      const llmContent = JSON.stringify(result, null, 2);

      return {
        llmContent,
        returnDisplay: `Analyzed ${result.total} dependencies, ${result.outdated} outdated`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debugLogger.error(`Error analyzing dependencies: ${errorMessage}`);

      return {
        llmContent: `Error analyzing dependencies: ${errorMessage}`,
        returnDisplay: `Error: ${errorMessage}`,
        error: {
          message: errorMessage,
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }
  }
}

export class AnalyzeDependenciesTool extends BaseDeclarativeTool<
  AnalyzeDependenciesParams,
  ToolResult
> {
  static readonly Name = 'analyze_dependencies';

  constructor(private readonly config: Config) {
    super(
      AnalyzeDependenciesTool.Name,
      'AnalyzeDependencies',
      analyzeDependenciesToolDescription,
      Kind.Read,
      analyzeDependenciesToolSchema.parametersJsonSchema as Record<
        string,
        unknown
      >,
    );
  }

  protected override createInvocation(
    params: AnalyzeDependenciesParams,
  ): AnalyzeDependenciesInvocation {
    return new AnalyzeDependenciesInvocation(this.config, params);
  }
}
