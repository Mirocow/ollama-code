/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useMultiFileBuffers } from '../contexts/MultiFileBufferContext.js';
import * as path from 'node:path';

/**
 * Props for the BufferList component
 */
export interface BufferListProps {
  /** Maximum height for the list (scrolls if exceeded) */
  maxHeight?: number;
  /** Whether to show full file paths or just filenames */
  showFullPaths?: boolean;
  /** Title to display above the list */
  title?: string;
  /** Whether the component has focus */
  focus?: boolean;
  /** Custom width */
  width?: number;
}

/**
 * Display a list of open buffers similar to vim's :ls command.
 * 
 * Shows:
 * - Buffer number
 * - File name/path
 * - Dirty indicator (+)
 * - Active buffer indicator (a)
 * - Previous buffer indicator (#)
 * - New file indicator (new)
 */
export const BufferList: React.FC<BufferListProps> = ({
  maxHeight = 10,
  showFullPaths = false,
  title = 'Buffers',
  focus: _focus = true,
  width = 80,
}) => {
  const { buffers, activeBuffer, previousBuffer } = useMultiFileBuffers();

  // Sort buffers by buffer number
  const sortedBuffers = useMemo(
    () => [...buffers].sort((a, b) => a.bufferNumber - b.bufferNumber),
    [buffers],
  );

  // Determine if we need scrolling
  const needsScroll = sortedBuffers.length > maxHeight;
  const visibleBuffers = needsScroll
    ? sortedBuffers.slice(0, maxHeight)
    : sortedBuffers;

  if (sortedBuffers.length === 0) {
    return (
      <Box flexDirection="column" width={width}>
        <Text color={theme.text.secondary}>No buffers open</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={width}>
      {/* Title */}
      <Box marginBottom={1}>
        <Text bold color={theme.text.accent}>
          {title}
        </Text>
        <Text color={theme.text.secondary}>
          {' '}
          ({sortedBuffers.length} buffer{sortedBuffers.length !== 1 ? 's' : ''})
        </Text>
      </Box>

      {/* Buffer list */}
      <Box flexDirection="column">
        {visibleBuffers.map((buffer) => {
          const isActive = buffer.bufferNumber === activeBuffer?.bufferNumber;
          const isPrevious =
            buffer.bufferNumber === previousBuffer?.bufferNumber;

          // Build status indicators
          const indicators: string[] = [];
          if (buffer.isDirty) indicators.push('+');
          if (isActive) indicators.push('a');
          if (isPrevious) indicators.push('#');
          if (buffer.isNewFile) indicators.push('new');

          // Get display path
          const displayPath = showFullPaths
            ? buffer.filePath
            : path.basename(buffer.filePath);

          // Calculate padding for alignment
          const maxNumWidth = String(
            sortedBuffers[sortedBuffers.length - 1]?.bufferNumber ?? 0,
          ).length;
          const numStr = String(buffer.bufferNumber).padStart(maxNumWidth);

          return (
            <Box key={buffer.bufferNumber}>
              <Text
                color={isActive ? theme.status.success : theme.text.primary}
              >
                {numStr}
              </Text>
              <Text color={theme.text.secondary}> </Text>
              <Text
                color={
                  indicators.length > 0
                    ? theme.status.warning
                    : theme.text.secondary
                }
              >
                {indicators.join('')}
              </Text>
              {indicators.length > 0 && (
                <Text color={theme.text.secondary}> </Text>
              )}
              <Text
                color={isActive ? theme.status.success : theme.text.primary}
                bold={isActive}
              >
                {displayPath}
              </Text>
              {!showFullPaths && (
                <Text color={theme.text.secondary}>
                  {' '}
                  ({path.dirname(buffer.filePath)})
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Scroll indicator */}
      {needsScroll && (
        <Box marginTop={1}>
          <Text color={theme.text.secondary}>
            ... {sortedBuffers.length - maxHeight} more buffer
            {sortedBuffers.length - maxHeight !== 1 ? 's' : ''}
          </Text>
        </Box>
      )}

      {/* Legend */}
      <Box marginTop={1} flexDirection="column">
        <Text color={theme.text.secondary} dimColor>
          Legend: + = modified, a = active, # = alternate, new = new file
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Props for BufferSwitcher component
 */
export interface BufferSwitcherProps {
  /** Called when a buffer is selected */
  onSelect: (bufferNumber: number) => void;
  /** Called when cancelled */
  onCancel?: () => void;
  /** Initial filter text */
  initialFilter?: string;
  /** Width of the switcher */
  width?: number;
}

/**
 * Compact buffer switcher for quick navigation
 */
export const BufferSwitcher: React.FC<BufferSwitcherProps> = ({
  onSelect: _onSelect,
  onCancel: _onCancel,
  initialFilter = '',
  width = 60,
}) => {
  const { buffers, activeBuffer } = useMultiFileBuffers();
  const [filter] = React.useState(initialFilter);

  // Filter buffers
  const filteredBuffers = useMemo(() => {
    if (!filter) return buffers;
    const lowerFilter = filter.toLowerCase();
    return buffers.filter(
      (b) =>
        b.fileName.toLowerCase().includes(lowerFilter) ||
        b.filePath.toLowerCase().includes(lowerFilter),
    );
  }, [buffers, filter]);

  // Sort by: active first, then by buffer number
  const sortedBuffers = useMemo(
    () =>
      [...filteredBuffers].sort((a, b) => {
        if (a.bufferNumber === activeBuffer?.bufferNumber) return -1;
        if (b.bufferNumber === activeBuffer?.bufferNumber) return 1;
        return a.bufferNumber - b.bufferNumber;
      }),
    [filteredBuffers, activeBuffer],
  );

  if (buffers.length === 0) {
    return (
      <Box width={width}>
        <Text color={theme.text.secondary}>No buffers open</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={width}>
      {/* Filter prompt */}
      <Box marginBottom={1}>
        <Text color={theme.text.accent}>Switch to buffer: </Text>
        <Text color={theme.text.primary}>{filter}</Text>
        <Text color={theme.text.secondary} dimColor>
          {' '}
          (type to filter, Enter to select)
        </Text>
      </Box>

      {/* Buffer list */}
      {sortedBuffers.slice(0, 5).map((buffer) => (
        <Box key={buffer.bufferNumber}>
          <Text
            color={
              buffer.bufferNumber === activeBuffer?.bufferNumber
                ? theme.status.success
                : theme.text.primary
            }
          >
            {buffer.bufferNumber}: {buffer.fileName}
            {buffer.isDirty ? ' +' : ''}
          </Text>
        </Box>
      ))}

      {sortedBuffers.length > 5 && (
        <Text color={theme.text.secondary}>
          ... {sortedBuffers.length - 5} more
        </Text>
      )}
    </Box>
  );
};

export { BufferList };
