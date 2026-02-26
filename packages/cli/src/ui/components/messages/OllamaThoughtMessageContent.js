import { jsx as _jsx } from "react/jsx-runtime";
import { Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { theme } from '../../semantic-colors.js';
/**
 * Continuation component for thought messages, similar to GeminiMessageContent.
 * Used when a thought response gets too long and needs to be split for performance.
 */
export const OllamaThoughtMessageContent = ({ text, isPending, availableTerminalHeight, contentWidth }) => {
    const originalPrefix = '✦ ';
    const prefixWidth = originalPrefix.length;
    return (_jsx(Box, { flexDirection: "column", paddingLeft: prefixWidth, children: _jsx(MarkdownDisplay, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth - prefixWidth, textColor: theme.text.secondary }) }));
};
//# sourceMappingURL=OllamaThoughtMessageContent.js.map