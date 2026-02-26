import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { MessageContent } from './MessageContent.js';
import { ChevronIcon } from '../icons/index.js';
import './ThinkingMessage.css';
/**
 * ThinkingMessage - Collapsible thinking message component
 *
 * Displays the LLM's thinking process, collapsed by default, click to expand and view details.
 * Style reference from Claude Code's thinking message design:
 * - Collapsed: gray dot + "Thinking" + down arrow
 * - Expanded: solid dot + "Thinking" + up arrow + thinking content
 * - Aligned with other message items, with status icon and connector line
 */
export const ThinkingMessage = ({ content, timestamp: _timestamp, onFileClick, defaultExpanded = false, status = 'default', }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };
    return (_jsx("div", { className: `qwen-message message-item thinking-message thinking-status-${status}`, children: _jsxs("div", { className: "thinking-content-wrapper", children: [_jsxs("button", { type: "button", onClick: handleToggle, className: "thinking-toggle-btn", "aria-expanded": isExpanded, "aria-label": isExpanded ? 'Collapse thinking' : 'Expand thinking', children: [_jsx("span", { className: "thinking-label", children: "Thinking" }), _jsx(ChevronIcon, { size: 12, direction: isExpanded ? 'up' : 'down', className: "thinking-chevron" })] }), isExpanded && (_jsx("div", { className: "thinking-content", children: _jsx(MessageContent, { content: content, onFileClick: onFileClick }) }))] }) }));
};
//# sourceMappingURL=ThinkingMessage.js.map