/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@ollama-code/ollama-code-core';
import type { LoadedSettings } from '../config/settings.js';
import type { CliArgs } from '../config/config.js';
export declare function runAcpAgent(config: Config, settings: LoadedSettings, argv: CliArgs): Promise<void>;
