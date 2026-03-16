/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Text } from 'ink';
import { memo, useMemo } from 'react';
import type { HistoryItem } from '../types.js';
import { useVirtualScroll } from '../hooks/useVirtualScroll.js';
import { theme } from '../semantic-colors.js';
import type { SlashCommand } from '../commands/types.js';

interface VirtualizedHistoryListProps {
  /** Array of history items to render */
  items: HistoryItem[];
  /** Maximum number of items to display at once */
  maxVisibleItems?: number;
  /** Whether keyboard navigation is active */
  isFocused?: boolean;
  /** Key for remounting the list */
  remountKey?: string | number;
  /** Terminal width */
  terminalWidth: number;
  /** Main area width */
  mainAreaWidth: number;
  /** Max item height for terminal */
  staticAreaMaxItemHeight: number;
  /** Max lines for gemini messages */
  maxGeminiMessageLines?: number;
  /** Slash commands for help display */
  commands?: readonly SlashCommand[];
  /** Render function for each item */
  renderItem: (item: HistoryItem, index: number) => React.ReactNode;
}

/**
 * Scroll indicator component showing scroll direction and position.
 */
const ScrollIndicator = memo(({
  direction,
  isActive,
  position,
  total,
}: {
  direction: 'up' | 'down';
  isActive: boolean;
  position?: number;
  total?: number;
}) => {
  const arrow = direction === 'up' ? '▲' : '▼';
  const color = isActive ? theme.text.primary : theme.text.secondary;

  return (
    <Box marginLeft={2}>
      <Text color={color} dimColor={!isActive}>
        {arrow}
        {position !== undefined && total !== undefined && (
          <Text color={theme.text.secondary}> ({position}/{total})</Text>
        )}
      </Text>
    </Box>
  );
});
ScrollIndicator.displayName = 'ScrollIndicator';

/**
 * VirtualizedHistoryList component - renders only visible history items
 * to improve performance with long conversations.
 *
 * Features:
 * - Only renders items within the visible viewport
 * - Keyboard navigation (up/down, Page Up/Down, Home/End)
 * - Scroll indicators (▲/▼) when content overflows
 * - Auto-scrolls to bottom when new items arrive
 * - Preserves all existing HistoryItemDisplay functionality
 */
const VirtualizedHistoryListComponent = ({
  items,
  maxVisibleItems = 20,
  isFocused = true,
  remountKey,
  renderItem,
}: VirtualizedHistoryListProps) => {
  // Use virtual scroll hook for managing visible items
  const {
    startIndex,
    endIndex,
    hasMoreAbove,
    hasMoreBelow,
  } = useVirtualScroll({
    itemCount: items.length,
    maxVisibleItems,
    isFocused,
    autoScrollToBottom: true,
    reservedLines: 2, // Reserve space for scroll indicators
  });

  // Get visible items slice
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  // Create a key for the visible slice to help React with reconciliation
  const visibleKey = useMemo(
    () => `${remountKey}-${startIndex}-${endIndex}`,
    [remountKey, startIndex, endIndex]
  );

  return (
    <Box flexDirection="column" key={visibleKey}>
      {/* Scroll up indicator */}
      {hasMoreAbove && (
        <ScrollIndicator
          direction="up"
          isActive={true}
          position={startIndex + 1}
          total={items.length}
        />
      )}

      {/* Render visible items */}
      {visibleItems.map((item, index) => {
        const actualIndex = startIndex + index;
        return (
          <Box key={item.id} flexDirection="column">
            {renderItem(item, actualIndex)}
          </Box>
        );
      })}

      {/* Scroll down indicator */}
      {hasMoreBelow && (
        <ScrollIndicator
          direction="down"
          isActive={true}
          position={endIndex}
          total={items.length}
        />
      )}
    </Box>
  );
};

/**
 * Memoized VirtualizedHistoryList component
 * Only re-renders when items or scroll position changes
 */
export const VirtualizedHistoryList = memo(VirtualizedHistoryListComponent);
