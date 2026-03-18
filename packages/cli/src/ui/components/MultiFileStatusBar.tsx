/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useMultiFileBuffers } from '../contexts/MultiFileBufferContext.js';
import * as path from 'node:path';

/**
 * Props for the MultiFileStatusBar component
 */
export interface MultiFileStatusBarProps {
  /** Width of the status bar */
  width?: number;
  /** Whether to show the buffer count */
  showBufferCount?: boolean;
  /** Whether to show the file path */
  showFilePath?: boolean;
  /** Whether to show line/column info */
  showPosition?: boolean;
  /** Custom prefix for the status bar */
  prefix?: string;
}

/**
 * Status bar component that displays current buffer information.
 * Similar to vim's status line.
 *
 * Shows:
 * - Buffer number
 * - File name
 * - Dirty indicator
 * - Buffer position (X/Y buffers)
 * - Cursor position
 */
export const MultiFileStatusBar: React.FC<MultiFileStatusBarProps> = ({
  width = 80,
  showBufferCount = true,
  showFilePath = true,
  showPosition = true,
  prefix = '',
}) => {
  const { activeBuffer, bufferCount } = useMultiFileBuffers();

  // Compute display values
  const fileInfo = useMemo(() => {
    if (!activeBuffer) {
      return {
        name: '[No File]',
        path: '',
        status: '',
      };
    }

    const name = path.basename(activeBuffer.filePath);
    const dir = path.dirname(activeBuffer.filePath);
    const statusParts: string[] = [];

    if (activeBuffer.isDirty) {
      statusParts.push('[+]');
    }
    if (activeBuffer.isNewFile) {
      statusParts.push('[New]');
    }

    return {
      name,
      path: dir !== '.' ? dir : '',
      status: statusParts.join(' '),
    };
  }, [activeBuffer]);

  // Build left side of status bar
  const leftParts: string[] = [];
  if (prefix) {
    leftParts.push(prefix);
  }
  leftParts.push(`[${activeBuffer?.bufferNumber ?? '-'}]`);
  leftParts.push(fileInfo.name);
  if (fileInfo.status) {
    leftParts.push(fileInfo.status);
  }

  // Build right side of status bar
  const rightParts: string[] = [];
  if (showBufferCount) {
    rightParts.push(`Buffers: ${bufferCount}`);
  }
  if (showPosition && activeBuffer) {
    rightParts.push(
      `Ln ${activeBuffer.cursorLine + 1}, Col ${activeBuffer.cursorColumn + 1}`,
    );
  }

  // Calculate available width for file path
  const leftText = leftParts.join(' ');
  const rightText = rightParts.join(' | ');
  const separatorLength = 3; // '...'
  const pathWidth =
    width - leftText.length - rightText.length - separatorLength - 4;

  return (
    <Box
      width={width}
      borderStyle="single"
      borderColor={activeBuffer ? theme.border.focused : theme.border.default}
      paddingX={1}
    >
      {/* Left side - buffer info */}
      <Box flexGrow={1}>
        <Text
          color={
            activeBuffer?.isDirty ? theme.status.warning : theme.text.accent
          }
          bold
        >
          {leftText}
        </Text>

        {/* File path */}
        {showFilePath && fileInfo.path && pathWidth > 5 && (
          <Text color={theme.text.secondary}>
            {' '}
            ({truncatePath(fileInfo.path, pathWidth)})
          </Text>
        )}
      </Box>

      {/* Right side - counts and position */}
      <Box>
        <Text color={theme.text.secondary}>{rightText}</Text>
      </Box>
    </Box>
  );
};

/**
 * Props for the MiniBufferStatus component
 */
export interface MiniBufferStatusProps {
  /** Width of the component */
  width?: number;
}

/**
 * Compact buffer status for inline display
 */
export const MiniBufferStatus: React.FC<MiniBufferStatusProps> = ({
  width = 40,
}) => {
  const { activeBuffer, bufferCount } = useMultiFileBuffers();

  if (!activeBuffer) {
    return (
      <Box width={width}>
        <Text color={theme.text.secondary}>[No buffer]</Text>
      </Box>
    );
  }

  const fileName = path.basename(activeBuffer.filePath);
  const status = activeBuffer.isDirty ? ' +' : '';

  return (
    <Box width={width}>
      <Text color={theme.text.accent}>
        [{activeBuffer.bufferNumber}/{bufferCount}]
      </Text>
      <Text color={theme.text.primary}>
        {' '}
        {truncateText(fileName + status, width - 10)}
      </Text>
    </Box>
  );
};

/**
 * Props for BufferNavigationHint component
 */
export interface BufferNavigationHintProps {
  /** Whether to show the hint */
  show?: boolean;
}

/**
 * Show navigation hints when switching buffers
 */
export const BufferNavigationHint: React.FC<BufferNavigationHintProps> = ({
  show = true,
}) => {
  const { activeBuffer } = useMultiFileBuffers();

  if (!show || !activeBuffer) return null;

  return (
    <Box flexDirection="column">
      <Text color={theme.text.secondary}>
        Buffer {activeBuffer.bufferNumber}:{' '}
        {path.basename(activeBuffer.filePath)}
        {activeBuffer.isDirty ? ' [modified]' : ''}
      </Text>
      <Text color={theme.text.secondary} dimColor>
        :bn next | :bp prev | :ls list | :bd close | :w save
      </Text>
    </Box>
  );
};

/**
 * Truncate a path to fit within a maximum length
 */
function truncatePath(filePath: string, maxLength: number): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }

  // Try to preserve the end of the path (filename)
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];

  if (fileName.length >= maxLength - 3) {
    return '...' + fileName.slice(-(maxLength - 3));
  }

  // Try to show some directory context
  const remaining = maxLength - fileName.length - 4; // 4 for '.../'
  if (remaining > 0) {
    return '...' + filePath.slice(-(remaining + fileName.length + 1));
  }

  return '...' + fileName.slice(-(maxLength - 3));
}

/**
 * Truncate text to fit within a maximum length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}
