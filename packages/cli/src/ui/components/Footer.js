import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { ContextUsageDisplay } from './ContextUsageDisplay.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { AutoAcceptIndicator } from './AutoAcceptIndicator.js';
import { ShellModeIndicator } from './ShellModeIndicator.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useVimMode } from '../contexts/VimModeContext.js';
import { ApprovalMode } from '@ollama-code/ollama-code-core';
import { t } from '../../i18n/index.js';
export const Footer = () => {
    const uiState = useUIState();
    const config = useConfig();
    const { vimEnabled, vimMode } = useVimMode();
    const { promptTokenCount, showAutoAcceptIndicator } = {
        promptTokenCount: uiState.sessionStats.lastPromptTokenCount,
        showAutoAcceptIndicator: uiState.showAutoAcceptIndicator,
    };
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    // Determine sandbox info from environment
    const sandboxEnv = process.env['SANDBOX'];
    const sandboxInfo = sandboxEnv
        ? sandboxEnv === 'sandbox-exec'
            ? 'seatbelt'
            : sandboxEnv.startsWith('ollama-code')
                ? 'docker'
                : sandboxEnv
        : null;
    // Check if debug mode is enabled
    const debugMode = config.getDebugMode();
    const contextWindowSize = config.getContentGeneratorConfig()?.contextWindowSize;
    // Left section should show exactly ONE thing at any time, in priority order.
    const leftContent = uiState.ctrlCPressedOnce ? (_jsx(Text, { color: theme.status.warning, children: t('Press Ctrl+C again to exit.') })) : uiState.ctrlDPressedOnce ? (_jsx(Text, { color: theme.status.warning, children: t('Press Ctrl+D again to exit.') })) : uiState.showEscapePrompt ? (_jsx(Text, { color: theme.text.secondary, children: t('Press Esc again to clear.') })) : vimEnabled && vimMode === 'INSERT' ? (_jsx(Text, { color: theme.text.secondary, children: "-- INSERT --" })) : uiState.shellModeActive ? (_jsx(ShellModeIndicator, {})) : showAutoAcceptIndicator !== undefined &&
        showAutoAcceptIndicator !== ApprovalMode.DEFAULT ? (_jsx(AutoAcceptIndicator, { approvalMode: showAutoAcceptIndicator })) : (_jsx(Text, { color: theme.text.secondary, children: t('? for shortcuts') }));
    const rightItems = [];
    if (sandboxInfo) {
        rightItems.push({
            key: 'sandbox',
            node: _jsxs(Text, { color: theme.status.success, children: ["\uD83D\uDD12 ", sandboxInfo] }),
        });
    }
    if (debugMode) {
        rightItems.push({
            key: 'debug',
            node: _jsx(Text, { color: theme.status.warning, children: "Debug Mode" }),
        });
    }
    if (promptTokenCount > 0 && contextWindowSize) {
        rightItems.push({
            key: 'context',
            node: (_jsx(Text, { color: theme.text.accent, children: _jsx(ContextUsageDisplay, { promptTokenCount: promptTokenCount, terminalWidth: terminalWidth, contextWindowSize: contextWindowSize }) })),
        });
    }
    return (_jsxs(Box, { justifyContent: "space-between", width: "100%", flexDirection: "row", alignItems: "center", children: [_jsx(Box, { marginLeft: 2, justifyContent: "flex-start", flexDirection: isNarrow ? 'column' : 'row', alignItems: isNarrow ? 'flex-start' : 'center', children: leftContent }), _jsx(Box, { alignItems: "center", justifyContent: "flex-end", marginRight: 2, children: rightItems.map(({ key, node }, index) => (_jsxs(Box, { alignItems: "center", children: [index > 0 && _jsx(Text, { color: theme.text.secondary, children: " | " }), node] }, key))) })] }));
};
//# sourceMappingURL=Footer.js.map