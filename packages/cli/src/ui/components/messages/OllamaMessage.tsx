/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { memo, useMemo } from 'react';
import { Text, Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { theme } from '../../semantic-colors.js';
import { SCREEN_READER_MODEL_PREFIX } from '../../textConstants.js';

interface OllamaMessageProps {
  text: string;
  isPending: boolean;
  availableTerminalHeight?: number;
  contentWidth: number;
}

/**
 * OllamaMessage component - renders assistant messages
 * Memoized to prevent unnecessary re-renders during streaming
 */
const OllamaMessageComponent: React.FC<OllamaMessageProps> = ({
  text,
  isPending,
  availableTerminalHeight,
  contentWidth,
}) => {
  const prefix = '✦ ';
  const prefixWidth = prefix.length;

  // Memoize calculated values
  const markdownWidth = useMemo(
    () => contentWidth - prefixWidth,
    [contentWidth, prefixWidth],
  );

  return (
    <Box flexDirection="row">
      <Box width={prefixWidth}>
        <Text color={theme.text.accent} aria-label={SCREEN_READER_MODEL_PREFIX}>
          {prefix}
        </Text>
      </Box>
      <Box flexGrow={1} flexDirection="column">
        <MarkdownDisplay
          text={text}
          isPending={isPending}
          availableTerminalHeight={availableTerminalHeight}
          contentWidth={markdownWidth}
        />
      </Box>
    </Box>
  );
};

/**
 * Memoized OllamaMessage - only re-renders when props actually change
 * Uses shallow comparison for props
 */
export const OllamaMessage = memo(OllamaMessageComponent);
