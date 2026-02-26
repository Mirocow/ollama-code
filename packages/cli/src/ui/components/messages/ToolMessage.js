import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Box, Text } from 'ink';
import { ToolCallStatus } from '../../types.js';
import { DiffRenderer } from './DiffRenderer.js';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { AnsiOutputText } from '../AnsiOutput.js';
import { OllamaRespondingSpinner } from '../OllamaRespondingSpinner.js';
import { MaxSizedBox } from '../shared/MaxSizedBox.js';
import { TodoDisplay } from '../TodoDisplay.js';
import { AgentExecutionDisplay } from '../subagents/index.js';
import { PlanSummaryDisplay } from '../PlanSummaryDisplay.js';
import { ShellInputPrompt } from '../ShellInputPrompt.js';
import { SHELL_COMMAND_NAME, SHELL_NAME, TOOL_STATUS, } from '../../constants.js';
import { theme } from '../../semantic-colors.js';
import { useSettings } from '../../contexts/SettingsContext.js';
const STATIC_HEIGHT = 1;
const RESERVED_LINE_COUNT = 5; // for tool name, status, padding etc.
const STATUS_INDICATOR_WIDTH = 3;
const MIN_LINES_SHOWN = 2; // show at least this many lines
// Large threshold to ensure we don't cause performance issues for very large
// outputs that will get truncated further MaxSizedBox anyway.
const MAXIMUM_RESULT_DISPLAY_CHARACTERS = 1000000;
/**
 * Custom hook to determine the type of result display and return appropriate rendering info
 */
const useResultDisplayRenderer = (resultDisplay) => React.useMemo(() => {
    if (!resultDisplay) {
        return { type: 'none' };
    }
    // Check for TodoResultDisplay
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        resultDisplay.type === 'todo_list') {
        return {
            type: 'todo',
            data: resultDisplay,
        };
    }
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        resultDisplay.type === 'plan_summary') {
        return {
            type: 'plan',
            data: resultDisplay,
        };
    }
    // Check for SubagentExecutionResultDisplay (for non-task tools)
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        resultDisplay.type === 'task_execution') {
        return {
            type: 'task',
            data: resultDisplay,
        };
    }
    // Check for FileDiff
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'fileDiff' in resultDisplay) {
        return {
            type: 'diff',
            data: resultDisplay,
        };
    }
    // Check for McpToolProgressData
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        resultDisplay.type === 'mcp_tool_progress') {
        const progress = resultDisplay;
        const msg = progress.message ?? `Progress: ${progress.progress}`;
        const totalStr = progress.total != null ? `/${progress.total}` : '';
        return {
            type: 'string',
            data: `⏳ [${progress.progress}${totalStr}] ${msg}`,
        };
    }
    // Check for AnsiOutput
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'ansiOutput' in resultDisplay) {
        return { type: 'ansi', data: resultDisplay.ansiOutput };
    }
    // Default to string
    return {
        type: 'string',
        data: resultDisplay,
    };
}, [resultDisplay]);
/**
 * Component to render todo list results
 */
const TodoResultRenderer = ({ data, }) => _jsx(TodoDisplay, { todos: data.todos });
const PlanResultRenderer = ({ data, availableHeight, childWidth }) => (_jsx(PlanSummaryDisplay, { data: data, availableHeight: availableHeight, childWidth: childWidth }));
/**
 * Component to render subagent execution results
 */
const SubagentExecutionRenderer = ({ data, availableHeight, childWidth, config }) => (_jsx(AgentExecutionDisplay, { data: data, availableHeight: availableHeight, childWidth: childWidth, config: config }));
/**
 * Component to render string results (markdown or plain text)
 */
const StringResultRenderer = ({ data, renderAsMarkdown, availableHeight, childWidth }) => {
    let displayData = data;
    // Truncate if too long
    if (displayData.length > MAXIMUM_RESULT_DISPLAY_CHARACTERS) {
        displayData = '...' + displayData.slice(-MAXIMUM_RESULT_DISPLAY_CHARACTERS);
    }
    if (renderAsMarkdown) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(MarkdownDisplay, { text: displayData, isPending: false, availableTerminalHeight: availableHeight, contentWidth: childWidth }) }));
    }
    return (_jsx(MaxSizedBox, { maxHeight: availableHeight, maxWidth: childWidth, children: _jsx(Box, { children: _jsx(Text, { wrap: "wrap", color: theme.text.primary, children: displayData }) }) }));
};
/**
 * Component to render diff results
 */
const DiffResultRenderer = ({ data, availableHeight, childWidth, settings }) => (_jsx(DiffRenderer, { diffContent: data.fileDiff, filename: data.fileName, availableTerminalHeight: availableHeight, contentWidth: childWidth, settings: settings }));
export const ToolMessage = ({ name, description, resultDisplay, status, availableTerminalHeight, contentWidth, emphasis = 'medium', renderOutputAsMarkdown = true, activeShellPtyId, embeddedShellFocused, ptyId, config, }) => {
    const settings = useSettings();
    const isThisShellFocused = (name === SHELL_COMMAND_NAME || name === 'Shell') &&
        status === ToolCallStatus.Executing &&
        ptyId === activeShellPtyId &&
        embeddedShellFocused;
    const [lastUpdateTime, setLastUpdateTime] = React.useState(null);
    const [userHasFocused, setUserHasFocused] = React.useState(false);
    const [showFocusHint, setShowFocusHint] = React.useState(false);
    React.useEffect(() => {
        if (resultDisplay) {
            setLastUpdateTime(new Date());
        }
    }, [resultDisplay]);
    React.useEffect(() => {
        if (!lastUpdateTime) {
            return;
        }
        const timer = setTimeout(() => {
            setShowFocusHint(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [lastUpdateTime]);
    React.useEffect(() => {
        if (isThisShellFocused) {
            setUserHasFocused(true);
        }
    }, [isThisShellFocused]);
    const isThisShellFocusable = (name === SHELL_COMMAND_NAME || name === 'Shell') &&
        status === ToolCallStatus.Executing &&
        config?.getShouldUseNodePtyShell();
    const shouldShowFocusHint = isThisShellFocusable && (showFocusHint || userHasFocused);
    const availableHeight = availableTerminalHeight
        ? Math.max(availableTerminalHeight - STATIC_HEIGHT - RESERVED_LINE_COUNT, MIN_LINES_SHOWN + 1)
        : undefined;
    const innerWidth = contentWidth - STATUS_INDICATOR_WIDTH;
    // Long tool call response in MarkdownDisplay doesn't respect availableTerminalHeight properly,
    // we're forcing it to not render as markdown when the response is too long, it will fallback
    // to render as plain text, which is contained within the terminal using MaxSizedBox
    if (availableHeight) {
        renderOutputAsMarkdown = false;
    }
    // Use the custom hook to determine the display type
    const displayRenderer = useResultDisplayRenderer(resultDisplay);
    return (_jsxs(Box, { paddingX: 1, paddingY: 0, flexDirection: "column", children: [_jsxs(Box, { minHeight: 1, children: [_jsx(ToolStatusIndicator, { status: status, name: name }), _jsx(ToolInfo, { name: name, status: status, description: description, emphasis: emphasis }), shouldShowFocusHint && (_jsx(Box, { marginLeft: 1, flexShrink: 0, children: _jsx(Text, { color: theme.text.accent, children: isThisShellFocused ? '(Focused)' : '(ctrl+f to focus)' }) })), emphasis === 'high' && _jsx(TrailingIndicator, {})] }), displayRenderer.type !== 'none' && (_jsx(Box, { paddingLeft: STATUS_INDICATOR_WIDTH, width: "100%", marginTop: 1, children: _jsxs(Box, { flexDirection: "column", children: [displayRenderer.type === 'todo' && (_jsx(TodoResultRenderer, { data: displayRenderer.data })), displayRenderer.type === 'plan' && (_jsx(PlanResultRenderer, { data: displayRenderer.data, availableHeight: availableHeight, childWidth: innerWidth })), displayRenderer.type === 'task' && config && (_jsx(SubagentExecutionRenderer, { data: displayRenderer.data, availableHeight: availableHeight, childWidth: innerWidth, config: config })), displayRenderer.type === 'diff' && (_jsx(DiffResultRenderer, { data: displayRenderer.data, availableHeight: availableHeight, childWidth: innerWidth, settings: settings })), displayRenderer.type === 'ansi' && (_jsx(AnsiOutputText, { data: displayRenderer.data, availableTerminalHeight: availableHeight })), displayRenderer.type === 'string' && (_jsx(StringResultRenderer, { data: displayRenderer.data, renderAsMarkdown: renderOutputAsMarkdown, availableHeight: availableHeight, childWidth: innerWidth }))] }) })), isThisShellFocused && config && (_jsx(Box, { paddingLeft: STATUS_INDICATOR_WIDTH, marginTop: 1, children: _jsx(ShellInputPrompt, { activeShellPtyId: activeShellPtyId ?? null, focus: embeddedShellFocused }) }))] }));
};
const ToolStatusIndicator = ({ status, name, }) => {
    const isShell = name === SHELL_COMMAND_NAME || name === SHELL_NAME;
    const statusColor = isShell ? theme.ui.symbol : theme.status.warning;
    return (_jsxs(Box, { minWidth: STATUS_INDICATOR_WIDTH, children: [status === ToolCallStatus.Pending && (_jsx(Text, { color: theme.status.success, children: TOOL_STATUS.PENDING })), status === ToolCallStatus.Executing && (_jsx(OllamaRespondingSpinner, { spinnerType: "toggle", nonRespondingDisplay: TOOL_STATUS.EXECUTING })), status === ToolCallStatus.Success && (_jsx(Text, { color: theme.status.success, "aria-label": 'Success:', children: TOOL_STATUS.SUCCESS })), status === ToolCallStatus.Confirming && (_jsx(Text, { color: statusColor, "aria-label": 'Confirming:', children: TOOL_STATUS.CONFIRMING })), status === ToolCallStatus.Canceled && (_jsx(Text, { color: statusColor, "aria-label": 'Canceled:', bold: true, children: TOOL_STATUS.CANCELED })), status === ToolCallStatus.Error && (_jsx(Text, { color: theme.status.error, "aria-label": 'Error:', bold: true, children: TOOL_STATUS.ERROR }))] }));
};
const ToolInfo = ({ name, description, status, emphasis, }) => {
    const nameColor = React.useMemo(() => {
        switch (emphasis) {
            case 'high':
                return theme.text.primary;
            case 'medium':
                return theme.text.primary;
            case 'low':
                return theme.text.secondary;
            default: {
                const exhaustiveCheck = emphasis;
                return exhaustiveCheck;
            }
        }
    }, [emphasis]);
    return (_jsx(Box, { children: _jsxs(Text, { wrap: "truncate-end", strikethrough: status === ToolCallStatus.Canceled, children: [_jsx(Text, { color: nameColor, bold: true, children: name }), ' ', _jsx(Text, { color: theme.text.secondary, children: description })] }) }));
};
const TrailingIndicator = () => (_jsxs(Text, { color: theme.text.primary, wrap: "truncate", children: [' ', "\u2190"] }));
//# sourceMappingURL=ToolMessage.js.map