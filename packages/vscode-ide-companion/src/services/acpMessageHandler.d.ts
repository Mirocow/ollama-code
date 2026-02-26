/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * ACP Message Handler
 *
 * Responsible for receiving, parsing, and distributing messages in the ACP protocol
 */
import type { AcpMessage, AcpRequest, AcpNotification, AcpResponse } from '../types/acpTypes.js';
import type { PendingRequest, AcpConnectionCallbacks } from '../types/connectionTypes.js';
import type { ChildProcess } from 'child_process';
/**
 * ACP Message Handler Class
 * Responsible for receiving, parsing, and processing messages
 */
export declare class AcpMessageHandler {
    private fileHandler;
    constructor();
    /**
     * Send response message to child process
     *
     * @param child - Child process instance
     * @param response - Response message
     */
    sendResponseMessage(child: ChildProcess | null, response: AcpResponse): void;
    /**
     * Handle received messages
     *
     * @param message - ACP message
     * @param pendingRequests - Pending requests map
     * @param callbacks - Callback functions collection
     */
    handleMessage(message: AcpMessage, pendingRequests: Map<number, PendingRequest<unknown>>, callbacks: AcpConnectionCallbacks): void;
    /**
     * Handle response message
     *
     * @param message - Response message
     * @param pendingRequests - Pending requests map
     * @param callbacks - Callback functions collection
     */
    private handleResponse;
    /**
     * Handle incoming requests
     *
     * @param message - Request or notification message
     * @param callbacks - Callback functions collection
     * @returns Request processing result
     */
    handleIncomingRequest(message: AcpRequest | AcpNotification, callbacks: AcpConnectionCallbacks): Promise<unknown>;
    /**
     * Handle permission requests
     *
     * @param params - Permission request parameters
     * @param callbacks - Callback functions collection
     * @returns Permission request result
     */
    private handlePermissionRequest;
}
