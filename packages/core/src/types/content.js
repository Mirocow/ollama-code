/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Reason for finishing generation.
 */
export var FinishReason;
(function (FinishReason) {
    FinishReason["STOP"] = "STOP";
    FinishReason["MAX_TOKENS"] = "MAX_TOKENS";
    FinishReason["SAFETY"] = "SAFETY";
    FinishReason["RECITATION"] = "RECITATION";
    FinishReason["TOOL_CALLS"] = "TOOL_CALLS";
    FinishReason["ERROR"] = "ERROR";
    FinishReason["OTHER"] = "OTHER";
})(FinishReason || (FinishReason = {}));
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Check if a part is a text part.
 */
export function isTextPart(part) {
    return 'text' in part;
}
/**
 * Check if a part is a function call part.
 */
export function isFunctionCallPart(part) {
    return 'functionCall' in part;
}
/**
 * Check if a part is a function response part.
 */
export function isFunctionResponsePart(part) {
    return 'functionResponse' in part;
}
/**
 * Check if a part is an inline data part (image/file).
 */
export function isInlineDataPart(part) {
    return 'inlineData' in part;
}
/**
 * Create a text content.
 */
export function textContent(role, text) {
    return { role, parts: [{ text }] };
}
/**
 * Create a user content.
 */
export function userContent(text, ...additionalParts) {
    return {
        role: 'user',
        parts: [{ text }, ...additionalParts],
    };
}
/**
 * Create a model content.
 */
export function modelContent(text, ...functionCalls) {
    const parts = [{ text }];
    for (const fc of functionCalls) {
        parts.push({ functionCall: fc });
    }
    return { role: 'model', parts };
}
/**
 * Create a system content.
 */
export function systemContent(text) {
    return { role: 'system', parts: [{ text }] };
}
/**
 * Create a tool response content.
 */
export function toolContent(name, response, id) {
    return {
        role: 'tool',
        parts: [{ functionResponse: { name, response, id } }],
    };
}
/**
 * Normalize a part list union to an array of parts.
 */
export function normalizeParts(parts) {
    if (typeof parts === 'string') {
        return [{ text: parts }];
    }
    if (Array.isArray(parts)) {
        return parts.flatMap((p) => {
            if (typeof p === 'string') {
                return [{ text: p }];
            }
            return [p];
        });
    }
    return [parts];
}
//# sourceMappingURL=content.js.map