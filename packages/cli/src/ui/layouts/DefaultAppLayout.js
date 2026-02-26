import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box } from 'ink';
import { MainContent } from '../components/MainContent.js';
import { DialogManager } from '../components/DialogManager.js';
import { Composer } from '../components/Composer.js';
import { ExitWarning } from '../components/ExitWarning.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
export const DefaultAppLayout = () => {
    const uiState = useUIState();
    const { columns: terminalWidth } = useTerminalSize();
    return (_jsxs(Box, { flexDirection: "column", width: terminalWidth, children: [_jsx(MainContent, {}), _jsxs(Box, { flexDirection: "column", ref: uiState.mainControlsRef, children: [uiState.dialogsVisible ? (_jsx(Box, { marginX: 2, flexDirection: "column", width: uiState.mainAreaWidth, children: _jsx(DialogManager, { terminalWidth: uiState.terminalWidth, addItem: uiState.historyManager.addItem }) })) : (_jsx(Composer, {})), _jsx(ExitWarning, {})] })] }));
};
//# sourceMappingURL=DefaultAppLayout.js.map