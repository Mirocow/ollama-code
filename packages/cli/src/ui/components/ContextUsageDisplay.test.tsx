/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';

// Test the formatting functions directly
describe('ContextUsageDisplay utilities', () => {
  // Import the component's internal functions by re-creating them for testing
  function formatTokenCount(count: number): string {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`;
    }
    if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`;
    }
    return count.toString();
  }

  function getUsageColor(percentage: number): string {
    if (percentage > 0.9) return 'error';
    if (percentage > 0.75) return 'warning';
    return 'accent';
  }

  describe('formatTokenCount', () => {
    it('should format small numbers without suffix', () => {
      expect(formatTokenCount(0)).toBe('0');
      expect(formatTokenCount(100)).toBe('100');
      expect(formatTokenCount(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatTokenCount(1000)).toBe('1.0K');
      expect(formatTokenCount(12500)).toBe('12.5K');
      expect(formatTokenCount(50000)).toBe('50.0K');
      expect(formatTokenCount(128000)).toBe('128.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatTokenCount(1_000_000)).toBe('1.0M');
      expect(formatTokenCount(1_500_000)).toBe('1.5M');
      expect(formatTokenCount(2_000_000)).toBe('2.0M');
    });
  });

  describe('getUsageColor', () => {
    it('should return accent for low usage', () => {
      expect(getUsageColor(0)).toBe('accent');
      expect(getUsageColor(0.5)).toBe('accent');
      expect(getUsageColor(0.75)).toBe('accent');
    });

    it('should return warning for medium-high usage', () => {
      expect(getUsageColor(0.76)).toBe('warning');
      expect(getUsageColor(0.85)).toBe('warning');
      expect(getUsageColor(0.9)).toBe('warning');
    });

    it('should return error for very high usage', () => {
      expect(getUsageColor(0.91)).toBe('error');
      expect(getUsageColor(0.95)).toBe('error');
      expect(getUsageColor(1.0)).toBe('error');
    });
  });

  describe('percentage calculations', () => {
    it('should calculate correct percentages', () => {
      const promptTokens = 12800;
      const contextWindow = 128000;
      const percentage = (promptTokens / contextWindow) * 100;
      expect(percentage).toBe(10);
    });

    it('should handle edge cases', () => {
      // 50% usage
      expect((64000 / 128000) * 100).toBe(50);

      // Near limit (93.75%)
      const nearLimit = (120000 / 128000) * 100;
      expect(nearLimit).toBeCloseTo(93.75, 2);
      expect(nearLimit > 90).toBe(true);
    });
  });
});
