/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  MCP_OAUTH_CLIENT_NAME,
  MCP_SA_IMPERSONATION_CLIENT_NAME,
  OAUTH_REDIRECT_PORT,
  OAUTH_REDIRECT_PATH,
} from './constants.js';

describe('MCP constants', () => {
  describe('MCP_OAUTH_CLIENT_NAME', () => {
    it('should be defined', () => {
      expect(MCP_OAUTH_CLIENT_NAME).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof MCP_OAUTH_CLIENT_NAME).toBe('string');
    });

    it('should have expected value', () => {
      expect(MCP_OAUTH_CLIENT_NAME).toBe('Ollama Code MCP Client');
    });

    it('should be non-empty', () => {
      expect(MCP_OAUTH_CLIENT_NAME.length).toBeGreaterThan(0);
    });
  });

  describe('MCP_SA_IMPERSONATION_CLIENT_NAME', () => {
    it('should be defined', () => {
      expect(MCP_SA_IMPERSONATION_CLIENT_NAME).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof MCP_SA_IMPERSONATION_CLIENT_NAME).toBe('string');
    });

    it('should have expected value', () => {
      expect(MCP_SA_IMPERSONATION_CLIENT_NAME).toBe(
        'Ollama Code (Service Account Impersonation)',
      );
    });

    it('should be non-empty', () => {
      expect(MCP_SA_IMPERSONATION_CLIENT_NAME.length).toBeGreaterThan(0);
    });

    it('should be different from MCP_OAUTH_CLIENT_NAME', () => {
      expect(MCP_SA_IMPERSONATION_CLIENT_NAME).not.toBe(MCP_OAUTH_CLIENT_NAME);
    });
  });

  describe('OAUTH_REDIRECT_PORT', () => {
    it('should be defined', () => {
      expect(OAUTH_REDIRECT_PORT).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof OAUTH_REDIRECT_PORT).toBe('number');
    });

    it('should have expected value', () => {
      expect(OAUTH_REDIRECT_PORT).toBe(7777);
    });

    it('should be a valid port number', () => {
      expect(OAUTH_REDIRECT_PORT).toBeGreaterThan(0);
      expect(OAUTH_REDIRECT_PORT).toBeLessThan(65536);
    });

    it('should be a non-privileged port (> 1024)', () => {
      expect(OAUTH_REDIRECT_PORT).toBeGreaterThan(1024);
    });
  });

  describe('OAUTH_REDIRECT_PATH', () => {
    it('should be defined', () => {
      expect(OAUTH_REDIRECT_PATH).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof OAUTH_REDIRECT_PATH).toBe('string');
    });

    it('should have expected value', () => {
      expect(OAUTH_REDIRECT_PATH).toBe('/oauth/callback');
    });

    it('should start with a slash', () => {
      expect(OAUTH_REDIRECT_PATH.startsWith('/')).toBe(true);
    });

    it('should be a valid URL path', () => {
      expect(OAUTH_REDIRECT_PATH).toMatch(/^\/[a-z0-9\-_/]+$/i);
    });
  });

  describe('OAuth redirect URL construction', () => {
    it('should allow constructing valid redirect URL', () => {
      const redirectUrl = `http://localhost:${OAUTH_REDIRECT_PORT}${OAUTH_REDIRECT_PATH}`;
      expect(redirectUrl).toBe('http://localhost:7777/oauth/callback');

      // Verify it's a valid URL
      const url = new URL(redirectUrl);
      expect(url.hostname).toBe('localhost');
      expect(url.port).toBe('7777');
      expect(url.pathname).toBe('/oauth/callback');
    });
  });
});
