/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  DetectDeadCodeParams,
  DeadCodeIssue,
  DeadCodeLocation,
  DeadCodeAnalysisResult,
  DeadCodeType,
} from './index.js';
import { detectDeadCodeTool } from './index.js';

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn((path: string) => {
    if (path.endsWith('.ts')) {
      return `
function example() {
  return 'hello';
  console.log('unreachable'); // unreachable code
}

const unusedVar = 'never used';

class Example {
  private unusedMethod() {}

  public usedMethod() {
    return this.helper();
  }

  private helper() {
    return 'help';
  }
}
`;
    }
    return '';
  }),
}));

describe('DetectDeadCodeTool', () => {
  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(detectDeadCodeTool.name).toBe('detect_dead_code');
    });

    it('should have correct display name', () => {
      expect(detectDeadCodeTool.displayName).toBe('Detect Dead Code');
    });

    it('should have description mentioning key features', () => {
      expect(detectDeadCodeTool.description).toContain('Unreachable');
      expect(detectDeadCodeTool.description).toContain('Unused variables');
      expect(detectDeadCodeTool.description).toContain('Unused private methods');
    });

    it('should have valid parameter schema', () => {
      expect(detectDeadCodeTool.parameterSchema).toBeDefined();
      expect(detectDeadCodeTool.parameterSchema.type).toBe('object');
      expect(detectDeadCodeTool.parameterSchema.properties).toHaveProperty('projectRoot');
      expect(detectDeadCodeTool.parameterSchema.required).toContain('projectRoot');
    });
  });

  describe('Parameter Validation', () => {
    it('should require projectRoot parameter', () => {
      const params = {} as DetectDeadCodeParams;
      const error = detectDeadCodeTool.validateToolParams(params);
      expect(error).toBeTruthy();
    });

    it('should validate valid params', () => {
      const params: DetectDeadCodeParams = {
        projectRoot: '/test/project',
      };
      const error = detectDeadCodeTool.validateToolParams(params);
      expect(error).toBeNull();
    });

    it('should accept optional parameters', () => {
      const params: DetectDeadCodeParams = {
        projectRoot: '/test/project',
        languages: ['typescript'],
        include: ['src/**'],
        exclude: ['node_modules/**', 'dist/**'],
        minSeverity: 'warning',
        detectTypes: ['unreachable', 'unused_variable'],
        aggressive: true,
      };
      const error = detectDeadCodeTool.validateToolParams(params);
      expect(error).toBeNull();
    });

    it('should accept different severity levels', () => {
      const severityLevels: Array<'error' | 'warning' | 'info'> = ['error', 'warning', 'info'];

      severityLevels.forEach((minSeverity) => {
        const params: DetectDeadCodeParams = {
          projectRoot: '/test/project',
          minSeverity,
        };
        const error = detectDeadCodeTool.validateToolParams(params);
        expect(error).toBeNull();
      });
    });

    it('should accept different detect types', () => {
      const detectTypes: DeadCodeType[] = [
        'unreachable',
        'unused_variable',
        'unused_parameter',
        'unused_private_method',
        'unused_function',
        'commented_code',
        'empty_block',
      ];

      const params: DetectDeadCodeParams = {
        projectRoot: '/test/project',
        detectTypes,
      };
      const error = detectDeadCodeTool.validateToolParams(params);
      expect(error).toBeNull();
    });
  });

  describe('Type Definitions', () => {
    it('should define DeadCodeLocation interface correctly', () => {
      const location: DeadCodeLocation = {
        file: '/src/utils.ts',
        startLine: 10,
        endLine: 12,
        snippet: 'const unused = "value";',
      };
      expect(location.file).toBe('/src/utils.ts');
      expect(location.startLine).toBe(10);
      expect(location.endLine).toBe(12);
    });

    it('should define DeadCodeIssue interface correctly', () => {
      const issue: DeadCodeIssue = {
        type: 'unreachable',
        severity: 'error',
        message: 'Unreachable code after return',
        location: {
          file: '/src/app.ts',
          startLine: 20,
          endLine: 20,
          snippet: 'console.log("never reached")',
        },
        suggestion: 'Remove this code',
        confidence: 'high',
        estimatedLines: 1,
      };
      expect(issue.type).toBe('unreachable');
      expect(issue.severity).toBe('error');
      expect(issue.confidence).toBe('high');
    });

    it('should define all dead code types', () => {
      const types: DeadCodeType[] = [
        'unreachable',
        'unused_variable',
        'unused_parameter',
        'unused_private_method',
        'unused_function',
        'commented_code',
        'empty_block',
        'deprecated_pattern',
        'duplicate_code',
      ];
      expect(types).toHaveLength(9);
    });

    it('should define DeadCodeAnalysisResult interface correctly', () => {
      const result: DeadCodeAnalysisResult = {
        projectRoot: '/test/project',
        totalIssues: 5,
        issuesByType: {
          unreachable: 2,
          unused_variable: 3,
          unused_parameter: 0,
          unused_private_method: 0,
          unused_function: 0,
          commented_code: 0,
          empty_block: 0,
          deprecated_pattern: 0,
          duplicate_code: 0,
        },
        issues: [],
        filesAnalyzed: 10,
        removableLines: 25,
        analysisTimeMs: 150,
        recommendations: ['Fix unreachable code first'],
      };
      expect(result.totalIssues).toBe(5);
      expect(result.removableLines).toBe(25);
      expect(result.issuesByType.unreachable).toBe(2);
    });
  });

  describe('Invocation', () => {
    it('should create invocation with valid params', () => {
      const params: DetectDeadCodeParams = {
        projectRoot: '/test/project',
      };
      const invocation = detectDeadCodeTool.createInvocation(params);
      expect(invocation).toBeDefined();
      expect(invocation.getDescription()).toContain('dead code');
    });
  });
});
