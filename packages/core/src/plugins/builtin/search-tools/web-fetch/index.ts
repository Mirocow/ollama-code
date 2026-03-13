/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { convert } from 'html-to-text';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import type { Config } from '../../../../config/config.js';
import { ApprovalMode } from '../../../../config/config.js';
import { fetchWithTimeout, isPrivateIp } from '../../../../utils/fetch.js';
import { getResponseText } from '../../../../utils/partUtils.js';
import { ToolErrorType } from '../../../../tools/tool-error.js';
import type {
  ToolCallConfirmationDetails,
  ToolInvocation,
  ToolResult,
} from '../../../../tools/tools.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
  ToolConfirmationOutcome,
} from '../../../../tools/tools.js';
import { DEFAULT_OLLAMA_MODEL } from '../../../../config/models.js';
import { createDebugLogger, type DebugLogger } from '../../../../utils/debugLogger.js';

const URL_FETCH_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 100000;

/**
 * Parameters for the WebFetch tool
 */
export interface WebFetchToolParams {
  /**
   * The URL to fetch content from
   */
  url: string;
  /**
   * The prompt to run on the fetched content
   */
  prompt: string;
}

/**
 * Implementation of the WebFetch tool invocation logic
 */
class WebFetchToolInvocation extends BaseToolInvocation<
  WebFetchToolParams,
  ToolResult
> {
  private readonly debugLogger: DebugLogger;

  constructor(
    private readonly config: Config,
    params: WebFetchToolParams,
  ) {
    super(params);
    this.debugLogger = createDebugLogger('WEB_FETCH');
  }

  private async executeDirectFetch(signal: AbortSignal): Promise<ToolResult> {
    let url = this.params.url;

    // Convert GitHub blob URL to raw URL
    if (url.includes('github.com') && url.includes('/blob/')) {
      url = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
      this.debugLogger.debug(
        `[WebFetchTool] Converted GitHub blob URL to raw URL: ${url}`,
      );
    }

    try {
      this.debugLogger.debug(`[WebFetchTool] Fetching content from: ${url}`);
      const response = await fetchWithTimeout(url, URL_FETCH_TIMEOUT_MS);

      if (!response.ok) {
        const errorMessage = `Request failed with status code ${response.status} ${response.statusText}`;
        this.debugLogger.error(`[WebFetchTool] ${errorMessage}`);
        throw new Error(errorMessage);
      }

      this.debugLogger.debug(
        `[WebFetchTool] Successfully fetched content from ${url}`,
      );
      const html = await response.text();
      const textContent = convert(html, {
        wordwrap: false,
        selectors: [
          { selector: 'a', options: { ignoreHref: true } },
          { selector: 'img', format: 'skip' },
        ],
      }).substring(0, MAX_CONTENT_LENGTH);

      this.debugLogger.debug(
        `[WebFetchTool] Converted HTML to text (${textContent.length} characters)`,
      );

      const ollamaClient = this.config.getOllamaClient();
      const fallbackPrompt = `The user requested the following: "${this.params.prompt}".

I have fetched the content from ${this.params.url}. Please use the following content to answer the user's request.

---
${textContent}
---`;

      this.debugLogger.debug(
        `[WebFetchTool] Processing content with prompt: "${this.params.prompt}"`,
      );

      const result = await ollamaClient.generateContent(
        [{ role: 'user', parts: [{ text: fallbackPrompt }] }],
        {},
        signal,
        this.config.getModel() || DEFAULT_OLLAMA_MODEL,
      );
      const resultText = getResponseText(result) || '';

      this.debugLogger.debug(
        `[WebFetchTool] Successfully processed content from ${this.params.url}`,
      );

      return {
        llmContent: resultText,
        returnDisplay: `Content from ${this.params.url} processed successfully.`,
      };
    } catch (e) {
      const error = e as Error;
      const errorMessage = `Error during fetch for ${url}: ${error.message}`;
      this.debugLogger.error(`[WebFetchTool] ${errorMessage}`, error);
      return {
        llmContent: `Error: ${errorMessage}`,
        returnDisplay: `Error: ${errorMessage}`,
        error: {
          message: errorMessage,
          type: ToolErrorType.WEB_FETCH_FALLBACK_FAILED,
        },
      };
    }
  }

  override getDescription(): string {
    const displayPrompt =
      this.params.prompt.length > 100
        ? this.params.prompt.substring(0, 97) + '...'
        : this.params.prompt;
    return `Fetching content from ${this.params.url} and processing with prompt: "${displayPrompt}"`;
  }

  override async shouldConfirmExecute(): Promise<
    ToolCallConfirmationDetails | false
  > {
    // Auto-execute in AUTO_EDIT mode and PLAN mode (read-only tool)
    if (
      this.config.getApprovalMode() === ApprovalMode.AUTO_EDIT ||
      this.config.getApprovalMode() === ApprovalMode.PLAN
    ) {
      return false;
    }

    const confirmationDetails: ToolCallConfirmationDetails = {
      type: 'info',
      title: `Confirm Web Fetch`,
      prompt: `Fetch content from ${this.params.url} and process with: ${this.params.prompt}`,
      urls: [this.params.url],
      onConfirm: async (outcome: ToolConfirmationOutcome) => {
        if (outcome === ToolConfirmationOutcome.ProceedAlways) {
          this.config.setApprovalMode(ApprovalMode.AUTO_EDIT);
        }
      },
    };
    return confirmationDetails;
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    // Check if URL is private/localhost
    const isPrivate = isPrivateIp(this.params.url);

    if (isPrivate) {
      this.debugLogger.debug(
        `[WebFetchTool] Private IP detected for ${this.params.url}, using direct fetch`,
      );
    } else {
      this.debugLogger.debug(
        `[WebFetchTool] Public URL detected for ${this.params.url}, using direct fetch`,
      );
    }

    return this.executeDirectFetch(signal);
  }
}

/**
 * Implementation of the WebFetch tool logic
 */
export class WebFetchTool extends BaseDeclarativeTool<
  WebFetchToolParams,
  ToolResult
> {
  static readonly Name: string = 'web_fetch';

  constructor(private readonly config: Config) {
    super(
      WebFetchTool.Name,
      'WebFetch',
      'Fetch content from a SPECIFIC URL when you ALREADY KNOW the address.\n\n**WHEN TO USE web_fetch:**\n- You have a specific URL and want to read its content\n- User provides a link and asks to extract/analyze information from it\n- You found a URL via web_search and want the full content\n- You need to read documentation, articles, or any web page\n\n**WHEN TO USE web_search INSTEAD:**\n- You DON\'T have a URL and need to FIND relevant pages\n- User asks a question that requires searching the web\n\n**DO NOT use web_fetch if:**\n- You don\'t have a URL → use web_search first\n\nTakes a URL and a prompt as input. Fetches content, converts HTML to text, processes with the prompt.\n\nUsage notes:\n  - URL must start with http:// or https://\n  - Prompt describes what information to extract from the page\n  - Supports both public and private/localhost URLs\n  - Results may be summarized for large content',
      Kind.Fetch,
      {
        properties: {
          url: {
            description: 'The exact URL to fetch. Must start with http:// or https://. Example: "https://docs.python.org/3/library/os.html"',
            type: 'string',
          },
          prompt: {
            description: 'What to extract/analyze from the page. Examples: "Summarize the main points", "Extract all function names", "Find the installation instructions", "What is the price?"',
            type: 'string',
          },
        },
        required: ['url', 'prompt'],
        type: 'object',
      },
    );
    const proxy = config.getProxy();
    if (proxy) {
      setGlobalDispatcher(new ProxyAgent(proxy as string));
    }
  }

  protected override validateToolParamValues(
    params: WebFetchToolParams,
  ): string | null {
    if (!params.url || params.url.trim() === '') {
      return "The 'url' parameter cannot be empty.";
    }
    if (
      !params.url.startsWith('http://') &&
      !params.url.startsWith('https://')
    ) {
      return "The 'url' must be a valid URL starting with http:// or https://.";
    }
    if (!params.prompt || params.prompt.trim() === '') {
      return "The 'prompt' parameter cannot be empty.";
    }
    return null;
  }

  protected createInvocation(
    params: WebFetchToolParams,
  ): ToolInvocation<WebFetchToolParams, ToolResult> {
    return new WebFetchToolInvocation(this.config, params);
  }
}
