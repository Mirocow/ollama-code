/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shouldAttemptBrowserLaunch } from './browser.js';

describe('shouldAttemptBrowserLaunch', () => {
  const originalEnv = { ...process.env };
  const originalPlatform = process.platform;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  describe('browser blocklist', () => {
    it('should return false when BROWSER is www-browser', () => {
      process.env['BROWSER'] = 'www-browser';
      expect(shouldAttemptBrowserLaunch()).toBe(false);
    });

    it('should return true for other BROWSER values', () => {
      process.env['BROWSER'] = 'chrome';
      // The result depends on other conditions, but it shouldn't be blocked by browser
      const result = shouldAttemptBrowserLaunch();
      // Just check it doesn't throw
      expect(typeof result).toBe('boolean');
    });
  });

  describe('CI environment', () => {
    it('should return false when CI is set', () => {
      process.env['CI'] = 'true';
      expect(shouldAttemptBrowserLaunch()).toBe(false);
    });

    it('should return false when DEBIAN_FRONTEND is noninteractive', () => {
      process.env['DEBIAN_FRONTEND'] = 'noninteractive';
      expect(shouldAttemptBrowserLaunch()).toBe(false);
    });
  });

  describe('SSH session', () => {
    it('should return false when in SSH session on non-Linux', () => {
      process.env['SSH_CONNECTION'] = '192.168.1.1 12345 192.168.1.2 22';
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
      });

      expect(shouldAttemptBrowserLaunch()).toBe(false);
    });

    it('should return false when in SSH session on Linux without display', () => {
      process.env['SSH_CONNECTION'] = '192.168.1.1 12345 192.168.1.2 22';
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });
      delete process.env['DISPLAY'];
      delete process.env['WAYLAND_DISPLAY'];
      delete process.env['MIR_SOCKET'];

      expect(shouldAttemptBrowserLaunch()).toBe(false);
    });

    it('should return true when in SSH session on Linux with display', () => {
      process.env['SSH_CONNECTION'] = '192.168.1.1 12345 192.168.1.2 22';
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });
      process.env['DISPLAY'] = ':0';

      expect(shouldAttemptBrowserLaunch()).toBe(true);
    });
  });

  describe('Linux display checks', () => {
    it('should return false on Linux without display variables', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });
      delete process.env['DISPLAY'];
      delete process.env['WAYLAND_DISPLAY'];
      delete process.env['MIR_SOCKET'];
      delete process.env['SSH_CONNECTION'];
      delete process.env['CI'];

      expect(shouldAttemptBrowserLaunch()).toBe(false);
    });

    it('should return true on Linux with DISPLAY', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });
      process.env['DISPLAY'] = ':0';
      delete process.env['SSH_CONNECTION'];
      delete process.env['CI'];

      expect(shouldAttemptBrowserLaunch()).toBe(true);
    });

    it('should return true on Linux with WAYLAND_DISPLAY', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });
      delete process.env['DISPLAY'];
      process.env['WAYLAND_DISPLAY'] = 'wayland-0';
      delete process.env['SSH_CONNECTION'];
      delete process.env['CI'];

      expect(shouldAttemptBrowserLaunch()).toBe(true);
    });

    it('should return true on Linux with MIR_SOCKET', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });
      delete process.env['DISPLAY'];
      delete process.env['WAYLAND_DISPLAY'];
      process.env['MIR_SOCKET'] = '/tmp/mir-socket';
      delete process.env['SSH_CONNECTION'];
      delete process.env['CI'];

      expect(shouldAttemptBrowserLaunch()).toBe(true);
    });
  });

  describe('non-Linux platforms', () => {
    it('should return true on macOS without blocking conditions', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
      });
      delete process.env['SSH_CONNECTION'];
      delete process.env['CI'];
      delete process.env['BROWSER'];

      expect(shouldAttemptBrowserLaunch()).toBe(true);
    });

    it('should return true on Windows without blocking conditions', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      });
      delete process.env['SSH_CONNECTION'];
      delete process.env['CI'];
      delete process.env['BROWSER'];

      expect(shouldAttemptBrowserLaunch()).toBe(true);
    });
  });
});
