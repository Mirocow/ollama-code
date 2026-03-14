/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PythonToolParams } from './index.js';
import { PythonTool } from './index.js';
import type { Config } from '../../../../config/config.js';
import type { ToolResult } from '../../../../tools/tools.js';

// Mock Config
const mockConfig = {
  getTargetDir: () => '/test/project',
  getWorkspaceContext: () => ({
    getDirectories: () => ['/test/project'],
    isPathWithinWorkspace: () => true,
  }),
  getFileSystemService: () => ({
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
  }),
  getShouldUseNodePtyShell: () => false,
  getDebugMode: () => false,
  getSessionId: () => 'test-session',
} as unknown as Config;

describe('PythonTool', () => {
  let tool: PythonTool;

  beforeEach(() => {
    tool = new PythonTool(mockConfig);
  });

  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(PythonTool.Name).toBe('python_dev');
    });

    it('should have correct display name', () => {
      expect(tool.displayName).toBe('PythonDev');
    });

    it('should have description', () => {
      expect(tool.description).toContain('Python development tool');
    });

    it('should have valid parameter schema', () => {
      expect(tool.parameterSchema).toBeDefined();
      expect(tool.parameterSchema.type).toBe('object');
      expect(tool.parameterSchema.properties).toHaveProperty('action');
    });
  });

  describe('Parameter Validation', () => {
    it('should require action parameter', () => {
      const params = {} as PythonToolParams;
      const error = tool.validateToolParams(params);
      expect(error).toBeTruthy();
    });

    it('should validate valid action', () => {
      const params: PythonToolParams = {
        action: 'run',
        script: 'main.py',
      };
      const error = tool.validateToolParams(params);
      expect(error).toBeNull();
    });

    it('should validate invalid action', () => {
      const params: PythonToolParams = {
        action: 'invalid_action' as PythonToolParams['action'],
      };
      const error = tool.validateToolParams(params);
      expect(error).toBeTruthy();
    });

    it('should require script for run action', () => {
      const params: PythonToolParams = {
        action: 'run',
      };
      const error = tool.validateToolParamValues(params);
      expect(error).toBeTruthy();
      expect(error).toContain('script');
    });

    it('should require packages for pip_install action', () => {
      const params: PythonToolParams = {
        action: 'pip_install',
      };
      const error = tool.validateToolParamValues(params);
      expect(error).toBeTruthy();
      expect(error).toContain('packages');
    });

    it('should validate timeout range', () => {
      const params: PythonToolParams = {
        action: 'run',
        script: 'main.py',
        timeout: 700000, // Exceeds max
      };
      const error = tool.validateToolParamValues(params);
      expect(error).toBeTruthy();
      expect(error).toContain('timeout');
    });

    it('should validate directory is within workspace', () => {
      const params: PythonToolParams = {
        action: 'run',
        script: 'main.py',
        directory: '/outside/workspace',
      };
      const error = tool.validateToolParamValues(params);
      expect(error).toBeTruthy();
      expect(error).toContain('workspace');
    });
  });

  describe('Action Types', () => {
    const validActions = [
      'run',
      'r',
      'exec',
      'e',
      'test',
      't',
      'lint',
      'l',
      'format',
      'f',
      'venv_create',
      'venv_activate',
      'pip_install',
      'pip_list',
      'pip_freeze',
      'mypy',
      'custom',
    ];

    validActions.forEach((action) => {
      it(`should accept '${action}' action`, () => {
        const params: PythonToolParams = { action: action as PythonToolParams['action'] };
        // Add required params for specific actions
        if (action === 'run' || action === 'r') params.script = 'main.py';
        if (action === 'exec' || action === 'e') params.code = 'print("hello")';
        if (action === 'pip_install') params.packages = ['requests'];
        if (action === 'custom') params.command = 'echo test';

        const error = tool.validateToolParamValues(params);
        expect(error).toBeNull();
      });
    });
  });
});

describe('PythonToolInvocation', () => {
  it('should build correct command for run action', async () => {
    const tool = new PythonTool(mockConfig);
    const params: PythonToolParams = {
      action: 'run',
      script: 'main.py',
      args: ['--verbose'],
    };

    const invocation = tool['createInvocation'](params);
    expect(invocation.getDescription()).toContain('main.py');
  });

  it('should build correct command for test action', async () => {
    const tool = new PythonTool(mockConfig);
    const params: PythonToolParams = {
      action: 'test',
      test_pattern: 'tests/unit/',
    };

    const invocation = tool['createInvocation'](params);
    expect(invocation.getDescription()).toContain('test');
  });

  it('should build correct command for venv_create action', async () => {
    const tool = new PythonTool(mockConfig);
    const params: PythonToolParams = {
      action: 'venv_create',
      venv: '.venv',
    };

    const invocation = tool['createInvocation'](params);
    expect(invocation.getDescription()).toContain('venv');
  });

  it('should accept exec action for inline code execution', async () => {
    const tool = new PythonTool(mockConfig);
    const params: PythonToolParams = {
      action: 'exec',
      code: 'print([x*3 for x in range(1,101) if x%3==0][:10])',
    };

    const error = tool.validateToolParamValues(params);
    expect(error).toBeNull();

    const invocation = tool['createInvocation'](params);
    expect(invocation.getDescription()).toContain('exec');
  });

  it('should require code for exec action', async () => {
    const tool = new PythonTool(mockConfig);
    const params: PythonToolParams = {
      action: 'exec',
    };

    const error = tool.validateToolParamValues(params);
    expect(error).toBeTruthy();
    expect(error).toContain('code');
  });

  it('should accept exec alias "e"', async () => {
    const tool = new PythonTool(mockConfig);
    const params: PythonToolParams = {
      action: 'e',
      code: 'print("hello")',
    };

    const error = tool.validateToolParamValues(params);
    expect(error).toBeNull();
  });

  it('should build correct description for exec action', async () => {
    const tool = new PythonTool(mockConfig);
    const params: PythonToolParams = {
      action: 'exec',
      code: 'print("hello world")',
      description: 'Quick print test',
    };

    const invocation = tool['createInvocation'](params);
    const description = invocation.getDescription();
    expect(description).toContain('exec');
    expect(description).toContain('Quick print test');
  });
});
