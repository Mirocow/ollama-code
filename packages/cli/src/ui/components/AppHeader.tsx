/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo, useMemo } from 'react';
import { Box } from 'ink';
import { Header } from './Header.js';
import { Tips } from './Tips.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useSessionStats } from '../contexts/SessionContext.js';

interface AppHeaderProps {
  version: string;
}

/**
 * AppHeader component - renders the application header with banner and tips
 * Memoized to prevent unnecessary re-renders
 */
const AppHeaderComponent = ({ version }: AppHeaderProps) => {
  const settings = useSettings();
  const config = useConfig();
  const uiState = useUIState();
  const sessionStats = useSessionStats();

  // Memoize config-derived values
  const { authType, baseUrl, targetDir, showBanner, contextWindowSize } = useMemo(() => {
    const contentGeneratorConfig = config.getContentGeneratorConfig();
    return {
      authType: contentGeneratorConfig?.authType,
      baseUrl: contentGeneratorConfig?.baseUrl,
      targetDir: config.getTargetDir(),
      showBanner: !config.getScreenReader(),
      contextWindowSize: contentGeneratorConfig?.contextWindowSize,
    };
  }, [config]);

  // Memoize settings-derived values
  const showTips = useMemo(
    () => !(settings.merged.ui?.hideTips || config.getScreenReader()),
    [settings.merged.ui?.hideTips, config]
  );

  // Memoize session stats
  const { sessionId, promptTokenCount } = useMemo(
    () => ({
      sessionId: sessionStats.stats.sessionId,
      promptTokenCount: sessionStats.stats.lastPromptTokenCount,
    }),
    [sessionStats.stats.sessionId, sessionStats.stats.lastPromptTokenCount]
  );

  // Only subscribe to currentModel from UIState
  const model = uiState.currentModel;

  return (
    <Box flexDirection="column">
      {showBanner && (
        <Header
          version={version}
          authType={authType}
          baseUrl={baseUrl}
          model={model}
          workingDirectory={targetDir}
          sessionId={sessionId}
          contextWindowSize={contextWindowSize}
          promptTokenCount={promptTokenCount}
        />
      )}
      {showTips && <Tips />}
    </Box>
  );
};

/**
 * Memoized AppHeader component
 */
export const AppHeader = memo(AppHeaderComponent);
