import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from 'react';
export const PermissionDrawer = ({ isOpen, options, toolCall, onResponse, onClose, }) => {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef = useRef(null);
    // Prefer file name from locations, fall back to content[].path if present
    const getAffectedFileName = () => {
        const fromLocations = toolCall.locations?.[0]?.path;
        if (fromLocations) {
            return fromLocations.split('/').pop() || fromLocations;
        }
        // Some tool calls (e.g. write/edit with diff content) only include path in content
        const fromContent = Array.isArray(toolCall.content)
            ? toolCall.content.find((c) => typeof c === 'object' &&
                c !== null &&
                'path' in c)?.path
            : undefined;
        if (typeof fromContent === 'string' && fromContent.length > 0) {
            return fromContent.split('/').pop() || fromContent;
        }
        return 'file';
    };
    // Get the title for the permission request
    const getTitle = () => {
        if (toolCall.kind === 'edit' || toolCall.kind === 'write') {
            const fileName = getAffectedFileName();
            return (_jsxs(_Fragment, { children: ["Make this edit to", ' ', _jsx("span", { className: "font-mono text-[var(--app-primary-foreground)]", children: fileName }), "?"] }));
        }
        if (toolCall.kind === 'execute' || toolCall.kind === 'bash') {
            return 'Allow this bash command?';
        }
        if (toolCall.kind === 'read') {
            const fileName = getAffectedFileName();
            return (_jsxs(_Fragment, { children: ["Allow read from", ' ', _jsx("span", { className: "font-mono text-[var(--app-primary-foreground)]", children: fileName }), "?"] }));
        }
        return toolCall.title || 'Permission Required';
    };
    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) {
                return;
            }
            // Number keys 1-9 for quick select
            const numMatch = e.key.match(/^[1-9]$/);
            if (numMatch) {
                const index = parseInt(e.key, 10) - 1;
                if (index < options.length) {
                    e.preventDefault();
                    onResponse(options[index].optionId);
                }
                return;
            }
            // Arrow keys for navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (options.length === 0) {
                    return;
                }
                const totalItems = options.length;
                if (e.key === 'ArrowDown') {
                    setFocusedIndex((prev) => (prev + 1) % totalItems);
                }
                else {
                    setFocusedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                }
            }
            // Enter to select
            if (e.key === 'Enter') {
                e.preventDefault();
                if (focusedIndex < options.length) {
                    onResponse(options[focusedIndex].optionId);
                }
            }
            // Escape to cancel permission and close (align with CLI behavior)
            if (e.key === 'Escape') {
                e.preventDefault();
                const rejectOptionId = options.find((o) => o.kind.includes('reject'))?.optionId ||
                    options.find((o) => o.optionId === 'cancel')?.optionId ||
                    'cancel';
                onResponse(rejectOptionId);
                if (onClose) {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, options, onResponse, onClose, focusedIndex]);
    // Focus container when opened
    useEffect(() => {
        if (isOpen && containerRef.current) {
            containerRef.current.focus();
        }
    }, [isOpen]);
    // Reset focus to the first option when the drawer opens or the options change
    useEffect(() => {
        if (isOpen) {
            setFocusedIndex(0);
        }
    }, [isOpen, options.length]);
    if (!isOpen) {
        return null;
    }
    return (_jsx("div", { className: "fixed inset-x-0 bottom-0 z-[1000] p-2", children: _jsxs("div", { ref: containerRef, className: "relative flex flex-col rounded-large border p-2 outline-none animate-slide-up", style: {
                backgroundColor: 'var(--app-input-secondary-background)',
                borderColor: 'var(--app-input-border)',
            }, tabIndex: 0, "data-focused-index": focusedIndex, children: [_jsx("div", { className: "p-2 absolute inset-0 rounded-large", style: { backgroundColor: 'var(--app-input-background)' } }), _jsxs("div", { className: "relative z-[1] text-[1.1em] text-[var(--app-primary-foreground)] flex flex-col min-h-0", children: [_jsx("div", { className: "font-bold text-[var(--app-primary-foreground)] mb-0.5", children: getTitle() }), (toolCall.kind === 'edit' ||
                            toolCall.kind === 'write' ||
                            toolCall.kind === 'read' ||
                            toolCall.kind === 'execute' ||
                            toolCall.kind === 'bash') &&
                            toolCall.title && (_jsx("div", { 
                            /* 13px, normal font weight; normal whitespace wrapping + long word breaking; maximum 3 lines with overflow ellipsis */
                            className: "text-[13px] font-normal text-[var(--app-secondary-foreground)] opacity-90 font-mono whitespace-normal break-words q-line-clamp-3 mb-2", style: {
                                fontSize: '.9em',
                                color: 'var(--app-secondary-foreground)',
                                marginBottom: '6px',
                            }, title: toolCall.title, children: toolCall.title }))] }), _jsx("div", { className: "relative z-[1] flex flex-col gap-1 pb-1", children: options.map((option, index) => {
                        const isFocused = focusedIndex === index;
                        return (_jsxs("button", { className: `flex items-center gap-2 px-2 py-1.5 text-left w-full box-border rounded-[4px] border-0 shadow-[inset_0_0_0_1px_var(--app-transparent-inner-border)] transition-colors duration-150 text-[var(--app-primary-foreground)] hover:bg-[var(--app-button-background)] ${isFocused
                                ? 'text-[var(--app-list-active-foreground)] bg-[var(--app-list-active-background)] hover:text-[var(--app-button-foreground)] hover:font-bold hover:relative hover:border-0'
                                : 'hover:bg-[var(--app-button-background)] hover:text-[var(--app-button-foreground)] hover:font-bold hover:relative hover:border-0'}`, onClick: () => onResponse(option.optionId), onMouseEnter: () => setFocusedIndex(index), children: [_jsx("span", { className: "inline-flex items-center justify-center min-w-[10px] h-5 font-semibold opacity-60", children: index + 1 }), _jsx("span", { className: "font-semibold", children: option.name })] }, option.optionId));
                    }) })] }) }));
};
//# sourceMappingURL=PermissionDrawer.js.map