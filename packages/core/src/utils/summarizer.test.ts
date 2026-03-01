/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  defaultSummarizer,
  llmSummarizer,
  summarizeToolOutput,
} from './summarizer.js';
import type { ToolResult } from '../tools/tools.js';
import type { OllamaClient } from '../core/ollamaClient.js';

describe('defaultSummarizer', () => {
  it('should return JSON stringified llmContent', async () => {
    const result: ToolResult = {
      llmContent: { text: 'test content' },
      returnDisplay: 'test display',
    };

    const summary = await defaultSummarizer(result, {} as OllamaClient, new AbortController().signal);
    expect(summary).toBe('{"text":"test content"}');
  });

  it('should handle string llmContent', async () => {
    const result: ToolResult = {
      llmContent: 'simple string content',
      returnDisplay: 'test display',
    };

    const summary = await defaultSummarizer(result, {} as OllamaClient, new AbortController().signal);
    expect(summary).toBe('"simple string content"');
  });

  it('should handle array llmContent', async () => {
    const result: ToolResult = {
      llmContent: [{ text: 'part1' }, { text: 'part2' }],
      returnDisplay: 'test display',
    };

    const summary = await defaultSummarizer(result, {} as OllamaClient, new AbortController().signal);
    expect(summary).toBe('[{"text":"part1"},{"text":"part2"}]');
  });

  it('should handle null llmContent', async () => {
    const result: ToolResult = {
      llmContent: null,
      returnDisplay: 'test display',
    };

    const summary = await defaultSummarizer(result, {} as OllamaClient, new AbortController().signal);
    expect(summary).toBe('null');
  });
});

describe('llmSummarizer', () => {
  const mockOllamaClient = {
    generateContent: vi.fn(),
  } as unknown as OllamaClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call summarizeToolOutput with correct parameters', async () => {
    const result: ToolResult = {
      llmContent: { text: 'short content' },
      returnDisplay: 'test display',
    };

    // Short content should be returned as-is
    const summary = await llmSummarizer(result, mockOllamaClient, new AbortController().signal);
    expect(summary).toBe('{"text":"short content"}');
  });
});

describe('summarizeToolOutput', () => {
  const mockOllamaClient = {
    generateContent: vi.fn(),
  } as unknown as OllamaClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return text as-is if shorter than maxOutputTokens', async () => {
    const text = 'short text';
    const result = await summarizeToolOutput(text, mockOllamaClient, new AbortController().signal, 1000);
    expect(result).toBe(text);
  });

  it('should return empty string as-is', async () => {
    const result = await summarizeToolOutput('', mockOllamaClient, new AbortController().signal, 1000);
    expect(result).toBe('');
  });

  it('should return null/undefined as empty string', async () => {
    const result = await summarizeToolOutput(null as unknown as string, mockOllamaClient, new AbortController().signal, 1000);
    expect(result).toBeNull();
  });

  it('should call ollamaClient for long texts', async () => {
    const longText = 'a'.repeat(3000);
    const summarizedText = 'This is a summary';

    (mockOllamaClient.generateContent as ReturnType<typeof vi.fn>).mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: summarizedText }],
        },
      }],
    });

    const result = await summarizeToolOutput(longText, mockOllamaClient, new AbortController().signal, 2000);

    expect(mockOllamaClient.generateContent).toHaveBeenCalled();
    expect(result).toBe(summarizedText);
  });

  it('should return original text if summarization fails', async () => {
    const longText = 'a'.repeat(3000);

    (mockOllamaClient.generateContent as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));

    const result = await summarizeToolOutput(longText, mockOllamaClient, new AbortController().signal, 2000);

    expect(result).toBe(longText);
  });

  it('should return original text if response has no text', async () => {
    const longText = 'a'.repeat(3000);

    (mockOllamaClient.generateContent as ReturnType<typeof vi.fn>).mockResolvedValue({
      candidates: [{
        content: {
          parts: [],
        },
      }],
    });

    const result = await summarizeToolOutput(longText, mockOllamaClient, new AbortController().signal, 2000);

    expect(result).toBe(longText);
  });

  it('should use default maxOutputTokens if not provided', async () => {
    const text = 'short text';
    const result = await summarizeToolOutput(text, mockOllamaClient, new AbortController().signal);
    expect(result).toBe(text);
  });
});
