/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  CancellationToken,
  CancellationTokenSource,
  CancellationError,
  OperationCanceledError,
  TimeoutError,
  toAbortSignal,
  fromAbortSignal,
  raceCancellationTokens,
  waitForCancellation,
} from './cancellation.js';

describe('CancellationError', () => {
  it('should create a CancellationError with correct properties', () => {
    const token = new CancellationToken();
    const error = new CancellationError('Test error', 'user', token);

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('CancellationError');
    expect(error.reason).toBe('user');
    expect(error.token).toBe(token);
  });
});

describe('OperationCanceledError', () => {
  it('should create with default message', () => {
    const error = new OperationCanceledError();
    expect(error.message).toBe('Operation was cancelled');
    expect(error.name).toBe('OperationCanceledError');
    expect(error.reason).toBe('user');
  });

  it('should create with custom message', () => {
    const token = new CancellationToken();
    const error = new OperationCanceledError('Custom cancel message', token);
    expect(error.message).toBe('Custom cancel message');
    expect(error.token).toBe(token);
  });
});

describe('TimeoutError', () => {
  it('should create with timeout value', () => {
    const error = new TimeoutError(5000);
    expect(error.message).toBe('Operation timed out after 5000ms');
    expect(error.name).toBe('TimeoutError');
    expect(error.timeoutMs).toBe(5000);
    expect(error.reason).toBe('timeout');
  });

  it('should create with custom message', () => {
    const token = new CancellationToken();
    const error = new TimeoutError(5000, 'Custom timeout message', token);
    expect(error.message).toBe('Custom timeout message');
    expect(error.token).toBe(token);
  });
});

describe('CancellationToken', () => {
  describe('constructor', () => {
    it('should create a token with default config', () => {
      const token = new CancellationToken();
      expect(token.isCancellationRequested).toBe(false);
      expect(token.canBeCancelled).toBe(true);
      expect(token.reason).toBe('unknown');
      expect(token.message).toBe('');
    });

    it('should create a disabled token', () => {
      const token = new CancellationToken({ enabled: false });
      expect(token.canBeCancelled).toBe(false);
    });
  });

  describe('isCancellationRequested', () => {
    it('should return false initially', () => {
      const token = new CancellationToken();
      expect(token.isCancellationRequested).toBe(false);
    });
  });

  describe('throwIfCancellationRequested', () => {
    it('should not throw when not cancelled', () => {
      const token = new CancellationToken();
      expect(() => token.throwIfCancellationRequested()).not.toThrow();
    });

    it('should throw OperationCanceledError when cancelled', () => {
      const token = new CancellationToken();
      token._cancel('user', 'Test cancellation');
      expect(() => token.throwIfCancellationRequested()).toThrow(OperationCanceledError);
    });

    it('should throw TimeoutError when reason is timeout', () => {
      const token = new CancellationToken({ timeout: 1000 });
      token._cancel('timeout', 'Timeout occurred');
      expect(() => token.throwIfCancellationRequested()).toThrow(TimeoutError);
    });

    it('should not throw when throwOnCancellation is false', () => {
      const token = new CancellationToken({ throwOnCancellation: false });
      token._cancel('user', 'Test cancellation');
      expect(() => token.throwIfCancellationRequested()).not.toThrow();
    });
  });

  describe('register', () => {
    it('should register a callback', () => {
      const token = new CancellationToken();
      const callback = vi.fn();
      token.register(callback);
      token._cancel('user', 'Test');
      expect(callback).toHaveBeenCalledWith('Test');
    });

    it('should call callback immediately if already cancelled', () => {
      const token = new CancellationToken();
      token._cancel('user', 'Already cancelled');
      const callback = vi.fn();
      token.register(callback);
      expect(callback).toHaveBeenCalledWith('Already cancelled');
    });

    it('should return unregister function', () => {
      const token = new CancellationToken();
      const callback = vi.fn();
      const registration = token.register(callback);
      registration.unregister();
      token._cancel('user', 'Test');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('toAbortSignal', () => {
    it('should create an AbortSignal from token', () => {
      const token = new CancellationToken();
      const signal = token.toAbortSignal();
      expect(signal.aborted).toBe(false);
    });

    it('should return aborted signal if already cancelled', () => {
      const token = new CancellationToken();
      token._cancel('user', 'Test');
      const signal = token.toAbortSignal();
      expect(signal.aborted).toBe(true);
    });

    it('should abort when token is cancelled', () => {
      const token = new CancellationToken();
      const signal = token.toAbortSignal();
      token._cancel('user', 'Test');
      expect(signal.aborted).toBe(true);
    });
  });

  describe('link', () => {
    it('should create linked token', () => {
      const token1 = new CancellationToken();
      const token2 = new CancellationToken();
      const linked = CancellationToken.link(token1, token2);
      expect(linked.isCancellationRequested).toBe(false);
    });

    it('should cancel when any source cancels', () => {
      const token1 = new CancellationToken();
      const token2 = new CancellationToken();
      const linked = CancellationToken.link(token1, token2);
      token1._cancel('user', 'Token1 cancelled');
      expect(linked.isCancellationRequested).toBe(true);
      expect(linked.reason).toBe('linked');
    });

    it('should be cancelled immediately if source is already cancelled', () => {
      const token1 = new CancellationToken();
      token1._cancel('user', 'Already cancelled');
      const token2 = new CancellationToken();
      const linked = CancellationToken.link(token1, token2);
      expect(linked.isCancellationRequested).toBe(true);
    });
  });

  describe('timeout', () => {
    it('should create a token that times out', async () => {
      vi.useFakeTimers();
      const onTimeout = vi.fn();
      const token = CancellationToken.timeout(1000, { onTimeout });
      
      expect(token.isCancellationRequested).toBe(false);
      
      vi.advanceTimersByTime(1000);
      
      expect(token.isCancellationRequested).toBe(true);
      expect(token.reason).toBe('timeout');
      expect(onTimeout).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('none', () => {
    it('should be a token that cannot be cancelled', () => {
      expect(CancellationToken.none.canBeCancelled).toBe(false);
      CancellationToken.none._cancel('user', 'Test');
      expect(CancellationToken.none.isCancellationRequested).toBe(false);
    });
  });

  describe('_cancel', () => {
    it('should not cancel if already cancelled', () => {
      const token = new CancellationToken();
      token._cancel('user', 'First');
      token._cancel('timeout', 'Second');
      expect(token.reason).toBe('user');
    });

    it('should not cancel if disabled', () => {
      const token = new CancellationToken({ enabled: false });
      token._cancel('user', 'Test');
      expect(token.isCancellationRequested).toBe(false);
    });

    it('should clear timeout on cancel', () => {
      vi.useFakeTimers();
      const token = CancellationToken.timeout(10000);
      token._cancel('user', 'Manual cancel');
      
      vi.advanceTimersByTime(10000);
      
      expect(token.reason).toBe('user');
      vi.useRealTimers();
    });
  });

  describe('_reset', () => {
    it('should reset the token', () => {
      const token = new CancellationToken();
      token._cancel('user', 'Test');
      token._reset();
      expect(token.isCancellationRequested).toBe(false);
      expect(token.reason).toBe('unknown');
      expect(token.message).toBe('');
    });
  });
});

describe('CancellationTokenSource', () => {
  describe('constructor', () => {
    it('should create a source with default config', () => {
      const source = new CancellationTokenSource();
      expect(source.token).toBeInstanceOf(CancellationToken);
      expect(source.isCancellationRequested).toBe(false);
    });

    it('should create a source with timeout', async () => {
      vi.useFakeTimers();
      const source = new CancellationTokenSource({ timeout: 100 });
      
      expect(source.isCancellationRequested).toBe(false);
      
      vi.advanceTimersByTime(100);
      
      expect(source.isCancellationRequested).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('cancel', () => {
    it('should cancel the token', () => {
      const source = new CancellationTokenSource();
      source.cancel('Test reason');
      expect(source.isCancellationRequested).toBe(true);
      expect(source.token.message).toBe('Test reason');
    });

    it('should cancel with specific reason', () => {
      const source = new CancellationTokenSource();
      source.cancel('Test reason', 'timeout');
      expect(source.token.reason).toBe('timeout');
    });

    it('should not cancel after dispose', () => {
      const source = new CancellationTokenSource();
      source.dispose();
      source.cancel('Test');
      expect(source.isCancellationRequested).toBe(false);
    });
  });

  describe('cancelAfter', () => {
    it('should cancel after delay', async () => {
      vi.useFakeTimers();
      const source = new CancellationTokenSource();
      source.cancelAfter(100);
      
      expect(source.isCancellationRequested).toBe(false);
      
      vi.advanceTimersByTime(100);
      
      expect(source.isCancellationRequested).toBe(true);
      vi.useRealTimers();
    });

    it('should not cancel if already disposed', () => {
      vi.useFakeTimers();
      const source = new CancellationTokenSource();
      source.dispose();
      source.cancelAfter(100);
      
      vi.advanceTimersByTime(100);
      
      expect(source.isCancellationRequested).toBe(false);
      vi.useRealTimers();
    });

    it('should not cancel if already cancelled', () => {
      vi.useFakeTimers();
      const source = new CancellationTokenSource();
      source.cancel('Already');
      source.cancelAfter(100);
      
      vi.advanceTimersByTime(100);
      
      expect(source.token.message).toBe('Already');
      vi.useRealTimers();
    });
  });

  describe('dispose', () => {
    it('should reset the token', () => {
      const source = new CancellationTokenSource();
      source.cancel('Test');
      source.dispose();
      expect(source.isCancellationRequested).toBe(false);
    });

    it('should be idempotent', () => {
      const source = new CancellationTokenSource();
      source.dispose();
      source.dispose();
      expect(source.isCancellationRequested).toBe(false);
    });
  });

  describe('timeout', () => {
    it('should create a source with timeout', () => {
      const source = CancellationTokenSource.timeout(5000);
      expect(source.token).toBeInstanceOf(CancellationToken);
    });
  });

  describe('link', () => {
    it('should create linked source', () => {
      const source1 = new CancellationTokenSource();
      const source2 = new CancellationTokenSource();
      const linked = CancellationTokenSource.link(source1, source2);
      
      expect(linked.isCancellationRequested).toBe(false);
    });

    it('should cancel when any source cancels', () => {
      const source1 = new CancellationTokenSource();
      const source2 = new CancellationTokenSource();
      const linked = CancellationTokenSource.link(source1, source2);
      
      source1.cancel('Source 1 cancelled');
      
      expect(linked.isCancellationRequested).toBe(true);
    });

    it('should be cancelled immediately if source is already cancelled', () => {
      const source1 = new CancellationTokenSource();
      source1.cancel('Already');
      const source2 = new CancellationTokenSource();
      const linked = CancellationTokenSource.link(source1, source2);
      
      expect(linked.isCancellationRequested).toBe(true);
    });
  });
});

describe('Utility functions', () => {
  describe('toAbortSignal', () => {
    it('should convert token to AbortSignal', () => {
      const token = new CancellationToken();
      const signal = toAbortSignal(token);
      expect(signal.aborted).toBe(false);
    });
  });

  describe('fromAbortSignal', () => {
    it('should create token from AbortSignal', () => {
      const controller = new AbortController();
      const token = fromAbortSignal(controller.signal);
      expect(token.isCancellationRequested).toBe(false);
    });

    it('should create cancelled token from aborted signal', () => {
      const controller = new AbortController();
      controller.abort('Test abort');
      const token = fromAbortSignal(controller.signal);
      expect(token.isCancellationRequested).toBe(true);
    });

    it('should cancel when signal aborts', () => {
      const controller = new AbortController();
      const token = fromAbortSignal(controller.signal);
      controller.abort('Test abort');
      expect(token.isCancellationRequested).toBe(true);
    });
  });

  describe('raceCancellationTokens', () => {
    it('should return linked token', () => {
      const token1 = new CancellationToken();
      const token2 = new CancellationToken();
      const raced = raceCancellationTokens(token1, token2);
      expect(raced.isCancellationRequested).toBe(false);
    });
  });

  describe('waitForCancellation', () => {
    it('should resolve immediately if already cancelled', async () => {
      const token = new CancellationToken();
      token._cancel('user', 'Test');
      await expect(waitForCancellation(token)).resolves.toBeUndefined();
    });

    it('should resolve when cancelled', async () => {
      vi.useFakeTimers();
      const token = new CancellationToken();
      const promise = waitForCancellation(token);
      
      setTimeout(() => token._cancel('user', 'Test'), 100);
      
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      vi.useRealTimers();
    });

    it('should reject on timeout', async () => {
      vi.useFakeTimers();
      const token = new CancellationToken();
      const promise = waitForCancellation(token, 100);
      
      vi.advanceTimersByTime(100);
      
      await expect(promise).rejects.toThrow(TimeoutError);
      vi.useRealTimers();
    });
  });
});
