/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

// Types - telemetry has been removed
// This file provides type stubs for compatibility

export interface TelemetryConfig {
  enabled: boolean;
  target?: string;
}

export type { SessionMetrics, ToolCallStats, ModelMetrics, FileMetrics } from './uiTelemetry.js';
