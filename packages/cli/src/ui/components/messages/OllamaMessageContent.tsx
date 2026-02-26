/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';

interface OllamaMessageContentProps {
  text: string;
  isPending: boolean;
  availableTerminalHeight?: number;
  contentWidth: number;
}

/*
 * Gemini message content is a semi-hacked component. The intention is to represent a partial
 * of OllamaMessage and is only used when a response gets too long. In that instance messages
 * are split into multiple OllamaMessageContent's to enable the root <Static> component in
 * App.tsx to be as performant as humanly possible.
 */
export const OllamaMessageContent: React.FC<OllamaMessageContentProps> = ({
  text,
  isPending,
  availableTerminalHeight,
  contentWidth,
}) => {
  const originalPrefix = '✦ ';
  const prefixWidth = originalPrefix.length;

  return (
    <Box flexDirection="column" paddingLeft={prefixWidth}>
      <MarkdownDisplay
        text={text}
        isPending={isPending}
        availableTerminalHeight={availableTerminalHeight}
        contentWidth={contentWidth - prefixWidth}
      />
    </Box>
  );
};
