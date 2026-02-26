import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolCallContainer, ToolCallCard, ToolCallRow, LocationsList, safeTitle, groupContent, } from './shared/index.js';
/**
 * Generic tool call component that can display any tool call type
 * Used as fallback for unknown tool call kinds
 * Minimal display: show description and outcome
 */
export const GenericToolCall = ({ toolCall, isFirst, isLast, }) => {
    const { kind, title, content, locations, toolCallId } = toolCall;
    const operationText = safeTitle(title);
    /**
     * Map tool call kind to appropriate display name
     */
    const getDisplayLabel = () => {
        const normalizedKind = kind.toLowerCase();
        if (normalizedKind === 'task') {
            return 'Task';
        }
        else if (normalizedKind === 'web_fetch') {
            return 'WebFetch';
        }
        else if (normalizedKind === 'web_search') {
            return 'WebSearch';
        }
        else if (normalizedKind === 'exit_plan_mode') {
            return 'ExitPlanMode';
        }
        else {
            return kind; // fallback to original kind if not mapped
        }
    };
    // Group content by type
    const { textOutputs, errors } = groupContent(content);
    // Error case: show operation + error in card layout
    if (errors.length > 0) {
        return (_jsxs(ToolCallCard, { icon: "\uD83D\uDD27", children: [_jsx(ToolCallRow, { label: getDisplayLabel(), children: _jsx("div", { children: operationText }) }), _jsx(ToolCallRow, { label: "Error", children: _jsx("div", { className: "text-[#c74e39] font-medium", children: errors.join('\n') }) })] }));
    }
    // Success with output: use card for long output, compact for short
    if (textOutputs.length > 0) {
        const output = textOutputs.join('\n');
        const isLong = output.length > 150;
        if (isLong) {
            const truncatedOutput = output.length > 300 ? output.substring(0, 300) + '...' : output;
            return (_jsxs(ToolCallCard, { icon: "\uD83D\uDD27", children: [_jsx(ToolCallRow, { label: getDisplayLabel(), children: _jsx("div", { children: operationText }) }), _jsx(ToolCallRow, { label: "Output", children: _jsx("div", { className: "whitespace-pre-wrap font-mono text-[13px] opacity-90", children: truncatedOutput }) })] }));
        }
        // Short output - compact format
        const statusFlag = toolCall.status === 'in_progress' || toolCall.status === 'pending'
            ? 'loading'
            : 'success';
        return (_jsx(ToolCallContainer, { label: getDisplayLabel(), status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: operationText || output }));
    }
    // Success with files: show operation + file list in compact format
    if (locations && locations.length > 0) {
        const statusFlag = toolCall.status === 'in_progress' || toolCall.status === 'pending'
            ? 'loading'
            : 'success';
        return (_jsx(ToolCallContainer, { label: getDisplayLabel(), status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: _jsx(LocationsList, { locations: locations }) }));
    }
    // No output - show just the operation
    if (operationText) {
        const statusFlag = toolCall.status === 'in_progress' || toolCall.status === 'pending'
            ? 'loading'
            : 'success';
        return (_jsx(ToolCallContainer, { label: getDisplayLabel(), status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: operationText }));
    }
    return null;
};
//# sourceMappingURL=GenericToolCall.js.map