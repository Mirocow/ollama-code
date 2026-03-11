/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { HistoryItemCompression } from '../types.js';
import { MessageType } from '../types.js';
import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
import {
  CompressionStatus,
  CompressionReportService,
} from '@ollama-code/ollama-code-core';

/**
 * Get human-readable message for compression status
 */
function getCompressionStatusMessage(
  status: CompressionStatus,
  originalTokens: number,
  newTokens: number,
): string {
  switch (status) {
    case CompressionStatus.COMPRESSED: {
      const saved = originalTokens - newTokens;
      const percent =
        originalTokens > 0 ? Math.round((saved / originalTokens) * 100) : 0;
      return t(
        'Context compressed: {{original}} → {{new}} tokens ({{percent}}% saved)',
        {
          original: String(originalTokens),
          new: String(newTokens),
          percent: String(percent),
        },
      );
    }

    case CompressionStatus.NOOP:
      return t('Context is already optimal, no compression needed.');

    case CompressionStatus.COMPRESSION_FAILED_INFLATED_TOKEN_COUNT:
      return t(
        'Compression would increase token count ({{original}} → {{new}}). Keeping original context.',
        { original: String(originalTokens), new: String(newTokens) },
      );

    case CompressionStatus.COMPRESSION_FAILED_EMPTY_SUMMARY:
      return t('Compression failed: model returned empty summary.');

    case CompressionStatus.COMPRESSION_FAILED_TOKEN_COUNT_ERROR:
      return t('Compression failed: could not calculate token count.');

    default:
      return t('Compression completed with status: {{status}}', { status });
  }
}

export const compressCommand: SlashCommand = {
  name: 'compress',
  altNames: ['summarize'],
  get description() {
    return t('Compresses the context by replacing it with a summary.');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context) => {
    const { ui } = context;
    const executionMode = context.executionMode ?? 'interactive';

    if (executionMode === 'interactive' && ui.pendingItem) {
      ui.addItem(
        {
          type: MessageType.ERROR,
          text: t('Already compressing, wait for previous request to complete'),
        },
        Date.now(),
      );
      return;
    }

    const pendingMessage: HistoryItemCompression = {
      type: MessageType.COMPRESSION,
      compression: {
        isPending: true,
        originalTokenCount: null,
        newTokenCount: null,
        compressionStatus: null,
      },
    };

    const config = context.services.config;
    const ollamaClient = config?.getOllamaClient();
    if (!config || !ollamaClient) {
      return {
        type: 'message',
        messageType: 'error',
        content: t('Config not loaded.'),
      };
    }

    const startTime = Date.now();

    const doCompress = async () => {
      const promptId = `compress-${Date.now()}`;
      return await ollamaClient.tryCompressChat(promptId, true);
    };

    try {
      if (executionMode === 'interactive') {
        ui.setPendingItem(pendingMessage);
      }

      const result = await doCompress();

      if (!result) {
        if (executionMode === 'interactive') {
          ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Failed to compress chat history.'),
            },
            Date.now(),
          );
          return;
        }

        return {
          type: 'message',
          messageType: 'error',
          content: t('Failed to compress chat history.'),
        };
      }

      const statusMessage = getCompressionStatusMessage(
        result.compressionStatus,
        result.originalTokenCount,
        result.newTokenCount,
      );

      // Generate compression report
      const duration = Date.now() - startTime;
      const reportService = new CompressionReportService(config);
      let reportPath: string | null = null;
      try {
        reportPath = await reportService.generateReport(result, duration);
      } catch (_reportError) {
        // Ignore report generation errors - compression result is more important
      }

      if (executionMode === 'interactive') {
        // Show compression result
        ui.addItem(
          {
            type: MessageType.COMPRESSION,
            compression: {
              isPending: false,
              originalTokenCount: result.originalTokenCount,
              newTokenCount: result.newTokenCount,
              compressionStatus: result.compressionStatus,
            },
          } as HistoryItemCompression,
          Date.now(),
        );

        // Show report path if generated
        if (reportPath) {
          ui.addItem(
            {
              type: MessageType.INFO,
              text: t('Compression report saved: {{path}}', {
                path: reportPath,
              }),
            },
            Date.now(),
          );
        }

        // Show additional info message for non-success cases
        if (result.compressionStatus !== CompressionStatus.COMPRESSED) {
          ui.addItem(
            {
              type: MessageType.INFO,
              text: statusMessage,
            },
            Date.now(),
          );
        }
        return;
      }

      // Non-interactive mode
      const isSuccess =
        result.compressionStatus === CompressionStatus.COMPRESSED;
      const reportInfo = reportPath ? `\n\nReport: ${reportPath}` : '';
      return {
        type: 'message',
        messageType: isSuccess ? 'info' : 'error',
        content: statusMessage + reportInfo,
      };
    } catch (e) {
      const errorMessage = t('Failed to compress chat history: {{error}}', {
        error: e instanceof Error ? e.message : String(e),
      });

      if (executionMode === 'interactive') {
        ui.addItem(
          {
            type: MessageType.ERROR,
            text: errorMessage,
          },
          Date.now(),
        );
        return;
      }

      return {
        type: 'message',
        messageType: 'error',
        content: errorMessage,
      };
    } finally {
      if (executionMode === 'interactive') {
        ui.setPendingItem(null);
      }
    }
  },
};
