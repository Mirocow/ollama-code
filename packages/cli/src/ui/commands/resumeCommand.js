/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const resumeCommand = {
    name: 'resume',
    kind: CommandKind.BUILT_IN,
    get description() {
        return t('Resume a previous session');
    },
    action: async () => ({
        type: 'dialog',
        dialog: 'resume',
    }),
};
//# sourceMappingURL=resumeCommand.js.map