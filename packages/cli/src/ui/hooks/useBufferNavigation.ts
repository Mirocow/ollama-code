/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { useMultiFileBuffers } from '../contexts/MultiFileBufferContext.js';
import type { Key } from './useKeypress.js';
import { useKeypress } from './useKeypress.js';

/**
 * Buffer command types
 */
export type BufferCommand =
  | 'next' // :bn - next buffer
  | 'previous' // :bp - previous buffer
  | 'alternate' // Ctrl-^ - alternate buffer
  | 'close' // :bd - delete buffer
  | 'closeForce' // :bd! - force delete buffer
  | 'save' // :w - save buffer
  | 'saveAll' // :wa - save all
  | 'list' // :ls - list buffers
  | 'quit' // :q - quit current buffer
  | 'quitForce'; // :q! - force quit

/**
 * Options for buffer navigation hook
 */
export interface BufferNavigationOptions {
  /** Enable vim-style buffer commands */
  enableVimCommands?: boolean;
  /** Callback when buffer command is executed */
  onCommand?: (command: BufferCommand) => void;
  /** Callback to show buffer list */
  onShowBufferList?: () => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Custom key bindings */
  keyBindings?: {
    nextBuffer?: string[];
    previousBuffer?: string[];
    alternateBuffer?: string[];
  };
}

/**
 * Result of a buffer navigation action
 */
export interface BufferNavigationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Hook that provides keyboard shortcuts for buffer navigation.
 * 
 * Supports vim-like commands:
 * - :bn or :buffer-next - next buffer
 * - :bp or :buffer-previous - previous buffer
 * - :bd - delete buffer (prompts if unsaved)
 * - :bd! - force delete buffer
 * - :w - save current buffer
 * - :wa - save all buffers
 * - :ls or :buffers - list buffers
 * - :q - quit current buffer (prompts if unsaved)
 * - :q! - force quit
 * - Ctrl-^ - alternate buffer (switch to previous)
 */
export function useBufferNavigation(
  options: BufferNavigationOptions = {},
): {
  /** Execute a buffer command programmatically */
  executeCommand: (command: BufferCommand, bufferNumber?: number) => BufferNavigationResult;
  /** Get keyboard help text */
  getHelpText: () => string;
  /** Whether there are pending unsaved changes */
  hasUnsavedChanges: boolean;
  /** Current buffer info */
  currentBufferInfo: string;
} {
  const {
    enableVimCommands = true,
    onCommand,
    onShowBufferList,
    onError,
    keyBindings,
  } = options;

  const {
    activeBuffer,
    hasDirtyBuffers,
    nextBuffer,
    previousBuffer,
    alternateBuffer,
    closeBuffer,
    closeCurrentBuffer,
    saveBuffer,
    saveAllBuffers,
  } = useMultiFileBuffers();

  const [_lastResult, setLastResult] = useState<BufferNavigationResult>({
    success: true,
  });

  // Execute a buffer command
  const executeCommand = useCallback(
    (command: BufferCommand, bufferNumber?: number): BufferNavigationResult => {
      let result: BufferNavigationResult = { success: true };

      try {
        switch (command) {
          case 'next': {
            const buffer = nextBuffer();
            if (buffer) {
              result.message = `Switched to buffer ${buffer.bufferNumber}: ${buffer.filePath}`;
            } else {
              result = { success: false, error: 'No buffers to switch to' };
            }
            break;
          }

          case 'previous': {
            const buffer = previousBuffer();
            if (buffer) {
              result.message = `Switched to buffer ${buffer.bufferNumber}: ${buffer.filePath}`;
            } else {
              result = { success: false, error: 'No buffers to switch to' };
            }
            break;
          }

          case 'alternate': {
            const buffer = alternateBuffer();
            if (buffer) {
              result.message = `Switched to buffer ${buffer.bufferNumber}: ${buffer.filePath}`;
            } else {
              result = { success: false, error: 'No alternate buffer' };
            }
            break;
          }

          case 'close':
          case 'closeForce': {
            const targetNumber = bufferNumber ?? activeBuffer?.bufferNumber;
            if (targetNumber === undefined) {
              result = { success: false, error: 'No buffer to close' };
            } else {
              const closeResult = closeBuffer(
                targetNumber,
                command === 'closeForce',
              );
              if (closeResult.success) {
                result.message = `Closed buffer ${targetNumber}`;
              } else {
                result = { success: false, error: closeResult.error };
              }
            }
            break;
          }

          case 'save': {
            const saveResult = saveBuffer();
            if (saveResult.success) {
              result.message = activeBuffer
                ? `Saved: ${activeBuffer.filePath}`
                : 'Buffer saved';
            } else {
              result = { success: false, error: saveResult.error };
            }
            break;
          }

          case 'saveAll': {
            const saveAllResult = saveAllBuffers();
            if (saveAllResult.success) {
              result.message = 'All buffers saved';
            } else {
              result = {
                success: false,
                error: `Some buffers failed to save: ${saveAllResult.errors.join(', ')}`,
              };
            }
            break;
          }

          case 'list': {
            onShowBufferList?.();
            result.message = 'Showing buffer list';
            break;
          }

          case 'quit':
          case 'quitForce': {
            const closeResult = closeCurrentBuffer(command === 'quitForce');
            if (closeResult.success) {
              result.message = 'Buffer closed';
            } else {
              result = { success: false, error: closeResult.error };
            }
            break;
          }

          default: {
            result = { success: false, error: `Unknown command: ${command}` };
            break;
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result = { success: false, error: errorMsg };
      }

      setLastResult(result);

      if (result.success) {
        onCommand?.(command);
      } else if (result.error) {
        onError?.(result.error);
      }

      return result;
    },
    [
      nextBuffer,
      previousBuffer,
      alternateBuffer,
      closeBuffer,
      closeCurrentBuffer,
      saveBuffer,
      saveAllBuffers,
      activeBuffer,
      onCommand,
      onShowBufferList,
      onError,
    ],
  );

  // Handle keyboard input for buffer navigation
  const handleInput = useCallback(
    (key: Key): boolean => {
      if (!enableVimCommands) return false;

      // Check for custom key bindings first
      const customNext = keyBindings?.nextBuffer ?? [];
      const customPrev = keyBindings?.previousBuffer ?? [];
      const customAlt = keyBindings?.alternateBuffer ?? ['^'];

      // Check for Ctrl-^ (alternate buffer - standard vim)
      if (key.ctrl && key.sequence === '^') {
        executeCommand('alternate');
        return true;
      }

      // Check for custom alternate buffer keys
      if (key.ctrl && customAlt.includes(key.sequence)) {
        executeCommand('alternate');
        return true;
      }

      // Check for custom next buffer keys
      if (customNext.includes(key.sequence) && !key.ctrl && !key.meta) {
        executeCommand('next');
        return true;
      }

      // Check for custom previous buffer keys
      if (customPrev.includes(key.sequence) && !key.ctrl && !key.meta) {
        executeCommand('previous');
        return true;
      }

      return false;
    },
    [enableVimCommands, keyBindings, executeCommand],
  );

  // Register keypress handler
  useKeypress(handleInput, { isActive: enableVimCommands });

  // Get help text for keyboard shortcuts
  const getHelpText = useCallback((): string => {
    return `Buffer Commands:
  :bn / :buffer-next    Next buffer
  :bp / :buffer-prev    Previous buffer
  :bd [N]               Delete buffer N (current if no N)
  :bd! [N]              Force delete (discard changes)
  :w                    Write/save current buffer
  :wa                   Write all buffers
  :ls / :buffers        List all buffers
  :q                    Quit current buffer
  :q!                   Force quit (discard changes)
  Ctrl-^                Alternate buffer (previous)`;
  }, []);

  // Compute derived state
  const hasUnsavedChanges = hasDirtyBuffers;
  const currentBufferInfo = activeBuffer
    ? `[${activeBuffer.bufferNumber}] ${activeBuffer.filePath}${activeBuffer.isDirty ? ' [+]' : ''}`
    : '[No buffer]';

  return {
    executeCommand,
    getHelpText,
    hasUnsavedChanges,
    currentBufferInfo,
  };
}

/**
 * Parse a vim-style command string into a buffer command
 */
export function parseBufferCommand(
  input: string,
): { command: BufferCommand; bufferNumber?: number } | null {
  const trimmed = input.trim().toLowerCase();

  // Match patterns like :bn, :bp, :bd, :bd!, :bd 3, :w, :wa, :ls, :q, :q!
  const bdMatch = trimmed.match(/^bd!?(\s+(\d+))?$/);
  if (bdMatch) {
    return {
      command: bdMatch[0].includes('!') ? 'closeForce' : 'close',
      bufferNumber: bdMatch[2] ? parseInt(bdMatch[2], 10) : undefined,
    };
  }

  const quitMatch = trimmed.match(/^q!?$/);
  if (quitMatch) {
    return {
      command: quitMatch[0].includes('!') ? 'quitForce' : 'quit',
    };
  }

  const simpleCommands: Record<string, BufferCommand> = {
    bn: 'next',
    'buffer-next': 'next',
    bnext: 'next',
    bp: 'previous',
    'buffer-prev': 'previous',
    bprev: 'previous',
    w: 'save',
    wa: 'saveAll',
    wall: 'saveAll',
    ls: 'list',
    buffers: 'list',
  };

  for (const [pattern, cmd] of Object.entries(simpleCommands)) {
    if (trimmed === pattern || trimmed === `:${pattern}`) {
      return { command: cmd };
    }
  }

  return null;
}

export { useBufferNavigation };
