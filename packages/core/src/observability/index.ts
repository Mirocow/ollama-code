/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Observability Module
 * Provides OpenTelemetry integration, Prometheus metrics export,
 * and distributed tracing capabilities.
 */

export {
  TelemetryService,
  telemetryService,
  type TelemetryServiceConfig,
  type TelemetryStats,
} from './telemetryService.js';

export {
  MetricsCollector,
  metricsCollector,
  type MetricsConfig,
  type MetricValue,
  type MetricType,
  type MetricDefinition,
} from './metricsCollector.js';

export {
  PrometheusExporter,
  type PrometheusConfig,
  type PrometheusMetric,
} from './prometheusExporter.js';

export {
  Tracer,
  tracer,
  Span,
  SpanContext,
  type SpanKind,
  type SpanStatus,
  type TracerConfig,
  type SpanOptions,
  type SpanEvent,
} from './tracer.js';

export {
  OpenTelemetryAdapter,
  type OpenTelemetryConfig,
} from './openTelemetryAdapter.js';
