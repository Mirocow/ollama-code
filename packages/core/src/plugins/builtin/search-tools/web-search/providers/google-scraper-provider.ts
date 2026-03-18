/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseWebSearchProvider } from '../base-provider.js';
import type {
  WebSearchResult,
  WebSearchResultItem,
  GoogleScraperProviderConfig,
} from '../types.js';

/**
 * Web search provider that scrapes search results directly.
 * No API key required - parses HTML from DuckDuckGo.
 */
export class GoogleScraperProvider extends BaseWebSearchProvider {
  readonly name = 'GoogleScraper';

  constructor(private readonly config: GoogleScraperProviderConfig) {
    super();
  }

  isAvailable(): boolean {
    // Always available - no API key required
    return true;
  }

  protected async performSearch(
    query: string,
    signal: AbortSignal,
  ): Promise<WebSearchResult> {
    const maxResults = this.config.maxResults || 10;
    const results = await this.searchDuckDuckGo(query, maxResults, signal);
    return { query, results };
  }

  /**
   * Search using DuckDuckGo HTML endpoint.
   */
  private async searchDuckDuckGo(
    query: string,
    maxResults: number,
    signal: AbortSignal,
  ): Promise<WebSearchResultItem[]> {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo request failed: ${response.status}`);
    }

    const html = await response.text();
    return this.parseResults(html, maxResults);
  }

  /**
   * Parse DuckDuckGo search results from HTML.
   */
  private parseResults(
    html: string,
    maxResults: number,
  ): WebSearchResultItem[] {
    const results: WebSearchResultItem[] = [];

    // Pattern for result links: <a class="result__a" href="//duckduckgo.com/l/?uddg=URL">
    const linkPattern =
      /<a[^>]*class="result__a"[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)/gi;

    // Pattern for snippets: <a class="result__snippet">text</a>
    const snippetPattern =
      /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    // Extract all links with URLs and titles
    const links: Array<{ url: string; title: string }> = [];
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      const encodedUrl = match[1];
      try {
        const url = decodeURIComponent(encodedUrl);

        // Get title from the anchor content
        const startIdx = match.index;
        const context = html.substring(startIdx, startIdx + 500);
        const titleMatch = context.match(
          /class="result__a"[^>]*>([\s\S]*?)<\/a>/,
        );

        const title = titleMatch ? this.cleanHtml(titleMatch[1]) : 'No title';

        if (url && url.startsWith('http')) {
          links.push({ url, title });
        }
      } catch {
        // Skip invalid URLs
      }
    }

    // Extract snippets
    const snippets: string[] = [];
    while ((match = snippetPattern.exec(html)) !== null) {
      snippets.push(this.cleanHtml(match[1]));
    }

    // Combine results, avoiding duplicates
    const seenUrls = new Set<string>();
    for (let i = 0; i < links.length && results.length < maxResults; i++) {
      const link = links[i];

      if (seenUrls.has(link.url)) continue;
      seenUrls.add(link.url);

      results.push({
        title: link.title,
        url: link.url,
        content: snippets[i] || undefined,
      });
    }

    return results;
  }

  /**
   * Clean HTML tags and decode entities.
   */
  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}
