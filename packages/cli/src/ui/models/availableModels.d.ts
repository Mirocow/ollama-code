/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, type Config } from '@ollama-code/ollama-code-core';
export type AvailableModel = {
    id: string;
    label: string;
    description?: string;
    isVision?: boolean;
};
export declare const MAINLINE_VLM = "llava";
export declare const MAINLINE_CODER = "qwen2.5-coder";
export declare const AVAILABLE_MODELS_OLLAMA: AvailableModel[];
/**
 * Get available Ollama models filtered by vision model preview setting
 */
export declare function getFilteredOllamaModels(visionModelPreviewEnabled: boolean): AvailableModel[];
/**
 * Get available Ollama model from environment variable
 */
export declare function getOllamaAvailableModelFromEnv(): AvailableModel | null;
/**
 * Get available models for the given authType.
 *
 * For Ollama, returns models from config or default list.
 */
export declare function getAvailableModelsForAuthType(authType: AuthType, config?: Config): AvailableModel[];
/**
 * Default vision model for Ollama
 */
export declare function getDefaultVisionModel(): string;
export declare function isVisionModel(modelId: string): boolean;
