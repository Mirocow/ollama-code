/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleScraperProvider } from './google-scraper-provider.js';

describe('GoogleScraperProvider', () => {
  let provider: GoogleScraperProvider;

  beforeEach(() => {
    vi.resetAllMocks();
    provider = new GoogleScraperProvider({ type: 'google-scraper' });
  });

  describe('isAvailable', () => {
    it('should always return true (no API key required)', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('name', () => {
    it('should have correct name', () => {
      expect(provider.name).toBe('GoogleScraper');
    });
  });

  describe('search', () => {
    it('should search DuckDuckGo and parse results', async () => {
      // Mock DuckDuckGo HTML response
      const mockHtml = `
        <html>
        <body>
          <div class="results">
            <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F1">Example Result 1</a>
            <a class="result__snippet">This is the first snippet.</a>
            
            <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F2">Example Result 2</a>
            <a class="result__snippet">This is the second snippet.</a>
          </div>
        </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await provider.search('test query', new AbortController().signal);

      expect(result.query).toBe('test query');
      expect(result.results.length).toBe(2);
      expect(result.results[0].title).toBe('Example Result 1');
      expect(result.results[0].url).toBe('https://example.com/1');
      expect(result.results[0].content).toBe('This is the first snippet.');
      expect(result.results[1].title).toBe('Example Result 2');
    });

    it('should handle empty results', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body>No results</body></html>',
      });

      const result = await provider.search('nonexistent query', new AbortController().signal);

      expect(result.results).toHaveLength(0);
    });

    it('should respect maxResults parameter', async () => {
      const providerWithLimit = new GoogleScraperProvider({
        type: 'google-scraper',
        maxResults: 2,
      });

      // Create HTML with 5 results
      let mockHtml = '<html><body>';
      for (let i = 1; i <= 5; i++) {
        mockHtml += `<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F${i}">Result ${i}</a>`;
        mockHtml += `<a class="result__snippet">Snippet ${i}</a>`;
      }
      mockHtml += '</body></html>';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await providerWithLimit.search('test', new AbortController().signal);

      expect(result.results.length).toBe(2);
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        provider.search('test query', new AbortController().signal)
      ).rejects.toThrow('DuckDuckGo request failed: 500');
    });

    it('should clean HTML entities from titles and snippets', async () => {
      const mockHtml = `
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">
          Title with &amp; ampersand &amp; &quot;quotes&quot;
        </a>
        <a class="result__snippet">Snippet with &lt;tags&gt; &amp; entities</a>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await provider.search('test', new AbortController().signal);

      expect(result.results[0].title).toContain('&');
      expect(result.results[0].title).toContain('"quotes"');
      expect(result.results[0].content).toContain('<tags>');
    });

    it('should send correct User-Agent header', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html></html>',
      });

      await provider.search('test', new AbortController().signal);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Mozilla'),
          }),
        })
      );
    });

    it('should encode query parameters correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html></html>',
      });

      await provider.search('курс юаня к доллару', new AbortController().signal);

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(calledUrl).toContain(encodeURIComponent('курс юаня к доллару'));
    });
  });

  describe('deduplication', () => {
    it('should deduplicate URLs', async () => {
      const mockHtml = `
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fsame">Result 1</a>
        <a class="result__snippet">Snippet 1</a>
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fsame">Result 2 (duplicate URL)</a>
        <a class="result__snippet">Snippet 2</a>
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fother">Result 3</a>
        <a class="result__snippet">Snippet 3</a>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await provider.search('test', new AbortController().signal);

      expect(result.results.length).toBe(2);
      expect(result.results[0].url).toBe('https://example.com/same');
      expect(result.results[1].url).toBe('https://example.com/other');
    });
  });
});
