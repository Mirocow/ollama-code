/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Verification System
 * Execute verification steps for tasks and plans
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import type {
  VerificationStep,
  VerificationResult,
  VerificationStatus,
} from './types.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const execAsync = promisify(exec);
const debugLogger = createDebugLogger('VERIFICATION');

// ============================================================================
// Verification Executor
// ============================================================================

/**
 * Verification executor - runs verification steps
 */
export class VerificationExecutor {
  private workingDirectory: string;
  private timeout: number;

  constructor(options?: { workingDirectory?: string; timeout?: number }) {
    this.workingDirectory = options?.workingDirectory || process.cwd();
    this.timeout = options?.timeout || 60000; // 1 minute default
  }

  /**
   * Execute a single verification step
   */
  async executeStep(step: VerificationStep): Promise<VerificationStep> {
    const startTime = Date.now();
    const updatedStep: VerificationStep = {
      ...step,
      status: 'running' as VerificationStatus,
      timestamp: new Date().toISOString(),
    };

    try {
      debugLogger.info(`[Verification] Executing step ${step.id}: ${step.type}`);

      switch (step.type) {
        case 'file_exists':
          await this.verifyFileExists(step.params);
          break;
        case 'file_contains':
          await this.verifyFileContains(step.params);
          break;
        case 'command_success':
          await this.verifyCommandSuccess(step.params);
          break;
        case 'test_pass':
          await this.verifyTestPass(step.params);
          break;
        case 'lint_pass':
          await this.verifyLintPass(step.params);
          break;
        case 'type_check':
          await this.verifyTypeCheck(step.params);
          break;
        case 'build_success':
          await this.verifyBuildSuccess(step.params);
          break;
        case 'custom':
          await this.verifyCustom(step.params);
          break;
        default:
          throw new Error(`Unknown verification type: ${step.type}`);
      }

      updatedStep.status = 'passed';
      updatedStep.result = `Verification passed in ${Date.now() - startTime}ms`;

      debugLogger.info(`[Verification] Step ${step.id} passed`);
    } catch (error) {
      updatedStep.status = 'failed';
      updatedStep.result = error instanceof Error ? error.message : String(error);

      debugLogger.warn(`[Verification] Step ${step.id} failed:`, updatedStep.result);
    }

    return updatedStep;
  }

  /**
   * Execute multiple verification steps
   */
  async executeSteps(steps: VerificationStep[]): Promise<VerificationResult> {
    const updatedSteps: VerificationStep[] = [];
    let completedSteps = 0;
    let allPassed = true;

    for (const step of steps) {
      if (step.status === 'skipped') {
        updatedSteps.push(step);
        continue;
      }

      const result = await this.executeStep(step);
      updatedSteps.push(result);

      if (result.status === 'passed') {
        completedSteps++;
      } else if (result.status === 'failed') {
        completedSteps++;
        allPassed = false;
      }
    }

    return {
      status: allPassed ? 'passed' : 'failed',
      completedSteps,
      totalSteps: steps.filter(s => s.status !== 'skipped').length,
      steps: updatedSteps,
      summary: allPassed
        ? `All ${completedSteps} verification steps passed`
        : `Verification failed: ${updatedSteps.filter(s => s.status === 'failed').length} of ${completedSteps} steps failed`,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // Verification Implementations
  // ============================================================================

  private async verifyFileExists(params: Record<string, unknown>): Promise<void> {
    const filePath = params['path'] as string;
    if (!filePath) throw new Error('File path not specified');

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workingDirectory, filePath);

    try {
      await fs.access(absolutePath);
    } catch {
      throw new Error(`File does not exist: ${filePath}`);
    }
  }

  private async verifyFileContains(params: Record<string, unknown>): Promise<void> {
    const filePath = params['path'] as string;
    const content = params['content'] as string;
    const regex = params['regex'] as string | undefined;

    if (!filePath || (!content && !regex)) {
      throw new Error('File path and content/regex required');
    }

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workingDirectory, filePath);

    const fileContent = await fs.readFile(absolutePath, 'utf-8');

    if (regex) {
      const re = new RegExp(regex, 'gm');
      if (!re.test(fileContent)) {
        throw new Error(`File does not match pattern: ${regex}`);
      }
    } else if (!fileContent.includes(content!)) {
      throw new Error(`File does not contain: ${content}`);
    }
  }

  private async verifyCommandSuccess(params: Record<string, unknown>): Promise<void> {
    const command = params['command'] as string;
    const expectedExitCode = (params['exitCode'] as number) ?? 0;

    if (!command) throw new Error('Command not specified');

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workingDirectory,
        timeout: this.timeout,
      });

      debugLogger.debug(`[Verification] Command output: ${stdout || stderr}`);
    } catch (error) {
      const execError = error as { code?: number; stderr?: string };
      if (execError.code !== expectedExitCode) {
        throw new Error(
          `Command failed with exit code ${execError.code}: ${execError.stderr || 'Unknown error'}`
        );
      }
    }
  }

  private async verifyTestPass(params: Record<string, unknown>): Promise<void> {
    const testPath = params['testPath'] as string | undefined;
    const framework = (params['framework'] as string) || 'auto';

    let command: string;

    if (framework === 'auto') {
      command = testPath ? `npm test -- ${testPath}` : 'npm test';
    } else if (framework === 'vitest') {
      command = testPath ? `npx vitest run ${testPath}` : 'npx vitest run';
    } else if (framework === 'jest') {
      command = testPath ? `npx jest ${testPath}` : 'npx jest';
    } else if (framework === 'pytest') {
      command = testPath ? `pytest ${testPath}` : 'pytest';
    } else {
      command = testPath ? `${framework} ${testPath}` : framework;
    }

    await this.verifyCommandSuccess({ command, exitCode: 0 });
  }

  private async verifyLintPass(params: Record<string, unknown>): Promise<void> {
    const files = params['files'] as string | string[] | undefined;
    const fix = params['fix'] as boolean;

    let command = 'npm run lint';
    if (fix) command += ' -- --fix';
    if (files) {
      const fileList = Array.isArray(files) ? files.join(' ') : files;
      command += ` -- ${fileList}`;
    }

    await this.verifyCommandSuccess({ command, exitCode: 0 });
  }

  private async verifyTypeCheck(params: Record<string, unknown>): Promise<void> {
    const project = params['project'] as string | undefined;
    
    let command = 'npx tsc --noEmit';
    if (project) command += ` --project ${project}`;

    await this.verifyCommandSuccess({ command, exitCode: 0 });
  }

  private async verifyBuildSuccess(params: Record<string, unknown>): Promise<void> {
    const script = (params['script'] as string) || 'build';
    
    await this.verifyCommandSuccess({ command: `npm run ${script}`, exitCode: 0 });
  }

  private async verifyCustom(params: Record<string, unknown>): Promise<void> {
    const command = params['command'] as string;

    if (command) {
      await this.verifyCommandSuccess({ command, exitCode: 0 });
    } else {
      throw new Error('Custom verification requires command parameter');
    }
  }
}

// ============================================================================
// Verification Step Factories
// ============================================================================

export const VerificationSteps = {
  fileExists(filePath: string, description?: string): VerificationStep {
    return {
      id: `file_exists_${Date.now()}`,
      type: 'file_exists',
      description: description || `File ${filePath} should exist`,
      params: { path: filePath },
      status: 'pending',
    };
  },

  fileContains(filePath: string, content: string, description?: string): VerificationStep {
    return {
      id: `file_contains_${Date.now()}`,
      type: 'file_contains',
      description: description || `File ${filePath} should contain content`,
      params: { path: filePath, content },
      status: 'pending',
    };
  },

  commandSuccess(command: string, description?: string): VerificationStep {
    return {
      id: `command_${Date.now()}`,
      type: 'command_success',
      description: description || `Command should succeed: ${command}`,
      params: { command },
      status: 'pending',
    };
  },

  testsPass(testPath?: string, framework?: string): VerificationStep {
    return {
      id: `tests_${Date.now()}`,
      type: 'test_pass',
      description: testPath
        ? `Tests should pass in ${testPath}`
        : 'All tests should pass',
      params: { testPath, framework },
      status: 'pending',
    };
  },

  lintPass(files?: string | string[]): VerificationStep {
    return {
      id: `lint_${Date.now()}`,
      type: 'lint_pass',
      description: files
        ? `Linting should pass for ${Array.isArray(files) ? files.join(', ') : files}`
        : 'Linting should pass',
      params: { files },
      status: 'pending',
    };
  },

  typeCheck(project?: string): VerificationStep {
    return {
      id: `typecheck_${Date.now()}`,
      type: 'type_check',
      description: project
        ? `Type check should pass for ${project}`
        : 'Type check should pass',
      params: { project },
      status: 'pending',
    };
  },

  buildSuccess(script?: string): VerificationStep {
    return {
      id: `build_${Date.now()}`,
      type: 'build_success',
      description: script
        ? `Build script ${script} should succeed`
        : 'Build should succeed',
      params: { script },
      status: 'pending',
    };
  },
};

export default VerificationExecutor;
