/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { doesToolInvocationMatch, isToolEnabled } from './tool-utils.js';
import type { AnyToolInvocation, Config } from '../index.js';
import { ReadFileTool } from '../plugins/builtin/file-tools/read-file/index.js';
import { DynamicAliases } from '../tools/tool-names.js';

// Tool names - these are the canonical tool names used by the system
const TOOL_NAMES = {
  SHELL: 'run_shell_command',
  GREP: 'grep_search',
  GLOB: 'glob',
  READ_FILE: 'read_file',
} as const;

describe('doesToolInvocationMatch', () => {
  it('should not match a partial command prefix', () => {
    const invocation = {
      params: { command: 'git commitsomething' },
    } as AnyToolInvocation;
    const patterns = ['ShellTool(git commit)'];
    const result = doesToolInvocationMatch(
      'run_shell_command',
      invocation,
      patterns,
    );
    expect(result).toBe(false);
  });

  it('should match an exact command', () => {
    const invocation = {
      params: { command: 'git status' },
    } as AnyToolInvocation;
    const patterns = ['ShellTool(git status)'];
    const result = doesToolInvocationMatch(
      'run_shell_command',
      invocation,
      patterns,
    );
    expect(result).toBe(true);
  });

  it('should match a command that is a prefix', () => {
    const invocation = {
      params: { command: 'git status -v' },
    } as AnyToolInvocation;
    const patterns = ['ShellTool(git status)'];
    const result = doesToolInvocationMatch(
      'run_shell_command',
      invocation,
      patterns,
    );
    expect(result).toBe(true);
  });

  describe('for non-shell tools', () => {
    const readFileTool = new ReadFileTool({} as Config);
    const invocation = {
      params: { file: 'test.txt' },
    } as AnyToolInvocation;

    it('should match by tool name', () => {
      const patterns = ['read_file'];
      const result = doesToolInvocationMatch(
        readFileTool,
        invocation,
        patterns,
      );
      expect(result).toBe(true);
    });

    it('should match by tool class name', () => {
      const patterns = ['ReadFileTool'];
      const result = doesToolInvocationMatch(
        readFileTool,
        invocation,
        patterns,
      );
      expect(result).toBe(true);
    });

    it('should not match if neither name is in the patterns', () => {
      const patterns = ['some_other_tool', 'AnotherToolClass'];
      const result = doesToolInvocationMatch(
        readFileTool,
        invocation,
        patterns,
      );
      expect(result).toBe(false);
    });

    it('should match by tool name when passed as a string', () => {
      const patterns = ['read_file'];
      const result = doesToolInvocationMatch('read_file', invocation, patterns);
      expect(result).toBe(true);
    });
  });
});

describe('isToolEnabled', () => {
  // Store original aliases to restore after tests
  let originalAliases: Record<string, string>;

  beforeEach(() => {
    // Save original aliases
    originalAliases = { ...DynamicAliases };
    // Clear and set up test aliases
    Object.keys(DynamicAliases).forEach((key) => delete DynamicAliases[key]);

    // Register test aliases (simulating what plugins would do)
    // Note: DynamicAliases keys are stored in lowercase (see registerPluginAliases)
    // Shell aliases
    DynamicAliases['shell'] = 'run_shell_command';
    DynamicAliases['shelltool'] = 'run_shell_command';
    DynamicAliases['_shelltool'] = 'run_shell_command';

    // Grep aliases
    DynamicAliases['searchfiles'] = 'grep_search';
    DynamicAliases['search_file_content'] = 'grep_search';

    // Glob aliases
    DynamicAliases['findfiles'] = 'glob';
  });

  afterEach(() => {
    // Restore original aliases
    Object.keys(DynamicAliases).forEach((key) => delete DynamicAliases[key]);
    Object.assign(DynamicAliases, originalAliases);
  });

  it('enables tool when coreTools is undefined and tool is not excluded', () => {
    expect(isToolEnabled(TOOL_NAMES.SHELL, undefined, undefined)).toBe(true);
  });

  it('disables tool when excluded by canonical tool name', () => {
    expect(
      isToolEnabled(TOOL_NAMES.SHELL, undefined, ['run_shell_command']),
    ).toBe(false);
  });

  it('enables tool when explicitly listed by display name (via alias)', () => {
    // Note: aliases are stored in lowercase
    expect(isToolEnabled(TOOL_NAMES.SHELL, ['Shell'], undefined)).toBe(true);
  });

  it('enables tool when explicitly listed by class name (via alias)', () => {
    // Note: aliases are stored in lowercase
    expect(isToolEnabled(TOOL_NAMES.SHELL, ['ShellTool'], undefined)).toBe(
      true,
    );
  });

  it('supports class names with leading underscores (via alias)', () => {
    // Note: aliases are stored in lowercase, underscore is removed by normalizeIdentifier
    expect(isToolEnabled(TOOL_NAMES.SHELL, ['_ShellTool'], undefined)).toBe(
      true,
    );
  });

  it('enables tool when coreTools contains a legacy tool name alias', () => {
    expect(
      isToolEnabled(TOOL_NAMES.GREP, ['search_file_content'], undefined),
    ).toBe(true);
  });

  it('enables tool when coreTools contains a legacy display name alias', () => {
    // Note: aliases are stored in lowercase
    expect(isToolEnabled(TOOL_NAMES.GLOB, ['FindFiles'], undefined)).toBe(true);
  });

  it('enables tool when coreTools contains the canonical name', () => {
    expect(
      isToolEnabled(TOOL_NAMES.SHELL, ['run_shell_command'], undefined),
    ).toBe(true);
  });

  it('disables tool when not present in coreTools', () => {
    expect(isToolEnabled(TOOL_NAMES.SHELL, ['Edit'], undefined)).toBe(false);
  });

  it('uses legacy display name aliases when excluding tools', () => {
    // Note: aliases are stored in lowercase
    expect(isToolEnabled(TOOL_NAMES.GREP, undefined, ['SearchFiles'])).toBe(
      false,
    );
  });

  it('does not treat argument-specific exclusions as matches for enabling', () => {
    // Argument-specific patterns like 'Shell(git status)' should NOT
    // enable a tool because they're filtered out as patterns, not names
    expect(
      isToolEnabled(TOOL_NAMES.SHELL, undefined, ['Shell(git status)']),
    ).toBe(true);
  });

  it('considers excludeTools even when tool is explicitly enabled', () => {
    expect(
      isToolEnabled(TOOL_NAMES.SHELL, ['Shell'], ['run_shell_command']),
    ).toBe(false);
  });
});
