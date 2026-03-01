/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  readLines,
  read,
  writeLine,
  writeLineSync,
  write,
  countLines,
  exists,
} from './jsonl-utils.js';

describe('jsonl-utils', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'jsonl-test-'),
    );
    testFile = path.join(tempDir, 'test.jsonl');
  });

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('readLines', () => {
    it('should read specified number of lines', async () => {
      const data = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' },
      ];
      await fs.promises.writeFile(
        testFile,
        data.map((d) => JSON.stringify(d)).join('\n'),
      );

      const result = await readLines(testFile, 2);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1, name: 'first' });
      expect(result[1]).toEqual({ id: 2, name: 'second' });
    });

    it('should return empty array for non-existent file', async () => {
      const result = await readLines('/non/existent/file.jsonl', 10);
      expect(result).toEqual([]);
    });

    it('should skip empty lines', async () => {
      await fs.promises.writeFile(
        testFile,
        '{"id":1}\n\n{"id":2}\n   \n{"id":3}',
      );

      const result = await readLines(testFile, 10);
      expect(result).toHaveLength(3);
    });

    it('should handle count greater than file lines', async () => {
      await fs.promises.writeFile(testFile, '{"id":1}\n{"id":2}');

      const result = await readLines(testFile, 100);
      expect(result).toHaveLength(2);
    });
  });

  describe('read', () => {
    it('should read all lines from file', async () => {
      const data = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' },
      ];
      await fs.promises.writeFile(
        testFile,
        data.map((d) => JSON.stringify(d)).join('\n'),
      );

      const result = await read(testFile);
      expect(result).toHaveLength(3);
      expect(result).toEqual(data);
    });

    it('should return empty array for non-existent file', async () => {
      const result = await read('/non/existent/file.jsonl');
      expect(result).toEqual([]);
    });

    it('should skip empty lines', async () => {
      await fs.promises.writeFile(
        testFile,
        '{"id":1}\n\n{"id":2}\n   \n{"id":3}',
      );

      const result = await read(testFile);
      expect(result).toHaveLength(3);
    });

    it('should handle typed results', async () => {
      interface TestType {
        id: number;
        value: string;
      }
      await fs.promises.writeFile(
        testFile,
        '{"id":1,"value":"a"}\n{"id":2,"value":"b"}',
      );

      const result = await read<TestType>(testFile);
      expect(result[0].id).toBe(1);
      expect(result[0].value).toBe('a');
    });
  });

  describe('writeLine', () => {
    it('should append a line to the file', async () => {
      await writeLine(testFile, { id: 1, name: 'first' });
      await writeLine(testFile, { id: 2, name: 'second' });

      const content = await fs.promises.readFile(testFile, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual({ id: 1, name: 'first' });
      expect(JSON.parse(lines[1])).toEqual({ id: 2, name: 'second' });
    });

    it('should create directory if it does not exist', async () => {
      const nestedFile = path.join(tempDir, 'subdir', 'test.jsonl');
      await writeLine(nestedFile, { id: 1 });

      const exists = fs.existsSync(nestedFile);
      expect(exists).toBe(true);
    });

    it('should handle concurrent writes', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(writeLine(testFile, { id: i }));
      }

      await Promise.all(promises);

      const content = await fs.promises.readFile(testFile, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(10);
    });
  });

  describe('writeLineSync', () => {
    it('should append a line synchronously', () => {
      writeLineSync(testFile, { id: 1, name: 'first' });
      writeLineSync(testFile, { id: 2, name: 'second' });

      const content = fs.readFileSync(testFile, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual({ id: 1, name: 'first' });
      expect(JSON.parse(lines[1])).toEqual({ id: 2, name: 'second' });
    });

    it('should create directory if it does not exist', () => {
      const nestedFile = path.join(tempDir, 'subdir', 'test.jsonl');
      writeLineSync(nestedFile, { id: 1 });

      const fileExists = fs.existsSync(nestedFile);
      expect(fileExists).toBe(true);
    });
  });

  describe('write', () => {
    it('should write all data to file', () => {
      const data = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
      ];

      write(testFile, data);

      const content = fs.readFileSync(testFile, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual(data[0]);
      expect(JSON.parse(lines[1])).toEqual(data[1]);
    });

    it('should create directory if it does not exist', () => {
      const nestedFile = path.join(tempDir, 'subdir', 'test.jsonl');
      write(nestedFile, [{ id: 1 }]);

      const fileExists = fs.existsSync(nestedFile);
      expect(fileExists).toBe(true);
    });

    it('should overwrite existing content', () => {
      write(testFile, [{ id: 1 }]);
      write(testFile, [{ id: 2 }, { id: 3 }]);

      const content = fs.readFileSync(testFile, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(2);
    });

    it('should handle empty array', () => {
      write(testFile, []);

      const content = fs.readFileSync(testFile, 'utf-8');
      expect(content.trim()).toBe('');
    });
  });

  describe('countLines', () => {
    it('should count non-empty lines', async () => {
      await fs.promises.writeFile(
        testFile,
        '{"id":1}\n{"id":2}\n\n{"id":3}',
      );

      const count = await countLines(testFile);
      expect(count).toBe(3);
    });

    it('should return 0 for non-existent file', async () => {
      const count = await countLines('/non/existent/file.jsonl');
      expect(count).toBe(0);
    });

    it('should return 0 for empty file', async () => {
      await fs.promises.writeFile(testFile, '');

      const count = await countLines(testFile);
      expect(count).toBe(0);
    });

    it('should count lines with only whitespace as empty', async () => {
      await fs.promises.writeFile(testFile, '{"id":1}\n   \n{"id":2}');

      const count = await countLines(testFile);
      expect(count).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return true for existing non-empty file', async () => {
      await fs.promises.writeFile(testFile, '{"id":1}');

      expect(exists(testFile)).toBe(true);
    });

    it('should return false for non-existent file', () => {
      expect(exists('/non/existent/file.jsonl')).toBe(false);
    });

    it('should return false for empty file', async () => {
      await fs.promises.writeFile(testFile, '');

      expect(exists(testFile)).toBe(false);
    });

    it('should return false for directory', () => {
      expect(exists(tempDir)).toBe(false);
    });
  });
});
