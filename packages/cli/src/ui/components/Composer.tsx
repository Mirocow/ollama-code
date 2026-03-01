/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, useIsScreenReaderEnabled } from 'ink';
import { memo, useCallback, useState, useMemo } from 'react';
import { LoadingIndicator } from './LoadingIndicator.js';
import { InputPrompt } from './InputPrompt.js';
import { Footer } from './Footer.js';
import { QueuedMessageDisplay } from './QueuedMessageDisplay.js';
import { KeyboardShortcuts } from './KeyboardShortcuts.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useUIActions } from '../contexts/UIActionsContext.js';
import { useVimMode } from '../contexts/VimModeContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { StreamingState } from '../types.js';
import { ConfigInitDisplay } from '../components/ConfigInitDisplay.js';
import { FeedbackDialog } from '../FeedbackDialog.js';
import { t } from '../../i18n/index.js';

/**
 * Composer component - renders input area and loading indicators
 * Memoized to prevent unnecessary re-renders
 */
const ComposerComponent = () => {
  const config = useConfig();
  const isScreenReaderEnabled = useIsScreenReaderEnabled();
  const uiState = useUIState();
  const uiActions = useUIActions();
  const { vimEnabled } = useVimMode();

  // Memoize frequently accessed state values
  const {
    showAutoAcceptIndicator,
    embeddedShellFocused,
    streamingState,
    thought,
    currentLoadingPhrase,
    elapsedTime,
    isConfigInitialized,
    messageQueue,
    isFeedbackDialogOpen,
    isInputActive,
    buffer,
    inputWidth,
    suggestionsWidth,
    userMessages,
    slashCommands,
    commandContext,
    shellModeActive,
  } = useMemo(() => ({
    showAutoAcceptIndicator: uiState.showAutoAcceptIndicator,
    embeddedShellFocused: uiState.embeddedShellFocused,
    streamingState: uiState.streamingState,
    thought: uiState.thought,
    currentLoadingPhrase: uiState.currentLoadingPhrase,
    elapsedTime: uiState.elapsedTime,
    isConfigInitialized: uiState.isConfigInitialized,
    messageQueue: uiState.messageQueue,
    isFeedbackDialogOpen: uiState.isFeedbackDialogOpen,
    isInputActive: uiState.isInputActive,
    buffer: uiState.buffer,
    inputWidth: uiState.inputWidth,
    suggestionsWidth: uiState.suggestionsWidth,
    userMessages: uiState.userMessages,
    slashCommands: uiState.slashCommands,
    commandContext: uiState.commandContext,
    shellModeActive: uiState.shellModeActive,
  }), [
    uiState.showAutoAcceptIndicator,
    uiState.embeddedShellFocused,
    uiState.streamingState,
    uiState.thought,
    uiState.currentLoadingPhrase,
    uiState.elapsedTime,
    uiState.isConfigInitialized,
    uiState.messageQueue,
    uiState.isFeedbackDialogOpen,
    uiState.isInputActive,
    uiState.buffer,
    uiState.inputWidth,
    uiState.suggestionsWidth,
    uiState.userMessages,
    uiState.slashCommands,
    uiState.commandContext,
    uiState.shellModeActive,
  ]);

  // State for keyboard shortcuts display toggle
  const [showShortcuts, setShowShortcuts] = useState(false);
  const handleToggleShortcuts = useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, []);

  // State for suggestions visibility
  const [showSuggestions, setShowSuggestions] = useState(false);
  const handleSuggestionsVisibilityChange = useCallback(
    (visible: boolean) => {
      setShowSuggestions(visible);
      // Also notify AppContainer for Tab key handling
      uiActions.onSuggestionsVisibilityChange(visible);
    },
    [uiActions],
  );

  // Memoize placeholder text
  const placeholder = useMemo(
    () =>
      vimEnabled
        ? '  ' + t("Press 'i' for INSERT mode and 'Esc' for NORMAL mode.")
        : '  ' + t('Type your message or @path/to/file'),
    [vimEnabled]
  );

  // Memoize loading indicator props
  const loadingIndicatorProps = useMemo(
    () => ({
      thought:
        streamingState === StreamingState.WaitingForConfirmation ||
        config.getAccessibility()?.enableLoadingPhrases === false
          ? undefined
          : thought,
      currentLoadingPhrase:
        config.getAccessibility()?.enableLoadingPhrases === false
          ? undefined
          : currentLoadingPhrase,
      elapsedTime,
    }),
    [streamingState, thought, currentLoadingPhrase, elapsedTime, config]
  );

  return (
    <Box flexDirection="column" marginTop={1}>
      {!embeddedShellFocused && <LoadingIndicator {...loadingIndicatorProps} />}

      {!isConfigInitialized && <ConfigInitDisplay />}

      <QueuedMessageDisplay messageQueue={messageQueue} />

      {isFeedbackDialogOpen && <FeedbackDialog />}

      {isInputActive && (
        <InputPrompt
          buffer={buffer}
          inputWidth={inputWidth}
          suggestionsWidth={suggestionsWidth}
          onSubmit={uiActions.handleFinalSubmit}
          userMessages={userMessages}
          onClearScreen={uiActions.handleClearScreen}
          config={config}
          slashCommands={slashCommands}
          commandContext={commandContext}
          shellModeActive={shellModeActive}
          setShellModeActive={uiActions.setShellModeActive}
          approvalMode={showAutoAcceptIndicator}
          onEscapePromptChange={uiActions.onEscapePromptChange}
          onToggleShortcuts={handleToggleShortcuts}
          showShortcuts={showShortcuts}
          onSuggestionsVisibilityChange={handleSuggestionsVisibilityChange}
          focus={true}
          vimHandleInput={uiActions.vimHandleInput}
          isEmbeddedShellFocused={embeddedShellFocused}
          placeholder={placeholder}
        />
      )}

      {/* Exclusive area: only one component visible at a time */}
      {!showSuggestions &&
        (showShortcuts ? (
          <KeyboardShortcuts />
        ) : (
          !isScreenReaderEnabled && <Footer />
        ))}
    </Box>
  );
};

/**
 * Memoized Composer component
 */
export const Composer = memo(ComposerComponent);
