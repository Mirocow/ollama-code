/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import {
  PluginSandbox,
  createPluginSandbox,
  createBuiltinSandbox,
  createTrustedSandbox,
  createUntrustedSandbox,
  SandboxViolationError,
  DEFAULT_RESOURCE_LIMITS,
  UNTRUSTED_PLUGIN_CONFIG,
  TRUSTED_PLUGIN_CONFIG,
  BUILTIN_PLUGIN_CONFIG,
} from './pluginSandbox.js';

describe('PluginSandbox', () => {
  const testWorkingDir = '/test/project';
  const testTempDir = '/test/temp';

  describe('Constructor', () => {
    it('should create sandbox with default config for untrusted plugin', () => {
      const sandbox = new PluginSandbox(
        { pluginId: 'test-plugin', pluginVersion: '1.0.0' },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.getContext().workingDirectory).toBe(testWorkingDir);
      expect(sandbox.getContext().tempDirectory).toBe(testTempDir);
      expect(sandbox.isActive()).toBe(false);
    });

    it('should create sandbox with custom config', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'custom-plugin',
          pluginVersion: '2.0.0',
          filesystem: [{ pattern: '/custom/**', access: 'read' }],
          limits: {
            timeout: 60000,
            maxMemory: 0,
            maxFileSize: 0,
            maxConcurrentOps: 10,
          },
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.getLimits().timeout).toBe(60000);
    });
  });

  describe('Trust Levels', () => {
    it('should apply untrusted defaults', () => {
      const sandbox = createUntrustedSandbox(
        'untrusted-plugin',
        '1.0.0',
        testWorkingDir,
      );

      // Untrusted plugins should have limited network access
      expect(
        sandbox.canMakeRequest('https://api.github.com/repos/test', 'GET'),
      ).toBe(true);
      expect(sandbox.canMakeRequest('https://malicious-site.com', 'GET')).toBe(
        false,
      );
    });

    it('should apply trusted defaults', () => {
      const sandbox = createTrustedSandbox(
        'trusted-plugin',
        '1.0.0',
        testWorkingDir,
      );

      // Trusted plugins should have broader network access
      expect(sandbox.canMakeRequest('https://any-site.com', 'GET')).toBe(true);
      expect(sandbox.canMakeRequest('https://any-site.com', 'POST')).toBe(true);
    });

    it('should apply builtin defaults', () => {
      const sandbox = createBuiltinSandbox('builtin-plugin', '1.0.0');

      // Builtin plugins should have full access
      expect(sandbox.canMakeRequest('https://any-site.com', 'DELETE')).toBe(
        true,
      );
      expect(sandbox.canExecuteCommand('rm', ['-rf', '/'])).toBe(true);
    });
  });

  describe('Filesystem Access Control', () => {
    it('should allow read access to permitted paths', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          filesystem: [{ pattern: '${workingDir}/**', access: 'read' }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canReadFile(`${testWorkingDir}/file.txt`)).toBe(true);
      expect(sandbox.canReadFile(`${testWorkingDir}/src/index.ts`)).toBe(true);
    });

    it('should deny read access to non-permitted paths', () => {
      const sandbox = createUntrustedSandbox('test', '1.0.0', testWorkingDir);

      // Should record a violation
      const violations = sandbox.getViolations();
      sandbox.canReadFile('/etc/passwd');
      expect(sandbox.getViolations().length).toBeGreaterThan(violations.length);
    });

    it('should allow write access to permitted paths', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          filesystem: [{ pattern: '${tempDir}/**', access: 'write' }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canWriteFile(`${testTempDir}/output.txt`)).toBe(true);
      expect(sandbox.canWriteFile(`${testWorkingDir}/file.txt`)).toBe(false);
    });

    it('should deny write access to read-only paths', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          filesystem: [{ pattern: '${workingDir}/**', access: 'read' }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canReadFile(`${testWorkingDir}/file.txt`)).toBe(true);
      expect(sandbox.canWriteFile(`${testWorkingDir}/file.txt`)).toBe(false);
    });

    it('should deny delete access for non-full permissions', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          filesystem: [{ pattern: '${workingDir}/**', access: 'write' }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canWriteFile(`${testWorkingDir}/file.txt`)).toBe(true);
      expect(sandbox.canDeleteFile(`${testWorkingDir}/file.txt`)).toBe(false);
    });
  });

  describe('Network Access Control', () => {
    it('should allow requests to permitted domains', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          network: [
            { domain: 'api.github.com', methods: ['GET', 'POST'] },
            { domain: '*.npmjs.org', methods: ['GET'] },
          ],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(
        sandbox.canMakeRequest('https://api.github.com/repos', 'GET'),
      ).toBe(true);
      expect(
        sandbox.canMakeRequest('https://api.github.com/repos', 'POST'),
      ).toBe(true);
      expect(
        sandbox.canMakeRequest('https://registry.npmjs.org/package', 'GET'),
      ).toBe(true);
    });

    it('should deny requests to non-permitted domains', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          network: [{ domain: 'api.github.com', methods: ['GET'] }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canMakeRequest('https://malicious.com', 'GET')).toBe(
        false,
      );
    });

    it('should deny non-permitted methods', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          network: [{ domain: 'api.github.com', methods: ['GET'] }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(
        sandbox.canMakeRequest('https://api.github.com/repos', 'GET'),
      ).toBe(true);
      expect(
        sandbox.canMakeRequest('https://api.github.com/repos', 'DELETE'),
      ).toBe(false);
    });

    it('should check port restrictions', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          network: [{ domain: 'example.com', ports: [443], methods: ['GET'] }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canMakeRequest('https://example.com/api', 'GET')).toBe(
        true,
      );
      expect(sandbox.canMakeRequest('http://example.com:8080/api', 'GET')).toBe(
        false,
      );
    });

    it('should allow wildcard domain matching', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          network: [{ domain: '*.example.com', methods: ['GET'] }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canMakeRequest('https://api.example.com', 'GET')).toBe(
        true,
      );
      expect(sandbox.canMakeRequest('https://sub.api.example.com', 'GET')).toBe(
        true,
      );
      expect(sandbox.canMakeRequest('https://other.com', 'GET')).toBe(false);
    });
  });

  describe('Command Execution Control', () => {
    it('should allow permitted commands', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          commands: [
            { command: 'npm', allowArgs: true },
            { command: 'git', allowArgs: false },
          ],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canExecuteCommand('npm', ['install'])).toBe(true);
      expect(sandbox.canExecuteCommand('git', [])).toBe(true);
      expect(sandbox.canExecuteCommand('git', ['status'])).toBe(false);
    });

    it('should deny non-permitted commands', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          commands: [{ command: 'npm', allowArgs: true }],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canExecuteCommand('rm', ['-rf'])).toBe(false);
      expect(sandbox.canExecuteCommand('/bin/bash', ['-c', 'malicious'])).toBe(
        false,
      );
    });

    it('should check argument patterns', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          commands: [
            {
              command: 'npm',
              allowArgs: true,
              allowedArgPatterns: ['install', 'run', 'test'],
            },
          ],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canExecuteCommand('npm', ['install'])).toBe(true);
      expect(sandbox.canExecuteCommand('npm', ['run', 'build'])).toBe(true);
      expect(sandbox.canExecuteCommand('npm', ['exec', 'malicious'])).toBe(
        false,
      );
    });
  });

  describe('Environment Variable Access', () => {
    it('should allow access to permitted env vars', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          allowedEnvVars: ['PATH', 'HOME', 'NODE_*'],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canAccessEnvVar('PATH')).toBe(true);
      expect(sandbox.canAccessEnvVar('HOME')).toBe(true);
      expect(sandbox.canAccessEnvVar('NODE_ENV')).toBe(true);
    });

    it('should deny access to non-permitted env vars', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          allowedEnvVars: ['PATH'],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canAccessEnvVar('SECRET_API_KEY')).toBe(false);
    });

    it('should allow wildcard env var access', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          allowedEnvVars: ['*'],
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.canAccessEnvVar('ANY_VAR')).toBe(true);
    });
  });

  describe('Resource Limits', () => {
    it('should enforce file size limits', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          limits: { ...DEFAULT_RESOURCE_LIMITS, maxFileSize: 1024 * 1024 }, // 1MB
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.isFileSizeAllowed(1024)).toBe(true); // 1KB
      expect(sandbox.isFileSizeAllowed(2 * 1024 * 1024)).toBe(false); // 2MB
    });

    it('should allow unlimited file size when maxFileSize is 0', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          limits: { ...DEFAULT_RESOURCE_LIMITS, maxFileSize: 0 },
        },
        testWorkingDir,
        testTempDir,
      );

      expect(sandbox.isFileSizeAllowed(Number.MAX_SAFE_INTEGER)).toBe(true);
    });
  });

  describe('Violation Tracking', () => {
    it('should record violations', () => {
      const sandbox = createUntrustedSandbox('test', '1.0.0', testWorkingDir);

      sandbox.canReadFile('/etc/passwd');
      sandbox.canMakeRequest('https://malicious.com', 'GET');

      const violations = sandbox.getViolations();
      expect(violations.length).toBe(2);
      expect(violations[0].type).toBe('filesystem_read');
      expect(violations[1].type).toBe('network_request');
    });

    it('should call violation callbacks', () => {
      const sandbox = createUntrustedSandbox('test', '1.0.0', testWorkingDir);
      const callback = vi.fn();

      sandbox.onViolation(callback);
      sandbox.canReadFile('/etc/passwd');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'filesystem_read',
          pluginId: 'test',
        }),
      );
    });

    it('should clear violations', () => {
      const sandbox = createUntrustedSandbox('test', '1.0.0', testWorkingDir);

      sandbox.canReadFile('/etc/passwd');
      expect(sandbox.getViolations().length).toBeGreaterThan(0);

      sandbox.clearViolations();
      expect(sandbox.getViolations().length).toBe(0);
    });
  });

  describe('Sandbox Lifecycle', () => {
    it('should start inactive', () => {
      const sandbox = createPluginSandbox('test', '1.0.0');
      expect(sandbox.isActive()).toBe(false);
    });

    it('should activate and deactivate', () => {
      const sandbox = createPluginSandbox('test', '1.0.0');

      sandbox.activate();
      expect(sandbox.isActive()).toBe(true);

      sandbox.deactivate();
      expect(sandbox.isActive()).toBe(false);
    });
  });

  describe('Context Access', () => {
    it('should provide isolated environment', () => {
      const sandbox = new PluginSandbox(
        {
          pluginId: 'test',
          pluginVersion: '1.0.0',
          allowedEnvVars: ['PATH', 'HOME'],
        },
        testWorkingDir,
        testTempDir,
      );

      const env = sandbox.getEnvironment();
      expect(env.PATH).toBeDefined();
      expect(env.HOME).toBeDefined();
      expect(env.SECRET_KEY).toBeUndefined();
    });

    it('should provide working and temp directories', () => {
      const sandbox = createPluginSandbox('test', '1.0.0', {
        workingDir: testWorkingDir,
        tempDir: testTempDir,
      });

      expect(sandbox.getWorkingDirectory()).toBe(testWorkingDir);
      expect(sandbox.getTempDirectory()).toBe(testTempDir);
    });
  });
});

describe('SandboxViolationError', () => {
  it('should create error with violation info', () => {
    const violation = {
      type: 'filesystem_read' as const,
      pluginId: 'test-plugin',
      resource: '/etc/passwd',
      timestamp: new Date(),
    };

    const error = new SandboxViolationError(violation);

    expect(error.name).toBe('SandboxViolationError');
    expect(error.message).toContain('filesystem_read');
    expect(error.message).toContain('/etc/passwd');
    expect(error.message).toContain('test-plugin');
    expect(error.violation).toBe(violation);
  });
});

describe('Default Configurations', () => {
  it('should have valid default resource limits', () => {
    expect(DEFAULT_RESOURCE_LIMITS.timeout).toBeGreaterThan(0);
    expect(DEFAULT_RESOURCE_LIMITS.maxMemory).toBeGreaterThan(0);
    expect(DEFAULT_RESOURCE_LIMITS.maxFileSize).toBeGreaterThan(0);
    expect(DEFAULT_RESOURCE_LIMITS.maxConcurrentOps).toBeGreaterThan(0);
  });

  it('should have restricted config for untrusted plugins', () => {
    expect(UNTRUSTED_PLUGIN_CONFIG.trustLevel).toBe('untrusted');
    expect(UNTRUSTED_PLUGIN_CONFIG.commands).toHaveLength(0);
    expect(UNTRUSTED_PLUGIN_CONFIG.limits?.timeout).toBeLessThan(
      DEFAULT_RESOURCE_LIMITS.timeout,
    );
  });

  it('should have broader config for trusted plugins', () => {
    expect(TRUSTED_PLUGIN_CONFIG.trustLevel).toBe('trusted');
    expect(TRUSTED_PLUGIN_CONFIG.filesystem).toBeDefined();
    expect(TRUSTED_PLUGIN_CONFIG.network).toBeDefined();
  });

  it('should have full access for builtin plugins', () => {
    expect(BUILTIN_PLUGIN_CONFIG.trustLevel).toBe('builtin');
    expect(BUILTIN_PLUGIN_CONFIG.filesystem?.[0].access).toBe('full');
    expect(BUILTIN_PLUGIN_CONFIG.network?.[0].domain).toBe('*');
    expect(BUILTIN_PLUGIN_CONFIG.commands?.[0].command).toBe('*');
  });
});
