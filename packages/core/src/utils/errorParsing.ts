/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { isApiError, isStructuredError } from './quotaErrorDetection.js';

const RATE_LIMIT_ERROR_MESSAGE_DEFAULT =
  '\nPossible quota limitations in place or slow response times detected. Please wait and try again later.';

/**
 * Connection error patterns for detecting connection issues.
 */
const CONNECTION_ERROR_PATTERNS = {
  econnrefused: /ECONNREFUSED/i,
  enotfound: /ENOTFOUND/i,
  etimedout: /ETIMEDOUT|ETIMEDOUT/i,
  ehostunreach: /EHOSTUNREACH/i,
  neterr: /NETERR|network error/i,
  connectionReset: /ECONNRESET|connection reset/i,
  connectionClosed: /connection closed|socket hang up/i,
} as const;

/**
 * Checks if the error is a connection error.
 */
function isConnectionError(error: unknown): {
  isConnection: boolean;
  type?: string;
  address?: string;
  port?: string;
} {
  const errorStr =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : String(error);

  // Check for Node.js network error format: ECONNREFUSED 192.168.1.177:11434
  const connectionMatch = errorStr.match(
    /(ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EHOSTUNREACH)\s+(\S+):(\d+)/i,
  );
  if (connectionMatch) {
    return {
      isConnection: true,
      type: connectionMatch[1],
      address: connectionMatch[2],
      port: connectionMatch[3],
    };
  }

  // Check for other connection error patterns
  for (const [type, pattern] of Object.entries(CONNECTION_ERROR_PATTERNS)) {
    if (pattern.test(errorStr)) {
      return { isConnection: true, type: type.toUpperCase() };
    }
  }

  return { isConnection: false };
}

/**
 * Formats a connection error with helpful suggestions.
 */
function formatConnectionError(
  errorType?: string,
  address?: string,
  port?: string,
): string {
  const serverInfo = address && port ? ` at ${address}:${port}` : '';

  switch (errorType) {
    case 'ECONNREFUSED':
      return [
        `❌ Connection refused${serverInfo}`,
        '',
        'The Ollama server is not running or not accessible.',
        '',
        '💡 To fix this:',
        '   1. Start Ollama: ollama serve',
        '   2. Or check if Ollama is running: ollama list',
        '   3. Verify the server URL with --ollama-server option',
      ].join('\n');

    case 'ENOTFOUND':
      return [
        `❌ Server not found${serverInfo}`,
        '',
        'The Ollama server address could not be resolved.',
        '',
        '💡 To fix this:',
        '   1. Check the server URL is correct',
        '   2. Use --ollama-server to specify the correct address',
        '   3. For local Ollama, try: --ollama-server http://localhost:11434',
      ].join('\n');

    case 'ETIMEDOUT':
      return [
        `❌ Connection timed out${serverInfo}`,
        '',
        'The Ollama server is not responding.',
        '',
        '💡 To fix this:',
        '   1. Check if Ollama is running: ollama list',
        '   2. The server may be overloaded, wait and try again',
        '   3. Check network connectivity',
      ].join('\n');

    case 'EHOSTUNREACH':
      return [
        `❌ Host unreachable${serverInfo}`,
        '',
        'The Ollama server host is not reachable.',
        '',
        '💡 To fix this:',
        '   1. Check your network connection',
        '   2. Verify the server address is correct',
        '   3. Check firewall settings',
      ].join('\n');

    default:
      return [
        `❌ Connection error${serverInfo}`,
        '',
        'Could not connect to the Ollama server.',
        '',
        '💡 To fix this:',
        '   1. Start Ollama: ollama serve',
        '   2. Check server URL with --ollama-server option',
      ].join('\n');
  }
}

export function parseAndFormatApiError(
  error: unknown,
  _authType?: string,
): string {
  // Check for connection errors first
  const connectionCheck = isConnectionError(error);
  if (connectionCheck.isConnection) {
    return formatConnectionError(
      connectionCheck.type,
      connectionCheck.address,
      connectionCheck.port,
    );
  }

  if (isStructuredError(error)) {
    // Check if the structured error contains a connection error
    const innerConnectionCheck = isConnectionError(error.message);
    if (innerConnectionCheck.isConnection) {
      return formatConnectionError(
        innerConnectionCheck.type,
        innerConnectionCheck.address,
        innerConnectionCheck.port,
      );
    }

    let text = `[API Error: ${error.message}]`;
    if (error.status === 429) {
      text += RATE_LIMIT_ERROR_MESSAGE_DEFAULT;
    }
    return text;
  }

  // The error message might be a string containing a JSON object.
  if (typeof error === 'string') {
    // Check for connection error in string
    const strConnectionCheck = isConnectionError(error);
    if (strConnectionCheck.isConnection) {
      return formatConnectionError(
        strConnectionCheck.type,
        strConnectionCheck.address,
        strConnectionCheck.port,
      );
    }

    const jsonStart = error.indexOf('{');
    if (jsonStart === -1) {
      return `[API Error: ${error}]`; // Not a JSON error, return as is.
    }

    const jsonString = error.substring(jsonStart);

    try {
      const parsedError = JSON.parse(jsonString) as unknown;
      if (isApiError(parsedError)) {
        let finalMessage = parsedError.error.message;
        let finalCode = parsedError.error.code;
        let hasStatus = parsedError.error.status !== undefined;

        try {
          // See if the message is a stringified JSON with another error
          const nestedError = JSON.parse(finalMessage) as unknown;
          if (isApiError(nestedError)) {
            finalMessage = nestedError.error.message;
            // For nested errors, use the nested error's code
            finalCode = nestedError.error.code;
            hasStatus = nestedError.error.status !== undefined;
          }
        } catch (_e) {
          // It's not a nested JSON error, so we just use the message as is.
        }

        // Check for connection error in nested message
        const nestedConnectionCheck = isConnectionError(finalMessage);
        if (nestedConnectionCheck.isConnection) {
          return formatConnectionError(
            nestedConnectionCheck.type,
            nestedConnectionCheck.address,
            nestedConnectionCheck.port,
          );
        }

        // Only show status if the status field exists (use code value for display)
        const statusText =
          hasStatus && finalCode ? ` (Status: ${finalCode})` : '';
        let text = `[API Error: ${finalMessage}${statusText}]`;
        if (parsedError.error.code === 429) {
          text += RATE_LIMIT_ERROR_MESSAGE_DEFAULT;
        }
        return text;
      }
    } catch (_e) {
      // Not a valid JSON, fall through and return the original message.
    }
    return `[API Error: ${error}]`;
  }

  return '[API Error: An unknown error occurred.]';
}
