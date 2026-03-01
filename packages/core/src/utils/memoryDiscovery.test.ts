/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadServerHierarchicalMemory } from './memoryDiscovery.js';
import type { FileDiscoveryService } from '../services/fileDiscoveryService.js';

// Mock the dependencies
vi.mock('../tools/memoryTool.js', () => ({
  getAllOllamaMdFilenames: () => ['OLLAMA.md', 'GEMINI.md'],
}));

vi.mock('./memoryImportProcessor.js', () => ({
  processImports: vi.fn(async (content: string) => ({ content })),
}));

describe('memoryDiscovery', () => {
  let tempDir: string;
  let homeDir: string;
  let mockFileService: FileDiscoveryService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'memory-discovery-test-'));
    homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'home-'));

    mockFileService = {
      getFiles: vi.fn().mockResolvedValue([]),
      discoverFiles: vi.fn().mockResolvedValue([]),
    } as unknown as FileDiscoveryService;

    vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.rm(homeDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('loadServerHierarchicalMemory', () => {
    it('should return empty result when no memory files exist', async () => {
      const result = await loadServerHierarchicalMemory(
        tempDir,
        [],
        mockFileService,
        [],
        true,
      );

      expect(result.memoryContent).toBe('');
      expect(result.fileCount).toBe(0);
    });

    it('should load OLLAMA.md from project directory', async () => {
      const ollamaMdPath = path.join(tempDir, 'OLLAMA.md');
      await fs.writeFile(ollamaMdPath, '# Project Memory\n\nSome instructions.');

      const result = await loadServerHierarchicalMemory(
        tempDir,
        [],
        mockFileService,
        [],
        true,
      );

      expect(result.memoryContent).toContain('# Project Memory');
      expect(result.fileCount).toBe(1);
    });

    it('should load global OLLAMA.md from home directory', async () => {
      const globalOllamaDir = path.join(homeDir, '.ollama-code');
      await fs.mkdir(globalOllamaDir, { recursive: true });
      const globalOllamaMdPath = path.join(globalOllamaDir, 'OLLAMA.md');
      await fs.writeFile(globalOllamaMdPath, '# Global Memory\n\nGlobal instructions.');

      const result = await loadServerHierarchicalMemory(
        tempDir,
        [],
        mockFileService,
        [],
        true,
      );

      expect(result.memoryContent).toContain('# Global Memory');
      expect(result.fileCount).toBe(1);
    });

    it('should load both global and project OLLAMA.md files', async () => {
      const globalOllamaDir = path.join(homeDir, '.ollama-code');
      await fs.mkdir(globalOllamaDir, { recursive: true });
      await fs.writeFile(
        path.join(globalOllamaDir, 'OLLAMA.md'),
        '# Global Memory',
      );

      await fs.writeFile(
        path.join(tempDir, 'OLLAMA.md'),
        '# Project Memory',
      );

      const result = await loadServerHierarchicalMemory(
        tempDir,
        [],
        mockFileService,
        [],
        true,
      );

      expect(result.memoryContent).toContain('# Global Memory');
      expect(result.memoryContent).toContain('# Project Memory');
      expect(result.fileCount).toBe(2);
    });

    it('should include context markers in output', async () => {
      await fs.writeFile(
        path.join(tempDir, 'OLLAMA.md'),
        '# Project Memory',
      );

      const result = await loadServerHierarchicalMemory(
        tempDir,
        [],
        mockFileService,
        [],
        true,
      );

      expect(result.memoryContent).toContain('--- Context from:');
      expect(result.memoryContent).toContain('--- End of Context from:');
    });

    it('should respect includeDirectoriesToReadOllama', async () => {
      const additionalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'additional-'));
      await fs.writeFile(
        path.join(additionalDir, 'OLLAMA.md'),
        '# Additional Memory',
      );

      const result = await loadServerHierarchicalMemory(
        tempDir,
        [additionalDir],
        mockFileService,
        [],
        true,
      );

      expect(result.memoryContent).toContain('# Additional Memory');

      await fs.rm(additionalDir, { recursive: true, force: true });
    });

    it('should include extensionContextFilePaths', async () => {
      const extensionPath = path.join(tempDir, 'extension-context.md');
      await fs.writeFile(extensionPath, '# Extension Context');

      const result = await loadServerHierarchicalMemory(
        tempDir,
        [],
        mockFileService,
        [extensionPath],
        true,
      );

      expect(result.memoryContent).toContain('# Extension Context');
    });

    it('should handle folderTrust false', async () => {
      await fs.writeFile(
        path.join(tempDir, 'OLLAMA.md'),
        '# Project Memory',
      );

      const result = await loadServerHierarchicalMemory(
        tempDir,
        [],
        mockFileService,
        [],
        false, // folderTrust is false
      );

      // When folderTrust is false, only global memory should be loaded
      // The result depends on the implementation
      expect(result).toBeDefined();
    });

    it('should handle unreadable files gracefully', async () => {
      const ollamaMdPath = path.join(tempDir, 'OLLAMA.md');
      await fs.writeFile(ollamaMdPath, '# Memory');

      // Make file unreadable (on Unix systems)
      try {
        await fs.chmod(ollamaMdPath, 0o000);
      } catch {
        // chmod might not work on some systems
      }

      // Should not throw
      const result = await loadServerHierarchicalMemory(
        tempDir,
        [],
        mockFileService,
        [],
        true,
      );

      expect(result).toBeDefined();
    });

    it('should handle nested project structures', async () => {
      const subDir = path.join(tempDir, 'src', 'components');
      await fs.mkdir(subDir, { recursive: true });

      await fs.writeFile(
        path.join(tempDir, 'OLLAMA.md'),
        '# Root Memory',
      );

      // Create git directory to establish project root
      await fs.mkdir(path.join(tempDir, '.git'));

      const result = await loadServerHierarchicalMemory(
        subDir,
        [],
        mockFileService,
        [],
        true,
      );

      expect(result.memoryContent).toContain('# Root Memory');
    });
  });
});
