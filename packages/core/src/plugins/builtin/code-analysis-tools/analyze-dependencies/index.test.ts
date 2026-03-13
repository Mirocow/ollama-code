/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  AnalyzeDependenciesParams,
  DependencyIssue,
  PackageInfo,
  DependencyAnalysisResult,
} from './index.js';
import { analyzeDependenciesTool } from './index.js';

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn((path: string) => {
    if (path.endsWith('package.json')) return true;
    if (path.includes('node_modules')) return false;
    return true;
  }),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn((path: string) => {
    if (path.endsWith('package.json')) {
      return JSON.stringify({
        name: 'test-project',
        dependencies: {
          lodash: '^4.17.21',
          express: '^4.18.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
          jest: '^29.0.0',
        },
      });
    }
    return '';
  }),
}));

describe('AnalyzeDependenciesTool', () => {
  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(analyzeDependenciesTool.name).toBe('analyze_dependencies');
    });

    it('should have correct display name', () => {
      expect(analyzeDependenciesTool.displayName).toBe('Analyze Dependencies');
    });

    it('should have description mentioning key features', () => {
      expect(analyzeDependenciesTool.description).toContain('Missing');
      expect(analyzeDependenciesTool.description).toContain('Unused');
      expect(analyzeDependenciesTool.description).toContain('Circular');
    });

    it('should have valid parameter schema', () => {
      expect(analyzeDependenciesTool.parameterSchema).toBeDefined();
      expect(analyzeDependenciesTool.parameterSchema.type).toBe('object');
      expect(analyzeDependenciesTool.parameterSchema.properties).toHaveProperty('projectRoot');
      expect(analyzeDependenciesTool.parameterSchema.required).toContain('projectRoot');
    });
  });

  describe('Parameter Validation', () => {
    it('should require projectRoot parameter', () => {
      const params = {} as AnalyzeDependenciesParams;
      const error = analyzeDependenciesTool.validateToolParams(params);
      expect(error).toBeTruthy();
    });

    it('should validate valid params', () => {
      const params: AnalyzeDependenciesParams = {
        projectRoot: '/test/project',
      };
      const error = analyzeDependenciesTool.validateToolParams(params);
      expect(error).toBeNull();
    });

    it('should accept optional parameters', () => {
      const params: AnalyzeDependenciesParams = {
        projectRoot: '/test/project',
        languages: ['typescript'],
        checkUnused: true,
        checkMissing: true,
        checkCircular: false,
        includeDev: true,
      };
      const error = analyzeDependenciesTool.validateToolParams(params);
      expect(error).toBeNull();
    });
  });

  describe('Type Definitions', () => {
    it('should define DependencyIssue interface correctly', () => {
      const issue: DependencyIssue = {
        type: 'missing',
        package: 'lodash',
        severity: 'error',
        message: 'Package "lodash" is imported but not listed in package.json',
        suggestion: 'npm install lodash',
      };
      expect(issue.type).toBe('missing');
      expect(issue.severity).toBe('error');
      expect(issue.suggestion).toBe('npm install lodash');
    });

    it('should define PackageInfo interface correctly', () => {
      const pkg: PackageInfo = {
        name: 'express',
        version: '^4.18.0',
        isDev: false,
        importCount: 5,
        importedIn: ['src/app.ts', 'src/server.ts'],
      };
      expect(pkg.name).toBe('express');
      expect(pkg.isDev).toBe(false);
      expect(pkg.importCount).toBe(5);
    });

    it('should define DependencyAnalysisResult interface correctly', () => {
      const result: DependencyAnalysisResult = {
        projectRoot: '/test/project',
        totalDependencies: 2,
        totalDevDependencies: 2,
        issues: [],
        circularDependencies: [],
        packages: new Map(),
        analysisTimeMs: 100,
        recommendations: ['No issues found'],
      };
      expect(result.projectRoot).toBe('/test/project');
      expect(result.totalDependencies).toBe(2);
      expect(result.recommendations).toHaveLength(1);
    });
  });

  describe('Invocation', () => {
    it('should create invocation with valid params', () => {
      const params: AnalyzeDependenciesParams = {
        projectRoot: '/test/project',
      };
      const invocation = analyzeDependenciesTool.createInvocation(params);
      expect(invocation).toBeDefined();
      expect(invocation.getDescription()).toContain('project');
    });
  });
});
