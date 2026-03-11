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
import { getTokenGraphService } from '@ollama-code/ollama-code-core';
import { execSync } from 'node:child_process';
import path from 'node:path';

// Get the token graph service instance
const tokenGraphService = getTokenGraphService();

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
  const { authType, baseUrl, targetDir, showBanner, contextWindowSize } =
    useMemo(() => {
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
    [settings.merged.ui?.hideTips, config],
  );

  // Memoize session stats
  const { sessionId, promptTokenCount } = useMemo(
    () => ({
      sessionId: sessionStats.stats.sessionId,
      promptTokenCount: sessionStats.stats.lastPromptTokenCount,
    }),
    [sessionStats.stats.sessionId, sessionStats.stats.lastPromptTokenCount],
  );

  // Get tool count, skill count, plugin count and storage stats from telemetry metrics
  const {
    toolCount,
    skillCount,
    pluginCount,
    unhealthyPluginCount,
    sessionToolCalls,
    sessionStorageRecords,
    generatedTokens,
    averageTps,
    peakTokens,
    workspaceName,
    gitBranch,
  } = useMemo(() => {
    try {
      const metrics = sessionStats.stats.metrics;

      // Get tool count from plugin metrics (updated by pluginRegistry.getMetrics())
      const tools = metrics.plugins?.toolCount || 0;

      // Fallback: try to get from toolRegistry if metrics not available
      let finalToolCount = tools;
      if (finalToolCount === 0) {
        const toolRegistry = config.getToolRegistry();
        finalToolCount = toolRegistry?.getAllToolNames()?.length || 0;
      }

      // Get skill count from plugin metrics
      const skills = metrics.plugins?.skillCount || 0;

      // Get plugin counts from telemetry
      const loadedPlugins = metrics.plugins?.loadedPlugins || 0;
      const enabledPlugins = metrics.plugins?.enabledPlugins || 0;

      // Get unhealthy plugins from pluginRegistry
      const pluginRegistry = config.getPluginRegistry?.();
      const unhealthyPlugins = pluginRegistry?.getUnhealthyPlugins?.() || [];

      // Get session tool calls from metrics
      const toolCalls = metrics.tools?.totalCalls || 0;

      // Get storage records - use keys array length for session count
      const sessionStorageCount = metrics.storage?.keys?.length || 0;

      // Get generated tokens for cost estimation
      const genTokens = metrics.totalGeneratedTokens || 0;

      // Calculate tokens per second if we have timing data
      const apiTime = metrics.totalApiTime || 0;
      const avgTps =
        genTokens > 0 && apiTime > 0
          ? Math.round((genTokens / (apiTime / 1000)) * 10) / 10
          : 0;

      // Get statistics from tokenGraphService
      const stats = tokenGraphService.getStatistics();
      const peak = stats.maxPrompt + stats.maxGenerated;

      // Get workspace name from project root directory name
      const wsName = path.basename(targetDir);

      // Get git branch
      let branch: string | undefined;
      try {
        branch = execSync('git branch --show-current', {
          cwd: targetDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        if (!branch) branch = undefined;
      } catch {
        // Not a git repo
      }

      return {
        toolCount: finalToolCount,
        skillCount: skills,
        pluginCount: enabledPlugins || loadedPlugins,
        unhealthyPluginCount: unhealthyPlugins.length,
        sessionToolCalls: toolCalls,
        sessionStorageRecords: sessionStorageCount,
        generatedTokens: genTokens,
        averageTps: avgTps,
        peakTokens: peak,
        workspaceName: wsName,
        gitBranch: branch,
      };
    } catch {
      return {
        toolCount: 0,
        skillCount: 0,
        pluginCount: 0,
        unhealthyPluginCount: 0,
        sessionToolCalls: 0,
        sessionStorageRecords: 0,
        generatedTokens: 0,
        averageTps: 0,
        peakTokens: 0,
        workspaceName: undefined,
        gitBranch: undefined,
      };
    }
  }, [config, sessionStats.stats.metrics, targetDir]);

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
          toolCount={toolCount}
          sessionToolCalls={sessionToolCalls}
          sessionStorageRecords={sessionStorageRecords}
          skillCount={skillCount}
          pluginCount={pluginCount}
          unhealthyPluginCount={unhealthyPluginCount}
          generatedTokens={generatedTokens}
          averageTps={averageTps}
          peakTokens={peakTokens}
          workspaceName={workspaceName}
          gitBranch={gitBranch}
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
