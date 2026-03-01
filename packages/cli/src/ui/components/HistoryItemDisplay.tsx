/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { memo, useMemo } from 'react';
import { escapeAnsiCtrlCodes } from '../utils/textUtils.js';
import type { HistoryItem } from '../types.js';
import { UserMessage } from './messages/UserMessage.js';
import { UserShellMessage } from './messages/UserShellMessage.js';
import { OllamaMessage } from './messages/OllamaMessage.js';
import { InfoMessage } from './messages/InfoMessage.js';
import { ErrorMessage } from './messages/ErrorMessage.js';
import { ToolGroupMessage } from './messages/ToolGroupMessage.js';
import { OllamaMessageContent } from './messages/OllamaMessageContent.js';
import { OllamaThoughtMessage } from './messages/OllamaThoughtMessage.js';
import { OllamaThoughtMessageContent } from './messages/OllamaThoughtMessageContent.js';
import { CompressionMessage } from './messages/CompressionMessage.js';
import { SummaryMessage } from './messages/SummaryMessage.js';
import { WarningMessage } from './messages/WarningMessage.js';
import { RetryCountdownMessage } from './messages/RetryCountdownMessage.js';
import { Box } from 'ink';
import { AboutBox } from './AboutBox.js';
import { StatsDisplay } from './StatsDisplay.js';
import { ModelStatsDisplay } from './ModelStatsDisplay.js';
import { ToolStatsDisplay } from './ToolStatsDisplay.js';
import { SessionSummaryDisplay } from './SessionSummaryDisplay.js';
import { Help } from './Help.js';
import type { SlashCommand } from '../commands/types.js';
import { ExtensionsList } from './views/ExtensionsList.js';
import { getMCPServerStatus } from '@ollama-code/ollama-code-core';
import { SkillsList } from './views/SkillsList.js';
import { ToolsList } from './views/ToolsList.js';
import { McpStatus } from './views/McpStatus.js';

interface HistoryItemDisplayProps {
  item: HistoryItem;
  availableTerminalHeight?: number;
  terminalWidth: number;
  mainAreaWidth?: number;
  isPending: boolean;
  isFocused?: boolean;
  commands?: readonly SlashCommand[];
  activeShellPtyId?: number | null;
  embeddedShellFocused?: boolean;
  availableTerminalHeightGemini?: number;
}

/**
 * HistoryItemDisplay component - renders individual history items
 * Memoized to prevent unnecessary re-renders when other items change
 */
const HistoryItemDisplayComponent: React.FC<HistoryItemDisplayProps> = ({
  item,
  availableTerminalHeight,
  terminalWidth,
  mainAreaWidth,
  isPending,
  commands,
  isFocused = true,
  activeShellPtyId,
  embeddedShellFocused,
  availableTerminalHeightGemini,
}) => {
  const itemForDisplay = useMemo(() => escapeAnsiCtrlCodes(item), [item]);
  
  // Memoize computed dimensions
  const dimensions = useMemo(() => {
    const contentWidth = terminalWidth - 4;
    const boxWidth = mainAreaWidth || contentWidth;
    return { contentWidth, boxWidth };
  }, [terminalWidth, mainAreaWidth]);

  // Memoize terminal height for gemini/ollama messages
  const effectiveHeight = useMemo(
    () => availableTerminalHeightGemini ?? availableTerminalHeight,
    [availableTerminalHeightGemini, availableTerminalHeight]
  );

  return (
    <Box
      flexDirection="column"
      key={itemForDisplay.id}
      marginLeft={2}
      marginRight={2}
    >
      {/* Render standard message types */}
      {itemForDisplay.type === 'user' && (
        <UserMessage text={itemForDisplay.text} />
      )}
      {itemForDisplay.type === 'user_shell' && (
        <UserShellMessage text={itemForDisplay.text} />
      )}
      {itemForDisplay.type === 'ollama' && (
        <OllamaMessage
          text={itemForDisplay.text}
          isPending={isPending}
          availableTerminalHeight={effectiveHeight}
          contentWidth={dimensions.contentWidth}
        />
      )}
      {itemForDisplay.type === 'ollama_content' && (
        <OllamaMessageContent
          text={itemForDisplay.text}
          isPending={isPending}
          availableTerminalHeight={effectiveHeight}
          contentWidth={dimensions.contentWidth}
        />
      )}
      {itemForDisplay.type === 'ollama_thought' && (
        <OllamaThoughtMessage
          text={itemForDisplay.text}
          isPending={isPending}
          availableTerminalHeight={effectiveHeight}
          contentWidth={dimensions.contentWidth}
        />
      )}
      {itemForDisplay.type === 'ollama_thought_content' && (
        <OllamaThoughtMessageContent
          text={itemForDisplay.text}
          isPending={isPending}
          availableTerminalHeight={effectiveHeight}
          contentWidth={dimensions.contentWidth}
        />
      )}
      {itemForDisplay.type === 'info' && (
        <InfoMessage text={itemForDisplay.text} />
      )}
      {itemForDisplay.type === 'warning' && (
        <WarningMessage text={itemForDisplay.text} />
      )}
      {itemForDisplay.type === 'error' && (
        <ErrorMessage text={itemForDisplay.text} />
      )}
      {itemForDisplay.type === 'retry_countdown' && (
        <RetryCountdownMessage text={itemForDisplay.text} />
      )}
      {itemForDisplay.type === 'about' && (
        <AboutBox {...itemForDisplay.systemInfo} width={dimensions.boxWidth} />
      )}
      {itemForDisplay.type === 'help' && commands && (
        <Help commands={commands} width={dimensions.boxWidth} />
      )}
      {itemForDisplay.type === 'stats' && (
        <StatsDisplay duration={itemForDisplay.duration} width={dimensions.boxWidth} />
      )}
      {itemForDisplay.type === 'model_stats' && (
        <ModelStatsDisplay width={dimensions.boxWidth} />
      )}
      {itemForDisplay.type === 'tool_stats' && (
        <ToolStatsDisplay width={dimensions.boxWidth} />
      )}
      {itemForDisplay.type === 'quit' && (
        <SessionSummaryDisplay
          duration={itemForDisplay.duration}
          width={dimensions.boxWidth}
        />
      )}
      {itemForDisplay.type === 'tool_group' && (
        <ToolGroupMessage
          toolCalls={itemForDisplay.tools}
          groupId={itemForDisplay.id}
          availableTerminalHeight={availableTerminalHeight}
          contentWidth={dimensions.contentWidth}
          isFocused={isFocused}
          activeShellPtyId={activeShellPtyId}
          embeddedShellFocused={embeddedShellFocused}
        />
      )}
      {itemForDisplay.type === 'compression' && (
        <CompressionMessage compression={itemForDisplay.compression} />
      )}
      {item.type === 'summary' && <SummaryMessage summary={item.summary} />}
      {itemForDisplay.type === 'extensions_list' && <ExtensionsList />}
      {itemForDisplay.type === 'tools_list' && (
        <ToolsList
          contentWidth={dimensions.contentWidth}
          tools={itemForDisplay.tools}
          showDescriptions={itemForDisplay.showDescriptions}
        />
      )}
      {itemForDisplay.type === 'skills_list' && (
        <SkillsList skills={itemForDisplay.skills} />
      )}
      {itemForDisplay.type === 'mcp_status' && (
        <McpStatus {...itemForDisplay} serverStatus={getMCPServerStatus} />
      )}
    </Box>
  );
};

/**
 * Memoized HistoryItemDisplay component
 * Only re-renders when item props actually change
 */
export const HistoryItemDisplay = memo(HistoryItemDisplayComponent);
