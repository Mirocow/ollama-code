/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

/**
 * Event types supported by the event bus
 */
export interface EventBusEvents {
  // Streaming events
  'stream:started': { promptId: string; model: string };
  'stream:chunk': { promptId: string; content: string };
  'stream:finished': { promptId: string; tokenCount: number };
  'stream:error': { promptId: string; error: Error };
  'stream:cancelled': { promptId: string };
  
  // Tool events
  'tool:started': { toolName: string; callId: string; args: Record<string, unknown> };
  'tool:progress': { toolName: string; callId: string; progress: number };
  'tool:completed': { toolName: string; callId: string; result: unknown };
  'tool:error': { toolName: string; callId: string; error: Error };
  'tool:confirmation:requested': { toolName: string; callId: string; details: unknown };
  'tool:confirmation:responded': { toolName: string; callId: string; approved: boolean };
  
  // Session events
  'session:started': { sessionId: string };
  'session:ended': { sessionId: string; reason: 'user' | 'timeout' | 'error' };
  'session:cleared': { sessionId: string };
  
  // Model events
  'model:changed': { previousModel: string; newModel: string };
  'model:loaded': { model: string };
  
  // Token events
  'tokens:updated': { promptTokens: number; generatedTokens: number };
  'tokens:limit:warning': { currentTokens: number; limit: number; percentage: number };
  
  // UI events
  'ui:notification': { type: 'info' | 'warning' | 'error' | 'success'; message: string };
  'ui:dialog:opened': { dialogId: string };
  'ui:dialog:closed': { dialogId: string };
  
  // Command events (for Command Pattern)
  'command:executed': { commandId: string; commandType: string; result: unknown };
  'command:undone': { commandId: string; commandType: string };
  'command:redone': { commandId: string; commandType: string };
  
  // Plugin events
  'plugin:loaded': { pluginId: string; pluginName: string };
  'plugin:unloaded': { pluginId: string };
  'plugin:error': { pluginId: string; error: Error };
}

/**
 * Event subscription interface
 */
export interface EventSubscription {
  id: string;
  event: keyof EventBusEvents;
  callback: (data: unknown) => void;
  once: boolean;
}

/**
 * Event Bus state
 */
interface EventBusState {
  subscriptions: Map<string, EventSubscription[]>;
  eventHistory: Array<{ event: keyof EventBusEvents; data: unknown; timestamp: number }>;
  maxHistorySize: number;
  
  // Actions
  subscribe: <K extends keyof EventBusEvents>(
    event: K,
    callback: (data: EventBusEvents[K]) => void,
    options?: { once?: boolean }
  ) => () => void;
  emit: <K extends keyof EventBusEvents>(event: K, data: EventBusEvents[K]) => void;
  unsubscribe: (subscriptionId: string) => void;
  clearHistory: () => void;
  getHistory: <K extends keyof EventBusEvents>(
    event?: K
  ) => typeof event extends K
    ? Array<{ data: EventBusEvents[K]; timestamp: number }>
    : Array<{ event: keyof EventBusEvents; data: unknown; timestamp: number }>;
}

/**
 * Generate unique subscription ID
 */
let subscriptionIdCounter = 0;
function generateSubscriptionId(): string {
  return `sub-${Date.now()}-${++subscriptionIdCounter}`;
}

/**
 * Event Bus Store - Provides a publish/subscribe mechanism for loose coupling
 * 
 * This event bus allows components to communicate without direct dependencies,
 * implementing a publish-subscribe pattern for better modularity.
 * 
 * @example
 * // Subscribe to an event
 * const unsubscribe = eventBus.subscribe('stream:finished', (data) => {
 *   console.log('Stream finished with tokens:', data.tokenCount);
 * });
 * 
 * // Emit an event
 * eventBus.emit('stream:finished', { promptId: '123', tokenCount: 1500 });
 * 
 * // Unsubscribe when done
 * unsubscribe();
 * 
 * @example
 * // One-time subscription
 * eventBus.subscribe('model:changed', (data) => {
 *   console.log('Model changed to:', data.newModel);
 * }, { once: true });
 */
export const eventBus = create<EventBusState>()((set, get) => ({
  subscriptions: new Map(),
  eventHistory: [],
  maxHistorySize: 100,

  subscribe: (event, callback, options = {}) => {
    const subscriptionId = generateSubscriptionId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      event,
      callback: callback as (data: unknown) => void,
      once: options.once ?? false,
    };

    set(state => {
      const newSubscriptions = new Map(state.subscriptions);
      const existing = newSubscriptions.get(event) ?? [];
      newSubscriptions.set(event, [...existing, subscription]);
      return { subscriptions: newSubscriptions };
    });

    // Return unsubscribe function
    return () => {
      get().unsubscribe(subscriptionId);
    };
  },

  emit: (event, data) => {
    const { subscriptions, maxHistorySize } = get();
    
    // Add to history
    set(state => ({
      eventHistory: [
        ...state.eventHistory.slice(-(maxHistorySize - 1)),
        { event, data, timestamp: Date.now() }
      ],
    }));

    // Get subscriptions for this event
    const eventSubscriptions = subscriptions.get(event) ?? [];
    
    // Execute callbacks
    const toRemove: string[] = [];
    
    for (const subscription of eventSubscriptions) {
      try {
        subscription.callback(data);
        if (subscription.once) {
          toRemove.push(subscription.id);
        }
      } catch (error) {
        console.error(`Error in event subscriber for "${event}":`, error);
      }
    }

    // Remove one-time subscriptions
    if (toRemove.length > 0) {
      set(state => {
        const newSubscriptions = new Map(state.subscriptions);
        const existing = newSubscriptions.get(event) ?? [];
        newSubscriptions.set(
          event,
          existing.filter(s => !toRemove.includes(s.id))
        );
        return { subscriptions: newSubscriptions };
      });
    }
  },

  unsubscribe: (subscriptionId: string) => {
    set(state => {
      const newSubscriptions = new Map(state.subscriptions);
      
      for (const [event, subs] of newSubscriptions) {
        const filtered = subs.filter(s => s.id !== subscriptionId);
        if (filtered.length !== subs.length) {
          newSubscriptions.set(event, filtered);
        }
      }
      
      return { subscriptions: newSubscriptions };
    });
  },

  clearHistory: () => {
    set({ eventHistory: [] });
  },

  getHistory: (event) => {
    const { eventHistory } = get();
    
    if (event) {
      return eventHistory
        .filter(e => e.event === event)
        .map(e => ({ data: e.data, timestamp: e.timestamp })) as any;
    }
    
    return eventHistory as any;
  },
}));

/**
 * Hook for using the event bus
 * 
 * @example
 * // Subscribe to events in a component
 * useEffect(() => {
 *   const unsubscribe = useEventBus.subscribe('stream:finished', (data) => {
 *     console.log('Stream finished:', data);
 *   });
 *   return unsubscribe;
 * }, []);
 */
export const useEventBus = eventBus;
