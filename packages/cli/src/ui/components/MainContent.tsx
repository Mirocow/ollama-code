/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo } from 'react';
import { Box, Static } from 'ink';
import { HistoryItemDisplay } from './HistoryItemDisplay.js';
import { ShowMoreLines } from './ShowMoreLines.js';
import { Notifications } from './Notifications.js';
import { OverflowProvider } from '../contexts/OverflowContext.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useAppContext } from '../contexts/AppContext.js';
import { AppHeader } from './AppHeader.js';
import { DebugModeNotification } from './DebugModeNotification.js';

// Limit Gemini messages to a very high number of lines to mitigate performance
// issues in the worst case if we somehow get an enormous response from Gemini.
// This threshold is arbitrary but should be high enough to never impact normal
// usage.
const MAX_GEMINI_MESSAGE_LINES = 65536;

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
              key={i}
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
      <DebugModeNotification />
      <Notifications />
    </>
  );
};

/**
 * Memoized MainContent component
 */
export const MainContent = memo(MainContentComponent);
