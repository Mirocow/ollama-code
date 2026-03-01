/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

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

export const AppHeader = ({ version }: AppHeaderProps) => {
  const settings = useSettings();
  const config = useConfig();
  const uiState = useUIState();
  const sessionStats = useSessionStats();

  const contentGeneratorConfig = config.getContentGeneratorConfig();
  const authType = contentGeneratorConfig?.authType;
  const baseUrl = contentGeneratorConfig?.baseUrl;
  const model = uiState.currentModel;
  const targetDir = config.getTargetDir();
  const showBanner = !config.getScreenReader();
  const showTips = !(settings.merged.ui?.hideTips || config.getScreenReader());
  const sessionId = sessionStats.stats.sessionId;

  // Get context window size from config or use default
  const contextWindowSize = contentGeneratorConfig?.contextWindowSize;

  // Get current context token count from session stats
  // lastPromptTokenCount contains the total context size (history + current request) from Ollama
  const promptTokenCount = sessionStats.stats.lastPromptTokenCount;
  console.log('[DEBUG AppHeader] promptTokenCount:', promptTokenCount, 'totalPromptTokens:', sessionStats.stats.metrics.totalPromptTokens);

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
