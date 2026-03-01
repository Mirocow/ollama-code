import { jsx as _jsx } from "react/jsx-runtime";
import { ToolCallContainer, groupContent, mapToolStatusToContainerStatus, } from './shared/index.js';
/**
 * SaveMemory tool call component
 * Displays saved memory content in a simple text format
 */
export const SaveMemoryToolCall = ({ toolCall, isFirst, isLast, }) => {
    const { content } = toolCall;
    // Group content by type
    const { textOutputs, errors } = groupContent(content);
    // Determine container status
    const containerStatus = mapToolStatusToContainerStatus(toolCall.status);
    // Error case
    if (errors.length > 0) {
        return (_jsx(ToolCallContainer, { label: "SaveMemory", status: "error", isFirst: isFirst, isLast: isLast, children: _jsx("div", { className: "text-[#c74e39] text-[var(--app-secondary-foreground)] py-0.5", children: errors.join('\n') }) }));
    }
    // No content case
    if (textOutputs.length === 0) {
        return null;
    }
    const memoryContent = textOutputs.join('\n\n');
    return (_jsx(ToolCallContainer, { label: "SaveMemory", status: containerStatus, isFirst: isFirst, isLast: isLast, children: _jsx("div", { className: "text-[var(--app-secondary-foreground)] py-0.5 italic", children: memoryContent }) }));
};
//# sourceMappingURL=SaveMemoryToolCall.js.map