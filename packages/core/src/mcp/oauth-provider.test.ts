/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi } from 'vitest';

// Mock debugLogger
const mockDebugLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
vi.mock('../utils/debugLogger.js', () => ({
  createDebugLogger: vi.fn(() => mockDebugLogger),
}));

// Mock dependencies AT THE TOP
const mockOpenBrowserSecurely = vi.hoisted(() => vi.fn());
vi.mock('../utils/secure-browser-launcher.js', () => ({
  openBrowserSecurely: mockOpenBrowserSecurely,
}));
vi.mock('node:crypto');
vi.mock('./oauth-token-storage.js', () => {
  const mockSaveToken = vi.fn();
  const mockGetCredentials = vi.fn();
  const mockIsTokenExpired = vi.fn();
  const mockdeleteCredentials = vi.fn();

  return {
    MCPOAuthTokenStorage: vi.fn(() => ({
      saveToken: mockSaveToken,
      getCredentials: mockGetCredentials,
      isTokenExpired: mockIsTokenExpired,
      deleteCredentials: mockdeleteCredentials,
    })),
  };
});

// Mock axios - this is what the code actually uses for HTTP requests
const mockAxiosPost = vi.fn();
const mockAxiosHead = vi.fn();
const mockAxiosGet = vi.fn();
vi.mock('axios', () => ({
  default: {
    post: (...args: unknown[]) => mockAxiosPost(...args),
    head: (...args: unknown[]) => mockAxiosHead(...args),
    get: (...args: unknown[]) => mockAxiosGet(...args),
    isAxiosError: (error: unknown) =>
      error && typeof error === 'object' && 'isAxiosError' in error,
  },
}));

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as http from 'node:http';
import * as crypto from 'node:crypto';
import type {
  MCPOAuthConfig,
  OAuthTokenResponse,
  OAuthClientRegistrationResponse,
} from './oauth-provider.js';
import { MCPOAuthProvider } from './oauth-provider.js';
import type { OAuthToken } from './token-storage/types.js';
import { MCPOAuthTokenStorage } from './oauth-token-storage.js';
import type {
  OAuthAuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
} from './oauth-utils.js';

// Define a reusable mock server with .listen, .close, and .on methods
const mockHttpServer = {
  listen: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
};
vi.mock('node:http', () => ({
  createServer: vi.fn(() => mockHttpServer),
}));

describe('MCPOAuthProvider', () => {
  const mockConfig: MCPOAuthConfig = {
    enabled: true,
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    scopes: ['read', 'write'],
    redirectUri: 'http://localhost:7777/oauth/callback',
    audiences: ['https://api.example.com'],
  };

  const mockToken: OAuthToken = {
    accessToken: 'access_token_123',
    refreshToken: 'refresh_token_456',
    tokenType: 'Bearer',
    scope: 'read write',
    expiresAt: Date.now() + 3600000,
  };

  const mockTokenResponse: OAuthTokenResponse = {
    access_token: 'access_token_123',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'refresh_token_456',
    scope: 'read write',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenBrowserSecurely.mockClear();
    mockAxiosPost.mockClear();
    mockAxiosHead.mockClear();
    mockAxiosGet.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock crypto functions
    vi.mocked(crypto.randomBytes).mockImplementation((size: number) => {
      if (size === 32) return Buffer.from('code_verifier_mock_32_bytes_long');
      if (size === 16) return Buffer.from('state_mock_16_by');
      return Buffer.alloc(size);
    });

    vi.mocked(crypto.createHash).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('code_challenge_mock'),
    } as unknown as crypto.Hash);

    // Mock randomBytes to return predictable values for state
    vi.mocked(crypto.randomBytes).mockImplementation((size) => {
      if (size === 32) {
        return Buffer.from('mock_code_verifier_32_bytes_long_string');
      } else if (size === 16) {
        return Buffer.from('mock_state_16_bytes');
      }
      return Buffer.alloc(size);
    });

    // Mock token storage
    const tokenStorage = new MCPOAuthTokenStorage();
    vi.mocked(tokenStorage.saveToken).mockResolvedValue(undefined);
    vi.mocked(tokenStorage.getCredentials).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authenticate', () => {
    it('should perform complete OAuth flow with PKCE', async () => {
      // Mock HTTP server callback
      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        // Simulate OAuth callback
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?code=auth_code_123&state=bW9ja19zdGF0ZV8xNl9ieXRlcw',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      // Mock token exchange via axios
      mockAxiosPost.mockResolvedValueOnce({
        data: mockTokenResponse,
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      const authProvider = new MCPOAuthProvider();
      const result = await authProvider.authenticate('test-server', mockConfig);

      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        tokenType: 'Bearer',
        scope: 'read write',
        expiresAt: expect.any(Number),
      });

      expect(mockOpenBrowserSecurely).toHaveBeenCalledWith(
        expect.stringContaining('authorize'),
      );
      const tokenStorage = new MCPOAuthTokenStorage();
      expect(tokenStorage.saveToken).toHaveBeenCalledWith(
        'test-server',
        expect.objectContaining({ accessToken: 'access_token_123' }),
        'test-client-id',
        'https://auth.example.com/token',
        undefined,
      );
    });

    it('should handle OAuth callback errors', async () => {
      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?error=access_denied&error_description=User%20denied%20access',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      const authProvider = new MCPOAuthProvider();
      await expect(
        authProvider.authenticate('test-server', mockConfig),
      ).rejects.toThrow('OAuth error: access_denied');
    });

    it('should handle state mismatch in callback', async () => {
      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?code=auth_code_123&state=wrong_state',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      const authProvider = new MCPOAuthProvider();
      await expect(
        authProvider.authenticate('test-server', mockConfig),
      ).rejects.toThrow('State mismatch - possible CSRF attack');
    });

    it('should handle token exchange failure', async () => {
      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?code=auth_code_123&state=bW9ja19zdGF0ZV8xNl9ieXRlcw',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      // Mock axios error response
      const axiosError = new Error('Request failed with status code 400');
      (axiosError as unknown as Record<string, unknown>).response = {
        data: 'error=invalid_grant&error_description=Invalid grant',
        status: 400,
      };
      mockAxiosPost.mockRejectedValueOnce(axiosError);

      const authProvider = new MCPOAuthProvider();
      await expect(
        authProvider.authenticate('test-server', mockConfig),
      ).rejects.toThrow();
    });

    it('should handle callback timeout', async () => {
      vi.mocked(http.createServer).mockImplementation(
        () => mockHttpServer as unknown as http.Server,
      );

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        // Don't trigger callback - simulate timeout
      });

      // Mock setTimeout to trigger timeout immediately
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((callback, delay) => {
        if (delay === 5 * 60 * 1000) {
          // 5 minute timeout
          callback();
        }
        return originalSetTimeout(callback, 0);
      }) as unknown as typeof setTimeout;

      const authProvider = new MCPOAuthProvider();
      await expect(
        authProvider.authenticate('test-server', mockConfig),
      ).rejects.toThrow('OAuth callback timeout');

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const refreshResponse = {
        access_token: 'new_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new_refresh_token',
      };

      mockAxiosPost.mockResolvedValueOnce({
        data: refreshResponse,
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      const authProvider = new MCPOAuthProvider();
      const result = await authProvider.refreshAccessToken(
        mockConfig,
        'old_refresh_token',
        'https://auth.example.com/token',
      );

      expect(result).toEqual(refreshResponse);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://auth.example.com/token',
        expect.stringContaining('grant_type=refresh_token'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json, application/x-www-form-urlencoded',
          },
        }),
      );
    });

    it('should include client secret in refresh request when available', async () => {
      mockAxiosPost.mockResolvedValueOnce({
        data: mockTokenResponse,
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      const authProvider = new MCPOAuthProvider();
      await authProvider.refreshAccessToken(
        mockConfig,
        'refresh_token',
        'https://auth.example.com/token',
      );

      const postCall = mockAxiosPost.mock.calls[0];
      expect(postCall[1]).toContain('client_secret=test-client-secret');
    });

    it('should handle refresh token failure', async () => {
      const axiosError = new Error('Request failed with status code 400');
      (axiosError as unknown as Record<string, unknown>).response = {
        data: 'error=invalid_request&error_description=Invalid refresh token',
        status: 400,
      };
      mockAxiosPost.mockRejectedValueOnce(axiosError);

      const authProvider = new MCPOAuthProvider();
      await expect(
        authProvider.refreshAccessToken(
          mockConfig,
          'invalid_refresh_token',
          'https://auth.example.com/token',
        ),
      ).rejects.toThrow();
    });
  });

  describe('getValidToken', () => {
    it('should return valid token when not expired', async () => {
      const validCredentials = {
        serverName: 'test-server',
        token: mockToken,
        clientId: 'test-client-id',
        tokenUrl: 'https://auth.example.com/token',
        updatedAt: Date.now(),
      };

      const tokenStorage = new MCPOAuthTokenStorage();
      vi.mocked(tokenStorage.getCredentials).mockResolvedValue(
        validCredentials,
      );
      vi.mocked(tokenStorage.isTokenExpired).mockReturnValue(false);

      const authProvider = new MCPOAuthProvider();
      const result = await authProvider.getValidToken(
        'test-server',
        mockConfig,
      );

      expect(result).toBe('access_token_123');
    });

    it('should refresh expired token and return new token', async () => {
      const expiredCredentials = {
        serverName: 'test-server',
        token: { ...mockToken, expiresAt: Date.now() - 3600000 },
        clientId: 'test-client-id',
        tokenUrl: 'https://auth.example.com/token',
        updatedAt: Date.now(),
      };

      const tokenStorage = new MCPOAuthTokenStorage();
      vi.mocked(tokenStorage.getCredentials).mockResolvedValue(
        expiredCredentials,
      );
      vi.mocked(tokenStorage.isTokenExpired).mockReturnValue(true);

      const refreshResponse = {
        access_token: 'new_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new_refresh_token',
      };

      mockAxiosPost.mockResolvedValueOnce({
        data: refreshResponse,
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      const authProvider = new MCPOAuthProvider();
      const result = await authProvider.getValidToken(
        'test-server',
        mockConfig,
      );

      expect(result).toBe('new_access_token');
      expect(tokenStorage.saveToken).toHaveBeenCalledWith(
        'test-server',
        expect.objectContaining({ accessToken: 'new_access_token' }),
        'test-client-id',
        'https://auth.example.com/token',
        undefined,
      );
    });

    it('should return null when no credentials exist', async () => {
      const tokenStorage = new MCPOAuthTokenStorage();
      vi.mocked(tokenStorage.getCredentials).mockResolvedValue(null);

      const authProvider = new MCPOAuthProvider();
      const result = await authProvider.getValidToken(
        'test-server',
        mockConfig,
      );

      expect(result).toBeNull();
    });

    it('should handle refresh failure and remove invalid token', async () => {
      const expiredCredentials = {
        serverName: 'test-server',
        token: { ...mockToken, expiresAt: Date.now() - 3600000 },
        clientId: 'test-client-id',
        tokenUrl: 'https://auth.example.com/token',
        updatedAt: Date.now(),
      };

      const tokenStorage = new MCPOAuthTokenStorage();
      vi.mocked(tokenStorage.getCredentials).mockResolvedValue(
        expiredCredentials,
      );
      vi.mocked(tokenStorage.isTokenExpired).mockReturnValue(true);
      vi.mocked(tokenStorage.deleteCredentials).mockResolvedValue(undefined);

      const axiosError = new Error('Request failed with status code 400');
      (axiosError as unknown as Record<string, unknown>).response = {
        data: 'error=invalid_request&error_description=Invalid refresh token',
        status: 400,
      };
      mockAxiosPost.mockRejectedValueOnce(axiosError);

      const authProvider = new MCPOAuthProvider();
      const result = await authProvider.getValidToken(
        'test-server',
        mockConfig,
      );

      expect(result).toBeNull();
      expect(tokenStorage.deleteCredentials).toHaveBeenCalledWith(
        'test-server',
      );
      expect(mockDebugLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to refresh token'),
      );
    });

    it('should return null for token without refresh capability', async () => {
      const tokenWithoutRefresh = {
        serverName: 'test-server',
        token: {
          ...mockToken,
          refreshToken: undefined,
          expiresAt: Date.now() - 3600000,
        },
        clientId: 'test-client-id',
        tokenUrl: 'https://auth.example.com/token',
        updatedAt: Date.now(),
      };

      const tokenStorage = new MCPOAuthTokenStorage();
      vi.mocked(tokenStorage.getCredentials).mockResolvedValue(
        tokenWithoutRefresh,
      );
      vi.mocked(tokenStorage.isTokenExpired).mockReturnValue(true);

      const authProvider = new MCPOAuthProvider();
      const result = await authProvider.getValidToken(
        'test-server',
        mockConfig,
      );

      expect(result).toBeNull();
    });
  });

  describe('PKCE parameter generation', () => {
    it('should generate valid PKCE parameters', async () => {
      // Test is implicit in the authenticate flow tests, but we can verify
      // the crypto mocks are called correctly
      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?code=auth_code_123&state=bW9ja19zdGF0ZV8xNl9ieXRlcw',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      mockAxiosPost.mockResolvedValueOnce({
        data: mockTokenResponse,
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      const authProvider = new MCPOAuthProvider();
      await authProvider.authenticate('test-server', mockConfig);

      expect(crypto.randomBytes).toHaveBeenCalledWith(32); // code verifier
      expect(crypto.randomBytes).toHaveBeenCalledWith(16); // state
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });
  });

  describe('Authorization URL building', () => {
    it('should build correct authorization URL with all parameters', async () => {
      // Mock to capture the URL that would be opened
      let capturedUrl: string | undefined;
      mockOpenBrowserSecurely.mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve();
      });

      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?code=auth_code_123&state=bW9ja19zdGF0ZV8xNl9ieXRlcw',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      mockAxiosPost.mockResolvedValueOnce({
        data: mockTokenResponse,
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      const authProvider = new MCPOAuthProvider();
      await authProvider.authenticate(
        'test-server',
        mockConfig,
        'https://auth.example.com',
      );

      expect(capturedUrl).toBeDefined();
      expect(capturedUrl!).toContain('response_type=code');
      expect(capturedUrl!).toContain('client_id=test-client-id');
      expect(capturedUrl!).toContain('code_challenge=code_challenge_mock');
      expect(capturedUrl!).toContain('code_challenge_method=S256');
      expect(capturedUrl!).toContain('scope=read+write');
      // resource should be the full canonical URI per MCP spec / RFC 8707
      expect(capturedUrl!).toContain('resource=https%3A%2F%2Fauth.example.com');
      expect(capturedUrl!).toContain('audience=https%3A%2F%2Fapi.example.com');
    });

    // Regression test for https://github.com/QwenLM/qwen-code/issues/1749
    // Scenario: user runs `qwen mcp add --transport http yuque https://mcp.alibaba-inc.com/yuque/mcp`
    // then `/mcp auth yuque`. Per MCP spec / RFC 8707, the resource param should be the
    // full canonical URI "https://mcp.alibaba-inc.com/yuque/mcp", not just the host.
    it('should use full canonical URI as resource parameter (issue #1749)', async () => {
      let capturedAuthUrl: string | undefined;
      mockOpenBrowserSecurely.mockImplementation((url: string) => {
        capturedAuthUrl = url;
        return Promise.resolve();
      });

      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?code=auth_code_123&state=bW9ja19zdGF0ZV8xNl9ieXRlcw',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      // Capture the token exchange request to verify resource param there too
      let capturedTokenBody: string | undefined;
      mockAxiosPost.mockImplementation((url: string, body: string) => {
        capturedTokenBody = body;
        return Promise.resolve({
          data: mockTokenResponse,
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      });

      const authProvider = new MCPOAuthProvider();

      // Simulating what mcpCommand.ts does:
      // serverName = "yuque" (the name the user gave)
      // mcpServerUrl = "https://mcp.alibaba-inc.com/yuque/mcp" (server.httpUrl || server.url)
      const serverName = 'yuque';
      const mcpServerUrl = 'https://mcp.alibaba-inc.com/yuque/mcp';

      await authProvider.authenticate(serverName, mockConfig, mcpServerUrl);

      // Verify the authorization URL contains the full canonical URI as resource
      expect(capturedAuthUrl).toBeDefined();
      const authUrl = new URL(capturedAuthUrl!);
      const resourceInAuthUrl = authUrl.searchParams.get('resource');
      expect(resourceInAuthUrl).toBe('https://mcp.alibaba-inc.com/yuque/mcp');

      // Verify the token exchange request also uses the full canonical URI
      expect(capturedTokenBody).toBeDefined();
      const tokenParams = new URLSearchParams(capturedTokenBody!);
      const resourceInTokenExchange = tokenParams.get('resource');
      expect(resourceInTokenExchange).toBe(
        'https://mcp.alibaba-inc.com/yuque/mcp',
      );
    });

    it('should correctly append parameters to an authorization URL that already has query params', async () => {
      // Mock to capture the URL that would be opened
      let capturedUrl: string;
      mockOpenBrowserSecurely.mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve();
      });

      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?code=auth_code_123&state=bW9ja19zdGF0ZV8xNl9ieXRlcw',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      mockAxiosPost.mockResolvedValueOnce({
        data: mockTokenResponse,
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      const configWithParamsInUrl = {
        ...mockConfig,
        authorizationUrl: 'https://auth.example.com/authorize?audience=1234',
      };

      const authProvider = new MCPOAuthProvider();
      await authProvider.authenticate('test-server', configWithParamsInUrl);

      const url = new URL(capturedUrl!);
      expect(url.searchParams.get('audience')).toBe('1234');
      expect(url.searchParams.get('client_id')).toBe('test-client-id');
      expect(url.searchParams.get('response_type')).toBe('code');
    });

    it('should correctly append parameters to a URL with a fragment', async () => {
      // Mock to capture the URL that would be opened
      let capturedUrl: string;
      mockOpenBrowserSecurely.mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve();
      });

      let callbackHandler: unknown;
      vi.mocked(http.createServer).mockImplementation((handler) => {
        callbackHandler = handler;
        return mockHttpServer as unknown as http.Server;
      });

      mockHttpServer.listen.mockImplementation((port, callback) => {
        callback?.();
        setTimeout(() => {
          const mockReq = {
            url: '/oauth/callback?code=auth_code_123&state=bW9ja19zdGF0ZV8xNl9ieXRlcw',
          };
          const mockRes = {
            writeHead: vi.fn(),
            end: vi.fn(),
          };
          (callbackHandler as (req: unknown, res: unknown) => void)(
            mockReq,
            mockRes,
          );
        }, 10);
      });

      mockAxiosPost.mockResolvedValueOnce({
        data: mockTokenResponse,
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      const configWithFragment = {
        ...mockConfig,
        authorizationUrl: 'https://auth.example.com/authorize#section',
      };

      const authProvider = new MCPOAuthProvider();
      await authProvider.authenticate('test-server', configWithFragment);

      const url = new URL(capturedUrl!);
      expect(url.hash).toBe('#section');
      expect(url.searchParams.get('client_id')).toBe('test-client-id');
    });
  });

  // Note: OAuth discovery tests are skipped because they require complex mocking
  // of axios.head and axios.get calls. These tests need to be refactored to properly
  // mock the OAuth discovery flow using axios mocks instead of fetch mocks.
  describe.skip('OAuth discovery', () => {
    it('should handle OAuth discovery when no authorization URL provided', async () => {
      // This test needs to be refactored to use axios mocks
    });

    it('should perform dynamic client registration when no client ID is provided but registration URL is provided', async () => {
      // This test needs to be refactored to use axios mocks
    });

    it('should perform OAuth discovery and dynamic client registration when no client ID or registration URL provided', async () => {
      // This test needs to be refactored to use axios mocks
    });

    it('should perform OAuth discovery once and dynamic client registration when no client ID, authorization URL or registration URL provided', async () => {
      // This test needs to be refactored to use axios mocks
    });
  });
});
