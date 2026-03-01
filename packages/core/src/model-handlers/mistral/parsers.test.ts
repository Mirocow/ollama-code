/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  MistralToolCallsBracketParser,
  mistralParsers,
} from './mistral/parsers.js';

describe('MistralToolCallsBracketParser', () => {
  const parser = new MistralToolCallsBracketParser();

  it('should have correct name and priority', () => {
    expect(parser.name).toBe('mistral-tool-calls-bracket');
    expect(parser.priority).toBe(5);
  });

  describe('canParse', () => {
    it('should return true for content with [TOOL_CALLS]', () => {
      expect(parser.canParse('[TOOL_CALLS] [{"name": "test"}]')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(parser.canParse('[tool_calls] [{"name": "test"}]')).toBe(true);
    });

    it('should return false for content without [TOOL_CALLS]', () => {
      expect(parser.canParse('regular text')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse [TOOL_CALLS] format', () => {
      const content =
        '[TOOL_CALLS] [{"name": "get_weather", "arguments": {"location": "Paris"}}]';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('get_weather');
      expect(result.toolCalls[0].args).toEqual({ location: 'Paris' });
    });

    it('should handle multiple tool calls', () => {
      const content =
        '[TOOL_CALLS] [{"name": "tool1", "arguments": {}}, {"name": "tool2", "arguments": {}}]';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls[0].name).toBe('tool1');
      expect(result.toolCalls[1].name).toBe('tool2');
    });

    it('should clean content after parsing', () => {
      const content =
        'Before [TOOL_CALLS] [{"name": "test"}] After';
      const result = parser.parse(content);

      expect(result.cleanedContent).toContain('Before');
      expect(result.cleanedContent).toContain('After');
      expect(result.cleanedContent).not.toContain('TOOL_CALLS');
    });

    it('should handle invalid JSON', () => {
      const content = '[TOOL_CALLS] [invalid json]';
      const result = parser.parse(content);

      expect(result.toolCalls).toHaveLength(0);
    });
  });
});

describe('mistralParsers', () => {
  it('should include Mistral-specific parsers', () => {
    expect(mistralParsers).toHaveLength(1);
    expect(mistralParsers[0].name).toBe('mistral-tool-calls-bracket');
  });
});
