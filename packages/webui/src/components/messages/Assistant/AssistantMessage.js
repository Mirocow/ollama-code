import { jsx as _jsx } from "react/jsx-runtime";
import { MessageContent } from '../MessageContent.js';
import './AssistantMessage.css';
/**
 * AssistantMessage component - renders AI responses with styling
 * Supports different states: default, success, error, warning, loading
 */
export const AssistantMessage = ({ content, timestamp: _timestamp, onFileClick, status = 'default', hideStatusIcon = false, isFirst = false, isLast = false, }) => {
    // Empty content not rendered directly
    if (!content || content.trim().length === 0) {
        return null;
    }
    const getStatusClass = () => {
        if (hideStatusIcon) {
            return '';
        }
        switch (status) {
            case 'success':
                return 'assistant-message-success';
            case 'error':
                return 'assistant-message-error';
            case 'warning':
                return 'assistant-message-warning';
            case 'loading':
                return 'assistant-message-loading';
            default:
                return 'assistant-message-default';
        }
    };
    return (_jsx("div", { className: `ollama-message message-item assistant-message-container ${getStatusClass()}`, "data-first": isFirst, "data-last": isLast, style: {
            width: '100%',
            alignItems: 'flex-start',
            paddingLeft: '30px',
            userSelect: 'text',
            position: 'relative',
        }, children: _jsx("span", { style: { width: '100%' }, children: _jsx("div", { style: {
                    margin: 0,
                    width: '100%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                }, children: _jsx(MessageContent, { content: content, onFileClick: onFileClick, enableFileLinks: false }) }) }) }));
};
//# sourceMappingURL=AssistantMessage.js.map