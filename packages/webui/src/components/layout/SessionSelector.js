import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment } from 'react';
import { getTimeAgo, groupSessionsByDate, } from '../../utils/sessionGrouping.js';
import { SearchIcon } from '../icons/NavigationIcons.js';
/**
 * SessionSelector component
 *
 * Features:
 * - Sessions grouped by date (Today, Yesterday, This Week, Older)
 * - Search filtering
 * - Infinite scroll to load more sessions
 * - Click outside to close
 * - Active session highlighting
 *
 * @example
 * ```tsx
 * <SessionSelector
 *   visible={true}
 *   sessions={sessions}
 *   currentSessionId="abc123"
 *   searchQuery=""
 *   onSearchChange={(q) => setQuery(q)}
 *   onSelectSession={(id) => loadSession(id)}
 *   onClose={() => setVisible(false)}
 * />
 * ```
 */
export const SessionSelector = ({ visible, sessions, currentSessionId, searchQuery, onSearchChange, onSelectSession, onClose, hasMore = false, isLoading = false, onLoadMore, }) => {
    if (!visible) {
        return null;
    }
    const hasNoSessions = sessions.length === 0;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "session-selector-backdrop fixed top-0 left-0 right-0 bottom-0 z-[999] bg-transparent", onClick: onClose }), _jsxs("div", { className: "session-dropdown fixed bg-[var(--app-menu-background)] rounded-[var(--corner-radius-small)] w-[min(400px,calc(100vw-32px))] max-h-[min(500px,50vh)] flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.1)] z-[1000] outline-none text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)]", tabIndex: -1, style: {
                    top: '30px',
                    left: '10px',
                }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "session-search p-2 flex items-center gap-2", children: [_jsx(SearchIcon, { className: "session-search-icon w-4 h-4 opacity-50 flex-shrink-0 text-[var(--app-primary-foreground)]" }), _jsx("input", { type: "text", className: "session-search-input flex-1 bg-transparent border-none outline-none text-[var(--app-menu-foreground)] text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)] p-0 placeholder:text-[var(--app-input-placeholder-foreground)] placeholder:opacity-60", placeholder: "Search sessions\u2026", "aria-label": "Search sessions", value: searchQuery, onChange: (e) => onSearchChange(e.target.value) })] }), _jsxs("div", { className: "session-list-content overflow-y-auto flex-1 select-none p-2", onScroll: (e) => {
                            const el = e.currentTarget;
                            const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
                            if (distanceToBottom < 48 && hasMore && !isLoading) {
                                onLoadMore?.();
                            }
                        }, children: [hasNoSessions ? (_jsx("div", { className: "p-5 text-center text-[var(--app-secondary-foreground)]", style: {
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: 'var(--app-secondary-foreground)',
                                }, children: searchQuery ? 'No matching sessions' : 'No sessions available' })) : (groupSessionsByDate(sessions).map((group) => (_jsxs(Fragment, { children: [_jsx("div", { className: "session-group-label p-1 px-2 text-[var(--app-primary-foreground)] opacity-50 text-[0.9em] font-medium [&:not(:first-child)]:mt-2", children: group.label }), _jsx("div", { className: "session-group flex flex-col gap-[2px]", children: group.sessions.map((session) => {
                                            const sessionId = session.id ||
                                                session.sessionId ||
                                                '';
                                            const title = session.title ||
                                                session.name ||
                                                'Untitled';
                                            const lastUpdated = session.lastUpdated ||
                                                session.startTime ||
                                                '';
                                            const isActive = sessionId === currentSessionId;
                                            return (_jsxs("button", { type: "button", className: `session-item flex items-center justify-between py-1.5 px-2 bg-transparent border-none rounded-md cursor-pointer text-left w-full text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)] text-[var(--app-primary-foreground)] transition-colors duration-100 hover:bg-[var(--app-list-hover-background)] ${isActive
                                                    ? 'active bg-[var(--app-list-active-background)] text-[var(--app-list-active-foreground)] font-[600]'
                                                    : ''}`, onClick: () => {
                                                    onSelectSession(sessionId);
                                                    onClose();
                                                }, children: [_jsx("span", { className: "session-item-title flex-1 overflow-hidden text-ellipsis whitespace-nowrap min-w-0", children: title }), _jsx("span", { className: "session-item-time opacity-60 text-[0.9em] flex-shrink-0 ml-3", children: getTimeAgo(lastUpdated) })] }, sessionId));
                                        }) })] }, group.label)))), hasMore && (_jsx("div", { className: "p-2 text-center opacity-60 text-[0.9em]", children: isLoading ? 'Loading…' : '' }))] })] })] }));
};
//# sourceMappingURL=SessionSelector.js.map