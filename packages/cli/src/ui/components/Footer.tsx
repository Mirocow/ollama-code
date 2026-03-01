/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { ContextUsageDisplay } from './ContextUsageDisplay.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { AutoAcceptIndicator } from './AutoAcceptIndicator.js';
import { ShellModeIndicator } from './ShellModeIndicator.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';

import { useUIState } from '../contexts/UIStateContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useVimMode } from '../contexts/VimModeContext.js';
import { ApprovalMode } from '@ollama-code/ollama-code-core';
import { t } from '../../i18n/index.js';

/**
 * Footer component - renders status bar at the bottom of the terminal
 * Memoized to prevent unnecessary re-renders
 */
const FooterComponent: React.FC = () => {
  const uiState = useUIState();
  const config = useConfig();
  const { vimEnabled, vimMode } = useVimMode();

  const { promptTokenCount, showAutoAcceptIndicator } = useMemo(
    () => ({
      promptTokenCount: uiState.sessionStats.lastPromptTokenCount,
      showAutoAcceptIndicator: uiState.showAutoAcceptIndicator,
    }),
    [
      uiState.sessionStats.lastPromptTokenCount,
      uiState.showAutoAcceptIndicator,
    ],
  );

  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);

  // Determine sandbox info from environment - memoized
  const sandboxInfo = useMemo(() => {
    const sandboxEnv = process.env['SANDBOX'];
    if (!sandboxEnv) return null;
    return sandboxEnv === 'sandbox-exec'
      ? 'seatbelt'
      : sandboxEnv.startsWith('ollama-code')
        ? 'docker'
        : sandboxEnv;
  }, []);

  // Check if debug mode is enabled
  const debugMode = config.getDebugMode();

  const contextWindowSize =
    config.getContentGeneratorConfig()?.contextWindowSize;

  // Left section should show exactly ONE thing at any time, in priority order.
  const leftContent = uiState.ctrlCPressedOnce ? (
    <Text color={theme.status.warning}>{t('Press Ctrl+C again to exit.')}</Text>
  ) : uiState.ctrlDPressedOnce ? (
    <Text color={theme.status.warning}>{t('Press Ctrl+D again to exit.')}</Text>
  ) : uiState.showEscapePrompt ? (
    <Text color={theme.text.secondary}>{t('Press Esc again to clear.')}</Text>
  ) : vimEnabled && vimMode === 'INSERT' ? (
    <Text color={theme.text.secondary}>-- INSERT --</Text>
  ) : uiState.shellModeActive ? (
    <ShellModeIndicator />
  ) : showAutoAcceptIndicator !== undefined &&
    showAutoAcceptIndicator !== ApprovalMode.DEFAULT ? (
    <AutoAcceptIndicator approvalMode={showAutoAcceptIndicator} />
  ) : (
    <Text color={theme.text.secondary}>{t('? for shortcuts')}</Text>
  );

  // Memoize right items to prevent unnecessary recalculations
  const rightItems = useMemo(() => {
    const items: Array<{ key: string; node: React.ReactNode }> = [];
    if (sandboxInfo) {
      items.push({
        key: 'sandbox',
        node: <Text color={theme.status.success}>🔒 {sandboxInfo}</Text>,
      });
    }
    if (debugMode) {
      items.push({
        key: 'debug',
        node: <Text color={theme.status.warning}>Debug Mode</Text>,
      });
    }
    if (promptTokenCount > 0 && contextWindowSize) {
      items.push({
        key: 'context',
        node: (
          <Text color={theme.text.accent}>
            <ContextUsageDisplay
              promptTokenCount={promptTokenCount}
              terminalWidth={terminalWidth}
              contextWindowSize={contextWindowSize}
            />
          </Text>
        ),
      });
    }
    return items;
  }, [
    sandboxInfo,
    debugMode,
    promptTokenCount,
    contextWindowSize,
    terminalWidth,
  ]);

  return (
    <Box
      justifyContent="space-between"
      width="100%"
      flexDirection="row"
      alignItems="center"
    >
      {/* Left Section: Exactly one status line (exit prompts / mode indicator / default hint) */}
      <Box
        marginLeft={2}
        justifyContent="flex-start"
        flexDirection={isNarrow ? 'column' : 'row'}
        alignItems={isNarrow ? 'flex-start' : 'center'}
      >
        {leftContent}
      </Box>

      {/* Right Section: Sandbox Info, Debug Mode, Context Usage, and Console Summary */}
      <Box alignItems="center" justifyContent="flex-end" marginRight={2}>
        {rightItems.map(({ key, node }, index) => (
          <Box key={key} alignItems="center">
            {index > 0 && <Text color={theme.text.secondary}> | </Text>}
            {node}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Memoized Footer component
 */
export const Footer = memo(FooterComponent);
