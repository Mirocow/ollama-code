/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Info command - combines session stats and system information
 */

import type { HistoryItemStats, HistoryItemAbout } from '../types.js';
import { MessageType } from '../types.js';
import { formatDuration } from '../utils/formatters.js';
import {
  type CommandContext,
  type SlashCommand,
  CommandKind,
} from './types.js';
import { getExtendedSystemInfo } from '../../utils/systemInfo.js';
import { t } from '../../i18n/index.js';

export const infoCommand: SlashCommand = {
  name: 'info',
  altNames: ['status', 'about', 'stats', 'usage'],
  get description() {
    return t('Show session stats and system information');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    // Show session stats
    const now = new Date();
    const { sessionStartTime } = context.session.stats;

    if (sessionStartTime) {
      const wallDuration = now.getTime() - sessionStartTime.getTime();
      const statsItem: HistoryItemStats = {
        type: MessageType.STATS,
        duration: formatDuration(wallDuration),
      };
      context.ui.addItem(statsItem, Date.now());
    }

    // Show system info
    const systemInfo = await getExtendedSystemInfo(context);
    const aboutItem: Omit<HistoryItemAbout, 'id'> = {
      type: MessageType.ABOUT,
      systemInfo,
    };
    context.ui.addItem(aboutItem, Date.now());
  },
  subCommands: [
    {
      name: 'model',
      get description() {
        return t('Show model-specific usage statistics.');
      },
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext) => {
        context.ui.addItem(
          {
            type: MessageType.MODEL_STATS,
          },
          Date.now(),
        );
      },
    },
    {
      name: 'tools',
      get description() {
        return t('Show tool-specific usage statistics.');
      },
      kind: CommandKind.BUILT_IN,
      action: (context: CommandContext) => {
        context.ui.addItem(
          {
            type: MessageType.TOOL_STATS,
          },
          Date.now(),
        );
      },
    },
  ],
};
