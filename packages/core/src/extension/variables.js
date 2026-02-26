/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { VARIABLE_SCHEMA } from './variableSchema.js';
import path from 'node:path';
import { OLLAMA_DIR } from '../config/storage.js';
export const EXTENSIONS_DIRECTORY_NAME = path.join(OLLAMA_DIR, 'extensions');
export const EXTENSIONS_CONFIG_FILENAME = 'ollama-extension.json';
export const INSTALL_METADATA_FILENAME = '.ollama-code-extension-install.json';
export const EXTENSION_SETTINGS_FILENAME = '.env';
export function validateVariables(variables, schema) {
    for (const key in schema) {
        const definition = schema[key];
        if (definition.required && !variables[key]) {
            throw new Error(`Missing required variable: ${key}`);
        }
    }
}
export function hydrateString(str, context) {
    validateVariables(context, VARIABLE_SCHEMA);
    const regex = /\${(.*?)}/g;
    return str.replace(regex, (match, key) => context[key] == null
        ? match
        : context[key]);
}
export function recursivelyHydrateStrings(obj, values) {
    if (typeof obj === 'string') {
        return hydrateString(obj, values);
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => recursivelyHydrateStrings(item, values));
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = recursivelyHydrateStrings(obj[key], values);
            }
        }
        return newObj;
    }
    return obj;
}
//# sourceMappingURL=variables.js.map