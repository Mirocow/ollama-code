/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { InputFormat, OutputFormat, type JsonError, type JsonOutput } from './types.js';

describe('InputFormat', () => {
  it('should have TEXT value', () => {
    expect(InputFormat.TEXT).toBe('text');
  });

  it('should have STREAM_JSON value', () => {
    expect(InputFormat.STREAM_JSON).toBe('stream-json');
  });

  it('should have exactly two values', () => {
    const values = Object.values(InputFormat);
    expect(values).toHaveLength(2);
    expect(values).toContain('text');
    expect(values).toContain('stream-json');
  });

  it('should be usable as type', () => {
    const format: InputFormat = InputFormat.TEXT;
    expect(format).toBe('text');
  });
});

describe('OutputFormat', () => {
  it('should have TEXT value', () => {
    expect(OutputFormat.TEXT).toBe('text');
  });

  it('should have JSON value', () => {
    expect(OutputFormat.JSON).toBe('json');
  });

  it('should have STREAM_JSON value', () => {
    expect(OutputFormat.STREAM_JSON).toBe('stream-json');
  });

  it('should have exactly three values', () => {
    const values = Object.values(OutputFormat);
    expect(values).toHaveLength(3);
    expect(values).toContain('text');
    expect(values).toContain('json');
    expect(values).toContain('stream-json');
  });

  it('should be usable as type', () => {
    const format: OutputFormat = OutputFormat.JSON;
    expect(format).toBe('json');
  });
});

describe('JsonError', () => {
  it('should have required type and message', () => {
    const error: JsonError = {
      type: 'Error',
      message: 'Something went wrong',
    };

    expect(error.type).toBe('Error');
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBeUndefined();
  });

  it('should allow optional code', () => {
    const errorWithCode: JsonError = {
      type: 'ValidationError',
      message: 'Invalid input',
      code: 'INVALID_INPUT',
    };

    expect(errorWithCode.code).toBe('INVALID_INPUT');
  });

  it('should allow numeric code', () => {
    const errorWithNumericCode: JsonError = {
      type: 'HttpError',
      message: 'Not found',
      code: 404,
    };

    expect(errorWithNumericCode.code).toBe(404);
  });
});

describe('JsonOutput', () => {
  it('should allow empty object', () => {
    const output: JsonOutput = {};
    expect(output.response).toBeUndefined();
    expect(output.error).toBeUndefined();
  });

  it('should allow response only', () => {
    const output: JsonOutput = {
      response: 'Hello, world!',
    };

    expect(output.response).toBe('Hello, world!');
    expect(output.error).toBeUndefined();
  });

  it('should allow error only', () => {
    const output: JsonOutput = {
      error: {
        type: 'Error',
        message: 'Something went wrong',
      },
    };

    expect(output.response).toBeUndefined();
    expect(output.error?.type).toBe('Error');
  });

  it('should allow both response and error', () => {
    const output: JsonOutput = {
      response: 'Partial result',
      error: {
        type: 'Warning',
        message: 'Some warnings occurred',
      },
    };

    expect(output.response).toBe('Partial result');
    expect(output.error?.type).toBe('Warning');
  });

  it('should allow empty response', () => {
    const output: JsonOutput = {
      response: '',
    };

    expect(output.response).toBe('');
  });

  it('should allow error with code', () => {
    const output: JsonOutput = {
      error: {
        type: 'HttpError',
        message: 'Not found',
        code: 404,
      },
    };

    expect(output.error?.code).toBe(404);
  });
});

describe('type guards and assertions', () => {
  it('should validate InputFormat values', () => {
    const isValidInputFormat = (value: string): value is InputFormat => {
      return Object.values(InputFormat).includes(value as InputFormat);
    };

    expect(isValidInputFormat('text')).toBe(true);
    expect(isValidInputFormat('stream-json')).toBe(true);
    expect(isValidInputFormat('json')).toBe(false);
    expect(isValidInputFormat('invalid')).toBe(false);
  });

  it('should validate OutputFormat values', () => {
    const isValidOutputFormat = (value: string): value is OutputFormat => {
      return Object.values(OutputFormat).includes(value as OutputFormat);
    };

    expect(isValidOutputFormat('text')).toBe(true);
    expect(isValidOutputFormat('json')).toBe(true);
    expect(isValidOutputFormat('stream-json')).toBe(true);
    expect(isValidOutputFormat('invalid')).toBe(false);
  });
});
