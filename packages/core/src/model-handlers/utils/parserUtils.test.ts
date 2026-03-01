/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  findMatchingBrace,
  findMatchingBracket,
  tryParseJsonAt,
  tryParseArrayAt,
  extractToolCall,
  hasToolCall,
} from './utils/parserUtils.js';

describe('findMatchingBrace', () => {
  it('should find matching brace for simple object', () => {
    const str = '{"key": "value"}';
    const result = findMatchingBrace(str, 0);
    expect(result).toBe(str.length - 1);
  });

  it('should find matching brace for nested object', () => {
    const str = '{"outer": {"inner": "value"}}';
    const result = findMatchingBrace(str, 0);
    expect(result).toBe(str.length - 1);
  });

  it('should handle braces in strings', () => {
    const str = '{"key": "{value}"}';
    const result = findMatchingBrace(str, 0);
    expect(result).toBe(str.length - 1);
  });

  it('should handle escaped quotes in strings', () => {
    const str = '{"key": "value\\"with\\"quote"}';
    const result = findMatchingBrace(str, 0);
    expect(result).toBe(str.length - 1);
  });

  it('should return -1 if start is not at opening brace', () => {
    const str = 'not a brace';
    const result = findMatchingBrace(str, 0);
    expect(result).toBe(-1);
  });

  it('should return -1 for unmatched brace', () => {
    const str = '{"key": "value"';
    const result = findMatchingBrace(str, 0);
    expect(result).toBe(-1);
  });

  it('should handle arrays inside objects', () => {
    const str = '{"key": [1, 2, 3]}';
    const result = findMatchingBrace(str, 0);
    expect(result).toBe(str.length - 1);
  });
});

describe('findMatchingBracket', () => {
  it('should find matching bracket for simple array', () => {
    const str = '[1, 2, 3]';
    const result = findMatchingBracket(str, 0);
    expect(result).toBe(str.length - 1);
  });

  it('should find matching bracket for nested array', () => {
    const str = '[[1, 2], [3, 4]]';
    const result = findMatchingBracket(str, 0);
    expect(result).toBe(str.length - 1);
  });

  it('should handle brackets in strings', () => {
    const str = '["[value]"]';
    const result = findMatchingBracket(str, 0);
    expect(result).toBe(str.length - 1);
  });

  it('should return -1 if start is not at opening bracket', () => {
    const str = 'not a bracket';
    const result = findMatchingBracket(str, 0);
    expect(result).toBe(-1);
  });

  it('should return -1 for unmatched bracket', () => {
    const str = '[1, 2, 3';
    const result = findMatchingBracket(str, 0);
    expect(result).toBe(-1);
  });

  it('should handle objects inside arrays', () => {
    const str = '[{"key": "value"}]';
    const result = findMatchingBracket(str, 0);
    expect(result).toBe(str.length - 1);
  });
});

describe('tryParseJsonAt', () => {
  it('should parse valid JSON object', () => {
    const str = '{"name": "test", "value": 123}';
    const result = tryParseJsonAt(str, 0);

    expect(result).not.toBeNull();
    expect(result!.json).toEqual({ name: 'test', value: 123 });
    expect(result!.end).toBe(str.length - 1);
  });

  it('should parse JSON at specific position', () => {
    const str = 'prefix {"name": "test"} suffix';
    const result = tryParseJsonAt(str, 7);

    expect(result).not.toBeNull();
    expect(result!.json).toEqual({ name: 'test' });
  });

  it('should return null for invalid JSON', () => {
    const str = '{"invalid": json}';
    const result = tryParseJsonAt(str, 0);
    expect(result).toBeNull();
  });

  it('should return null if start is not at opening brace', () => {
    const str = 'not json';
    const result = tryParseJsonAt(str, 0);
    expect(result).toBeNull();
  });

  it('should return null for incomplete JSON', () => {
    const str = '{"key": "value"';
    const result = tryParseJsonAt(str, 0);
    expect(result).toBeNull();
  });
});

describe('tryParseArrayAt', () => {
  it('should parse valid JSON array', () => {
    const str = '[1, 2, 3]';
    const result = tryParseArrayAt(str, 0);

    expect(result).not.toBeNull();
    expect(result!.array).toEqual([1, 2, 3]);
    expect(result!.end).toBe(str.length - 1);
  });

  it('should parse array at specific position', () => {
    const str = 'prefix [1, 2] suffix';
    const result = tryParseArrayAt(str, 7);

    expect(result).not.toBeNull();
    expect(result!.array).toEqual([1, 2]);
  });

  it('should return null for non-array JSON', () => {
    const str = '{"key": "value"}';
    const result = tryParseArrayAt(str, 0);
    expect(result).toBeNull();
  });

  it('should return null if start is not at opening bracket', () => {
    const str = 'not array';
    const result = tryParseArrayAt(str, 0);
    expect(result).toBeNull();
  });
});

describe('extractToolCall', () => {
  it('should extract tool call from direct format with arguments', () => {
    const parsed = { name: 'test_tool', arguments: { key: 'value' } };
    const result = extractToolCall(parsed);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('test_tool');
    expect(result!.args).toEqual({ key: 'value' });
  });

  it('should extract tool call from direct format with args', () => {
    const parsed = { name: 'test_tool', args: { key: 'value' } };
    const result = extractToolCall(parsed);

    expect(result).not.toBeNull();
    expect(result!.args).toEqual({ key: 'value' });
  });

  it('should extract tool call from direct format with parameters', () => {
    const parsed = { name: 'test_tool', parameters: { key: 'value' } };
    const result = extractToolCall(parsed);

    expect(result).not.toBeNull();
    expect(result!.args).toEqual({ key: 'value' });
  });

  it('should extract tool call from OpenAI format with string arguments', () => {
    const parsed = {
      type: 'function',
      function: {
        name: 'test_tool',
        arguments: '{"key": "value"}',
      },
    };
    const result = extractToolCall(parsed);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('test_tool');
    expect(result!.args).toEqual({ key: 'value' });
  });

  it('should extract tool call from OpenAI format with object arguments', () => {
    const parsed = {
      type: 'function',
      function: {
        name: 'test_tool',
        arguments: { key: 'value' },
      },
    };
    const result = extractToolCall(parsed);

    expect(result).not.toBeNull();
    expect(result!.args).toEqual({ key: 'value' });
  });

  it('should handle invalid JSON arguments string', () => {
    const parsed = {
      type: 'function',
      function: {
        name: 'test_tool',
        arguments: 'not valid json',
      },
    };
    const result = extractToolCall(parsed);

    expect(result).not.toBeNull();
    expect(result!.args).toEqual({});
  });

  it('should return null for null input', () => {
    const result = extractToolCall(null);
    expect(result).toBeNull();
  });

  it('should return null for non-object input', () => {
    const result = extractToolCall('string');
    expect(result).toBeNull();
  });

  it('should return null for object without name', () => {
    const parsed = { key: 'value' };
    const result = extractToolCall(parsed);
    expect(result).toBeNull();
  });
});

describe('hasToolCall', () => {
  it('should return true if tool call exists', () => {
    const toolCalls = [{ name: 'tool1', args: {} }, { name: 'tool2', args: {} }];
    expect(hasToolCall(toolCalls, 'tool1')).toBe(true);
    expect(hasToolCall(toolCalls, 'tool2')).toBe(true);
  });

  it('should return false if tool call does not exist', () => {
    const toolCalls = [{ name: 'tool1', args: {} }];
    expect(hasToolCall(toolCalls, 'tool3')).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(hasToolCall([], 'tool1')).toBe(false);
  });
});
