/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseMessageHandler } from './BaseMessageHandler.js';
/**
 * Auth message handler
 * Handles all authentication-related messages
 */
export declare class AuthMessageHandler extends BaseMessageHandler {
    private loginHandler;
    canHandle(messageType: string): boolean;
    handle(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Set login handler
     */
    setLoginHandler(handler: () => Promise<void>): void;
    /**
     * Handle login request
     */
    private handleLogin;
}
