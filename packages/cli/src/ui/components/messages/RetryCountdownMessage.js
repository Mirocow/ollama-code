import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text, Box } from 'ink';
import { theme } from '../../semantic-colors.js';
/**
 * Displays a retry countdown message in a dimmed/secondary style
 * to visually distinguish it from error messages.
 */
export const RetryCountdownMessage = ({ text, }) => {
    if (!text || text.trim() === '') {
        return null;
    }
    const prefix = '↻ ';
    const prefixWidth = prefix.length;
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: prefixWidth, children: _jsx(Text, { color: theme.text.secondary, children: prefix }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { wrap: "wrap", color: theme.text.secondary, children: text }) })] }));
};
//# sourceMappingURL=RetryCountdownMessage.js.map