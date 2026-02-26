/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * InputForm adapter for VSCode - wraps webui InputForm with local type handling
 * This allows local ApprovalModeValue to work with webui's EditModeInfo
 */
import type { FC } from 'react';
import type { InputFormProps as BaseInputFormProps } from '@ollama-code/webui';
import type { ApprovalModeValue } from '../../../types/approvalModeValueTypes.js';
import type { ModelInfo } from '../../../types/acpTypes.js';
/**
 * Extended props that accept ApprovalModeValue and ModelSelector
 */
export interface InputFormProps extends Omit<BaseInputFormProps, 'editModeInfo'> {
    /** Edit mode value (local type) */
    editMode: ApprovalModeValue;
    /** Whether to show model selector */
    showModelSelector?: boolean;
    /** Available models for selection */
    availableModels?: ModelInfo[];
    /** Current model ID */
    currentModelId?: string | null;
    /** Callback when a model is selected */
    onSelectModel?: (modelId: string) => void;
    /** Callback to close model selector */
    onCloseModelSelector?: () => void;
}
/**
 * InputForm with ApprovalModeValue and ModelSelector support
 *
 * This is an adapter that accepts the local ApprovalModeValue type
 * and converts it to webui's EditModeInfo format.
 * It also renders the ModelSelector component when needed.
 */
export declare const InputForm: FC<InputFormProps>;
