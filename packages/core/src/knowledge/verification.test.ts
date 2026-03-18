/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VerificationExecutor,
  VerificationSteps,
} from './verification.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('VerificationExecutor', () => {
  let tempDir: string;
  let executor: VerificationExecutor;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'verification-test-'));
    executor = new VerificationExecutor({ workingDirectory: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('executeStep', () => {
    it('should pass file_exists verification when file exists', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const step = VerificationSteps.fileExists(testFile);
      const result = await executor.executeStep(step);

      expect(result.status).toBe('passed');
    });

    it('should fail file_exists verification when file does not exist', async () => {
      const step = VerificationSteps.fileExists('nonexistent.txt');
      const result = await executor.executeStep(step);

      expect(result.status).toBe('failed');
    });

    it('should pass file_contains verification when file contains text', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Hello World\nAnother line');

      const step = VerificationSteps.fileContains(testFile, 'Hello');
      const result = await executor.executeStep(step);

      expect(result.status).toBe('passed');
    });

    it('should fail file_contains verification when text not found', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Hello World');

      const step = VerificationSteps.fileContains(testFile, 'Goodbye');
      const result = await executor.executeStep(step);

      expect(result.status).toBe('failed');
    });

    it('should pass command_success verification for valid command', async () => {
      const step = VerificationSteps.commandSuccess('echo "test"');
      const result = await executor.executeStep(step);

      expect(result.status).toBe('passed');
    });

    it('should fail command_success verification for invalid command', async () => {
      const step = VerificationSteps.commandSuccess('exit 1');
      const result = await executor.executeStep(step);

      expect(result.status).toBe('failed');
    });
  });

  describe('executeSteps', () => {
    it('should execute multiple steps and return aggregate result', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const steps = [
        VerificationSteps.fileExists(testFile),
        VerificationSteps.fileContains(testFile, 'test'),
        VerificationSteps.commandSuccess('echo "test"'),
      ];

      const result = await executor.executeSteps(steps);

      expect(result.status).toBe('passed');
      expect(result.completedSteps).toBe(3);
      expect(result.totalSteps).toBe(3);
    });

    it('should report failed steps', async () => {
      const steps = [
        VerificationSteps.fileExists('nonexistent.txt'),
        VerificationSteps.commandSuccess('echo "test"'),
      ];

      const result = await executor.executeSteps(steps);

      expect(result.status).toBe('failed');
      expect(result.completedSteps).toBe(2);
    });
  });

  describe('VerificationSteps factory', () => {
    it('should create file_exists step with correct params', () => {
      const step = VerificationSteps.fileExists('/path/to/file.txt', 'Test file');

      expect(step.type).toBe('file_exists');
      expect(step.description).toBe('Test file');
      expect(step.params['path']).toBe('/path/to/file.txt');
      expect(step.status).toBe('pending');
    });

    it('should create file_contains step with correct params', () => {
      const step = VerificationSteps.fileContains('/path/to/file.txt', 'search text', 'Contains text');

      expect(step.type).toBe('file_contains');
      expect(step.description).toBe('Contains text');
      expect(step.params['path']).toBe('/path/to/file.txt');
      expect(step.params['content']).toBe('search text');
    });

    it('should create command_success step with correct params', () => {
      const step = VerificationSteps.commandSuccess('npm test', 'Run tests');

      expect(step.type).toBe('command_success');
      expect(step.description).toBe('Run tests');
      expect(step.params['command']).toBe('npm test');
    });

    it('should create tests_pass step with correct params', () => {
      const step = VerificationSteps.testsPass('src/test.ts', 'vitest');

      expect(step.type).toBe('test_pass');
      expect(step.params['testPath']).toBe('src/test.ts');
      expect(step.params['framework']).toBe('vitest');
    });

    it('should create lint_pass step with correct params', () => {
      const step = VerificationSteps.lintPass(['src/index.ts', 'src/utils.ts']);

      expect(step.type).toBe('lint_pass');
      expect(step.params['files']).toEqual(['src/index.ts', 'src/utils.ts']);
    });

    it('should create type_check step with correct params', () => {
      const step = VerificationSteps.typeCheck('tsconfig.json');

      expect(step.type).toBe('type_check');
      expect(step.params['project']).toBe('tsconfig.json');
    });

    it('should create build_success step with correct params', () => {
      const step = VerificationSteps.buildSuccess('build');

      expect(step.type).toBe('build_success');
      expect(step.params['script']).toBe('build');
    });
  });

  describe('regex verification', () => {
    it('should pass file_contains with regex pattern', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x: number = 42;');

      const step: any = {
        id: 'regex-test',
        type: 'file_contains',
        description: 'Find type annotation',
        params: { path: testFile, regex: ':\\s*(string|number|boolean)' },
        status: 'pending',
      };

      const result = await executor.executeStep(step);
      expect(result.status).toBe('passed');
    });

    it('should fail file_contains with non-matching regex', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 42;');

      const step: any = {
        id: 'regex-test',
        type: 'file_contains',
        description: 'Find type annotation',
        params: { path: testFile, regex: ':\\s*(string|number|boolean)' },
        status: 'pending',
      };

      const result = await executor.executeStep(step);
      expect(result.status).toBe('failed');
    });
  });
});
