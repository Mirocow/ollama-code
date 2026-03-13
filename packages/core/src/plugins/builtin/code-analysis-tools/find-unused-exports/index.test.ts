/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  FindUnusedExportsParams,
  UnusedExport,
  UnusedExportsResult,
} from './index.js';
import { findUnusedExportsTool } from './index.js';

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn((path: string) => {
    if (path.endsWith('.ts')) {
      return `
export const usedFunction = () => 'used';
export const unusedFunction = () => 'unused';
export interface UsedInterface { name: string; }
export type UnusedType = string;
export class UnusedClass {}
`;
    }
    return '';
  }),
}));

describe('FindUnusedExportsTool', () => {
  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(findUnusedExportsTool.name).toBe('find_unused_exports');
    });

    it('should have correct display name', () => {
      expect(findUnusedExportsTool.displayName).toBe('Find Unused Exports');
    });

    it('should have description mentioning key features', () => {
      expect(findUnusedExportsTool.description).toContain('functions');
      expect(findUnusedExportsTool.description).toContain('classes');
      expect(findUnusedExportsTool.description).toContain('types');
    });

    it('should have valid parameter schema', () => {
      expect(findUnusedExportsTool.parameterSchema).toBeDefined();
      expect(findUnusedExportsTool.parameterSchema.type).toBe('object');
      expect(findUnusedExportsTool.parameterSchema.properties).toHaveProperty('projectRoot');
      expect(findUnusedExportsTool.parameterSchema.required).toContain('projectRoot');
    });
  });

  describe('Parameter Validation', () => {
    it('should require projectRoot parameter', () => {
      const params = {} as FindUnusedExportsParams;
      const error = findUnusedExportsTool.validateToolParams(params);
      expect(error).toBeTruthy();
    });

    it('should validate valid params', () => {
      const params: FindUnusedExportsParams = {
        projectRoot: '/test/project',
      };
      const error = findUnusedExportsTool.validateToolParams(params);
      expect(error).toBeNull();
    });

    it('should accept optional parameters', () => {
      const params: FindUnusedExportsParams = {
        projectRoot: '/test/project',
        languages: ['typescript'],
        include: ['src/**'],
        exclude: ['node_modules/**'],
        minConfidence: 'high',
        useTaskDelegation: true,
      };
      const error = findUnusedExportsTool.validateToolParams(params);
      expect(error).toBeNull();
    });

    it('should accept different confidence levels', () => {
      const confidenceLevels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

      confidenceLevels.forEach((minConfidence) => {
        const params: FindUnusedExportsParams = {
          projectRoot: '/test/project',
          minConfidence,
        };
        const error = findUnusedExportsTool.validateToolParams(params);
        expect(error).toBeNull();
      });
    });
  });

  describe('Type Definitions', () => {
    it('should define UnusedExport interface correctly', () => {
      const exp: UnusedExport = {
        file: '/src/utils.ts',
        name: 'unusedHelper',
        type: 'function',
        line: 15,
        confidence: 'high',
        reason: 'Named function export',
      };
      expect(exp.name).toBe('unusedHelper');
      expect(exp.type).toBe('function');
      expect(exp.confidence).toBe('high');
    });

    it('should define all export types', () => {
      const types: Array<UnusedExport['type']> = [
        'function',
        'class',
        'variable',
        'type',
        'interface',
        'const',
        'default',
      ];
      expect(types).toHaveLength(7);
    });

    it('should define UnusedExportsResult interface correctly', () => {
      const result: UnusedExportsResult = {
        projectRoot: '/test/project',
        totalExports: 10,
        unusedExports: [],
        filesAnalyzed: 5,
        analysisTimeMs: 250,
        recommendations: ['All exports are being used'],
      };
      expect(result.totalExports).toBe(10);
      expect(result.filesAnalyzed).toBe(5);
    });
  });

  describe('Invocation', () => {
    it('should create invocation with valid params', () => {
      const params: FindUnusedExportsParams = {
        projectRoot: '/test/project',
      };
      const invocation = findUnusedExportsTool.createInvocation(params);
      expect(invocation).toBeDefined();
      expect(invocation.getDescription()).toContain('unused exports');
    });
  });
});
