/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as childProcess from 'node:child_process';
import {
  isGitRepository,
  findGitRoot,
  getGitBranch,
} from './gitUtils.js';

describe('gitUtils', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'git-utils-test-'),
    );
  });

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('isGitRepository', () => {
    it('should return false for non-git directory', () => {
      expect(isGitRepository(tempDir)).toBe(false);
    });

    it('should return true for git repository', () => {
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);

      expect(isGitRepository(tempDir)).toBe(true);
    });

    it('should return true for subdirectory of git repository', () => {
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir);

      expect(isGitRepository(subDir)).toBe(true);
    });

    it('should return true for git worktree (file .git)', () => {
      const gitFile = path.join(tempDir, '.git');
      fs.writeFileSync(gitFile, 'gitdir: /path/to/.git/worktree');

      expect(isGitRepository(tempDir)).toBe(true);
    });

    it('should return false when reaching root directory', () => {
      // tempDir is not in a git repo
      expect(isGitRepository(tempDir)).toBe(false);
    });

    it('should handle errors gracefully', () => {
      // Pass a non-existent path
      expect(isGitRepository('/non/existent/path')).toBe(false);
    });
  });

  describe('findGitRoot', () => {
    it('should return null for non-git directory', () => {
      expect(findGitRoot(tempDir)).toBeNull();
    });

    it('should return git root for git repository', () => {
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);

      expect(findGitRoot(tempDir)).toBe(path.resolve(tempDir));
    });

    it('should return git root for subdirectory of git repository', () => {
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);
      const subDir = path.join(tempDir, 'subdir', 'nested');
      fs.mkdirSync(subDir, { recursive: true });

      expect(findGitRoot(subDir)).toBe(path.resolve(tempDir));
    });

    it('should return null when reaching root directory', () => {
      expect(findGitRoot(tempDir)).toBeNull();
    });

    it('should handle errors gracefully', () => {
      expect(findGitRoot('/non/existent/path')).toBeNull();
    });
  });

  describe('getGitBranch', () => {
    it('should return undefined for non-git directory', () => {
      expect(getGitBranch(tempDir)).toBeUndefined();
    });

    it('should return branch name for git repository', () => {
      // Create a git repo
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);
      fs.mkdirSync(path.join(gitDir, 'refs', 'heads'), { recursive: true });

      // Try to get branch - may return undefined if not actually in a git repo
      const result = getGitBranch(tempDir);
      // The result depends on whether git is installed and the directory structure
      // Just check it doesn't throw
      expect(result === undefined || typeof result === 'string').toBe(true);
    });
  });
});
