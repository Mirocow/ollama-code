/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { memo } from 'react';
import { Box, Text } from 'ink';
import {
  AuthType,
  shortenPath,
  tildeifyPath,
  getModelCapabilities,
  tokenLimit,
  getTokenGraphService,
} from '@ollama-code/ollama-code-core';
import { theme } from '../semantic-colors.js';
import { shortAsciiLogo } from './AsciiArt.js';
import { getAsciiArtWidth, getCachedStringWidth } from '../utils/textUtils.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { t, getCurrentLanguage } from '../../i18n/index.js';

// Get the token graph service instance
const tokenGraphService = getTokenGraphService();

/**
 * Format context window size for display
 */
function formatContextSize(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`;
  }
  return tokens.toString();
}

/**
 * Create a progress bar string
 */
function createProgressBar(
  percentage: number,
  width: number = 10,
): { filled: string; empty: string } {
  const filled = Math.round(percentage * width);
  return {
    filled: '█'.repeat(Math.min(filled, width)),
    empty: '░'.repeat(Math.max(0, width - filled)),
  };
}

/**
 * Truncate a string to fit within max width, adding ellipsis if needed
 */
function truncateString(str: string, maxWidth: number): string {
  if (str.length <= maxWidth) return str;
  if (maxWidth <= 3) return str.slice(0, maxWidth);
  return str.slice(0, maxWidth - 3) + '...';
}

interface HeaderProps {
  customAsciiArt?: string; // For user-defined ASCII art
  version: string;
  authType?: AuthType;
  model: string;
  baseUrl?: string;
  workingDirectory: string;
  sessionId?: string;
  contextWindowSize?: number; // Context window size in tokens
  promptTokenCount?: number; // Current prompt token count for usage display
  toolCount?: number; // Number of registered tools
  sessionToolCalls?: number; // Number of tool calls in current session
  sessionStorageRecords?: number; // Number of storage records created in session
  skillCount?: number; // Number of available skills
  pluginCount?: number; // Number of loaded plugins
  unhealthyPluginCount?: number; // Number of plugins with degraded/error status
  generatedTokens?: number; // Total generated tokens for cost estimation
  averageTps?: number; // Average tokens per second
  peakTokens?: number; // Peak token usage in session
  workspaceName?: string; // Current workspace name
  gitBranch?: string; // Current git branch
}

function titleizeAuthType(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === 'ai') {
        return 'AI';
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

// Format auth type for display
function formatAuthType(authType?: AuthType): string {
  if (!authType) {
    return 'Unknown';
  }

  switch (authType) {
    case AuthType.USE_OLLAMA:
      return 'Ollama';
    default:
      return titleizeAuthType(String(authType));
  }
}

export const Header: React.FC<HeaderProps> = memo(
  ({
    customAsciiArt,
    version,
    authType,
    model,
    baseUrl,
    workingDirectory,
    sessionId,
    contextWindowSize,
    promptTokenCount,
    toolCount,
    sessionToolCalls,
    sessionStorageRecords,
    skillCount: _skillCount,
    pluginCount,
    unhealthyPluginCount,
    generatedTokens,
    averageTps: _averageTps,
    peakTokens: _peakTokens,
    workspaceName: _workspaceName,
    gitBranch,
  }) => {
    const { columns: terminalWidth } = useTerminalSize();

    const displayLogo = customAsciiArt ?? shortAsciiLogo;
    const logoWidth = getAsciiArtWidth(displayLogo);
    const formattedAuthType = formatAuthType(authType);

    // Get model capabilities
    const capabilities = getModelCapabilities(model);
    const capabilityBadges: string[] = [];
    if (capabilities.tools) {
      capabilityBadges.push('🔧');
    }
    if (capabilities.thinking) {
      capabilityBadges.push('🧠');
    }
    if (capabilities.vision) {
      capabilityBadges.push('📷');
    }
    if (capabilities.structuredOutput) {
      capabilityBadges.push('📋');
    }
    const capabilitiesText =
      capabilityBadges.length > 0 ? ` ${capabilityBadges.join(' ')}` : '';

    // Get context window size (use provided or auto-detect from model)
    const contextSize = contextWindowSize ?? tokenLimit(model, 'input');
    const contextSizeFormatted = formatContextSize(contextSize);

    // Calculate context usage if promptTokenCount is provided
    const contextUsagePercentage =
      promptTokenCount && contextSize
        ? Math.min(promptTokenCount / contextSize, 1)
        : 0;

    // Estimate session cost based on tokens
    // For local Ollama, this is just an estimate for reference
    // Prices are approximate, based on similar API models
    const estimateSessionCost = (
      promptTokens: number,
      genTokens: number,
      modelName: string,
    ): string => {
      // Rough pricing per 1M tokens (very approximate for reference)
      const lowerModel = modelName.toLowerCase();
      let inputPricePer1M = 0.15; // Default cheap model
      let outputPricePer1M = 0.6;

      // Adjust for model size/type
      if (lowerModel.includes('70b') || lowerModel.includes('72b')) {
        inputPricePer1M = 0.9;
        outputPricePer1M = 3.5;
      } else if (lowerModel.includes('32b') || lowerModel.includes('34b')) {
        inputPricePer1M = 0.4;
        outputPricePer1M = 1.6;
      } else if (lowerModel.includes('14b') || lowerModel.includes('13b')) {
        inputPricePer1M = 0.2;
        outputPricePer1M = 0.8;
      } else if (lowerModel.includes('7b') || lowerModel.includes('8b')) {
        inputPricePer1M = 0.1;
        outputPricePer1M = 0.4;
      }

      const inputCost = (promptTokens / 1_000_000) * inputPricePer1M;
      const outputCost = (genTokens / 1_000_000) * outputPricePer1M;
      const totalCost = inputCost + outputCost;

      if (totalCost < 0.01) {
        return `<$0.01`;
      }
      return `$${totalCost.toFixed(2)}`;
    };

    const sessionCost = generatedTokens
      ? estimateSessionCost(promptTokenCount ?? 0, generatedTokens, model)
      : null;

    // Calculate available space properly:
    // First determine if logo can be shown, then use remaining space for path
    const containerMarginX = 2; // marginLeft + marginRight on the outer container
    const logoGap = 2; // Gap between logo and info panel
    const infoPanelPaddingX = 1;
    const infoPanelBorderWidth = 2; // left + right border
    const infoPanelChromeWidth = infoPanelBorderWidth + infoPanelPaddingX * 2;
    const minPathLength = 40; // Minimum readable path length
    const minInfoPanelWidth = minPathLength + infoPanelChromeWidth;

    const availableTerminalWidth = Math.max(
      0,
      terminalWidth - containerMarginX * 2,
    );

    // Check if we have enough space for logo + gap + minimum info panel
    const showLogo =
      availableTerminalWidth >= logoWidth + logoGap + minInfoPanelWidth;

    // Calculate available width for info panel (use all remaining space)
    // Cap at reasonable width for readability (increased to fit all stats)
    const maxInfoPanelWidth = 140;
    const availableInfoPanelWidth = showLogo
      ? Math.min(
          availableTerminalWidth - logoWidth - logoGap,
          maxInfoPanelWidth,
        )
      : Math.min(availableTerminalWidth, maxInfoPanelWidth);

    // Calculate max path length (subtract padding/borders from available space)
    const maxPathLength = Math.max(
      0,
      availableInfoPanelWidth - infoPanelChromeWidth,
    );

    const infoPanelContentWidth = Math.max(
      0,
      availableInfoPanelWidth - infoPanelChromeWidth,
    );

    // Calculate progress bar width dynamically based on actual text content
    // Text format: " 999,999/128K | left: 999,999" (varies based on token counts)
    const promptTokensText = promptTokenCount?.toLocaleString() ?? '0';
    const contextSizeText = contextSizeFormatted;
    const leftTokens =
      promptTokenCount && contextSize && promptTokenCount < contextSize
        ? (contextSize - promptTokenCount).toLocaleString()
        : '';
    const overflowTokens =
      promptTokenCount && contextSize && promptTokenCount >= contextSize
        ? (promptTokenCount - contextSize).toLocaleString()
        : '';

    // Calculate text width for progress bar line
    // Use localized "left" text for accurate width calculation
    const leftText = t('left');
    let progressTextWidth = 3; // " " before + "/" between
    progressTextWidth += promptTokensText.length;
    progressTextWidth += contextSizeText.length;

    if (leftTokens) {
      // " | left: " + leftTokens (use localized text length)
      progressTextWidth += 3 + leftText.length + 2 + leftTokens.length; // " | " + leftText + ": " + number
    } else if (overflowTokens) {
      // " | ⚠️ OVERFLOW +number"
      progressTextWidth += 3 + 16 + overflowTokens.length;
    }

    // Add small buffer to prevent line wrap
    const buffer = 2;

    // Progress bar fills remaining space, with max width to keep it compact
    // Width increased to match wider info panel
    const maxProgressBarWidth = 50;
    const progressBarWidth = Math.min(
      maxProgressBarWidth,
      Math.max(8, infoPanelContentWidth - progressTextWidth - buffer),
    );
    const progressBar = createProgressBar(
      contextUsagePercentage,
      progressBarWidth,
    );

    // Sparkline width is limited to leave room for progress bar text on the line above
    // Width increased to match wider info panel
    const maxSparklineWidth = 70;
    const sparklineWidth = Math.min(
      maxSparklineWidth,
      Math.max(20, infoPanelContentWidth - 5),
    );
    const sparkline =
      tokenGraphService.generateCombinedSparkline(sparklineWidth);

    // Format server URL (show only host:port, hide http:// prefix for brevity)
    const displayBaseUrl = baseUrl
      ? baseUrl.replace(/^https?:\/\//, '')
      : 'localhost:11434';

    // Build model line with truncation if needed
    const langCode = getCurrentLanguage().toUpperCase();
    const baseModelLine = `${formattedAuthType} | ${displayBaseUrl} | `;
    const suffixModelLine = `${capabilitiesText} | ${langCode}`;

    // Calculate available space for model name
    const modelLineOverhead = baseModelLine.length + suffixModelLine.length;
    const maxModelLength = Math.max(
      10,
      infoPanelContentWidth - modelLineOverhead,
    );
    const truncatedModel = truncateString(model, maxModelLength);

    const authModelText = `${baseModelLine}${truncatedModel}${suffixModelLine}`;
    const modelHintText = ' (/model to change)';
    const showModelHint =
      infoPanelContentWidth > 0 &&
      getCachedStringWidth(authModelText + modelHintText) <=
        infoPanelContentWidth;

    // Now shorten the path to fit the available space
    const tildeifiedPath = tildeifyPath(workingDirectory);
    const shortenedPath = shortenPath(
      tildeifiedPath,
      Math.max(3, maxPathLength),
    );
    const displayPath =
      maxPathLength <= 0
        ? ''
        : shortenedPath.length > maxPathLength
          ? shortenedPath.slice(0, maxPathLength)
          : shortenedPath;

    return (
      <Box
        flexDirection="row"
        alignItems="center"
        marginX={containerMarginX}
        width={availableTerminalWidth}
      >
        {/* Left side: ASCII logo (only if enough space) */}
        {showLogo && (
          <>
            <Box flexShrink={0}>
              <Text color={theme.text.accent}>{displayLogo}</Text>
            </Box>
            {/* Fixed gap between logo and info panel */}
            <Box width={logoGap} />
          </>
        )}

        {/* Right side: Info panel (flexible width, max 60 in two-column layout) */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={theme.border.default}
          paddingX={infoPanelPaddingX}
          flexGrow={showLogo ? 0 : 1}
          width={showLogo ? availableInfoPanelWidth : undefined}
        >
          {/* Title line: >_ Ollama Code (v{version}) */}
          <Text>
            <Text bold color={theme.text.accent}>
              &gt;_ Ollama Code
            </Text>
            <Text color={theme.text.secondary}> (v{version})</Text>
          </Text>
          {/* Empty line for spacing */}
          <Text> </Text>
          {/* Auth and Model line */}
          <Text>
            <Text color={theme.text.secondary}>{authModelText}</Text>
            {showModelHint && (
              <Text color={theme.text.secondary}>{modelHintText}</Text>
            )}
          </Text>
          {/* Context usage - unified progress bar with remaining tokens */}
          <Text>
            {/* Progress bar */}
            <Text
              color={
                contextUsagePercentage > 0.95
                  ? theme.status.error
                  : contextUsagePercentage > 0.8
                    ? theme.status.warning
                    : theme.text.accent
              }
            >
              {progressBar.filled}
            </Text>
            <Text color={theme.text.secondary}>{progressBar.empty}</Text>
            {/* Usage stats */}
            <Text color={theme.text.secondary}> </Text>
            <Text color={theme.text.accent}>
              {promptTokenCount?.toLocaleString() ?? 0}
            </Text>
            <Text color={theme.text.secondary}>/</Text>
            <Text color={theme.text.accent}>{contextSizeFormatted}</Text>
            {/* Remaining or overflow warning - only show when there's actual usage */}
            {promptTokenCount &&
            promptTokenCount > 0 &&
            contextSize &&
            promptTokenCount < contextSize ? (
              <>
                <Text color={theme.text.secondary}> | </Text>
                <Text color={theme.text.secondary}>{t('left')}: </Text>
                <Text color={theme.text.accent}>
                  {(contextSize - promptTokenCount).toLocaleString()}
                </Text>
              </>
            ) : promptTokenCount &&
              contextSize &&
              promptTokenCount >= contextSize ? (
              <>
                <Text color={theme.text.secondary}> | </Text>
                <Text color={theme.status.error}>
                  ⚠️ OVERFLOW +
                  {(promptTokenCount - contextSize).toLocaleString()}
                </Text>
              </>
            ) : null}
          </Text>
          {/* Sparkline - show if there's history data (even if partially empty) */}
          {sparkline && sparkline.length > 0 && !sparkline.match(/^░+$/) && (
            <Text color={theme.text.accent}>{sparkline}</Text>
          )}
          {/* Session, Tools, Storage, Plugins line - fit within available width */}
          <Text>
            {(() => {
              // Build stats line that fits within available width
              const parts: Array<{ label: string; value: string }> = [];

              if (sessionId) {
                parts.push({
                  label: 'Session',
                  value:
                    sessionId.length > 8
                      ? sessionId.slice(0, 8) + '..'
                      : sessionId,
                });
              }
              if (toolCount !== undefined) {
                parts.push({
                  label: 'Tools',
                  value: `${sessionToolCalls ?? 0}/${toolCount}`,
                });
              }
              if (sessionStorageRecords !== undefined) {
                parts.push({
                  label: 'Storage',
                  value: String(sessionStorageRecords),
                });
              }
              if (sessionCost) {
                parts.push({ label: 'Est', value: sessionCost });
              }
              if (pluginCount !== undefined && pluginCount > 0) {
                let pluginValue = String(pluginCount);
                if (
                  unhealthyPluginCount !== undefined &&
                  unhealthyPluginCount > 0
                ) {
                  pluginValue += `⚠${unhealthyPluginCount}`;
                }
                parts.push({ label: 'Plugins', value: pluginValue });
              }

              // Build string and truncate if needed
              const statsLine = parts
                .map((p) => `${p.label}: ${p.value}`)
                .join(' | ');
              const truncatedLine = truncateString(
                statsLine,
                infoPanelContentWidth,
              );

              return <Text color={theme.text.secondary}>{truncatedLine}</Text>;
            })()}
          </Text>
          {/* Directory line */}
          <Text color={theme.text.secondary}>
            {displayPath}
            {gitBranch && <Text color={theme.text.accent}> ({gitBranch})</Text>}
          </Text>
        </Box>
      </Box>
    );
  },
);
Header.displayName = 'Header';
