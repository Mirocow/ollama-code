/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentResponse } from '@google/genai';
export interface HttpError extends Error {
    status?: number;
}
export interface RetryOptions {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    shouldRetryOnError: (error: Error) => boolean;
    shouldRetryOnContent?: (content: GenerateContentResponse) => boolean;
}
/**
 * Retries a function with exponential backoff and jitter.
 * @param fn The asynchronous function to retry.
 * @param options Optional retry configuration.
 * @returns A promise that resolves with the result of the function if successful.
 * @throws The last error encountered if all attempts fail.
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
/**
 * Extracts the HTTP status code from an error object.
 *
 * Checks the following properties in order of priority:
 * 1. `error.status` - OpenAI, Anthropic, Gemini SDK errors
 * 2. `error.statusCode` - Some HTTP client libraries
 * 3. `error.response.status` - Axios-style errors
 * 4. `error.error.code` - Nested error objects
 *
 * @param error The error object.
 * @returns The HTTP status code (100-599), or undefined if not found.
 */
export declare function getErrorStatus(error: unknown): number | undefined;
