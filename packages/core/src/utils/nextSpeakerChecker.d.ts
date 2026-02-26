/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { OllamaChat } from '../core/ollamaChat.js';
import type { Config } from '../config/config.js';
export interface NextSpeakerResponse {
    reasoning: string;
    next_speaker: 'user' | 'model';
}
export declare function checkNextSpeaker(chat: OllamaChat, config: Config, abortSignal: AbortSignal, promptId: string): Promise<NextSpeakerResponse | null>;
