/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Auto Storage Utility
 *
 * Automatic storage for AI model data:
 * - Generated text (if no file is created)
 * - Web content (fetched from internet)
 * - User clarifications
 *
 * This acts as a "notebook" for the AI model.
 */

import { createDebugLogger } from './debugLogger.js';

const debugLogger = createDebugLogger('AUTO_STORAGE');

// Storage namespace for auto-saved content
export const AUTO_STORAGE_NAMESPACE = 'session';

// Keys for different types of auto-saved content
export const AutoStorageKeys = {
  GENERATED_TEXT: 'generated_text', // AI-generated text not saved to files
  WEB_CONTENT: 'web_content', // Content fetched from the web
  USER_CLARIFICATIONS: 'user_clarifications', // User clarifications/answers
  CONVERSATION_CONTEXT: 'conversation_context', // Important context from conversation
} as const;

export type AutoStorageKey =
  (typeof AutoStorageKeys)[keyof typeof AutoStorageKeys];

/**
 * Interface for auto-saved entry
 */
export interface AutoSavedEntry {
  id: string;
  timestamp: string;
  type: AutoStorageKey | string;
  content: string;
  metadata?: {
    source?: string; // URL for web content, prompt for generated text
    tags?: string[];
    ttl?: number;
  };
}

/**
 * Storage service interface
 */
export interface StorageService {
  setItem(namespace: string, key: string, value: unknown): Promise<void>;
  getItem(namespace: string, key: string): Promise<unknown>;
  appendItem(namespace: string, key: string, value: unknown): Promise<void>;
}

/**
 * Global storage service reference
 */
let globalStorageService: StorageService | null = null;

/**
 * Set the global storage service
 */
export function setAutoStorageService(service: StorageService): void {
  globalStorageService = service;
  debugLogger.info('Auto storage service initialized');
}

/**
 * Get the global storage service
 */
export function getAutoStorageService(): StorageService | null {
  return globalStorageService;
}

/**
 * Generate unique ID for entries
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Auto-save generated text to storage
 * Called when AI generates text but doesn't create a file
 */
export async function autoSaveGeneratedText(
  content: string,
  metadata?: {
    prompt?: string;
    tags?: string[];
  },
): Promise<string | null> {
  if (!globalStorageService) {
    debugLogger.warn('Auto storage service not initialized');
    return null;
  }

  const entry: AutoSavedEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: AutoStorageKeys.GENERATED_TEXT,
    content,
    metadata: {
      source: metadata?.prompt,
      tags: metadata?.tags || ['generated'],
    },
  };

  try {
    // Append to the list of generated texts
    await globalStorageService.appendItem(
      AUTO_STORAGE_NAMESPACE,
      AutoStorageKeys.GENERATED_TEXT,
      entry,
    );
    debugLogger.info(`Auto-saved generated text: ${entry.id}`);
    return entry.id;
  } catch (error) {
    debugLogger.error('Failed to auto-save generated text:', error);
    return null;
  }
}

/**
 * Auto-save web content to storage
 * Called when content is fetched from the internet
 */
export async function autoSaveWebContent(
  content: string,
  sourceUrl: string,
  metadata?: {
    title?: string;
    tags?: string[];
    ttl?: number; // TTL in seconds
  },
): Promise<string | null> {
  if (!globalStorageService) {
    debugLogger.warn('Auto storage service not initialized');
    return null;
  }

  const entry: AutoSavedEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: AutoStorageKeys.WEB_CONTENT,
    content,
    metadata: {
      source: sourceUrl,
      tags: metadata?.tags || ['web', 'fetched'],
      ttl: metadata?.ttl,
    },
  };

  try {
    // Append to the list of web contents
    await globalStorageService.appendItem(
      AUTO_STORAGE_NAMESPACE,
      AutoStorageKeys.WEB_CONTENT,
      entry,
    );
    debugLogger.info(`Auto-saved web content from: ${sourceUrl}`);
    return entry.id;
  } catch (error) {
    debugLogger.error('Failed to auto-save web content:', error);
    return null;
  }
}

/**
 * Auto-save user clarification to storage
 * Called when user provides clarification or answers a question
 */
export async function autoSaveUserClarification(
  question: string,
  answer: string,
  metadata?: {
    tags?: string[];
  },
): Promise<string | null> {
  if (!globalStorageService) {
    debugLogger.warn('Auto storage service not initialized');
    return null;
  }

  const entry: AutoSavedEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: AutoStorageKeys.USER_CLARIFICATIONS,
    content: `Q: ${question}\nA: ${answer}`,
    metadata: {
      tags: metadata?.tags || ['clarification', 'user-input'],
    },
  };

  try {
    // Append to the list of clarifications
    await globalStorageService.appendItem(
      AUTO_STORAGE_NAMESPACE,
      AutoStorageKeys.USER_CLARIFICATIONS,
      entry,
    );
    debugLogger.info(`Auto-saved user clarification: ${entry.id}`);
    return entry.id;
  } catch (error) {
    debugLogger.error('Failed to auto-save user clarification:', error);
    return null;
  }
}

/**
 * Auto-save conversation context
 * Called when important context is identified in conversation
 */
export async function autoSaveConversationContext(
  context: string,
  metadata?: {
    topic?: string;
    importance?: 'high' | 'medium' | 'low';
    tags?: string[];
  },
): Promise<string | null> {
  if (!globalStorageService) {
    debugLogger.warn('Auto storage service not initialized');
    return null;
  }

  const entry: AutoSavedEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: AutoStorageKeys.CONVERSATION_CONTEXT,
    content: context,
    metadata: {
      tags: metadata?.tags || [
        'context',
        metadata?.importance || 'medium',
      ],
    },
  };

  try {
    // Append to the list of context entries
    await globalStorageService.appendItem(
      AUTO_STORAGE_NAMESPACE,
      AutoStorageKeys.CONVERSATION_CONTEXT,
      entry,
    );
    debugLogger.info(`Auto-saved conversation context: ${entry.id}`);
    return entry.id;
  } catch (error) {
    debugLogger.error('Failed to auto-save conversation context:', error);
    return null;
  }
}

/**
 * Get all entries of a specific type from auto-storage
 */
export async function getAutoSavedEntries(
  type: AutoStorageKey,
): Promise<AutoSavedEntry[]> {
  if (!globalStorageService) {
    debugLogger.warn('Auto storage service not initialized');
    return [];
  }

  try {
    const data = await globalStorageService.getItem(
      AUTO_STORAGE_NAMESPACE,
      type,
    );
    if (Array.isArray(data)) {
      return data as AutoSavedEntry[];
    }
    return [];
  } catch (error) {
    debugLogger.error(`Failed to get auto-saved entries for ${type}:`, error);
    return [];
  }
}

/**
 * Clear all entries of a specific type from auto-storage
 */
export async function clearAutoSavedEntries(
  type: AutoStorageKey,
): Promise<boolean> {
  if (!globalStorageService) {
    debugLogger.warn('Auto storage service not initialized');
    return false;
  }

  try {
    await globalStorageService.setItem(
      AUTO_STORAGE_NAMESPACE,
      type,
      [],
    );
    debugLogger.info(`Cleared auto-saved entries for ${type}`);
    return true;
  } catch (error) {
    debugLogger.error(`Failed to clear auto-saved entries for ${type}:`, error);
    return false;
  }
}
