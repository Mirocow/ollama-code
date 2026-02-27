/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapter layer for normalizing different data formats to unified message format
 */

// Type exports
export type {
  UnifiedMessage,
  UnifiedMessageType,
  JSONLMessage,
  ToolCallData,
  FileContext,
} from './types.js';

// JSONL Adapter (for ChatViewer)
export { adaptJSONLMessages, filterEmptyMessages } from './JSONLAdapter.js';
