/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { OllamaCodeIgnoreParser } from './ollamaIgnoreParser.js';

describe('OllamaCodeIgnoreParser', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ollama-ignore-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should load patterns from .ollama-codeignore file', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, 'node_modules\n*.log\n# comment\n\ndist');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.getPatterns()).toEqual(['node_modules', '*.log', 'dist']);
    });

    it('should handle missing .ollama-codeignore file', () => {
      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.getPatterns()).toEqual([]);
    });

    it('should resolve relative project root paths', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, 'test');

      const parser = new OllamaCodeIgnoreParser(
        path.relative(process.cwd(), tempDir),
      );
      expect(parser.getPatterns()).toEqual(['test']);
    });

    it('should ignore comment lines', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, '# This is a comment\nnode_modules\n# Another comment');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.getPatterns()).toEqual(['node_modules']);
    });

    it('should ignore empty lines', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, '\n\nnode_modules\n\n\n');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.getPatterns()).toEqual(['node_modules']);
    });

    it('should trim whitespace from patterns', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, '  node_modules  \n\t*.log\t');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.getPatterns()).toEqual(['node_modules', '*.log']);
    });
  });

  describe('isIgnored', () => {
    it('should return false when no patterns are loaded', () => {
      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('node_modules')).toBe(false);
    });

    it('should return true for ignored files', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, 'node_modules\n*.log');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('node_modules')).toBe(true);
      expect(parser.isIgnored('test.log')).toBe(true);
    });

    it('should return false for non-ignored files', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, 'node_modules\n*.log');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('src/index.ts')).toBe(false);
      expect(parser.isIgnored('README.md')).toBe(false);
    });

    it('should return false for empty or invalid file paths', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, '*');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('')).toBe(false);
      expect(parser.isIgnored(null as unknown as string)).toBe(false);
      expect(parser.isIgnored(undefined as unknown as string)).toBe(false);
      expect(parser.isIgnored(123 as unknown as string)).toBe(false);
    });

    it('should return false for paths starting with backslash', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, '*');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('\\path')).toBe(false);
    });

    it('should return false for root path', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, '*');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('/')).toBe(false);
    });

    it('should return false for paths with null character', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, '*');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('file\0name')).toBe(false);
    });

    it('should return false for paths outside project root', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, '*');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('../outside')).toBe(false);
      expect(parser.isIgnored('../../etc/passwd')).toBe(false);
    });

    it('should handle nested directory patterns', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, 'dist/**\nsrc/**/*.test.ts');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.isIgnored('dist/output.js')).toBe(true);
      expect(parser.isIgnored('src/utils.test.ts')).toBe(true);
    });
  });

  describe('getPatterns', () => {
    it('should return all loaded patterns', () => {
      const ignoreFile = path.join(tempDir, '.ollama-codeignore');
      fs.writeFileSync(ignoreFile, 'node_modules\ndist\n*.log');

      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.getPatterns()).toEqual(['node_modules', 'dist', '*.log']);
    });

    it('should return empty array when no patterns loaded', () => {
      const parser = new OllamaCodeIgnoreParser(tempDir);
      expect(parser.getPatterns()).toEqual([]);
    });
  });
});
