/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useKeypress } from './useKeypress.js';
import { isUpKey, isDownKey } from './useSelectionList.js';

/**
 * Configuration options for the virtual scroll hook.
 */
export interface UseVirtualScrollOptions {
  /** Total number of items in the list */
  itemCount: number;
  /** Maximum number of items to display at once */
  maxVisibleItems: number;
  /** Whether the hook should respond to keyboard input */
  isFocused?: boolean;
  /** Auto-scroll to bottom when new items are added */
  autoScrollToBottom?: boolean;
  /** Reserve lines for other UI elements (header, footer, etc.) */
  reservedLines?: number;
}

/**
 * Result returned by the useVirtualScroll hook.
 */
export interface UseVirtualScrollResult {
  /** Index of the first visible item */
  startIndex: number;
  /** Index after the last visible item (exclusive) */
  endIndex: number;
  /** Current scroll offset from the top */
  scrollOffset: number;
  /** Whether there are more items above the visible area */
  hasMoreAbove: boolean;
  /** Whether there are more items below the visible area */
  hasMoreBelow: boolean;
  /** Scroll to a specific index */
  scrollToIndex: (index: number) => void;
  /** Scroll up by one page */
  scrollPageUp: () => void;
  /** Scroll down by one page */
  scrollPageDown: () => void;
  /** Scroll to the top of the list */
  scrollToTop: () => void;
  /** Scroll to the bottom of the list */
  scrollToBottom: () => void;
  /** Scroll up by one item */
  scrollUp: () => void;
  /** Scroll down by one item */
  scrollDown: () => void;
}

/**
 * A hook that manages virtual scrolling for large lists in a terminal environment.
 *
 * Features:
 * - Only renders visible items based on terminal height
 * - Keyboard navigation (up/down arrows, Page Up/Down)
 * - Auto-scroll to bottom when new items arrive
 * - Efficient scroll position management
 */
export function useVirtualScroll({
  itemCount,
  maxVisibleItems,
  isFocused = true,
  autoScrollToBottom = true,
  reservedLines = 0,
}: UseVirtualScrollOptions): UseVirtualScrollResult {
  const [scrollOffset, setScrollOffset] = useState(0);
  const prevItemCountRef = useRef(itemCount);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate the effective visible items count
  const effectiveVisibleItems = Math.max(1, maxVisibleItems - reservedLines);

  // Calculate visible range
  const startIndex = scrollOffset;
  const endIndex = Math.min(scrollOffset + effectiveVisibleItems, itemCount);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = endIndex < itemCount;

  // Scroll to a specific index
  const scrollToIndex = useCallback(
    (index: number) => {
      if (index < 0) {
        setScrollOffset(0);
        return;
      }

      if (index >= itemCount) {
        setScrollOffset(Math.max(0, itemCount - effectiveVisibleItems));
        return;
      }

      // If index is above visible area
      if (index < scrollOffset) {
        setScrollOffset(index);
        return;
      }

      // If index is below visible area
      if (index >= scrollOffset + effectiveVisibleItems) {
        setScrollOffset(Math.max(0, index - effectiveVisibleItems + 1));
        return;
      }
    },
    [itemCount, effectiveVisibleItems, scrollOffset]
  );

  // Scroll up by one item
  const scrollUp = useCallback(() => {
    setScrollOffset((prev) => Math.max(0, prev - 1));
    isUserScrollingRef.current = true;
  }, []);

  // Scroll down by one item
  const scrollDown = useCallback(() => {
    setScrollOffset((prev) =>
      Math.min(itemCount - effectiveVisibleItems, prev + 1)
    );
    isUserScrollingRef.current = true;
  }, [itemCount, effectiveVisibleItems]);

  // Scroll up by one page
  const scrollPageUp = useCallback(() => {
    setScrollOffset((prev) =>
      Math.max(0, prev - effectiveVisibleItems)
    );
    isUserScrollingRef.current = true;
  }, [effectiveVisibleItems]);

  // Scroll down by one page
  const scrollPageDown = useCallback(() => {
    setScrollOffset((prev) =>
      Math.min(itemCount - effectiveVisibleItems, prev + effectiveVisibleItems)
    );
    isUserScrollingRef.current = true;
  }, [itemCount, effectiveVisibleItems]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    setScrollOffset(0);
    isUserScrollingRef.current = true;
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    setScrollOffset(Math.max(0, itemCount - effectiveVisibleItems));
  }, [itemCount, effectiveVisibleItems]);

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (autoScrollToBottom && itemCount > prevItemCountRef.current) {
      // Only auto-scroll if the user isn't actively scrolling
      if (!isUserScrollingRef.current) {
        scrollToBottom();
      }
    }
    prevItemCountRef.current = itemCount;
  }, [itemCount, autoScrollToBottom, scrollToBottom]);

  // Reset user scrolling flag after inactivity
  useEffect(() => {
    if (isUserScrollingRef.current) {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      userScrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 2000); // Reset after 2 seconds of inactivity
    }

    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, [scrollOffset]);

  // Handle keyboard navigation
  useKeypress(
    (key) => {
      const { name, sequence } = key;

      // Up arrow or 'k'
      if (isUpKey(name, sequence)) {
        scrollUp();
        return;
      }

      // Down arrow or 'j'
      if (isDownKey(name, sequence)) {
        scrollDown();
        return;
      }

      // Page Up
      if (name === 'pageup') {
        scrollPageUp();
        return;
      }

      // Page Down
      if (name === 'pagedown') {
        scrollPageDown();
        return;
      }

      // Home - scroll to top
      if (name === 'home') {
        scrollToTop();
        return;
      }

      // End - scroll to bottom
      if (name === 'end') {
        scrollToBottom();
        return;
      }
    },
    { isActive: isFocused && itemCount > effectiveVisibleItems }
  );

  return {
    startIndex,
    endIndex,
    scrollOffset,
    hasMoreAbove,
    hasMoreBelow,
    scrollToIndex,
    scrollPageUp,
    scrollPageDown,
    scrollToTop,
    scrollToBottom,
    scrollUp,
    scrollDown,
  };
}
