/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContentGenerator, ContentGeneratorConfig } from '../contentGenerator.js';
import type { Config } from '../../config/config.js';
import { type OpenAICompatibleProvider } from './provider/index.js';
export { OpenAIContentGenerator } from './openaiContentGenerator.js';
export { ContentGenerationPipeline, type PipelineConfig } from './pipeline.js';
export { type OpenAICompatibleProvider, OllamaOpenAICompatibleProvider, } from './provider/index.js';
export { OpenAIContentConverter } from './converter.js';
/**
 * Create an OpenAI-compatible content generator with Ollama provider
 */
export declare function createOpenAIContentGenerator(contentGeneratorConfig: ContentGeneratorConfig, cliConfig: Config): ContentGenerator;
/**
 * Determine the appropriate provider based on configuration
 * Only Ollama is supported in this version
 */
export declare function determineProvider(contentGeneratorConfig: ContentGeneratorConfig, cliConfig: Config): OpenAICompatibleProvider;
export { type ErrorHandler, EnhancedErrorHandler } from './errorHandler.js';
