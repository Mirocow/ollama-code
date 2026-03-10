/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Static } from 'ink';
import { memo } from 'react';
import { useAppContext } from '../contexts/AppContext.js';
import { OverflowProvider } from '../contexts/OverflowContext.js';
import { useUIState } from '../contexts/UIStateContext.js';
import type { HistoryItemWithoutId } from '../types.js';
import { AppHeader } from './AppHeader.js';
import { HistoryItemDisplay } from './HistoryItemDisplay.js';
import { Notifications } from './Notifications.js';
import { ShowMoreLines } from './ShowMoreLines.js';

// Limit Gemini messages to a very high number of lines to mitigate performance
// issues in the worst case if we somehow get an enormous response from Gemini.
// This threshold is arbitrary but should be high enough to never impact normal
// usage.
const MAX_GEMINI_MESSAGE_LINES = 65536;

/**
 * Generates a stable key for pending history items to prevent flickering.
 * Using array index as key causes React to re-render all items on every update.
 * Instead, we use a combination of item type and unique identifiers.
 */
function getPendingItemKey(item: HistoryItemWithoutId, index: number): string {
  switch (item.type) {
    case 'tool_group':
      // Use the first tool's callId as the key for tool groups
      return `tool_group-${item.tools[0]?.callId ?? index}`;
    case 'ollama':
    case 'ollama_content':
    case 'ollama_thought':
    case 'ollama_thought_content':
      // Streaming content - use type as key (typically only one streaming item)
      // Include first 20 chars of text hash for stability during streaming
      return `stream-${item.type}`;
    case 'user':
    case 'user_shell':
      // User messages - use type and first 30 chars
      return `user-${item.text?.slice(0, 30) ?? index}`;
    case 'about':
      return 'about';
    case 'help':
      return 'help';
    case 'stats':
    case 'model_stats':
    case 'tool_stats':
      return item.type;
    case 'quit':
      return 'quit';
    case 'compression':
      return `compression-${index}`;
    case 'summary':
      return `summary-${index}`;
    case 'extensions_list':
      return 'extensions_list';
    case 'tools_list':
      return 'tools_list';
    case 'skills_list':
      return 'skills_list';
    case 'mcp_status':
      return 'mcp_status';
    case 'info':
    case 'error':
    case 'warning':
    case 'retry_countdown':
      // Use first 30 chars for messages
      return `msg-${item.type}-${item.text?.slice(0, 30) ?? index}`;
    default:
      // Fallback to index for unknown types
      return `pending-${index}`;
  }
}

/**
 * MainContent component - renders the main content area with history and pending items
 * Memoized to prevent unnecessary re-renders
 */
const MainContentComponent = () => {
  const { version } = useAppContext();
  const uiState = useUIState();

  // Extract only the values needed for rendering
  const {
    pendingHistoryItems,
    terminalWidth,
    mainAreaWidth,
    staticAreaMaxItemHeight,
    availableTerminalHeight,
    historyRemountKey,
    currentModel,
    history,
    slashCommands,
    constrainHeight,
    isEditorDialogOpen,
    activePtyId,
    embeddedShellFocused,
  } = uiState;

  return (
    <>
      {/* AppHeader is outside Static to allow dynamic updates (e.g., context progress bar) */}
      <AppHeader version={version} />
      <Static key={`${historyRemountKey}-${currentModel}`} items={history}>
        {(item) => (
          <HistoryItemDisplay
            key={item.id}
            terminalWidth={terminalWidth}
            mainAreaWidth={mainAreaWidth}
            availableTerminalHeight={staticAreaMaxItemHeight}
            availableTerminalHeightGemini={MAX_GEMINI_MESSAGE_LINES}
            item={item}
            isPending={false}
            commands={slashCommands}
          />
        )}
      </Static>
      <OverflowProvider>
        <Box flexDirection="column">
          {pendingHistoryItems.map((item, i) => (
            <HistoryItemDisplay
              key={getPendingItemKey(item, i)}
              availableTerminalHeight={
                constrainHeight ? availableTerminalHeight : undefined
              }
              terminalWidth={terminalWidth}
              mainAreaWidth={mainAreaWidth}
              item={{ ...item, id: 0 }}
              isPending={true}
              isFocused={!isEditorDialogOpen}
              activeShellPtyId={activePtyId}
              embeddedShellFocused={embeddedShellFocused}
            />
          ))}
          <ShowMoreLines constrainHeight={constrainHeight} />
        </Box>
      </OverflowProvider>
      <Notifications />
    </>
  );
};

/**
 * Memoized MainContent component
 */
export const MainContent = memo(MainContentComponent);
