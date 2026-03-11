/**
 * Data Processor Tool Handler
 *
 * Processes data files and returns statistics.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Executes the data processor tool.
 */
export async function execute(params, context) {
  const { filePath, operation } = params;
  const { logger, workingDirectory } = context;

  logger?.info('Processing data file', { filePath, operation });

  // Resolve the file path
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(workingDirectory, filePath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    return {
      llmContent: `Error: File not found: ${filePath}`,
      returnDisplay: `File not found: ${filePath}`,
      error: {
        message: 'File not found',
        type: 'FILE_NOT_FOUND',
      },
    };
  }

  try {
    // Read the file
    const content = await fs.promises.readFile(resolvedPath, 'utf-8');

    // Parse based on file extension
    const ext = path.extname(resolvedPath).toLowerCase();
    let data;

    if (ext === '.json') {
      data = JSON.parse(content);
    } else if (ext === '.csv') {
      data = parseCSV(content);
    } else {
      // Treat as lines
      data = content.split('\n').filter((line) => line.trim());
    }

    // Perform the operation
    let result;
    switch (operation) {
      case 'count':
        result = {
          count: Array.isArray(data) ? data.length : Object.keys(data).length,
          type: Array.isArray(data) ? 'array' : 'object',
        };
        break;

      case 'sum':
        if (Array.isArray(data) && data.every((n) => typeof n === 'number')) {
          result = { sum: data.reduce((a, b) => a + b, 0) };
        } else {
          result = { error: 'Cannot sum non-numeric data' };
        }
        break;

      case 'average':
        if (Array.isArray(data) && data.every((n) => typeof n === 'number')) {
          const sum = data.reduce((a, b) => a + b, 0);
          result = { average: sum / data.length, count: data.length };
        } else {
          result = { error: 'Cannot average non-numeric data' };
        }
        break;

      case 'analyze':
        result = analyzeData(data);
        break;

      default:
        result = { error: `Unknown operation: ${operation}` };
    }

    const response = {
      file: filePath,
      operation,
      result,
      timestamp: new Date().toISOString(),
    };

    return {
      llmContent: JSON.stringify(response, null, 2),
      returnDisplay: `${operation} on ${filePath}: ${JSON.stringify(result)}`,
    };
  } catch (error) {
    return {
      llmContent: `Error processing file: ${error.message}`,
      returnDisplay: `Error: ${error.message}`,
      error: {
        message: error.message,
        type: 'PROCESSING_ERROR',
      },
    };
  }
}

/**
 * Validates the tool parameters.
 */
export function validate(params) {
  if (!params.filePath) {
    return 'File path is required';
  }

  if (!params.operation) {
    return 'Operation is required';
  }

  const validOperations = ['count', 'sum', 'average', 'analyze'];
  if (!validOperations.includes(params.operation)) {
    return `Invalid operation. Must be one of: ${validOperations.join(', ')}`;
  }

  return null;
}

/**
 * Returns a description of what the tool will do.
 */
export function getDescription(params) {
  return `Process ${params.filePath} with operation: ${params.operation}`;
}

// Helper functions

function parseCSV(content) {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
}

function analyzeData(data) {
  const analysis = {
    type: typeof data,
    isArray: Array.isArray(data),
    length: Array.isArray(data)
      ? data.length
      : typeof data === 'object'
        ? Object.keys(data).length
        : 1,
    sample: null,
    types: {},
  };

  // Get sample
  if (Array.isArray(data) && data.length > 0) {
    analysis.sample = data.slice(0, 3);

    // Count types
    data.forEach((item) => {
      const type = typeof item;
      analysis.types[type] = (analysis.types[type] || 0) + 1;
    });
  }

  return analysis;
}

export default {
  execute,
  validate,
  getDescription,
};
