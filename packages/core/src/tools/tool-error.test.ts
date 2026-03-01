/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ToolErrorType } from './tool-error.js';

describe('ToolErrorType', () => {
  describe('Enum Values', () => {
    it('should have INVALID_TOOL_PARAMS error type', () => {
      expect(ToolErrorType.INVALID_TOOL_PARAMS).toBe('invalid_tool_params');
    });

    it('should have UNKNOWN error type', () => {
      expect(ToolErrorType.UNKNOWN).toBe('unknown');
    });

    it('should have UNHANDLED_EXCEPTION error type', () => {
      expect(ToolErrorType.UNHANDLED_EXCEPTION).toBe('unhandled_exception');
    });

    it('should have TOOL_NOT_REGISTERED error type', () => {
      expect(ToolErrorType.TOOL_NOT_REGISTERED).toBe('tool_not_registered');
    });

    it('should have EXECUTION_FAILED error type', () => {
      expect(ToolErrorType.EXECUTION_FAILED).toBe('execution_failed');
    });

    it('should have EXECUTION_DENIED error type', () => {
      expect(ToolErrorType.EXECUTION_DENIED).toBe('execution_denied');
    });
  });

  describe('File System Errors', () => {
    it('should have FILE_NOT_FOUND error type', () => {
      expect(ToolErrorType.FILE_NOT_FOUND).toBe('file_not_found');
    });

    it('should have FILE_WRITE_FAILURE error type', () => {
      expect(ToolErrorType.FILE_WRITE_FAILURE).toBe('file_write_failure');
    });

    it('should have READ_CONTENT_FAILURE error type', () => {
      expect(ToolErrorType.READ_CONTENT_FAILURE).toBe('read_content_failure');
    });

    it('should have ATTEMPT_TO_CREATE_EXISTING_FILE error type', () => {
      expect(ToolErrorType.ATTEMPT_TO_CREATE_EXISTING_FILE).toBe(
        'attempt_to_create_existing_file',
      );
    });

    it('should have FILE_TOO_LARGE error type', () => {
      expect(ToolErrorType.FILE_TOO_LARGE).toBe('file_too_large');
    });

    it('should have PERMISSION_DENIED error type', () => {
      expect(ToolErrorType.PERMISSION_DENIED).toBe('permission_denied');
    });

    it('should have NO_SPACE_LEFT error type', () => {
      expect(ToolErrorType.NO_SPACE_LEFT).toBe('no_space_left');
    });

    it('should have TARGET_IS_DIRECTORY error type', () => {
      expect(ToolErrorType.TARGET_IS_DIRECTORY).toBe('target_is_directory');
    });

    it('should have PATH_NOT_IN_WORKSPACE error type', () => {
      expect(ToolErrorType.PATH_NOT_IN_WORKSPACE).toBe('path_not_in_workspace');
    });

    it('should have SEARCH_PATH_NOT_FOUND error type', () => {
      expect(ToolErrorType.SEARCH_PATH_NOT_FOUND).toBe('search_path_not_found');
    });

    it('should have SEARCH_PATH_NOT_A_DIRECTORY error type', () => {
      expect(ToolErrorType.SEARCH_PATH_NOT_A_DIRECTORY).toBe(
        'search_path_not_a_directory',
      );
    });
  });

  describe('Edit-specific Errors', () => {
    it('should have EDIT_PREPARATION_FAILURE error type', () => {
      expect(ToolErrorType.EDIT_PREPARATION_FAILURE).toBe(
        'edit_preparation_failure',
      );
    });

    it('should have EDIT_NO_OCCURRENCE_FOUND error type', () => {
      expect(ToolErrorType.EDIT_NO_OCCURRENCE_FOUND).toBe(
        'edit_no_occurrence_found',
      );
    });

    it('should have EDIT_EXPECTED_OCCURRENCE_MISMATCH error type', () => {
      expect(ToolErrorType.EDIT_EXPECTED_OCCURRENCE_MISMATCH).toBe(
        'edit_expected_occurrence_mismatch',
      );
    });

    it('should have EDIT_NO_CHANGE error type', () => {
      expect(ToolErrorType.EDIT_NO_CHANGE).toBe('edit_no_change');
    });

    it('should have EDIT_NO_CHANGE_LLM_JUDGEMENT error type', () => {
      expect(ToolErrorType.EDIT_NO_CHANGE_LLM_JUDGEMENT).toBe(
        'edit_no_change_llm_judgement',
      );
    });
  });

  describe('Tool-specific Errors', () => {
    it('should have GLOB_EXECUTION_ERROR error type', () => {
      expect(ToolErrorType.GLOB_EXECUTION_ERROR).toBe('glob_execution_error');
    });

    it('should have GREP_EXECUTION_ERROR error type', () => {
      expect(ToolErrorType.GREP_EXECUTION_ERROR).toBe('grep_execution_error');
    });

    it('should have LS_EXECUTION_ERROR error type', () => {
      expect(ToolErrorType.LS_EXECUTION_ERROR).toBe('ls_execution_error');
    });

    it('should have PATH_IS_NOT_A_DIRECTORY error type', () => {
      expect(ToolErrorType.PATH_IS_NOT_A_DIRECTORY).toBe(
        'path_is_not_a_directory',
      );
    });

    it('should have MCP_TOOL_ERROR error type', () => {
      expect(ToolErrorType.MCP_TOOL_ERROR).toBe('mcp_tool_error');
    });

    it('should have MEMORY_TOOL_EXECUTION_ERROR error type', () => {
      expect(ToolErrorType.MEMORY_TOOL_EXECUTION_ERROR).toBe(
        'memory_tool_execution_error',
      );
    });

    it('should have SHELL_EXECUTE_ERROR error type', () => {
      expect(ToolErrorType.SHELL_EXECUTE_ERROR).toBe('shell_execute_error');
    });

    it('should have DISCOVERED_TOOL_EXECUTION_ERROR error type', () => {
      expect(ToolErrorType.DISCOVERED_TOOL_EXECUTION_ERROR).toBe(
        'discovered_tool_execution_error',
      );
    });
  });

  describe('Web Errors', () => {
    it('should have WEB_FETCH_NO_URL_IN_PROMPT error type', () => {
      expect(ToolErrorType.WEB_FETCH_NO_URL_IN_PROMPT).toBe(
        'web_fetch_no_url_in_prompt',
      );
    });

    it('should have WEB_FETCH_FALLBACK_FAILED error type', () => {
      expect(ToolErrorType.WEB_FETCH_FALLBACK_FAILED).toBe(
        'web_fetch_fallback_failed',
      );
    });

    it('should have WEB_FETCH_PROCESSING_ERROR error type', () => {
      expect(ToolErrorType.WEB_FETCH_PROCESSING_ERROR).toBe(
        'web_fetch_processing_error',
      );
    });

    it('should have WEB_SEARCH_FAILED error type', () => {
      expect(ToolErrorType.WEB_SEARCH_FAILED).toBe('web_search_failed');
    });
  });

  describe('Type Safety', () => {
    it('should be usable as a type', () => {
      const errorType: ToolErrorType = ToolErrorType.INVALID_TOOL_PARAMS;
      expect(errorType).toBe('invalid_tool_params');
    });

    it('should be usable in error objects', () => {
      const error = {
        message: 'Test error',
        type: ToolErrorType.EXECUTION_FAILED,
      };
      expect(error.type).toBe('execution_failed');
    });
  });

  describe('All Values', () => {
    it('should have all expected enum values', () => {
      const expectedValues = [
        'invalid_tool_params',
        'unknown',
        'unhandled_exception',
        'tool_not_registered',
        'execution_failed',
        'execution_denied',
        'file_not_found',
        'file_write_failure',
        'read_content_failure',
        'attempt_to_create_existing_file',
        'file_too_large',
        'permission_denied',
        'no_space_left',
        'target_is_directory',
        'path_not_in_workspace',
        'search_path_not_found',
        'search_path_not_a_directory',
        'edit_preparation_failure',
        'edit_no_occurrence_found',
        'edit_expected_occurrence_mismatch',
        'edit_no_change',
        'edit_no_change_llm_judgement',
        'glob_execution_error',
        'grep_execution_error',
        'ls_execution_error',
        'path_is_not_a_directory',
        'mcp_tool_error',
        'memory_tool_execution_error',
        'shell_execute_error',
        'discovered_tool_execution_error',
        'web_fetch_no_url_in_prompt',
        'web_fetch_fallback_failed',
        'web_fetch_processing_error',
        'web_search_failed',
      ];

      const actualValues = Object.values(ToolErrorType);
      expect(actualValues).toHaveLength(expectedValues.length);
      expectedValues.forEach((value) => {
        expect(actualValues).toContain(value);
      });
    });
  });
});
