/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
import type { ModelInfo } from '../../../types/acpTypes.js';
interface ModelSelectorProps {
    visible: boolean;
    models: ModelInfo[];
    currentModelId: string | null;
    onSelectModel: (modelId: string) => void;
    onClose: () => void;
}
export declare const ModelSelector: FC<ModelSelectorProps>;
export {};
