import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './styles.css';
import logoSvg from './favicon.svg';
const ReactDOM = window.ReactDOM;
const { ChatViewer, PlatformProvider } = QwenCodeWebUI;
const logoSvgWithGradient = (() => {
    if (!logoSvg) {
        return logoSvg;
    }
    const gradientDef = '<defs><linearGradient id="qwen-logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#60a5fa" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs>';
    const withDefs = logoSvg.replace(/<svg([^>]*)>/, `<svg$1>${gradientDef}`);
    return withDefs.replace(/fill="[^"]*"/, 'fill="url(#qwen-logo-gradient)"');
})();
const platformContext = {
    platform: 'web',
    postMessage: (message) => {
        console.log('Posted message:', message);
    },
    onMessage: (handler) => {
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    },
    openFile: (path) => {
        console.log('Opening file:', path);
    },
    getResourceUrl: () => undefined,
    features: {
        canOpenFile: false,
        canCopy: true,
    },
};
const isChatViewerMessage = (value) => Boolean(value) && typeof value === 'object';
const parseChatData = () => {
    const chatDataElement = document.getElementById('chat-data');
    if (!chatDataElement?.textContent) {
        return {};
    }
    try {
        const parsed = JSON.parse(chatDataElement.textContent);
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
        return {};
    }
    catch (error) {
        console.error('Failed to parse chat data.', error);
        return {};
    }
};
const formatSessionDate = (startTime) => {
    if (!startTime) {
        return '-';
    }
    try {
        const date = new Date(startTime);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    catch {
        return startTime;
    }
};
const App = () => {
    const chatData = parseChatData();
    const rawMessages = Array.isArray(chatData.messages) ? chatData.messages : [];
    const messages = rawMessages
        .filter(isChatViewerMessage)
        .filter((record) => record.type !== 'system');
    const sessionId = chatData.sessionId ?? '-';
    const sessionDate = formatSessionDate(chatData.startTime);
    return (_jsxs("div", { className: "page-wrapper", children: [_jsxs("header", { className: "header", children: [_jsxs("div", { className: "header-left", children: [_jsx("div", { className: "logo-icon", "aria-hidden": "true", dangerouslySetInnerHTML: { __html: logoSvgWithGradient } }), _jsx("div", { className: "logo", children: _jsx("div", { className: "logo-text", "data-text": "OLLAMA", children: _jsx("span", { className: "logo-text-inner", children: "OLLAMA" }) }) })] }), _jsxs("div", { className: "meta", children: [_jsxs("div", { className: "meta-item", children: [_jsx("span", { className: "meta-label", children: "Session Id" }), _jsx("span", { className: "font-mono", children: sessionId })] }), _jsxs("div", { className: "meta-item", children: [_jsx("span", { className: "meta-label", children: "Export Time" }), _jsx("span", { children: sessionDate })] })] })] }), _jsx("div", { className: "chat-container", children: _jsx(PlatformProvider, { value: platformContext, children: _jsx(ChatViewer, { messages: messages, autoScroll: false, theme: "dark" }) }) })] }));
};
const rootElement = document.getElementById('app');
if (!rootElement) {
    console.error('App container not found.');
}
else {
    ReactDOM.createRoot(rootElement).render(_jsx(App, {}));
}
//# sourceMappingURL=main.js.map