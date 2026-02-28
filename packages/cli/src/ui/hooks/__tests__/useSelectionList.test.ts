/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeKeyName,
  isConfirmKey,
  isRejectKey,
  isUpKey,
  isDownKey,
} from '../useSelectionList.js';

describe('useSelectionList - Cross-platform key handling', () => {
  describe('normalizeKeyName', () => {
    it('should normalize return/enter keys across platforms', () => {
      // Unix/macOS style
      expect(normalizeKeyName('return', '\r')).toBe('return');
      expect(normalizeKeyName('return', '')).toBe('return');

      // Windows style
      expect(normalizeKeyName('enter', '\r')).toBe('return');
      expect(normalizeKeyName('enter', '\n')).toBe('return');

      // Raw sequences
      expect(normalizeKeyName('', '\r')).toBe('return');
      expect(normalizeKeyName('', '\n')).toBe('return');
    });

    it('should normalize escape keys', () => {
      expect(normalizeKeyName('escape', '')).toBe('escape');
      expect(normalizeKeyName('esc', '')).toBe('escape');
      expect(normalizeKeyName('', '\u001b')).toBe('escape');
    });

    it('should normalize backspace keys', () => {
      expect(normalizeKeyName('backspace', '')).toBe('backspace');
      expect(normalizeKeyName('', '\u007f')).toBe('backspace');
      expect(normalizeKeyName('', '\b')).toBe('backspace');
    });

    it('should normalize letter keys to lowercase', () => {
      // Lowercase
      expect(normalizeKeyName('y', 'y')).toBe('y');
      expect(normalizeKeyName('n', 'n')).toBe('n');

      // Uppercase sequence
      expect(normalizeKeyName('', 'Y')).toBe('y');
      expect(normalizeKeyName('', 'N')).toBe('n');
    });

    it('should pass through other key names unchanged', () => {
      expect(normalizeKeyName('up', '')).toBe('up');
      expect(normalizeKeyName('down', '')).toBe('down');
      expect(normalizeKeyName('j', '')).toBe('j');
      expect(normalizeKeyName('k', '')).toBe('k');
    });
  });

  describe('isConfirmKey', () => {
    it('should return true for Enter/Return keys', () => {
      expect(isConfirmKey('return', '')).toBe(true);
      expect(isConfirmKey('enter', '')).toBe(true);
      expect(isConfirmKey('', '\r')).toBe(true);
      expect(isConfirmKey('', '\n')).toBe(true);
    });

    it('should return true for y key (both cases)', () => {
      expect(isConfirmKey('y', 'y')).toBe(true);
      expect(isConfirmKey('', 'y')).toBe(true);
      expect(isConfirmKey('', 'Y')).toBe(true);
    });

    it('should return false for other keys', () => {
      expect(isConfirmKey('n', '')).toBe(false);
      expect(isConfirmKey('up', '')).toBe(false);
      expect(isConfirmKey('escape', '')).toBe(false);
    });
  });

  describe('isRejectKey', () => {
    it('should return true for Escape key', () => {
      expect(isRejectKey('escape', '')).toBe(true);
      expect(isRejectKey('esc', '')).toBe(true);
      expect(isRejectKey('', '\u001b')).toBe(true);
    });

    it('should return true for n key (both cases)', () => {
      expect(isRejectKey('n', 'n')).toBe(true);
      expect(isRejectKey('', 'n')).toBe(true);
      expect(isRejectKey('', 'N')).toBe(true);
    });

    it('should return false for other keys', () => {
      expect(isRejectKey('y', '')).toBe(false);
      expect(isRejectKey('return', '')).toBe(false);
      expect(isRejectKey('down', '')).toBe(false);
    });
  });

  describe('isUpKey', () => {
    it('should return true for up arrow key', () => {
      expect(isUpKey('up', '')).toBe(true);
    });

    it('should return true for k key (vim-style)', () => {
      expect(isUpKey('k', '')).toBe(true);
    });

    it('should return false for other keys', () => {
      expect(isUpKey('down', '')).toBe(false);
      expect(isUpKey('j', '')).toBe(false);
      expect(isUpKey('y', '')).toBe(false);
    });
  });

  describe('isDownKey', () => {
    it('should return true for down arrow key', () => {
      expect(isDownKey('down', '')).toBe(true);
    });

    it('should return true for j key (vim-style)', () => {
      expect(isDownKey('j', '')).toBe(true);
    });

    it('should return false for other keys', () => {
      expect(isDownKey('up', '')).toBe(false);
      expect(isDownKey('k', '')).toBe(false);
      expect(isDownKey('n', '')).toBe(false);
    });
  });
});

describe('Cross-platform scenarios', () => {
  it('should handle Windows Enter key', () => {
    // Windows often reports 'enter' instead of 'return'
    expect(isConfirmKey('enter', '\r')).toBe(true);
  });

  it('should handle macOS/Linux Return key', () => {
    // Unix systems typically report 'return'
    expect(isConfirmKey('return', '\r')).toBe(true);
  });

  it('should handle quick confirmation scenario', () => {
    // User pressing 'y' should trigger confirm
    const simulateKeyPress = (name: string, sequence: string) => {
      if (isConfirmKey(name, sequence)) {
        return 'confirm';
      }
      if (isRejectKey(name, sequence)) {
        return 'reject';
      }
      return 'none';
    };

    expect(simulateKeyPress('y', 'y')).toBe('confirm');
    expect(simulateKeyPress('', 'Y')).toBe('confirm');
    expect(simulateKeyPress('n', 'n')).toBe('reject');
    expect(simulateKeyPress('', 'N')).toBe('reject');
  });

  it('should handle navigation with vim keys', () => {
    const simulateNavigation = (name: string, sequence: string) => {
      if (isUpKey(name, sequence)) return 'up';
      if (isDownKey(name, sequence)) return 'down';
      return 'none';
    };

    // Vim-style navigation
    expect(simulateNavigation('k', '')).toBe('up');
    expect(simulateNavigation('j', '')).toBe('down');

    // Arrow key navigation
    expect(simulateNavigation('up', '')).toBe('up');
    expect(simulateNavigation('down', '')).toBe('down');
  });
});
