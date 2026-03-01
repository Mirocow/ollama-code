/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Zustand Stores - Centralized State Management
 * 
 * This module provides Zustand-based state management to replace
 * the Context API pattern, eliminating unnecessary re-renders and
 * improving performance.
 * 
 * Benefits over Context API:
 * - Selective subscriptions (components only re-render when their specific data changes)
 * - No provider nesting required
 * - Built-in devtools support
 * - Easier testing
 * - Better TypeScript support
 */

export { useSessionStore, sessionStore, initializeSessionTelemetry, type SessionStoreState } from './sessionStore.js';
export { useStreamingStore, streamingStore, StreamingState, type StreamingStoreState } from './streamingStore.js';
export { useUIStore, uiStore, type UIStoreState } from './uiStore.js';
export { useEventBus, eventBus, type EventSubscription, type EventBusEvents } from './eventBus.js';
export { useCommandStore, commandStore, CommandFactory, type Command } from './commandStore.js';
