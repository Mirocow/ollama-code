import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text, Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { theme } from '../../semantic-colors.js';
/**
 * Displays model thinking/reasoning text with a softer, dimmed style
 * to visually distinguish it from regular content output.
 */
export const OllamaThoughtMessage = ({ text, isPending, availableTerminalHeight, contentWidth, }) => {
    const prefix = '✦ ';
    const prefixWidth = prefix.length;
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: prefixWidth, children: _jsx(Text, { color: theme.text.secondary, children: prefix }) }), _jsx(Box, { flexGrow: 1, flexDirection: "column", children: _jsx(MarkdownDisplay, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth - prefixWidth, textColor: theme.text.secondary }) })] }));
};
//# sourceMappingURL=OllamaThoughtMessage.js.map