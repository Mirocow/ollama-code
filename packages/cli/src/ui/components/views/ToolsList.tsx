/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { type ToolDefinition } from '../../types.js';
import { t } from '../../../i18n/index.js';

interface ToolsListProps {
  tools: readonly ToolDefinition[];
  showDescriptions: boolean;
  contentWidth: number;
}

/**
 * Calculate display width for a string (handling Unicode characters)
 */
function getDisplayWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    const code = char.codePointAt(0) || 0;
    if (code > 0x7f) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Pad a string to a specific display width
 */
function padToWidth(str: string, targetWidth: number): string {
  const currentWidth = getDisplayWidth(str);
  if (currentWidth >= targetWidth) {
    return str;
  }
  return str + ' '.repeat(targetWidth - currentWidth);
}

/**
 * Truncate a string to fit within a maximum display width
 */
function truncateToWidth(str: string, maxWidth: number): string {
  if (getDisplayWidth(str) <= maxWidth) {
    return str;
  }
  let result = '';
  let width = 0;
  for (const char of str) {
    const charWidth = char.codePointAt(0) || 0 > 0x7f ? 2 : 1;
    if (width + charWidth > maxWidth - 3) {
      break;
    }
    result += char;
    width += charWidth;
  }
  return result + '...';
}

/**
 * Group tools by plugin
 */
function groupToolsByPlugin(tools: readonly ToolDefinition[]): Map<string, ToolDefinition[]> {
  const groups = new Map<string, ToolDefinition[]>();
  
  for (const tool of tools) {
    const key = tool.pluginName || tool.pluginId || 'Core';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tool);
  }
  
  return groups;
}

export const ToolsList: React.FC<ToolsListProps> = ({
  tools,
  showDescriptions,
  contentWidth,
}) => {
  if (tools.length === 0) {
    return (
      <Box flexDirection="column">
        <Text bold color={theme.text.primary}>
          {t('Available Ollama Code CLI tools:')}
        </Text>
        <Box height={1} />
        <Text color={theme.text.primary}> {t('No tools available')}</Text>
      </Box>
    );
  }

  // Calculate column widths
  const nameColWidth = Math.min(30, Math.max(12, Math.floor(contentWidth * 0.3)));
  const descColWidth = contentWidth - nameColWidth - 4;

  // Group tools by plugin
  const groupedTools = groupToolsByPlugin(tools);
  const totalPlugins = groupedTools.size;

  return (
    <Box flexDirection="column">
      <Text bold color={theme.text.primary}>
        {t('Available Tools')} ({tools.length} {t('from')} {totalPlugins} {t('plugins')}):
      </Text>
      <Box height={1} />
      
      {/* Table header */}
      <Box flexDirection="row">
        <Text bold color={theme.text.accent}>
          {'  '}{padToWidth(t('Tool Name'), nameColWidth)}
        </Text>
        <Text color={theme.text.secondary}> │ </Text>
        <Text bold color={theme.text.accent}>
          {t('Description')}
        </Text>
      </Box>
      
      {/* Separator line */}
      <Text color={theme.border.default}>
        {'  '}{('─').repeat(nameColWidth + 2)}┼{('─').repeat(descColWidth + 2)}
      </Text>
      
      {/* Tool rows grouped by plugin */}
      {Array.from(groupedTools.entries()).map(([pluginName, pluginTools]) => (
        <Box key={pluginName} flexDirection="column">
          {/* Plugin header */}
          <Text bold color={theme.text.link}>
            {'  '}📦 {pluginName} ({pluginTools.length})
          </Text>
          
          {/* Tools for this plugin */}
          {pluginTools.map((tool, index) => {
            const displayName = truncateToWidth(tool.displayName || tool.name, nameColWidth);
            const rawDescription = tool.description || '';
            const description = showDescriptions && rawDescription
              ? truncateToWidth(rawDescription.replace(/\n/g, ' '), descColWidth)
              : '';
            
            return (
              <Box key={tool.name || index} flexDirection="row">
                <Text color={theme.text.primary}>
                    {'    '}{padToWidth(displayName, nameColWidth - 2)}
                </Text>
                <Text color={theme.border.default}> │ </Text>
                <Text color={theme.text.secondary}>
                  {description || (showDescriptions ? t('(no description)') : t('(use /tools brief to hide)'))}
                </Text>
              </Box>
            );
          })}
          
          <Box height={1} />
        </Box>
      ))}
      
      {/* Footer */}
      <Text color={theme.text.secondary}>
        {'  '}💡 {t('All tools are loaded from plugins. Use /tools brief to hide descriptions.')}
      </Text>
    </Box>
  );
};
