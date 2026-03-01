/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getUserStartupWarnings } from './userStartupWarnings.js';

describe('userStartupWarnings', () => {
  const originalLang = process.env['LANG'];
  const originalLcAll = process.env['LC_ALL'];
  const originalLcCtype = process.env['LC_CTYPE'];

  beforeEach(() => {
    // Save original values
  });

  afterEach(() => {
    // Restore original values
    if (originalLang !== undefined) {
      process.env['LANG'] = originalLang;
    } else {
      delete process.env['LANG'];
    }
    if (originalLcAll !== undefined) {
      process.env['LC_ALL'] = originalLcAll;
    } else {
      delete process.env['LC_ALL'];
    }
    if (originalLcCtype !== undefined) {
      process.env['LC_CTYPE'] = originalLcCtype;
    } else {
      delete process.env['LC_CTYPE'];
    }
  });

  describe('encodingCheck', () => {
    it('should not warn when LANG is set to UTF-8', async () => {
      process.env['LANG'] = 'en_US.UTF-8';
      delete process.env['LC_ALL'];
      delete process.env['LC_CTYPE'];

      const warnings = await getUserStartupWarnings({
        workspaceRoot: '/tmp',
        useRipgrep: false,
        useBuiltinRipgrep: false,
      });

      const encodingWarning = warnings.find((w) =>
        w.includes('UTF-8 locale'),
      );
      expect(encodingWarning).toBeUndefined();
    });

    it('should not warn when LC_ALL is set to UTF-8', async () => {
      delete process.env['LANG'];
      process.env['LC_ALL'] = 'en_US.UTF-8';
      delete process.env['LC_CTYPE'];

      const warnings = await getUserStartupWarnings({
        workspaceRoot: '/tmp',
        useRipgrep: false,
        useBuiltinRipgrep: false,
      });

      const encodingWarning = warnings.find((w) =>
        w.includes('UTF-8 locale'),
      );
      expect(encodingWarning).toBeUndefined();
    });

    it('should not warn when LC_CTYPE is set to UTF-8', async () => {
      delete process.env['LANG'];
      delete process.env['LC_ALL'];
      process.env['LC_CTYPE'] = 'C.UTF-8';

      const warnings = await getUserStartupWarnings({
        workspaceRoot: '/tmp',
        useRipgrep: false,
        useBuiltinRipgrep: false,
      });

      const encodingWarning = warnings.find((w) =>
        w.includes('UTF-8 locale'),
      );
      expect(encodingWarning).toBeUndefined();
    });

    it('should warn when no UTF-8 locale is set', async () => {
      // Skip on Windows
      if (process.platform === 'win32') {
        return;
      }

      delete process.env['LANG'];
      delete process.env['LC_ALL'];
      delete process.env['LC_CTYPE'];

      const warnings = await getUserStartupWarnings({
        workspaceRoot: '/tmp',
        useRipgrep: false,
        useBuiltinRipgrep: false,
      });

      const encodingWarning = warnings.find((w) =>
        w.includes('No UTF-8 locale detected'),
      );
      expect(encodingWarning).toBeDefined();
    });

    it('should warn when LANG is set but not UTF-8', async () => {
      // Skip on Windows
      if (process.platform === 'win32') {
        return;
      }

      process.env['LANG'] = 'C';
      delete process.env['LC_ALL'];
      delete process.env['LC_CTYPE'];

      const warnings = await getUserStartupWarnings({
        workspaceRoot: '/tmp',
        useRipgrep: false,
        useBuiltinRipgrep: false,
      });

      const encodingWarning = warnings.find((w) =>
        w.includes('may not support UTF-8'),
      );
      expect(encodingWarning).toBeDefined();
    });

    it('should accept utf8 (without hyphen)', async () => {
      process.env['LANG'] = 'en_US.utf8';
      delete process.env['LC_ALL'];
      delete process.env['LC_CTYPE'];

      const warnings = await getUserStartupWarnings({
        workspaceRoot: '/tmp',
        useRipgrep: false,
        useBuiltinRipgrep: false,
      });

      const encodingWarning = warnings.find((w) =>
        w.includes('UTF-8 locale'),
      );
      expect(encodingWarning).toBeUndefined();
    });
  });
});
