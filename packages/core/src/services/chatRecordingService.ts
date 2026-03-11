/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Config } from '../config/config.js';
import { randomUUID } from 'node:crypto';
import {
  type PartListUnion,
  type Content,
  type GenerateContentResponseUsageMetadata,
  createUserContent,
  createModelContent,
} from '../types/content.js';
import { getGitBranch } from '../utils/gitUtils.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { SessionService } from './sessionService.js';
import { MemorySummaryService } from './memorySummaryService.js';
// Re-export types for backward compatibility
export { type ActivityType, type ActivityLogRecordPayload } from '../types/activity.js';
// Import for local use
import type { ActivityLogRecordPayload as ActivityLogPayload } from '../types/activity.js';

const debugLogger = createDebugLogger('CHAT_RECORDING');
import type {
  ChatCompressionInfo,
  ToolCallResponseInfo,
} from '../core/turn.js';
import type { Status } from '../core/coreToolScheduler.js';
import type { TaskResultDisplay } from '../tools/tools.js';

/**
 * A single record stored in the JSONL file.
 * Forms a tree structure via uuid/parentUuid for future checkpointing support.
 *
 * Each record is self-contained with full metadata, enabling:
 * - Append-only writes (crash-safe)
 * - Tree reconstruction by following parentUuid chain
 * - Future checkpointing by branching from any historical record
 */
export interface ChatRecord {
  /** Unique identifier for this logical message */
  uuid: string;
  /** UUID of the parent message; null for root (first message in session) */
  parentUuid: string | null;
  /** Session identifier - groups records into a logical conversation */
  sessionId: string;
  /** ISO 8601 timestamp of when the record was created */
  timestamp: string;
  /**
   * Message type: user input, assistant response, tool result, or system event.
   * System records are append-only events that can alter how history is reconstructed
   * (e.g., chat compression checkpoints) while keeping the original UI history intact.
   */
  type: 'user' | 'assistant' | 'tool_result' | 'system';
  /**
   * For assistant responses: UUID of the user message this response is answering.
   * This creates a bidirectional link between request and response.
   */
  requestUuid?: string;
  /** Optional system subtype for distinguishing system behaviors */
  subtype?:
    | 'chat_compression'
    | 'slash_command'
    | 'ui_telemetry'
    | 'at_command'
    | 'error'
    | 'loop_detected'
    | 'activity_log';
  /** Working directory at time of message */
  cwd: string;
  /** CLI version for compatibility tracking */
  version: string;
  /** Current git branch, if available */
  gitBranch?: string;

  // Content field - raw API format for history reconstruction

  /**
   * The actual Content object (role + parts) sent to/from LLM.
   * This is stored in the exact format needed for API calls, enabling
   * direct aggregation into Content[] for session resumption.
   * Contains: text, functionCall, functionResponse, thought parts, etc.
   */
  message?: Content;

  // Metadata fields (not part of API Content)

  /** Token usage statistics */
  usageMetadata?: GenerateContentResponseUsageMetadata;
  /** Model used for this response */
  model?: string;
  /**
   * Tool call metadata for UI recovery.
   * Contains enriched info (displayName, status, result, etc.) not in API format.
   */
  toolCallResult?: Partial<ToolCallResponseInfo>;

  /**
   * Payload for system records. For chat compression, this stores all data needed
   * to reconstruct the compressed history without mutating the original UI list.
   */
  systemPayload?:
    | ChatCompressionRecordPayload
    | SlashCommandRecordPayload
    | UiTelemetryRecordPayload
    | AtCommandRecordPayload
    | ErrorRecordPayload
    | LoopDetectedRecordPayload
    | ActivityLogPayload;
}

/**
 * Stored payload for chat compression checkpoints. This allows us to rebuild the
 * effective chat history on resume while keeping the original UI-visible history.
 */
export interface ChatCompressionRecordPayload {
  /** Compression metrics/status returned by the compression service */
  info: ChatCompressionInfo;
  /**
   * Snapshot of the new history contents that the model should see after
   * compression (summary turns + retained tail). Stored as Content[] for
   * resume reconstruction. May be null if compression failed.
   */
  compressedHistory: Content[] | null;
}

export interface SlashCommandRecordPayload {
  /** Whether this record represents the invocation or the resulting output. */
  phase: 'invocation' | 'result';
  /** Raw user-entered slash command (e.g., "/about"). */
  rawCommand: string;
  /**
   * History items the UI displayed for this command, in the same shape used by
   * the CLI (without IDs). Stored as plain objects for replay on resume.
   */
  outputHistoryItems?: Array<Record<string, unknown>>;
}

/**
 * Stored payload for @-command replay.
 */
export interface AtCommandRecordPayload {
  /** Files that were read for this @-command. */
  filesRead: string[];
  /** Status for UI reconstruction. */
  status: 'success' | 'error';
  /** Optional result message for UI reconstruction. */
  message?: string;
  /** Raw user-entered @-command query (optional for legacy records). */
  userText?: string;
}

/**
 * Stored payload for error events.
 * Records API errors for debugging and session analysis.
 */
export interface ErrorRecordPayload {
  /** Error message */
  message: string;
  /** HTTP status code if available */
  status?: number;
  /** Request UUID that caused this error */
  requestUuid?: string;
}

/**
 * Stored payload for loop detection events.
 */
export interface LoopDetectedRecordPayload {
  /** Request UUID that triggered loop detection */
  requestUuid?: string;
  /** Number of turns before loop was detected */
  turnCount?: number;
}

// Activity types are imported from types/activity.ts and re-exported above

/**
 * Stored payload for UI telemetry replay.
 * Contains all data needed to restore session metrics on resume.
 * Uses TelemetrySerializableState directly for consistency.
 */
export interface UiTelemetryRecordPayload {
  /** Serializable telemetry state (re-uses type from uiTelemetry for consistency) */
  telemetryState: {
    metrics: {
      models: {
        tokens: {
          prompt: number;
          generated: number;
          cached: number;
          total: number;
          thoughts: number;
          tool: number;
          candidates: number;
        };
        api: {
          time: number;
          calls: number;
          totalRequests: number;
          totalErrors: number;
          totalLatencyMs: number;
        };
        totalPromptTokens: number;
        totalGeneratedTokens: number;
        totalCachedTokens: number;
        totalApiTime: number;
        byModel: Record<
          string,
          {
            promptTokens: number;
            generatedTokens: number;
            cachedTokens: number;
            apiTime: number;
          }
        >;
      };
      tools: {
        totalCalls: number;
        totalSuccess: number;
        totalFail: number;
        totalDurationMs: number;
        totalDecisions: {
          accept: number;
          reject: number;
          modify: number;
          auto_accept: number;
        };
        byName: Record<
          string,
          {
            toolName: string;
            count: number;
            success: number;
            fail: number;
            durationMs: number;
            decisions: {
              accept: number;
              reject: number;
              modify: number;
              auto_accept: number;
            };
          }
        >;
      };
      files: {
        read: number;
        write: number;
        edit: number;
        totalLinesAdded: number;
        totalLinesRemoved: number;
      };
      storage: {
        recordCount: number;
        keys: string[];
        totalSize: number;
      };
      plugins: {
        loadedPlugins: number;
        enabledPlugins: number;
        toolCount: number;
        skillCount: number;
      };
      totalPromptTokens: number;
      totalCachedTokens: number;
      totalGeneratedTokens: number;
      totalApiTime: number;
    };
    lastPromptTokenCount: number;
    accumulatedPromptTokens: number;
    gitOperations: Record<string, number>;
    /** Token history for sparkline graph */
    tokenHistory?: Array<{
      timestamp: number;
      promptTokens: number;
      generatedTokens: number;
      cachedTokens: number;
      model: string;
      messageIndex: number;
    }>;
  };
}

/**
 * Service for recording the current chat session to disk.
 *
 * This service provides comprehensive conversation recording that captures:
 * - All user and assistant messages
 * - Tool calls and their execution results
 * - Token usage statistics
 * - Assistant thoughts and reasoning
 *
 * **API Design:**
 * - `recordUserMessage()` - Records a user message (immediate write)
 * - `recordAssistantTurn()` - Records an assistant turn with all data (immediate write)
 * - `recordToolResult()` - Records tool results (immediate write)
 *
 * **Storage Format:** JSONL files with tree-structured records.
 * Each record has uuid/parentUuid fields enabling:
 * - Append-only writes (never rewrite the file)
 * - Linear history reconstruction
 * - Future checkpointing (branch from any historical point)
 *
 * **Storage Location:** Uses SessionService for all file operations.
 * Sessions are stored in: ~/.ollama-code/projects/<project_id>/chats/
 *
 * For session management (list, load, remove), use SessionService directly.
 */
export class ChatRecordingService {
  /** UUID of the last written record in the chain */
  private lastRecordUuid: string | null = null;
  private readonly config: Config;
  /** SessionService instance for all file operations */
  private readonly sessionService: SessionService;
  /** MemorySummaryService for aggregating activities */
  private readonly memorySummaryService: MemorySummaryService;

  constructor(config: Config) {
    this.config = config;
    this.lastRecordUuid =
      config.getResumedSessionData()?.lastCompletedUuid ?? null;
    // Create SessionService for all file operations
    this.sessionService = new SessionService(config.getProjectRoot());
    // Create MemorySummaryService for activity aggregation
    this.memorySummaryService = new MemorySummaryService(config);
  }

  /**
   * Returns the session ID.
   * @returns The session ID.
   */
  private getSessionId(): string {
    return this.config.getSessionId();
  }

  /**
   * Creates base fields for a ChatRecord.
   */
  private createBaseRecord(
    type: ChatRecord['type'],
  ): Omit<ChatRecord, 'message' | 'tokens' | 'model' | 'toolCallsMetadata'> {
    return {
      uuid: randomUUID(),
      parentUuid: this.lastRecordUuid,
      sessionId: this.getSessionId(),
      timestamp: new Date().toISOString(),
      type,
      cwd: this.config.getProjectRoot(),
      version: this.config.getCliVersion() || 'unknown',
      gitBranch: getGitBranch(this.config.getProjectRoot()),
    };
  }

  /**
   * Appends a record to the session file and updates lastRecordUuid.
   * Delegates all file operations to SessionService.
   */
  private appendRecord(record: ChatRecord): void {
    debugLogger.info('Appending record to session', {
      recordType: record.type,
      sessionId: record.sessionId,
    });

    // Use SessionService for all file operations
    this.sessionService.appendRecord(record.sessionId, record);
    this.lastRecordUuid = record.uuid;

    debugLogger.info('Record appended successfully', { uuid: record.uuid });
  }

  /**
   * Records a user message.
   * Writes immediately to disk.
   *
   * @param message The raw PartListUnion object as used with the API
   * @param uuid Optional UUID to use (generated if not provided)
   * @returns The UUID of the created record
   */
  recordUserMessage(message: PartListUnion, uuid?: string): string {
    debugLogger.info('recordUserMessage called', {
      sessionId: this.getSessionId(),
      uuid,
    });
    const recordUuid = uuid || randomUUID();
    const baseRecord = this.createBaseRecord('user');
    const record: ChatRecord = {
      ...baseRecord,
      uuid: recordUuid, // Override with provided or generated UUID
      message: createUserContent(message),
    };
    this.appendRecord(record);
    debugLogger.info('User message saved successfully', { uuid: recordUuid });
    return recordUuid;
  }

  /**
   * Records an assistant turn with all available data.
   * Writes immediately to disk.
   * Returns the UUID of the record.
   *
   * @param data.uuid Optional UUID to use (generated if not provided)
   * @param data.message The raw PartListUnion object from the model response
   * @param data.model The model name
   * @param data.tokens Token usage statistics
   * @param data.requestUuid UUID of the user message this response is answering
   * @param data.toolCallsMetadata Enriched tool call info for UI recovery
   * @returns The UUID of the created record
   */
  recordAssistantTurn(data: {
    model: string;
    message?: PartListUnion;
    tokens?: GenerateContentResponseUsageMetadata;
    uuid?: string;
    requestUuid?: string;
  }): string {
    const uuid = data.uuid || randomUUID();
    debugLogger.info('recordAssistantTurn called', {
      sessionId: this.getSessionId(),
      model: data.model,
      hasMessage: !!data.message,
      uuid,
      requestUuid: data.requestUuid,
    });

    const baseRecord = this.createBaseRecord('assistant');
    const record: ChatRecord = {
      ...baseRecord,
      uuid, // Override with provided or generated UUID
      model: data.model,
    };

    if (data.requestUuid) {
      record.requestUuid = data.requestUuid;
    }

    if (data.message !== undefined) {
      record.message = createModelContent(data.message);
    }

    if (data.tokens) {
      record.usageMetadata = data.tokens;
    }

    this.appendRecord(record);
    debugLogger.info('Assistant turn saved successfully', {
      uuid: record.uuid,
      requestUuid: data.requestUuid,
    });
    return record.uuid;
  }

  /**
   * Records tool results (function responses) sent back to the model.
   * Writes immediately to disk.
   *
   * @param message The raw PartListUnion object with functionResponse parts
   * @param toolCallResult Optional tool call result info for UI recovery
   */
  recordToolResult(
    message: PartListUnion,
    toolCallResult?: Partial<ToolCallResponseInfo> & { status: Status },
  ): void {
    try {
      const record: ChatRecord = {
        ...this.createBaseRecord('tool_result'),
        message: createUserContent(message),
      };

      if (toolCallResult) {
        // special case for task executions - we don't want to record the tool calls
        if (
          typeof toolCallResult.resultDisplay === 'object' &&
          toolCallResult.resultDisplay !== null &&
          'type' in toolCallResult.resultDisplay &&
          toolCallResult.resultDisplay.type === 'task_execution'
        ) {
          const taskResult = toolCallResult.resultDisplay as TaskResultDisplay;
          record.toolCallResult = {
            ...toolCallResult,
            resultDisplay: {
              ...taskResult,
              toolCalls: [],
            },
          };
        } else {
          record.toolCallResult = toolCallResult;
        }
      }

      this.appendRecord(record);
    } catch (error) {
      debugLogger.error('Error saving tool result:', error);
    }
  }

  /**
   * Records a slash command invocation as a system record. This keeps the model
   * history clean while allowing resume to replay UI output for commands like
   * /about.
   */
  recordSlashCommand(payload: SlashCommandRecordPayload): void {
    try {
      const record: ChatRecord = {
        ...this.createBaseRecord('system'),
        type: 'system',
        subtype: 'slash_command',
        systemPayload: payload,
      };

      this.appendRecord(record);
    } catch (error) {
      debugLogger.error('Error saving slash command record:', error);
    }
  }

  /**
   * Records a chat compression checkpoint as a system record. This keeps the UI
   * history immutable while allowing resume/continue flows to reconstruct the
   * compressed model-facing history from the stored snapshot.
   */
  recordChatCompression(payload: ChatCompressionRecordPayload): void {
    try {
      const record: ChatRecord = {
        ...this.createBaseRecord('system'),
        type: 'system',
        subtype: 'chat_compression',
        systemPayload: payload,
      };

      this.appendRecord(record);
    } catch (error) {
      debugLogger.error('Error saving chat compression record:', error);
    }
  }

  /**
   * Records UI telemetry event for replaying metrics on resume.
   * Call this at the end of each assistant turn to persist session metrics.
   */
  recordUiTelemetryEvent(payload: UiTelemetryRecordPayload): void {
    try {
      const record: ChatRecord = {
        ...this.createBaseRecord('system'),
        type: 'system',
        subtype: 'ui_telemetry',
        systemPayload: payload,
      };

      this.appendRecord(record);
    } catch (error) {
      debugLogger.error('Error saving ui telemetry record:', error);
    }
  }

  /**
   * Records @-command metadata as a system record for UI reconstruction.
   */
  recordAtCommand(payload: AtCommandRecordPayload): void {
    try {
      const record: ChatRecord = {
        ...this.createBaseRecord('system'),
        type: 'system',
        subtype: 'at_command',
        systemPayload: payload,
      };

      this.appendRecord(record);
    } catch (error) {
      debugLogger.error('Error saving @-command record:', error);
    }
  }

  /**
   * Records an error event for debugging and session analysis.
   * This helps identify why a model response might be missing.
   */
  recordError(payload: ErrorRecordPayload): void {
    try {
      const record: ChatRecord = {
        ...this.createBaseRecord('system'),
        type: 'system',
        subtype: 'error',
        systemPayload: payload,
      };

      this.appendRecord(record);
      debugLogger.info('Error recorded to session', {
        message: payload.message,
        status: payload.status,
      });
    } catch (error) {
      debugLogger.error('Error saving error record:', error);
    }
  }

  /**
   * Records a loop detection event when the model enters a repetitive pattern.
   */
  recordLoopDetected(payload: LoopDetectedRecordPayload): void {
    try {
      const record: ChatRecord = {
        ...this.createBaseRecord('system'),
        type: 'system',
        subtype: 'loop_detected',
        systemPayload: payload,
      };

      this.appendRecord(record);
      debugLogger.info('Loop detection recorded to session', {
        requestUuid: payload.requestUuid,
      });
    } catch (error) {
      debugLogger.error('Error saving loop detection record:', error);
    }
  }

  /**
   * Records an activity log event for session memory and resume context.
   * This tracks significant actions like tool calls, file operations, etc.
   *
   * Activity logs are used to:
   * - Provide context for compression summaries
   * - Enable better session memory on resume
   * - Track what work was done in a session
   */
  recordActivityLog(payload: ActivityLogPayload): void {
    try {
      const record: ChatRecord = {
        ...this.createBaseRecord('system'),
        type: 'system',
        subtype: 'activity_log',
        systemPayload: payload,
      };

      this.appendRecord(record);

      // Also add to MemorySummaryService for aggregation
      this.memorySummaryService.addActivity(payload);

      debugLogger.info('Activity logged to session', {
        activityType: payload.activityType,
        description: payload.description,
        success: payload.success,
      });
    } catch (error) {
      debugLogger.error('Error saving activity log record:', error);
    }
  }

  /**
   * Get the MemorySummaryService instance for this session.
   * Use this to create summaries or get activity statistics.
   */
  getMemorySummaryService(): MemorySummaryService {
    return this.memorySummaryService;
  }
}
