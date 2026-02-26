import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { escapeAnsiCtrlCodes } from '../utils/textUtils.js';
import { UserMessage } from './messages/UserMessage.js';
import { UserShellMessage } from './messages/UserShellMessage.js';
import { OllamaMessage } from './messages/OllamaMessage.js';
import { InfoMessage } from './messages/InfoMessage.js';
import { ErrorMessage } from './messages/ErrorMessage.js';
import { ToolGroupMessage } from './messages/ToolGroupMessage.js';
import { OllamaMessageContent } from './messages/OllamaMessageContent.js';
import { OllamaThoughtMessage } from './messages/OllamaThoughtMessage.js';
import { OllamaThoughtMessageContent } from './messages/OllamaThoughtMessageContent.js';
import { CompressionMessage } from './messages/CompressionMessage.js';
import { SummaryMessage } from './messages/SummaryMessage.js';
import { WarningMessage } from './messages/WarningMessage.js';
import { RetryCountdownMessage } from './messages/RetryCountdownMessage.js';
import { Box } from 'ink';
import { AboutBox } from './AboutBox.js';
import { StatsDisplay } from './StatsDisplay.js';
import { ModelStatsDisplay } from './ModelStatsDisplay.js';
import { ToolStatsDisplay } from './ToolStatsDisplay.js';
import { SessionSummaryDisplay } from './SessionSummaryDisplay.js';
import { Help } from './Help.js';
import { ExtensionsList } from './views/ExtensionsList.js';
import { getMCPServerStatus } from '@ollama-code/ollama-code-core';
import { SkillsList } from './views/SkillsList.js';
import { ToolsList } from './views/ToolsList.js';
import { McpStatus } from './views/McpStatus.js';
const HistoryItemDisplayComponent = ({ item, availableTerminalHeight, terminalWidth, mainAreaWidth, isPending, commands, isFocused = true, activeShellPtyId, embeddedShellFocused, availableTerminalHeightGemini, }) => {
    const itemForDisplay = useMemo(() => escapeAnsiCtrlCodes(item), [item]);
    const contentWidth = terminalWidth - 4;
    const boxWidth = mainAreaWidth || contentWidth;
    return (_jsxs(Box, { flexDirection: "column", marginLeft: 2, marginRight: 2, children: [itemForDisplay.type === 'user' && (_jsx(UserMessage, { text: itemForDisplay.text })), itemForDisplay.type === 'user_shell' && (_jsx(UserShellMessage, { text: itemForDisplay.text })), itemForDisplay.type === 'ollama' && (_jsx(OllamaMessage, { text: itemForDisplay.text, isPending: isPending, availableTerminalHeight: availableTerminalHeightGemini ?? availableTerminalHeight, contentWidth: contentWidth })), itemForDisplay.type === 'ollama_content' && (_jsx(OllamaMessageContent, { text: itemForDisplay.text, isPending: isPending, availableTerminalHeight: availableTerminalHeightGemini ?? availableTerminalHeight, contentWidth: contentWidth })), itemForDisplay.type === 'ollama_thought' && (_jsx(OllamaThoughtMessage, { text: itemForDisplay.text, isPending: isPending, availableTerminalHeight: availableTerminalHeightGemini ?? availableTerminalHeight, contentWidth: contentWidth })), itemForDisplay.type === 'ollama_thought_content' && (_jsx(OllamaThoughtMessageContent, { text: itemForDisplay.text, isPending: isPending, availableTerminalHeight: availableTerminalHeightGemini ?? availableTerminalHeight, contentWidth: contentWidth })), itemForDisplay.type === 'info' && (_jsx(InfoMessage, { text: itemForDisplay.text })), itemForDisplay.type === 'warning' && (_jsx(WarningMessage, { text: itemForDisplay.text })), itemForDisplay.type === 'error' && (_jsx(ErrorMessage, { text: itemForDisplay.text })), itemForDisplay.type === 'retry_countdown' && (_jsx(RetryCountdownMessage, { text: itemForDisplay.text })), itemForDisplay.type === 'about' && (_jsx(AboutBox, { ...itemForDisplay.systemInfo, width: boxWidth })), itemForDisplay.type === 'help' && commands && (_jsx(Help, { commands: commands, width: boxWidth })), itemForDisplay.type === 'stats' && (_jsx(StatsDisplay, { duration: itemForDisplay.duration, width: boxWidth })), itemForDisplay.type === 'model_stats' && (_jsx(ModelStatsDisplay, { width: boxWidth })), itemForDisplay.type === 'tool_stats' && (_jsx(ToolStatsDisplay, { width: boxWidth })), itemForDisplay.type === 'quit' && (_jsx(SessionSummaryDisplay, { duration: itemForDisplay.duration, width: boxWidth })), itemForDisplay.type === 'tool_group' && (_jsx(ToolGroupMessage, { toolCalls: itemForDisplay.tools, groupId: itemForDisplay.id, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth, isFocused: isFocused, activeShellPtyId: activeShellPtyId, embeddedShellFocused: embeddedShellFocused })), itemForDisplay.type === 'compression' && (_jsx(CompressionMessage, { compression: itemForDisplay.compression })), item.type === 'summary' && _jsx(SummaryMessage, { summary: item.summary }), itemForDisplay.type === 'extensions_list' && _jsx(ExtensionsList, {}), itemForDisplay.type === 'tools_list' && (_jsx(ToolsList, { contentWidth: contentWidth, tools: itemForDisplay.tools, showDescriptions: itemForDisplay.showDescriptions })), itemForDisplay.type === 'skills_list' && (_jsx(SkillsList, { skills: itemForDisplay.skills })), itemForDisplay.type === 'mcp_status' && (_jsx(McpStatus, { ...itemForDisplay, serverStatus: getMCPServerStatus }))] }, itemForDisplay.id));
};
// Export alias for backward compatibility
export { HistoryItemDisplayComponent as HistoryItemDisplay };
//# sourceMappingURL=HistoryItemDisplay.js.map