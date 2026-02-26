/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const modelCommand = {
    name: 'model',
    get description() {
        return t('Switch the model for this session');
    },
    kind: CommandKind.BUILT_IN,
    action: async (context) => {
        const { services } = context;
        const { config } = services;
        if (!config) {
            return {
                type: 'message',
                messageType: 'error',
                content: t('Configuration not available.'),
            };
        }
        const contentGeneratorConfig = config.getContentGeneratorConfig();
        if (!contentGeneratorConfig) {
            return {
                type: 'message',
                messageType: 'error',
                content: t('Content generator configuration not available.'),
            };
        }
        const authType = contentGeneratorConfig.authType;
        if (!authType) {
            return {
                type: 'message',
                messageType: 'error',
                content: t('Authentication type not available.'),
            };
        }
        return {
            type: 'dialog',
            dialog: 'model',
        };
    },
};
//# sourceMappingURL=modelCommand.js.map