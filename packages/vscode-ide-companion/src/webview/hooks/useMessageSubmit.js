/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { getRandomLoadingMessage } from '../../constants/loadingMessages.js';
/**
 * Message submit Hook
 * Handles message submission logic and context parsing
 */
export const useMessageSubmit = ({ vscode, inputText, setInputText, inputFieldRef, isStreaming, isWaitingForResponse, skipAutoActiveContext = false, fileContext, messageHandling, }) => {
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!inputText.trim() || isStreaming || isWaitingForResponse) {
            return;
        }
        // Handle /login command - show inline loading while extension authenticates
        if (inputText.trim() === '/login') {
            setInputText('');
            if (inputFieldRef.current) {
                // Use a zero-width space to maintain the height of the contentEditable element
                inputFieldRef.current.textContent = '\u200B';
                // Set the data-empty attribute to show the placeholder
                inputFieldRef.current.setAttribute('data-empty', 'true');
            }
            vscode.postMessage({
                type: 'login',
                data: {},
            });
            // Show a friendly loading message in the chat while logging in
            try {
                messageHandling.setWaitingForResponse('Logging in to Qwen Code...');
            }
            catch (_err) {
                // Best-effort UI hint; ignore if hook not available
            }
            return;
        }
        messageHandling.setWaitingForResponse(getRandomLoadingMessage());
        // Parse @file references from input text
        const context = [];
        const fileRefPattern = /@([^\s]+)/g;
        let match;
        while ((match = fileRefPattern.exec(inputText)) !== null) {
            const fileName = match[1];
            const filePath = fileContext.getFileReference(fileName);
            if (filePath) {
                context.push({
                    type: 'file',
                    name: fileName,
                    value: filePath,
                });
            }
        }
        // Add active file selection context if present and not skipped
        if (fileContext.activeFilePath && !skipAutoActiveContext) {
            const fileName = fileContext.activeFileName || 'current file';
            context.push({
                type: 'file',
                name: fileName,
                value: fileContext.activeFilePath,
                startLine: fileContext.activeSelection?.startLine,
                endLine: fileContext.activeSelection?.endLine,
            });
        }
        let fileContextForMessage;
        if (fileContext.activeFilePath &&
            fileContext.activeFileName &&
            !skipAutoActiveContext) {
            fileContextForMessage = {
                fileName: fileContext.activeFileName,
                filePath: fileContext.activeFilePath,
                startLine: fileContext.activeSelection?.startLine,
                endLine: fileContext.activeSelection?.endLine,
            };
        }
        vscode.postMessage({
            type: 'sendMessage',
            data: {
                text: inputText,
                context: context.length > 0 ? context : undefined,
                fileContext: fileContextForMessage,
            },
        });
        setInputText('');
        if (inputFieldRef.current) {
            // Use a zero-width space to maintain the height of the contentEditable element
            inputFieldRef.current.textContent = '\u200B';
            // Set the data-empty attribute to show the placeholder
            inputFieldRef.current.setAttribute('data-empty', 'true');
        }
        fileContext.clearFileReferences();
    }, [
        inputText,
        isStreaming,
        setInputText,
        inputFieldRef,
        vscode,
        fileContext,
        skipAutoActiveContext,
        isWaitingForResponse,
        messageHandling,
    ]);
    return { handleSubmit };
};
//# sourceMappingURL=useMessageSubmit.js.map