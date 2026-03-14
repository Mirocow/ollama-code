/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { TodoWriteParams, TodoItem, TodosData } from './index.js';
import { TodoWriteTool } from './index.js';
import type { Config } from '../config/config.js';
import * as storageTools from '../../storage-tools/index.js';

// Mock storage-tools module
vi.mock('../../storage-tools/index.js', () => ({
  storageGet: vi.fn(),
  storageSet: vi.fn(),
  StorageNamespaces: {
    ROADMAP: 'roadmap',
    SESSION: 'session',
    KNOWLEDGE: 'knowledge',
    CONTEXT: 'context',
    LEARNING: 'learning',
    METRICS: 'metrics',
    PLANS: 'plans',
    TODOS: 'todos',
  },
}));

const mockStorageGet = vi.mocked(storageTools.storageGet);
const mockStorageSet = vi.mocked(storageTools.storageSet);

describe('TodoWriteTool', () => {
  let tool: TodoWriteTool;
  let mockAbortSignal: AbortSignal;
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = {
      getSessionId: () => 'test-session-123',
    } as Config;
    tool = new TodoWriteTool(mockConfig);
    mockAbortSignal = new AbortController().signal;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateToolParams', () => {
    it('should validate correct parameters', () => {
      const params: TodoWriteParams = {
        todos: [
          { id: '1', content: 'Task 1', status: 'pending' },
          { id: '2', content: 'Task 2', status: 'in_progress' },
        ],
      };

      const result = tool.validateToolParams(params);
      expect(result).toBeNull();
    });

    it('should accept empty todos array', () => {
      const params: TodoWriteParams = {
        todos: [],
      };

      const result = tool.validateToolParams(params);
      expect(result).toBeNull();
    });

    it('should accept single todo', () => {
      const params: TodoWriteParams = {
        todos: [{ id: '1', content: 'Task 1', status: 'pending' }],
      };

      const result = tool.validateToolParams(params);
      expect(result).toBeNull();
    });

    it('should reject todos with empty content', () => {
      const params: TodoWriteParams = {
        todos: [
          { id: '1', content: '', status: 'pending' },
          { id: '2', content: 'Task 2', status: 'pending' },
        ],
      };

      const result = tool.validateToolParams(params);
      expect(result).toContain(
        'Each todo must have a non-empty "content" string',
      );
    });

    it('should reject todos with empty id', () => {
      const params: TodoWriteParams = {
        todos: [
          { id: '', content: 'Task 1', status: 'pending' },
          { id: '2', content: 'Task 2', status: 'pending' },
        ],
      };

      const result = tool.validateToolParams(params);
      expect(result).toContain('non-empty "id" string');
    });

    it('should reject todos with invalid status', () => {
      const params: TodoWriteParams = {
        todos: [
          {
            id: '1',
            content: 'Task 1',
            status: 'invalid' as TodoItem['status'],
          },
          { id: '2', content: 'Task 2', status: 'pending' },
        ],
      };

      const result = tool.validateToolParams(params);
      expect(result).toContain(
        'Each todo must have a valid "status" (pending, in_progress, completed)',
      );
    });

    it('should reject todos with duplicate IDs', () => {
      const params: TodoWriteParams = {
        todos: [
          { id: '1', content: 'Task 1', status: 'pending' },
          { id: '1', content: 'Task 2', status: 'pending' },
        ],
      };

      const result = tool.validateToolParams(params);
      expect(result).toContain('unique');
    });
  });

  describe('execute', () => {
    it('should create new todos when none exists', async () => {
      const params: TodoWriteParams = {
        todos: [
          { id: '1', content: 'Task 1', status: 'pending' },
          { id: '2', content: 'Task 2', status: 'in_progress' },
        ],
      };

      // Mock storage returning undefined (no existing todos)
      mockStorageGet.mockResolvedValue(undefined);
      mockStorageSet.mockResolvedValue(undefined);

      const invocation = tool.build(params);
      const result = await invocation.execute(mockAbortSignal);

      expect(result.llmContent).toContain(
        'Todos have been modified successfully',
      );
      expect(result.llmContent).toContain('<system-reminder>');
      expect(result.llmContent).toContain('Your todo list has changed');
      expect(result.returnDisplay).toEqual({
        type: 'todo_list',
        todos: [
          { id: '1', content: 'Task 1', status: 'pending' },
          { id: '2', content: 'Task 2', status: 'in_progress' },
        ],
      });
      expect(mockStorageSet).toHaveBeenCalledWith(
        'todos',
        'items',
        expect.objectContaining({
          items: params.todos,
          sessionId: 'test-session-123',
        }),
        { scope: 'project' },
      );
    });

    it('should replace todos with new ones', async () => {
      const existingData: TodosData = {
        items: [{ id: '1', content: 'Existing Task', status: 'completed' }],
        sessionId: 'test-session-123',
        createdAt: '2025-03-14T10:00:00Z',
        updatedAt: '2025-03-14T10:00:00Z',
        status: 'active',
      };

      const params: TodoWriteParams = {
        todos: [
          { id: '1', content: 'Updated Task', status: 'completed' },
          { id: '2', content: 'New Task', status: 'pending' },
        ],
      };

      // Mock storage returning existing data
      mockStorageGet.mockResolvedValue(existingData);
      mockStorageSet.mockResolvedValue(undefined);

      const invocation = tool.build(params);
      const result = await invocation.execute(mockAbortSignal);

      expect(result.llmContent).toContain(
        'Todos have been modified successfully',
      );
      expect(result.llmContent).toContain('<system-reminder>');
      expect(result.returnDisplay).toEqual({
        type: 'todo_list',
        todos: [
          { id: '1', content: 'Updated Task', status: 'completed' },
          { id: '2', content: 'New Task', status: 'pending' },
        ],
      });
    });

    it('should handle storage errors', async () => {
      const params: TodoWriteParams = {
        todos: [
          { id: '1', content: 'Task 1', status: 'pending' },
          { id: '2', content: 'Task 2', status: 'pending' },
        ],
      };

      // Mock storageGet returns undefined (no existing data)
      mockStorageGet.mockResolvedValue(undefined);
      // Mock storageSet throws error
      mockStorageSet.mockRejectedValue(new Error('Storage failed'));

      const invocation = tool.build(params);
      const result = await invocation.execute(mockAbortSignal);

      expect(result.llmContent).toContain('Failed to modify todos');
      expect(result.llmContent).toContain('<system-reminder>');
      expect(result.returnDisplay).toContain('Error writing todos');
    });

    it('should handle empty todos array', async () => {
      const params: TodoWriteParams = {
        todos: [],
      };

      mockStorageGet.mockResolvedValue(undefined);
      mockStorageSet.mockResolvedValue(undefined);

      const invocation = tool.build(params);
      const result = await invocation.execute(mockAbortSignal);

      expect(result.llmContent).toContain('Todo list has been cleared');
      expect(result.llmContent).toContain('<system-reminder>');
      expect(result.llmContent).toContain('Your todo list is now empty');
      expect(result.returnDisplay).toEqual({
        type: 'todo_list',
        todos: [],
      });
    });
  });

  describe('tool properties', () => {
    it('should have correct tool name', () => {
      expect(TodoWriteTool.Name).toBe('todo_write');
      expect(tool.name).toBe('todo_write');
    });

    it('should have correct display name', () => {
      expect(tool.displayName).toBe('TodoWrite');
    });

    it('should have correct kind', () => {
      expect(tool.kind).toBe('think');
    });

    it('should have schema with required properties', () => {
      const schema = tool.schema;
      expect(schema.name).toBe('todo_write');
      expect(schema.parametersJsonSchema).toHaveProperty('properties.todos');
      expect(schema.parametersJsonSchema).not.toHaveProperty(
        'properties.merge',
      );
    });
  });

  describe('getDescription', () => {
    it('should return "Update todos" for todo operations', () => {
      // With storage-tools integration, we always use 'update' operation type
      // because storage handles both create and update scenarios
      const params = {
        todos: [{ id: '1', content: 'Test todo', status: 'pending' as const }],
      };
      const invocation = tool.build(params);
      expect(invocation.getDescription()).toBe('Update todos');
    });

    it('should return "Update todos" for multiple todos', () => {
      const params = {
        todos: [
          { id: '1', content: 'First todo', status: 'pending' as const },
          { id: '2', content: 'Second todo', status: 'completed' as const },
        ],
      };
      const invocation = tool.build(params);
      expect(invocation.getDescription()).toBe('Update todos');
    });
  });
});
