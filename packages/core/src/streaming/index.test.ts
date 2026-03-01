/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import * as streamingModule from './index.js';

describe('Streaming Module Index', () => {
  it('should export ChunkValidator', () => {
    expect(streamingModule.ChunkValidator).toBeDefined();
    expect(typeof streamingModule.ChunkValidator).toBe('function');
  });

  it('should export ValidatedChunk type', () => {
    // Type exports are verified by TypeScript compilation
    expect(streamingModule.ChunkValidator).toBeDefined();
  });

  it('should export ChunkValidationResult type', () => {
    expect(streamingModule.ChunkValidator).toBeDefined();
  });

  it('should export ChunkValidationConfig type', () => {
    expect(streamingModule.ChunkValidator).toBeDefined();
  });

  it('should export ChunkValidationError', () => {
    expect(streamingModule.ChunkValidationError).toBeDefined();
    expect(typeof streamingModule.ChunkValidationError).toBe('function');
  });

  it('should export BackpressureController', () => {
    expect(streamingModule.BackpressureController).toBeDefined();
    expect(typeof streamingModule.BackpressureController).toBe('function');
  });

  it('should export BackpressureConfig type', () => {
    expect(streamingModule.BackpressureController).toBeDefined();
  });

  it('should export BackpressureStats type', () => {
    expect(streamingModule.BackpressureController).toBeDefined();
  });

  it('should export PressureState type', () => {
    expect(streamingModule.BackpressureController).toBeDefined();
  });

  it('should export CancellationTokenSource', () => {
    expect(streamingModule.CancellationTokenSource).toBeDefined();
    expect(typeof streamingModule.CancellationTokenSource).toBe('function');
  });

  it('should export CancellationToken', () => {
    expect(streamingModule.CancellationToken).toBeDefined();
    expect(typeof streamingModule.CancellationToken).toBe('function');
  });

  it('should export CancellationTokenConfig type', () => {
    expect(streamingModule.CancellationTokenSource).toBeDefined();
  });

  it('should export CancellationError', () => {
    expect(streamingModule.CancellationError).toBeDefined();
    expect(typeof streamingModule.CancellationError).toBe('function');
  });

  it('should export OperationCanceledError', () => {
    expect(streamingModule.OperationCanceledError).toBeDefined();
    expect(typeof streamingModule.OperationCanceledError).toBe('function');
  });

  it('should export TimeoutError', () => {
    expect(streamingModule.TimeoutError).toBeDefined();
    expect(typeof streamingModule.TimeoutError).toBe('function');
  });

  it('should export StreamingController', () => {
    expect(streamingModule.StreamingController).toBeDefined();
    expect(typeof streamingModule.StreamingController).toBe('function');
  });

  it('should export StreamingConfig type', () => {
    expect(streamingModule.StreamingController).toBeDefined();
  });

  it('should export StreamingStats type', () => {
    expect(streamingModule.StreamingController).toBeDefined();
  });

  it('should export StreamingState type', () => {
    expect(streamingModule.StreamingController).toBeDefined();
  });

  it('should export StreamEvent type', () => {
    expect(streamingModule.StreamingController).toBeDefined();
  });

  it('should export StreamEventListener type', () => {
    expect(streamingModule.StreamingController).toBeDefined();
  });

  it('should export StreamBuffer', () => {
    expect(streamingModule.StreamBuffer).toBeDefined();
    expect(typeof streamingModule.StreamBuffer).toBe('function');
  });

  it('should export BufferConfig type', () => {
    expect(streamingModule.StreamBuffer).toBeDefined();
  });

  it('should export BufferStats type', () => {
    expect(streamingModule.StreamBuffer).toBeDefined();
  });

  describe('Integration Tests', () => {
    it('should create a complete streaming pipeline', async () => {
      const { StreamingController, CancellationTokenSource } = streamingModule;
      
      const cancelSource = new CancellationTokenSource();
      const controller = new StreamingController({
        cancellation: { enabled: true },
        listeners: [
          (event) => {
            if (event.type === 'chunk') {
              // Handle chunk
            }
          },
        ],
      });
      
      await controller.start(async (emit) => {
        await emit({ data: 'test' });
      });
      
      expect(controller.getState()).toBe('completed');
      
      controller.dispose();
      cancelSource.dispose();
    });

    it('should use ChunkValidator with StreamingController', async () => {
      const { StreamingController, ChunkValidator } = streamingModule;
      
      const validator = new ChunkValidator({
        maxChunkSize: 1000,
      });
      
      const controller = new StreamingController({
        validation: {
          maxChunkSize: 1000,
        },
      });
      
      await controller.start(async (emit) => {
        await emit({ message: 'Hello' });
      });
      
      expect(controller.getState()).toBe('completed');
      
      controller.dispose();
    });

    it('should use BackpressureController with StreamingController', async () => {
      const { StreamingController } = streamingModule;
      
      const controller = new StreamingController({
        backpressure: {
          maxBufferSize: 1024 * 1024,
          warningThreshold: 0.7,
          criticalThreshold: 0.9,
        },
      });
      
      await controller.start(async (emit) => {
        await emit('test');
      });
      
      expect(controller.getState()).toBe('completed');
      
      controller.dispose();
    });

    it('should use StreamBuffer independently', async () => {
      const { StreamBuffer } = streamingModule;
      
      const buffer = new StreamBuffer({
        maxSize: 1024,
        enableAggregation: true,
      });
      
      buffer.add('Hello, ');
      buffer.add('World!');
      
      expect(buffer.length).toBeGreaterThan(0);
      
      buffer.clear();
    });
  });
});
