/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  ApprovalMode,
  APPROVAL_MODES,
  APPROVAL_MODE_INFO,
  MCPServerConfig,
  isSdkMcpServerConfig,
  AuthProviderType,
  DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD,
  DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES,
} from './config.js';

describe('ApprovalMode', () => {
  it('should have PLAN mode', () => {
    expect(ApprovalMode.PLAN).toBe('plan');
  });

  it('should have DEFAULT mode', () => {
    expect(ApprovalMode.DEFAULT).toBe('default');
  });

  it('should have AUTO_EDIT mode', () => {
    expect(ApprovalMode.AUTO_EDIT).toBe('auto-edit');
  });

  it('should have YOLO mode', () => {
    expect(ApprovalMode.YOLO).toBe('yolo');
  });

  it('should have exactly four modes', () => {
    expect(Object.values(ApprovalMode)).toHaveLength(4);
  });
});

describe('APPROVAL_MODES', () => {
  it('should contain all approval modes', () => {
    expect(APPROVAL_MODES).toContain('plan');
    expect(APPROVAL_MODES).toContain('default');
    expect(APPROVAL_MODES).toContain('auto-edit');
    expect(APPROVAL_MODES).toContain('yolo');
  });

  it('should have length of 4', () => {
    expect(APPROVAL_MODES).toHaveLength(4);
  });
});

describe('APPROVAL_MODE_INFO', () => {
  it('should have info for PLAN mode', () => {
    expect(APPROVAL_MODE_INFO[ApprovalMode.PLAN].name).toBe('Plan');
    expect(APPROVAL_MODE_INFO[ApprovalMode.PLAN].description).toContain('Analyze only');
  });

  it('should have info for DEFAULT mode', () => {
    expect(APPROVAL_MODE_INFO[ApprovalMode.DEFAULT].name).toBe('Default');
    expect(APPROVAL_MODE_INFO[ApprovalMode.DEFAULT].description).toContain('Require approval');
  });

  it('should have info for AUTO_EDIT mode', () => {
    expect(APPROVAL_MODE_INFO[ApprovalMode.AUTO_EDIT].name).toBe('Auto Edit');
    expect(APPROVAL_MODE_INFO[ApprovalMode.AUTO_EDIT].description).toContain('Automatically approve file edits');
  });

  it('should have info for YOLO mode', () => {
    expect(APPROVAL_MODE_INFO[ApprovalMode.YOLO].name).toBe('YOLO');
    expect(APPROVAL_MODE_INFO[ApprovalMode.YOLO].description).toContain('Automatically approve all');
  });

  it('should have matching id for each mode', () => {
    for (const mode of APPROVAL_MODES) {
      expect(APPROVAL_MODE_INFO[mode].id).toBe(mode);
    }
  });
});

describe('MCPServerConfig', () => {
  it('should create with minimal options', () => {
    const config = new MCPServerConfig();
    expect(config.command).toBeUndefined();
    expect(config.url).toBeUndefined();
  });

  it('should create with stdio transport options', () => {
    const config = new MCPServerConfig(
      'node',
      ['server.js'],
      { NODE_ENV: 'production' },
      '/app',
    );

    expect(config.command).toBe('node');
    expect(config.args).toEqual(['server.js']);
    expect(config.env).toEqual({ NODE_ENV: 'production' });
    expect(config.cwd).toBe('/app');
  });

  it('should create with SSE transport options', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      'http://localhost:8080/sse',
    );

    expect(config.url).toBe('http://localhost:8080/sse');
    expect(config.command).toBeUndefined();
  });

  it('should create with HTTP transport options', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'http://localhost:8080/mcp',
    );

    expect(config.httpUrl).toBe('http://localhost:8080/mcp');
  });

  it('should create with headers', () => {
    const headers = { Authorization: 'Bearer token' };
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      headers,
    );

    expect(config.headers).toEqual(headers);
  });

  it('should create with timeout and trust', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined, // tcp
      30000, // timeout
      true, // trust
    );

    expect(config.timeout).toBe(30000);
    expect(config.trust).toBe(true);
  });

  it('should create with description and tools', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined, // tcp
      undefined, // timeout
      undefined, // trust
      'Test server', // description
      ['tool1', 'tool2'], // includeTools
      ['tool3'], // excludeTools
    );

    expect(config.description).toBe('Test server');
    expect(config.includeTools).toEqual(['tool1', 'tool2']);
    expect(config.excludeTools).toEqual(['tool3']);
  });

  it('should create with extension name', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined, // tcp
      undefined, // timeout
      undefined, // trust
      undefined, // description
      undefined, // includeTools
      undefined, // excludeTools
      'my-extension',
    );

    expect(config.extensionName).toBe('my-extension');
  });

  it('should create with OAuth config', () => {
    const oauthConfig = { clientId: 'test', clientSecret: 'secret' };
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined, // tcp
      undefined, // timeout
      undefined, // trust
      undefined, // description
      undefined, // includeTools
      undefined, // excludeTools
      undefined, // extensionName
      oauthConfig,
    );

    expect(config.oauth).toEqual(oauthConfig);
  });

  it('should create with authProviderType', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined, // tcp
      undefined, // timeout
      undefined, // trust
      undefined, // description
      undefined, // includeTools
      undefined, // excludeTools
      undefined, // extensionName
      undefined, // oauth
      AuthProviderType.DYNAMIC_DISCOVERY,
    );

    expect(config.authProviderType).toBe(AuthProviderType.DYNAMIC_DISCOVERY);
  });

  it('should create with target audience', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined, // tcp
      undefined, // timeout
      undefined, // trust
      undefined, // description
      undefined, // includeTools
      undefined, // excludeTools
      undefined, // extensionName
      undefined, // oauth
      undefined, // authProviderType
      'audience.apps.googleusercontent.com',
    );

    expect(config.targetAudience).toBe('audience.apps.googleusercontent.com');
  });

  it('should create with target service account', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined, // tcp
      undefined, // timeout
      undefined, // trust
      undefined, // description
      undefined, // includeTools
      undefined, // excludeTools
      undefined, // extensionName
      undefined, // oauth
      undefined, // authProviderType
      undefined, // targetAudience
      'sa@project.iam.gserviceaccount.com',
    );

    expect(config.targetServiceAccount).toBe('sa@project.iam.gserviceaccount.com');
  });

  it('should create with SDK type', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined, // tcp
      undefined, // timeout
      undefined, // trust
      undefined, // description
      undefined, // includeTools
      undefined, // excludeTools
      undefined, // extensionName
      undefined, // oauth
      undefined, // authProviderType
      undefined, // targetAudience
      undefined, // targetServiceAccount
      'sdk',
    );

    expect(config.type).toBe('sdk');
  });
});

describe('isSdkMcpServerConfig', () => {
  it('should return true for SDK server config', () => {
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'sdk',
    );

    expect(isSdkMcpServerConfig(config)).toBe(true);
  });

  it('should return false for non-SDK server config', () => {
    const config = new MCPServerConfig('node', ['server.js']);
    expect(isSdkMcpServerConfig(config)).toBe(false);
  });

  it('should return false for undefined type', () => {
    const config = new MCPServerConfig();
    expect(isSdkMcpServerConfig(config)).toBe(false);
  });
});

describe('AuthProviderType', () => {
  it('should have DYNAMIC_DISCOVERY', () => {
    expect(AuthProviderType.DYNAMIC_DISCOVERY).toBe('dynamic_discovery');
  });

  it('should have GOOGLE_CREDENTIALS', () => {
    expect(AuthProviderType.GOOGLE_CREDENTIALS).toBe('google_credentials');
  });

  it('should have SERVICE_ACCOUNT_IMPERSONATION', () => {
    expect(AuthProviderType.SERVICE_ACCOUNT_IMPERSONATION).toBe(
      'service_account_impersonation',
    );
  });

  it('should have exactly three types', () => {
    expect(Object.values(AuthProviderType)).toHaveLength(3);
  });
});

describe('DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD', () => {
  it('should be defined', () => {
    expect(DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD).toBeDefined();
  });

  it('should have expected value', () => {
    expect(DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD).toBe(25_000);
  });

  it('should be a positive number', () => {
    expect(DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD).toBeGreaterThan(0);
  });
});

describe('DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES', () => {
  it('should be defined', () => {
    expect(DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES).toBeDefined();
  });

  it('should have expected value', () => {
    expect(DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES).toBe(1000);
  });

  it('should be a positive number', () => {
    expect(DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES).toBeGreaterThan(0);
  });
});
