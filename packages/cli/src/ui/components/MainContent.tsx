/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo, useMemo } from 'react';
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

  // Memoize frequently used values
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
  } = useMemo(
    () => ({
      pendingHistoryItems: uiState.pendingHistoryItems,
      terminalWidth: uiState.terminalWidth,
      mainAreaWidth: uiState.mainAreaWidth,
      staticAreaMaxItemHeight: uiState.staticAreaMaxItemHeight,
      availableTerminalHeight: uiState.availableTerminalHeight,
      historyRemountKey: uiState.historyRemountKey,
      currentModel: uiState.currentModel,
      history: uiState.history,
      slashCommands: uiState.slashCommands,
      constrainHeight: uiState.constrainHeight,
      isEditorDialogOpen: uiState.isEditorDialogOpen,
      activePtyId: uiState.activePtyId,
      embeddedShellFocused: uiState.embeddedShellFocused,
    }),
    [
      uiState.pendingHistoryItems,
      uiState.terminalWidth,
      uiState.mainAreaWidth,
      uiState.staticAreaMaxItemHeight,
      uiState.availableTerminalHeight,
      uiState.historyRemountKey,
      uiState.currentModel,
      uiState.history,
      uiState.slashCommands,
      uiState.constrainHeight,
      uiState.isEditorDialogOpen,
      uiState.activePtyId,
      uiState.embeddedShellFocused,
    ]
  );

  // Memoize history items rendering
  const historyItems = useMemo(
    () =>
      history.map((h) => (
        <HistoryItemDisplay
          terminalWidth={terminalWidth}
          mainAreaWidth={mainAreaWidth}
          availableTerminalHeight={staticAreaMaxItemHeight}
          availableTerminalHeightGemini={MAX_GEMINI_MESSAGE_LINES}
          key={h.id}
          item={h}
          isPending={false}
          commands={slashCommands}
        />
      )),
    [history, terminalWidth, mainAreaWidth, staticAreaMaxItemHeight, slashCommands]
  );

  // Memoize static items
  const staticItems = useMemo(
    () => [
      <DebugModeNotification key="debug-notification" />,
      <Notifications key="notifications" />,
      ...historyItems,
    ],
    [historyItems]
  );

  // Memoize pending items rendering
  const pendingItems = useMemo(
    () =>
      pendingHistoryItems.map((item, i) => (
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
      )),
    [
      pendingHistoryItems,
      constrainHeight,
      availableTerminalHeight,
      terminalWidth,
      mainAreaWidth,
      isEditorDialogOpen,
      activePtyId,
      embeddedShellFocused,
    ]
  );

  return (
    <>
      {/* AppHeader is outside Static to allow dynamic updates (e.g., context progress bar) */}
      <AppHeader version={version} />
      <Static key={`${historyRemountKey}-${currentModel}`} items={staticItems}>
        {(item) => item}
      </Static>
      <OverflowProvider>
        <Box flexDirection="column">
          {pendingItems}
          <ShowMoreLines constrainHeight={constrainHeight} />
        </Box>
      </OverflowProvider>
    </>
  );
};

/**
 * Memoized MainContent component
 */
export const MainContent = memo(MainContentComponent);
