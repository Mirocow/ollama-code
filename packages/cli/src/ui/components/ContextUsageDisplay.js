import { jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Text } from 'ink';
import { theme } from '../semantic-colors.js';
export const ContextUsageDisplay = ({ promptTokenCount, terminalWidth, contextWindowSize, }) => {
    if (promptTokenCount === 0) {
        return null;
    }
    const percentage = promptTokenCount / contextWindowSize;
    const percentageUsed = (percentage * 100).toFixed(1);
    const label = terminalWidth < 100 ? '% used' : '% context used';
    return (_jsxs(Text, { color: theme.text.secondary, children: [percentageUsed, label] }));
};
//# sourceMappingURL=ContextUsageDisplay.js.map