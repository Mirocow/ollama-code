/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Backward compatibility module for OpenAILogger.
 * This module re-exports ApiLogger with the old names for compatibility.
 * @deprecated Use ApiLogger from './apiLogger.js' instead.
 */

import { ApiLogger, type ApiLoggerOptions } from './apiLogger.js';

// Re-export ApiLogger with backward compatible names
export { ApiLogger } from './apiLogger.js';

/**
 * Create OpenAILogger with backward compatible API.
 * @deprecated Use ApiLogger from './apiLogger.js' instead.
 */
export class OpenAILogger extends ApiLogger {
  constructor(customLogDirOrOptions?: string | ApiLoggerOptions) {
    // Handle both string and object argument, default logPrefix to 'openai'
    if (typeof customLogDirOrOptions === 'string') {
      super({ customLogDir: customLogDirOrOptions, logPrefix: 'openai' });
    } else if (customLogDirOrOptions) {
      super({ ...customLogDirOrOptions, logPrefix: customLogDirOrOptions.logPrefix || 'openai' });
    } else {
      super({ logPrefix: 'openai' });
    }
  }
}

// Singleton instance with openai prefix
export const openaiLogger = new OpenAILogger();
