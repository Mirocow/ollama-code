/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { getProjectSummaryInfo } from './projectSummary.js';

describe('projectSummary', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-summary-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getProjectSummaryInfo', () => {
    it('should return hasHistory false when no summary file exists', async () => {
      const result = await getProjectSummaryInfo();

      expect(result.hasHistory).toBe(false);
    });

    it('should parse summary file when it exists', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');
      await fs.writeFile(
        summaryPath,
        `**Update time**: 2024-01-01T12:00:00Z

## Overall Goal
Build a test project

## Current Plan
1. [DONE] Setup project
2. [IN PROGRESS] Write tests
3. [TODO] Deploy
`,
      );

      const result = await getProjectSummaryInfo();

      expect(result.hasHistory).toBe(true);
      expect(result.timestamp).toBe('2024-01-01T12:00:00Z');
      expect(result.goalContent).toBe('Build a test project');
      expect(result.totalTasks).toBe(3);
      expect(result.doneCount).toBe(1);
      expect(result.inProgressCount).toBe(1);
      expect(result.todoCount).toBe(1);
      expect(result.pendingTasks).toContain('[IN PROGRESS] Write tests');
      expect(result.pendingTasks).toContain('[TODO] Deploy');
    });

    it('should calculate time ago correctly', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');

      // Use a timestamp 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      await fs.writeFile(
        summaryPath,
        `**Update time**: ${twoHoursAgo}

## Overall Goal
Test

## Current Plan
[DONE] Task
`,
      );

      const result = await getProjectSummaryInfo();

      expect(result.hasHistory).toBe(true);
      expect(result.timeAgo).toContain('2 hour');
    });

    it('should handle days ago', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');

      // Use a timestamp 3 days ago
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      await fs.writeFile(
        summaryPath,
        `**Update time**: ${threeDaysAgo}

## Overall Goal
Test

## Current Plan
[DONE] Task
`,
      );

      const result = await getProjectSummaryInfo();

      expect(result.timeAgo).toContain('3 day');
    });

    it('should handle just now', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');

      // Use current timestamp
      const now = new Date().toISOString();
      await fs.writeFile(
        summaryPath,
        `**Update time**: ${now}

## Overall Goal
Test

## Current Plan
[DONE] Task
`,
      );

      const result = await getProjectSummaryInfo();

      expect(result.timeAgo).toBe('just now');
    });

    it('should use default timestamp if not in file', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');
      await fs.writeFile(
        summaryPath,
        `## Overall Goal
Test

## Current Plan
[DONE] Task
`,
      );

      const result = await getProjectSummaryInfo();

      expect(result.timestamp).toBeDefined();
    });

    it('should handle empty plan section', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');
      await fs.writeFile(
        summaryPath,
        `## Overall Goal
Test

## Current Plan

`,
      );

      const result = await getProjectSummaryInfo();

      expect(result.totalTasks).toBe(0);
      expect(result.doneCount).toBe(0);
      expect(result.inProgressCount).toBe(0);
      expect(result.todoCount).toBe(0);
    });

    it('should handle file read errors gracefully', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');

      // Create the file but then make it unreadable (on Unix)
      await fs.writeFile(summaryPath, 'content');
      try {
        await fs.chmod(summaryPath, 0o000);
      } catch {
        // chmod might not work on some systems
      }

      // Should not throw
      const result = await getProjectSummaryInfo();
      expect(result).toBeDefined();
    });

    it('should limit pending tasks to 3', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');
      await fs.writeFile(
        summaryPath,
        `## Overall Goal
Test

## Current Plan
1. [TODO] Task 1
2. [TODO] Task 2
3. [TODO] Task 3
4. [TODO] Task 4
5. [TODO] Task 5
`,
      );

      const result = await getProjectSummaryInfo();

      expect(result.pendingTasks?.length).toBeLessThanOrEqual(3);
    });

    it('should include both TODO and IN PROGRESS in pending tasks', async () => {
      const ollamaCodeDir = path.join(tempDir, '.ollama-code');
      await fs.mkdir(ollamaCodeDir, { recursive: true });

      const summaryPath = path.join(ollamaCodeDir, 'PROJECT_SUMMARY.md');
      await fs.writeFile(
        summaryPath,
        `## Overall Goal
Test

## Current Plan
1. [IN PROGRESS] Current task
2. [TODO] Future task
`,
      );

      const result = await getProjectSummaryInfo();

      expect(result.pendingTasks).toHaveLength(2);
    });
  });
});
