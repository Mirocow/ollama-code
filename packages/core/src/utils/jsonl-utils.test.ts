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

  describe('mixed sync/async writes', () => {
    it('should handle mixed concurrent sync and async writes', async () => {
      // This tests that writeLine (async) and writeLineSync (sync) 
      // properly coordinate through the shared syncFileLocks mechanism
      
      const promises: Promise<void>[] = [];
      const syncWrites = 5;
      const asyncWrites = 5;
      
      // Start async writes
      for (let i = 0; i < asyncWrites; i++) {
        promises.push(writeLine(testFile, { type: 'async', id: i }));
      }
      
      // Immediately do sync writes (may interleave with async)
      for (let i = 0; i < syncWrites; i++) {
        writeLineSync(testFile, { type: 'sync', id: i });
      }
      
      // Wait for async writes to complete
      await Promise.all(promises);
      
      // Verify all writes completed without corruption
      const content = fs.readFileSync(testFile, 'utf-8');
      const lines = content.trim().split('\n');
      
      expect(lines).toHaveLength(syncWrites + asyncWrites);
      
      // Verify each line is valid JSON
      let asyncCount = 0;
      let syncCount = 0;
      for (const line of lines) {
        const parsed = JSON.parse(line);
        if (parsed.type === 'async') asyncCount++;
        else if (parsed.type === 'sync') syncCount++;
      }
      
      expect(asyncCount).toBe(asyncWrites);
      expect(syncCount).toBe(syncWrites);
    });

    it('should handle rapid fire mixed writes without data corruption', async () => {
      const iterations = 20;
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < iterations; i++) {
        // Alternate between sync and async
        if (i % 2 === 0) {
          promises.push(writeLine(testFile, { iteration: i, method: 'async' }));
        } else {
          writeLineSync(testFile, { iteration: i, method: 'sync' });
        }
      }
      
      await Promise.all(promises);
      
      const content = fs.readFileSync(testFile, 'utf-8');
      const lines = content.trim().split('\n');
      
      expect(lines).toHaveLength(iterations);
      
      // Verify no data corruption - each line should be valid JSON
      for (const line of lines) {
        const parsed = JSON.parse(line);
        expect(parsed).toHaveProperty('iteration');
        expect(parsed).toHaveProperty('method');
      }
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

    it('should handle large records without truncation', () => {
      // Create a large record that would be > 64KB when serialized
      // This tests the writeAllSync function which handles partial writes
      const largeData = {
        id: 1,
        largeArray: new Array(10000).fill('x'.repeat(100)),
        nested: {
          data: 'y'.repeat(50000),
        },
      };

      writeLineSync(testFile, largeData);

      const content = fs.readFileSync(testFile, 'utf-8');
      const parsed = JSON.parse(content.trim());

      expect(parsed.id).toBe(1);
      expect(parsed.largeArray).toHaveLength(10000);
      expect(parsed.nested.data).toBe('y'.repeat(50000));
    });

    it('should handle multiple large records correctly', () => {
      const largeRecord = {
        id: 0,
        data: 'x'.repeat(100000),
      };

      // Write 5 large records
      for (let i = 0; i < 5; i++) {
        writeLineSync(testFile, { ...largeRecord, id: i });
      }

      const content = fs.readFileSync(testFile, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        const parsed = JSON.parse(lines[i]);
        expect(parsed.id).toBe(i);
        expect(parsed.data).toBe('x'.repeat(100000));
      }
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
