/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldSimulate429,
  resetRequestCounter,
  disableSimulationAfterFallback,
  createSimulated429Error,
  resetSimulationState,
  setSimulate429,
} from './testUtils.js';

describe('testUtils', () => {
  beforeEach(() => {
    resetSimulationState();
    setSimulate429(false);
  });

  describe('shouldSimulate429', () => {
    it('should return false when simulation is disabled', () => {
      setSimulate429(false);
      expect(shouldSimulate429()).toBe(false);
    });

    it('should return true when simulation is enabled', () => {
      setSimulate429(true);
      expect(shouldSimulate429()).toBe(true);
    });

    it('should return false after fallback occurred', () => {
      setSimulate429(true);
      disableSimulationAfterFallback();
      expect(shouldSimulate429()).toBe(false);
    });

    it('should filter by auth type when specified', () => {
      setSimulate429(true, 0, 'api-key');
      expect(shouldSimulate429('api-key')).toBe(true);
      expect(shouldSimulate429('oauth')).toBe(false);
    });

    it('should only simulate after specified request count', () => {
      setSimulate429(true, 3);

      expect(shouldSimulate429()).toBe(false); // request 1
      expect(shouldSimulate429()).toBe(false); // request 2
      expect(shouldSimulate429()).toBe(false); // request 3
      expect(shouldSimulate429()).toBe(true); // request 4
    });

    it('should increment request counter on each call', () => {
      setSimulate429(true);
      resetRequestCounter();

      shouldSimulate429();
      shouldSimulate429();
      shouldSimulate429();

      // After 3 calls, counter should be 3
      // Setting afterRequests to 2 should now trigger simulation
      setSimulate429(true, 2);
      resetRequestCounter();

      shouldSimulate429(); // counter = 1
      shouldSimulate429(); // counter = 2
      expect(shouldSimulate429()).toBe(true); // counter = 3 > 2
    });
  });

  describe('resetRequestCounter', () => {
    it('should reset request counter to 0', () => {
      setSimulate429(true);
      shouldSimulate429();
      shouldSimulate429();

      resetRequestCounter();

      // After reset, counter starts from 0 again
      setSimulate429(true, 1);
      expect(shouldSimulate429()).toBe(false); // counter = 1, not > 1
      expect(shouldSimulate429()).toBe(true); // counter = 2 > 1
    });
  });

  describe('disableSimulationAfterFallback', () => {
    it('should disable simulation after being called', () => {
      setSimulate429(true);
      expect(shouldSimulate429()).toBe(true);

      disableSimulationAfterFallback();

      expect(shouldSimulate429()).toBe(false);
    });
  });

  describe('createSimulated429Error', () => {
    it('should create error with status 429', () => {
      const error = createSimulated429Error();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Rate limit exceeded (simulated)');
      expect((error as Error & { status: number }).status).toBe(429);
    });
  });

  describe('resetSimulationState', () => {
    it('should reset fallback and request counter', () => {
      setSimulate429(true);
      disableSimulationAfterFallback();
      shouldSimulate429();

      resetSimulationState();
      setSimulate429(true);

      // Should be able to simulate again
      expect(shouldSimulate429()).toBe(true);
    });
  });

  describe('setSimulate429', () => {
    it('should enable simulation', () => {
      setSimulate429(true);
      expect(shouldSimulate429()).toBe(true);
    });

    it('should disable simulation', () => {
      setSimulate429(true);
      setSimulate429(false);
      expect(shouldSimulate429()).toBe(false);
    });

    it('should set afterRequests value', () => {
      setSimulate429(true, 5);
      // First 5 requests should not simulate
      for (let i = 0; i < 5; i++) {
        expect(shouldSimulate429()).toBe(false);
      }
      expect(shouldSimulate429()).toBe(true);
    });

    it('should set authType filter', () => {
      setSimulate429(true, 0, 'custom-auth');
      expect(shouldSimulate429('custom-auth')).toBe(true);
      expect(shouldSimulate429('other-auth')).toBe(false);
    });

    it('should reset fallback state when enabled', () => {
      setSimulate429(true);
      disableSimulationAfterFallback();
      expect(shouldSimulate429()).toBe(false);

      setSimulate429(true);
      expect(shouldSimulate429()).toBe(true);
    });

    it('should reset request counter', () => {
      setSimulate429(true);
      shouldSimulate429();
      shouldSimulate429();

      setSimulate429(true, 1);
      // Counter should be reset, so first request should not simulate
      expect(shouldSimulate429()).toBe(false);
      expect(shouldSimulate429()).toBe(true);
    });
  });
});
