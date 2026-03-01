/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { formatMemoryUsage } from './formatters.js';

describe('formatMemoryUsage', () => {
  it('should format bytes less than 1MB as KB', () => {
    expect(formatMemoryUsage(512)).toBe('0.5 KB');
    expect(formatMemoryUsage(1024)).toBe('1.0 KB');
    expect(formatMemoryUsage(1023)).toBe('1.0 KB');
  });

  it('should format bytes less than 1GB as MB', () => {
    expect(formatMemoryUsage(1024 * 1024)).toBe('1.0 MB');
    expect(formatMemoryUsage(512 * 1024 * 1024)).toBe('512.0 MB');
    expect(formatMemoryUsage(1024 * 1024 - 1)).toBe('1.0 MB');
  });

  it('should format bytes as GB when >= 1GB', () => {
    expect(formatMemoryUsage(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatMemoryUsage(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
  });

  it('should handle zero bytes', () => {
    expect(formatMemoryUsage(0)).toBe('0.0 KB');
  });

  it('should handle very small values', () => {
    expect(formatMemoryUsage(1)).toBe('0.0 KB');
    expect(formatMemoryUsage(100)).toBe('0.1 KB');
  });

  it('should handle very large values', () => {
    const terabytes = 1024 * 1024 * 1024 * 1024; // 1TB
    expect(formatMemoryUsage(terabytes)).toBe('1024.00 GB');
  });
});
