/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface OllamaConfigInputProps {
    onSubmit: (config: {
        baseUrl?: string;
        apiKey?: string;
        model?: string;
    }) => Promise<void>;
    onCancel: () => void;
    defaultBaseUrl?: string;
    defaultModel?: string;
}
export declare function OllamaConfigInput({ onSubmit, onCancel, defaultBaseUrl, defaultModel, }: OllamaConfigInputProps): React.JSX.Element;
export {};
