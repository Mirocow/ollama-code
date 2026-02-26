/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VSCodeAPI } from './useVSCode.js';
interface UseMessageSubmitProps {
    vscode: VSCodeAPI;
    inputText: string;
    setInputText: (text: string) => void;
    inputFieldRef: React.RefObject<HTMLDivElement>;
    isStreaming: boolean;
    isWaitingForResponse: boolean;
    skipAutoActiveContext?: boolean;
    fileContext: {
        getFileReference: (fileName: string) => string | undefined;
        activeFilePath: string | null;
        activeFileName: string | null;
        activeSelection: {
            startLine: number;
            endLine: number;
        } | null;
        clearFileReferences: () => void;
    };
    messageHandling: {
        setWaitingForResponse: (message: string) => void;
    };
}
/**
 * Message submit Hook
 * Handles message submission logic and context parsing
 */
export declare const useMessageSubmit: ({ vscode, inputText, setInputText, inputFieldRef, isStreaming, isWaitingForResponse, skipAutoActiveContext, fileContext, messageHandling, }: UseMessageSubmitProps) => {
    handleSubmit: (e: React.FormEvent) => void;
};
export {};
