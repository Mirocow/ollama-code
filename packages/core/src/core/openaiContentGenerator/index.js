/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { OpenAIContentGenerator } from './openaiContentGenerator.js';
import { OllamaOpenAICompatibleProvider, } from './provider/index.js';
export { OpenAIContentGenerator } from './openaiContentGenerator.js';
export { ContentGenerationPipeline } from './pipeline.js';
export { OllamaOpenAICompatibleProvider, } from './provider/index.js';
export { OpenAIContentConverter } from './converter.js';
/**
 * Create an OpenAI-compatible content generator with Ollama provider
 */
export function createOpenAIContentGenerator(contentGeneratorConfig, cliConfig) {
    const provider = determineProvider(contentGeneratorConfig, cliConfig);
    return new OpenAIContentGenerator(contentGeneratorConfig, cliConfig, provider);
}
/**
 * Determine the appropriate provider based on configuration
 * Only Ollama is supported in this version
 */
export function determineProvider(contentGeneratorConfig, cliConfig) {
    // Always use Ollama provider
    return new OllamaOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
}
export { EnhancedErrorHandler } from './errorHandler.js';
//# sourceMappingURL=index.js.map