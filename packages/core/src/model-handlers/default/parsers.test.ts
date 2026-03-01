/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  ToolCallTagParser,
  ToolCallStartEndParser,
  ThinkTagParser,
  MarkdownCodeBlockParser,
  StandaloneJsonParser,
  FunctionCallParser,
  defaultParsers,
} from './default/parsers.js';

describe('ToolCallTagParser', () => {
  const parser = new ToolCallTagParser();

  it('should have correct name and priority', () => {
    expect(parser.name).toBe('tool-call-tag');
    expect(parser.priority).toBe(10);
  });

  describe('canParse', () => {
    it('should return true for content with tool_call tag', () => {
      expect(parser.canParse('<tool_call={"name": "test"}>')).toBe(true);
    });

    it('should return false for content without tool_call tag', () => {
      expect(parser.canParse('regular text')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse tool_call format', () => {
      const content =
        '<tool_call={"name": "list_directory", "arguments": {"path": "/home"}}>';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('list_directory');
      expect(result.toolCalls[0].args).toEqual({ path: '/home' });
    });

    it('should parse tool_call with args shorthand', () => {
      const content = '<tool_call={"name": "test", "args": {"key": "value"}}>';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test');
      expect(result.toolCalls[0].args).toEqual({ key: 'value' });
    });

    it('should clean content after parsing', () => {
      const content =
        'Before <tool_call={"name": "test", "arguments": {}}> After';
      const result = parser.parse(content);

      expect(result.cleanedContent).toContain('Before');
      expect(result.cleanedContent).toContain('After');
      expect(result.cleanedContent).not.toContain('tool_call');
    });

    it('should handle multiple tool calls', () => {
      const content =
        '<tool_call={"name": "test1", "arguments": {}}><tool_call={"name": "test2", "arguments": {}}>';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(2);
    });
  });
});

describe('ToolCallStartEndParser', () => {
  const parser = new ToolCallStartEndParser();

  it('should have correct name and priority', () => {
    expect(parser.name).toBe('tool-call-start-end');
    expect(parser.priority).toBe(10);
  });

  describe('canParse', () => {
    it('should return true for content with tool_call_start tag', () => {
      expect(parser.canParse('<tool_call_start>{}<tool_call_end>')).toBe(true);
    });

    it('should return false for content without tool_call_start tag', () => {
      expect(parser.canParse('regular text')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse tool_call_start/end format', () => {
      const content =
        '<tool_call_start>{"name": "test", "arguments": {"path": "/home"}}<tool_call_end>';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test');
      expect(result.toolCalls[0].args).toEqual({ path: '/home' });
    });

    it('should handle invalid JSON', () => {
      const content = '<tool_call_start>invalid json<tool_call_end>';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(0);
    });
  });
});

describe('ThinkTagParser', () => {
  const parser = new ThinkTagParser();

  it('should have correct name and priority', () => {
    expect(parser.name).toBe('think-tag');
    expect(parser.priority).toBe(20);
  });

  describe('canParse', () => {
    it('should return true for content with think tags', () => {
      expect(parser.canParse('<think reasoning</think')).toBe(true);
    });

    it('should return true for content with think tags with attributes', () => {
      expect(
        parser.canParse('<think type="reasoning"content</think'),
      ).toBe(true);
    });

    it('should return false for content without think tags', () => {
      expect(parser.canParse('regular text')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse think tag with JSON tool call', () => {
      const content =
        '<think{"name": "test", "arguments": {"key": "value"}}</think';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test');
    });

    it('should keep think block if not JSON', () => {
      const content = '<think this is reasoning </think';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(0);
      expect(result.cleanedContent).toContain('think');
    });
  });
});

describe('MarkdownCodeBlockParser', () => {
  const parser = new MarkdownCodeBlockParser();

  it('should have correct name and priority', () => {
    expect(parser.name).toBe('markdown-code-block');
    expect(parser.priority).toBe(5);
  });

  describe('canParse', () => {
    it('should return true for content with json code block', () => {
      expect(parser.canParse('```json\n{"name": "test"}\n```')).toBe(true);
    });

    it('should return true for content with plain code block', () => {
      expect(parser.canParse('```\n{"name": "test"}\n```')).toBe(true);
    });

    it('should return false for content without code blocks', () => {
      expect(parser.canParse('regular text')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse JSON code block', () => {
      const content =
        '```json\n{"name": "test", "arguments": {"key": "value"}}\n```';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test');
    });

    it('should avoid duplicate tool calls', () => {
      const content =
        '```json\n{"name": "test"}\n```\n```json\n{"name": "test"}\n```';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
    });
  });
});

describe('StandaloneJsonParser', () => {
  const parser = new StandaloneJsonParser();

  it('should have correct name and priority', () => {
    expect(parser.name).toBe('standalone-json');
    expect(parser.priority).toBe(30);
  });

  describe('canParse', () => {
    it('should return true for content with name field', () => {
      expect(parser.canParse('{"name": "test"}')).toBe(true);
    });

    it('should return false for content with type field (function format)', () => {
      expect(parser.canParse('{"type": "function"}')).toBe(false);
    });

    it('should return false for content without required fields', () => {
      expect(parser.canParse('regular text')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse standalone JSON with name field', () => {
      const content = '{"name": "test", "arguments": {"key": "value"}}';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test');
    });

    it('should handle args shorthand', () => {
      const content = '{"name": "test", "args": {"key": "value"}}';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].args).toEqual({ key: 'value' });
    });
  });
});

describe('FunctionCallParser', () => {
  const parser = new FunctionCallParser();

  it('should have correct name and priority', () => {
    expect(parser.name).toBe('function-call');
    expect(parser.priority).toBe(30);
  });

  describe('canParse', () => {
    it('should return true for function call format', () => {
      expect(
        parser.canParse('{"type": "function", "function": {"name": "test"}}'),
      ).toBe(true);
    });

    it('should return false for content without function format', () => {
      expect(parser.canParse('{"name": "test"}')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse OpenAI function call format', () => {
      const content =
        '{"type": "function", "function": {"name": "run_shell_command", "arguments": "{\\"command\\": \\"ls\\"}"}}';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('run_shell_command');
      expect(result.toolCalls[0].args).toEqual({ command: 'ls' });
    });

    it('should handle object arguments', () => {
      const content =
        '{"type": "function", "function": {"name": "test", "arguments": {"key": "value"}}}';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].args).toEqual({ key: 'value' });
    });
  });
});

describe('defaultParsers', () => {
  it('should include all parsers', () => {
    expect(defaultParsers).toHaveLength(6);
    expect(defaultParsers.map((p) => p.name)).toContain('tool-call-tag');
    expect(defaultParsers.map((p) => p.name)).toContain('tool-call-start-end');
    expect(defaultParsers.map((p) => p.name)).toContain('think-tag');
    expect(defaultParsers.map((p) => p.name)).toContain('markdown-code-block');
    expect(defaultParsers.map((p) => p.name)).toContain('standalone-json');
    expect(defaultParsers.map((p) => p.name)).toContain('function-call');
  });

  it('should be sorted by priority', () => {
    const priorities = defaultParsers.map((p) => p.priority ?? 100);
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i - 1]).toBeLessThanOrEqual(priorities[i]);
    }
  });
});
