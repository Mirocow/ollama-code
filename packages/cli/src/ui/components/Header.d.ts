/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { AuthType } from '@ollama-code/ollama-code-core';
interface HeaderProps {
    customAsciiArt?: string;
    version: string;
    authType?: AuthType;
    model: string;
    workingDirectory: string;
}
export declare const Header: React.FC<HeaderProps>;
export {};
