/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSearchTool } from './index.js';
import type { Config } from '../../../../config/config.js';
import type { WebSearchConfig } from './types.js';
import { ApprovalMode } from '../../../../config/config.js';

describe('WebSearchTool', () => {
  let mockConfig: Config;

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfig = {
      getApprovalMode: vi.fn(() => ApprovalMode.AUTO_EDIT),
      setApprovalMode: vi.fn(),
      getWebSearchConfig: vi.fn(),
    } as unknown as Config;
  });

  describe('formatSearchResults', () => {
    it('should format results with title, snippet, and source', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      // Mock fetch for DuckDuckGo HTML
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F1">Result 1</a>
          <a class="result__snippet">Content 1</a>
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F2">Result 2</a>
          <a class="result__snippet">Content 2</a>
        `,
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test query' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('Result 1');
      expect(result.llmContent).toContain('https://example.com/1');
      expect(result.llmContent).toContain('Content 1');
      expect(result.sources).toHaveLength(2);
    });

    it('should build informative summary with source links', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F1">Google Result 1</a>
          <a class="result__snippet">This is a helpful snippet from the first result.</a>
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F2">Google Result 2</a>
          <a class="result__snippet">This is a helpful snippet from the second result.</a>
        `,
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test query' });
      const result = await invocation.execute(new AbortController().signal);

      // Should contain formatted results with title, snippet, and source
      expect(result.llmContent).toContain('Google Result 1');
      expect(result.llmContent).toContain(
        'This is a helpful snippet from the first result.',
      );
      expect(result.llmContent).toContain('https://example.com/1');
      expect(result.llmContent).toContain('Google Result 2');

      // Should include web_fetch hint
      expect(result.llmContent).toContain('web_fetch tool');
    });

    it('should handle empty results gracefully', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      // Mock fetch to return empty results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body>No results</body></html>',
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test query' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('No search results found');
    });

    it('should respect maxResults limit', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper', maxResults: 3 }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      // Create HTML with 10 results
      let mockHtml = '<html><body>';
      for (let i = 1; i <= 10; i++) {
        mockHtml += `<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F${i}">Result ${i}</a>`;
        mockHtml += `<a class="result__snippet">Snippet ${i}</a>`;
      }
      mockHtml += '</body></html>';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test query' });
      const result = await invocation.execute(new AbortController().signal);

      // Should only contain first 3 results (maxResults: 3)
      expect(result.llmContent).toContain('Result 1');
      expect(result.llmContent).toContain('Result 3');
      expect(result.llmContent).not.toContain('Result 4');
      expect(result.llmContent).not.toContain('Result 10');
    });
  });

  describe('validation', () => {
    it('should throw validation error when query is empty', () => {
      const tool = new WebSearchTool(mockConfig);
      expect(() => tool.build({ query: '' })).toThrow(
        "The 'query' parameter cannot be empty",
      );
    });

    it('should throw validation error when provider is empty string', () => {
      const tool = new WebSearchTool(mockConfig);
      expect(() => tool.build({ query: 'test', provider: '' })).toThrow(
        "The 'provider' parameter cannot be empty",
      );
    });
  });

  describe('configuration', () => {
    it('should return error when web search is not configured', async () => {
      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(null);

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test query' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.error?.message).toContain('Web search is disabled');
      expect(result.llmContent).toContain('Web search is disabled');
    });

    it('should return descriptive message in getDescription when web search is not configured', () => {
      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(null);

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test query' });
      const description = invocation.getDescription();

      expect(description).toBe(
        ' (Web search is disabled - configure a provider in settings.json)',
      );
    });

    it('should return provider name in getDescription when web search is configured', () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [
          {
            type: 'tavily',
            apiKey: 'test-key',
          },
        ],
        default: 'tavily',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test query' });
      const description = invocation.getDescription();

      expect(description).toBe(' (Searching the web via tavily)');
    });
  });

  describe('dynamic tool description', () => {
    it('should include available providers in tool description', () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [
          { type: 'tavily', apiKey: 'test-key' },
          { type: 'google-scraper' },
        ],
        default: 'tavily',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      const tool = new WebSearchTool(mockConfig);
      const schema = tool.parameterSchema as Record<string, unknown>;
      const properties = schema.properties as Record<string, unknown>;
      const providerDesc = (properties?.provider as Record<string, unknown>)?.description as string;

      expect(providerDesc).toContain('tavily');
      expect(providerDesc).toContain('google-scraper');
      expect(providerDesc).toContain('Default: "tavily"');
    });

    it('should show google-scraper as default when configured', () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      const tool = new WebSearchTool(mockConfig);
      const schema = tool.parameterSchema as Record<string, unknown>;
      const properties = schema.properties as Record<string, unknown>;
      const providerDesc = (properties?.provider as Record<string, unknown>)?.description as string;

      expect(providerDesc).toContain('google-scraper');
      expect(providerDesc).toContain('Default: "google-scraper"');
    });

    it('should include provider descriptions in tool description', () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      const tool = new WebSearchTool(mockConfig);
      // The tool description is set in constructor, we can check it contains provider info
      const description = tool.description;
      expect(description).toContain('google-scraper');
      expect(description).toContain('no API key required');
    });
  });

  describe('provider selection', () => {
    it('should use specified provider when provider parameter is given', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [
          { type: 'tavily', apiKey: 'tavily-key' },
          { type: 'google-scraper' },
        ],
        default: 'tavily',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      // Mock fetch for google-scraper (DuckDuckGo)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">Test Result</a>
          <a class="result__snippet">Test snippet</a>
        `,
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test', provider: 'google-scraper' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('GoogleScraper');
    });

    it('should use default provider when no provider parameter is given', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">Test Result</a>
          <a class="result__snippet">Test snippet</a>
        `,
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('GoogleScraper');
    });

    it('should fallback to first available provider when default is not available', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'tavily', // tavily not in provider list, should fallback
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">Test Result</a>
        `,
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('GoogleScraper');
    });

    it('should return error when requested provider is not available', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'test', provider: 'tavily' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.error?.message).toContain('tavily');
      expect(result.error?.message).toContain('not available');
    });
  });

  describe('google-scraper provider', () => {
    it('should work without API key', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F1">Result 1</a>
          <a class="result__snippet">Snippet 1</a>
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F2">Result 2</a>
          <a class="result__snippet">Snippet 2</a>
        `,
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'курс юаня' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('Result 1');
      expect(result.llmContent).toContain('https://example.com/1');
      expect(result.sources).toHaveLength(2);
    });

    it('should handle Russian queries', async () => {
      const webSearchConfig: WebSearchConfig = {
        provider: [{ type: 'google-scraper' }],
        default: 'google-scraper',
      };

      (
        mockConfig.getWebSearchConfig as ReturnType<typeof vi.fn>
      ).mockReturnValue(webSearchConfig);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">Курс юаня</a>
          <a class="result__snippet">Актуальный курс юаня к доллару</a>
        `,
      });

      const tool = new WebSearchTool(mockConfig);
      const invocation = tool.build({ query: 'курс юаня к доллару' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('Курс юаня');
      // Check that fetch was called with encoded Russian query
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('курс юаня к доллару')),
        expect.any(Object)
      );
    });
  });
});
