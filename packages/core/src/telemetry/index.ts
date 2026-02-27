/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry stubs - all telemetry has been removed
// All logging functions are no-ops that accept any arguments

// Re-export UI telemetry types and service
export {
  uiTelemetryService,
  type SessionMetrics,
  type ToolCallStats,
  type ModelMetrics,
  type FileMetrics,
} from './uiTelemetry.js';

export enum TelemetryTarget {
  GCP = 'gcp',
  LOCAL = 'local',
  OLLAMA = 'ollama',
}

export const DEFAULT_TELEMETRY_TARGET = TelemetryTarget.LOCAL;
export const DEFAULT_OTLP_ENDPOINT = 'http://localhost:4317';

export function initializeTelemetry(): void {}
export function shutdownTelemetry(): Promise<void> { return Promise.resolve(); }
export function isTelemetrySdkInitialized(): boolean { return false; }
export function resolveTelemetrySettings(): { enabled: boolean } { return { enabled: false }; }
export function parseBooleanEnvFlag(): boolean { return false; }
export function parseTelemetryTargetValue(): TelemetryTarget { return TelemetryTarget.LOCAL; }

// Logger stubs
export function logStartSession(..._args: unknown[]): void {}
export function logUserPrompt(..._args: unknown[]): void {}
export function logToolCall(..._args: unknown[]): void {}
export function logApiRequest(..._args: unknown[]): void {}
export function logApiError(..._args: unknown[]): void {}
export function logApiCancel(..._args: unknown[]): void {}
export function logApiResponse(..._args: unknown[]): void {}
export function logFlashFallback(..._args: unknown[]): void {}
export function logSlashCommand(..._args: unknown[]): void {}
export function logConversationFinishedEvent(..._args: unknown[]): void {}
export function logKittySequenceOverflow(..._args: unknown[]): void {}
export function logChatCompression(..._args: unknown[]): void {}
export function logToolOutputTruncated(..._args: unknown[]): void {}
export function logExtensionEnable(..._args: unknown[]): void {}
export function logExtensionInstallEvent(..._args: unknown[]): void {}
export function logExtensionUninstall(..._args: unknown[]): void {}
export function logExtensionDisable(..._args: unknown[]): void {}
export function logExtensionUpdateEvent(..._args: unknown[]): void {}
export function logRipgrepFallback(..._args: unknown[]): void {}
export function logNextSpeakerCheck(..._args: unknown[]): void {}
export function logAuth(..._args: unknown[]): void {}
export function logSkillLaunch(..._args: unknown[]): void {}
export function logUserFeedback(..._args: unknown[]): void {}
export function logIdeConnection(..._args: unknown[]): void {}
export function logModelSlashCommand(..._args: unknown[]): void {}
export function logLoopDetected(..._args: unknown[]): void {}
export function logLoopDetectionDisabled(..._args: unknown[]): void {}
export function logSubagentExecution(..._args: unknown[]): void {}

// Event types
export class StartSessionEvent { constructor(..._args: unknown[]) {} }
export class UserPromptEvent { constructor(..._args: unknown[]) {} }
export class ToolCallEvent { constructor(..._args: unknown[]) {} }
export class ApiRequestEvent { constructor(..._args: unknown[]) {} }
export class ApiResponseEvent { constructor(..._args: unknown[]) {} }
export class ApiErrorEvent { constructor(..._args: unknown[]) {} }
export class ApiCancelEvent { constructor(..._args: unknown[]) {} }
export class FlashFallbackEvent { constructor(..._args: unknown[]) {} }
export class SlashCommandEvent { constructor(..._args: unknown[]) {} }
export class ConversationFinishedEvent { constructor(..._args: unknown[]) {} }
export class KittySequenceOverflowEvent { constructor(..._args: unknown[]) {} }
export class ToolOutputTruncatedEvent { constructor(..._args: unknown[]) {} }
export class RipgrepFallbackEvent { constructor(..._args: unknown[]) {} }
export class NextSpeakerCheckEvent { constructor(..._args: unknown[]) {} }
export class AuthEvent { constructor(..._args: unknown[]) {} }
export class SkillLaunchEvent { constructor(..._args: unknown[]) {} }
export class UserFeedbackEvent { constructor(..._args: unknown[]) {} }
export class ExtensionEnableEvent { constructor(..._args: unknown[]) {} }
export class ExtensionDisableEvent { constructor(..._args: unknown[]) {} }
export class ExtensionInstallEvent { constructor(..._args: unknown[]) {} }
export class ExtensionUninstallEvent { constructor(..._args: unknown[]) {} }
export class ExtensionUpdateEvent { constructor(..._args: unknown[]) {} }
export class IdeConnectionEvent { constructor(..._args: unknown[]) {} }
export class ModelSlashCommandEvent { constructor(..._args: unknown[]) {} }
export class LoopDetectedEvent { constructor(..._args: unknown[]) {} }
export class LoopDetectionDisabledEvent { constructor(..._args: unknown[]) {} }
export class SubagentExecutionEvent { constructor(..._args: unknown[]) {} }

// Enums
export enum SlashCommandStatus { SUCCESS = 'success', ERROR = 'error' }
export enum UserFeedbackRating { POSITIVE = 'positive', NEGATIVE = 'negative' }
export enum IdeConnectionType { IDE = 'ide', CLI = 'cli', START = 'start', SESSION = 'session' }
export enum LoopType { TOOL_CALL = 'tool_call', CONTENT = 'content' }

export type TelemetryEvent = unknown;
export type ChatCompressionEvent = unknown;

export function makeSlashCommandEvent(..._args: unknown[]): unknown { return {}; }
export function makeChatCompressionEvent(..._args: unknown[]): unknown { return {}; }

// Metrics stubs
export function recordToolCallMetrics(..._args: unknown[]): void {}
export function recordTokenUsageMetrics(..._args: unknown[]): void {}
export function recordApiResponseMetrics(..._args: unknown[]): void {}
export function recordApiErrorMetrics(..._args: unknown[]): void {}
export function recordFileOperationMetric(..._args: unknown[]): void {}
export function recordInvalidChunk(..._args: unknown[]): void {}
export function recordContentRetry(..._args: unknown[]): void {}
export function recordContentRetryFailure(..._args: unknown[]): void {}
export function recordStartupPerformance(..._args: unknown[]): void {}
export function recordMemoryUsage(..._args: unknown[]): void {}
export function recordCpuUsage(..._args: unknown[]): void {}
export function recordToolQueueDepth(..._args: unknown[]): void {}
export function recordToolExecutionBreakdown(..._args: unknown[]): void {}
export function recordTokenEfficiency(..._args: unknown[]): void {}
export function recordApiRequestBreakdown(..._args: unknown[]): void {}
export function recordPerformanceScore(..._args: unknown[]): void {}
export function recordPerformanceRegression(..._args: unknown[]): void {}
export function recordBaselineComparison(..._args: unknown[]): void {}
export function isPerformanceMonitoringActive(): boolean { return false; }

export enum PerformanceMetricType {}
export enum MemoryMetricType {}
export enum ToolExecutionPhase {}
export enum ApiRequestPhase {}
export enum FileOperation {}
