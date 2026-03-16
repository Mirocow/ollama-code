/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CountTokensParameters,
  Content,
  Part,
  PartUnion,
} from '../../types/content.js';
import type { TokenCalculationResult } from './types.js';
import { TextTokenizer } from './textTokenizer.js';
import { ImageTokenizer } from './imageTokenizer.js';
import { createDebugLogger } from '../debugLogger.js';

const debugLogger = createDebugLogger('TOKENIZER');

/**
 * Simple request token estimator that handles text and image content serially
 */
export class RequestTokenizer {
  private textTokenizer: TextTokenizer;
  private imageTokenizer: ImageTokenizer;

  constructor() {
    this.textTokenizer = new TextTokenizer();
    this.imageTokenizer = new ImageTokenizer();
  }

  /**
   * Calculate tokens for a request using serial processing
   */
  async calculateTokens(
    request: CountTokensParameters,
  ): Promise<TokenCalculationResult> {
    const startTime = performance.now();

    try {
      // Process request content and group by type
      const { textContents, imageContents, audioContents, otherContents } =
        this.processAndGroupContents(request);

      if (
        textContents.length === 0 &&
        imageContents.length === 0 &&
        audioContents.length === 0 &&
        otherContents.length === 0
      ) {
        return {
          totalTokens: 0,
          breakdown: {
            textTokens: 0,
            imageTokens: 0,
            audioTokens: 0,
            otherTokens: 0,
          },
          processingTime: performance.now() - startTime,
        };
      }

      // Calculate tokens for each content type serially
      const textTokens = await this.calculateTextTokens(textContents);
      const imageTokens = await this.calculateImageTokens(imageContents);
      const audioTokens = await this.calculateAudioTokens(audioContents);
      const otherTokens = await this.calculateOtherTokens(otherContents);

      const totalTokens = textTokens + imageTokens + audioTokens + otherTokens;
      const processingTime = performance.now() - startTime;

      return {
        totalTokens,
        breakdown: {
          textTokens,
          imageTokens,
          audioTokens,
          otherTokens,
        },
        processingTime,
      };
    } catch (error) {
      debugLogger.error('Error calculating tokens:', error);

      // Fallback calculation
      const fallbackTokens = this.calculateFallbackTokens(request);

      return {
        totalTokens: fallbackTokens,
        breakdown: {
          textTokens: fallbackTokens,
          imageTokens: 0,
          audioTokens: 0,
          otherTokens: 0,
        },
        processingTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Calculate tokens for text contents
   */
  private async calculateTextTokens(textContents: string[]): Promise<number> {
    if (textContents.length === 0) return 0;

    try {
      // Avoid per-part rounding inflation by estimating once on the combined text.
      return await this.textTokenizer.calculateTokens(textContents.join(''));
    } catch (error) {
      debugLogger.warn('Error calculating text tokens:', error);
      // Fallback: character-based estimation
      const totalChars = textContents.join('').length;
      return Math.ceil(totalChars / 4);
    }
  }

  /**
   * Calculate tokens for image contents using serial processing
   */
  private async calculateImageTokens(
    imageContents: Array<{ data: string; mimeType: string }>,
  ): Promise<number> {
    if (imageContents.length === 0) return 0;

    try {
      const tokenCounts =
        await this.imageTokenizer.calculateTokensBatch(imageContents);
      return tokenCounts.reduce((sum, count) => sum + count, 0);
    } catch (error) {
      debugLogger.warn('Error calculating image tokens:', error);
      // Fallback: minimum tokens per image
      return imageContents.length * 6; // 4 image tokens + 2 special tokens as minimum
    }
  }

  /**
   * Calculate tokens for audio contents.
   *
   * Audio token calculation varies by model:
   * - OpenAI GPT-4o-audio: Uses duration-based calculation (~150 words/min, ~1.3 tokens/word)
   * - Gemini: Similar duration-based approach
   * - Other models: May use different approaches
   *
   * This implementation provides reasonable estimates based on:
   * 1. Audio duration (if extractable from base64 metadata)
   * 2. Audio file size (as fallback)
   * 3. MIME type-specific adjustments
   */
  private async calculateAudioTokens(
    audioContents: Array<{ data: string; mimeType: string }>,
  ): Promise<number> {
    if (audioContents.length === 0) return 0;

    let totalTokens = 0;

    for (const audioContent of audioContents) {
      try {
        // Calculate approximate binary size from base64
        const base64Data = audioContent.data;
        const dataSize = Math.floor(base64Data.length * 0.75); // Base64 overhead

        // Get audio format from MIME type
        const mimeType = audioContent.mimeType.toLowerCase();
        const isCompressed =
          mimeType.includes('mp3') ||
          mimeType.includes('aac') ||
          mimeType.includes('ogg') ||
          mimeType.includes('opus');

        // Estimate duration based on format and size
        // Uncompressed (WAV): ~176KB/sec for 16-bit stereo 44.1kHz
        // Compressed (MP3/AAC): ~16-32KB/sec depending on bitrate
        let estimatedDurationSeconds: number;

        if (isCompressed) {
          // Assume 128kbps bitrate for compressed audio
          // 128kbps = 16KB/sec
          estimatedDurationSeconds = dataSize / (16 * 1024);
        } else {
          // Uncompressed audio (WAV, AIFF, etc.)
          // 16-bit stereo 44.1kHz = 176.4KB/sec
          estimatedDurationSeconds = dataSize / (176.4 * 1024);
        }

        // Calculate tokens based on duration
        // Speech typically: 150 words per minute, 1.3 tokens per word
        // = ~195 tokens per minute = ~3.25 tokens per second
        const tokensPerSecond = 3.25;
        const durationBasedTokens = Math.ceil(
          estimatedDurationSeconds * tokensPerSecond,
        );

        // Also consider minimum tokens for audio metadata/header
        const minTokens = 10;
        const maxTokens = 128000; // Max context for most models

        // Use duration-based estimate with bounds
        const estimatedTokens = Math.min(
          Math.max(durationBasedTokens, minTokens),
          maxTokens,
        );

        totalTokens += estimatedTokens;

        debugLogger.debug(
          `Audio token estimate: ${estimatedTokens} tokens ` +
            `(${estimatedDurationSeconds.toFixed(1)}s, ${mimeType}, ${(dataSize / 1024).toFixed(1)}KB)`,
        );
      } catch (error) {
        debugLogger.warn('Error calculating audio tokens:', error);
        // Fallback: minimum tokens per audio
        totalTokens += 50;
      }
    }

    return totalTokens;
  }

  /**
   * Calculate tokens for other content types (functions, files, etc.)
   */
  private async calculateOtherTokens(otherContents: string[]): Promise<number> {
    if (otherContents.length === 0) return 0;

    try {
      // Treat other content as text, and avoid per-item rounding inflation.
      return await this.textTokenizer.calculateTokens(otherContents.join(''));
    } catch (error) {
      debugLogger.warn('Error calculating other content tokens:', error);
      // Fallback: character-based estimation
      const totalChars = otherContents.join('').length;
      return Math.ceil(totalChars / 4);
    }
  }

  /**
   * Fallback token calculation using simple string serialization
   */
  private calculateFallbackTokens(request: CountTokensParameters): number {
    try {
      const content = JSON.stringify(request.contents);
      return Math.ceil(content.length / 4); // Rough estimate: 1 token ≈ 4 characters
    } catch (error) {
      debugLogger.warn('Error in fallback token calculation:', error);
      return 100; // Conservative fallback
    }
  }

  /**
   * Process request contents and group by type
   */
  private processAndGroupContents(request: CountTokensParameters): {
    textContents: string[];
    imageContents: Array<{ data: string; mimeType: string }>;
    audioContents: Array<{ data: string; mimeType: string }>;
    otherContents: string[];
  } {
    const textContents: string[] = [];
    const imageContents: Array<{ data: string; mimeType: string }> = [];
    const audioContents: Array<{ data: string; mimeType: string }> = [];
    const otherContents: string[] = [];

    if (!request.contents) {
      return { textContents, imageContents, audioContents, otherContents };
    }

    const contents = Array.isArray(request.contents)
      ? request.contents
      : [request.contents];

    for (const content of contents) {
      this.processContent(
        content,
        textContents,
        imageContents,
        audioContents,
        otherContents,
      );
    }

    return { textContents, imageContents, audioContents, otherContents };
  }

  /**
   * Process a single content item and add to appropriate arrays
   */
  private processContent(
    content: Content | string | PartUnion,
    textContents: string[],
    imageContents: Array<{ data: string; mimeType: string }>,
    audioContents: Array<{ data: string; mimeType: string }>,
    otherContents: string[],
  ): void {
    if (typeof content === 'string') {
      if (content.trim()) {
        textContents.push(content);
      }
      return;
    }

    if ('parts' in content && content.parts) {
      for (const part of content.parts) {
        this.processPart(
          part,
          textContents,
          imageContents,
          audioContents,
          otherContents,
        );
      }
      return;
    }

    // Some request shapes (e.g. CountTokensParameters) allow passing parts directly
    // instead of wrapping them in a { parts: [...] } Content object.
    this.processPart(
      content as Part | string,
      textContents,
      imageContents,
      audioContents,
      otherContents,
    );
  }

  /**
   * Process a single part and add to appropriate arrays
   */
  private processPart(
    part: Part | string,
    textContents: string[],
    imageContents: Array<{ data: string; mimeType: string }>,
    audioContents: Array<{ data: string; mimeType: string }>,
    otherContents: string[],
  ): void {
    if (typeof part === 'string') {
      if (part.trim()) {
        textContents.push(part);
      }
      return;
    }

    if ('text' in part && part.text) {
      textContents.push(part.text);
      return;
    }

    if ('inlineData' in part && part.inlineData) {
      const { data, mimeType } = part.inlineData;
      if (mimeType && mimeType.startsWith('image/')) {
        imageContents.push({ data: data || '', mimeType });
        return;
      }
      if (mimeType && mimeType.startsWith('audio/')) {
        audioContents.push({ data: data || '', mimeType });
        return;
      }
    }

    if ('fileData' in part && part.fileData) {
      otherContents.push(JSON.stringify(part.fileData));
      return;
    }

    if ('functionCall' in part && part.functionCall) {
      otherContents.push(JSON.stringify(part.functionCall));
      return;
    }

    if ('functionResponse' in part && part.functionResponse) {
      otherContents.push(JSON.stringify(part.functionResponse));
      return;
    }

    // Unknown part type - try to serialize
    try {
      const serialized = JSON.stringify(part);
      if (serialized && serialized !== '{}') {
        otherContents.push(serialized);
      }
    } catch (error) {
      debugLogger.warn('Failed to serialize unknown part type:', error);
    }
  }
}
