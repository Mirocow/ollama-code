/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { FatalConfigError } from '../utils/errors.js';
import { TelemetryTarget } from './index.js';
/**
 * Parse a boolean environment flag. Accepts 'true'/'1' as true.
 */
export function parseBooleanEnvFlag(value) {
    if (value === undefined)
        return undefined;
    return value === 'true' || value === '1';
}
/**
 * Normalize a telemetry target value into TelemetryTarget or undefined.
 */
export function parseTelemetryTargetValue(value) {
    if (value === undefined)
        return undefined;
    if (value === TelemetryTarget.LOCAL || value === 'local') {
        return TelemetryTarget.LOCAL;
    }
    if (value === TelemetryTarget.GCP || value === 'gcp') {
        return TelemetryTarget.GCP;
    }
    return undefined;
}
/**
 * Build TelemetrySettings by resolving from argv (highest), env, then settings.
 */
export async function resolveTelemetrySettings(options) {
    const argv = options.argv ?? {};
    const env = options.env ?? {};
    const settings = options.settings ?? {};
    const enabled = argv.telemetry ??
        parseBooleanEnvFlag(env['OLLAMA_TELEMETRY_ENABLED']) ??
        parseBooleanEnvFlag(env['GEMINI_TELEMETRY_ENABLED']) ?? // Legacy support
        settings.enabled;
    const rawTarget = argv.telemetryTarget ??
        env['OLLAMA_TELEMETRY_TARGET'] ??
        env['GEMINI_TELEMETRY_TARGET'] ?? // Legacy support
        settings.target;
    const target = parseTelemetryTargetValue(rawTarget);
    if (rawTarget !== undefined && target === undefined) {
        throw new FatalConfigError(`Invalid telemetry target: ${String(rawTarget)}. Valid values are: local, gcp`);
    }
    const otlpEndpoint = argv.telemetryOtlpEndpoint ??
        env['OLLAMA_TELEMETRY_OTLP_ENDPOINT'] ??
        env['GEMINI_TELEMETRY_OTLP_ENDPOINT'] ?? // Legacy support
        env['OTEL_EXPORTER_OTLP_ENDPOINT'] ??
        settings.otlpEndpoint;
    const rawProtocol = argv.telemetryOtlpProtocol ??
        env['OLLAMA_TELEMETRY_OTLP_PROTOCOL'] ??
        env['GEMINI_TELEMETRY_OTLP_PROTOCOL'] ?? // Legacy support
        settings.otlpProtocol;
    const otlpProtocol = ['grpc', 'http'].find((p) => p === rawProtocol);
    if (rawProtocol !== undefined && otlpProtocol === undefined) {
        throw new FatalConfigError(`Invalid telemetry OTLP protocol: ${String(rawProtocol)}. Valid values are: grpc, http`);
    }
    const logPrompts = argv.telemetryLogPrompts ??
        parseBooleanEnvFlag(env['OLLAMA_TELEMETRY_LOG_PROMPTS']) ??
        parseBooleanEnvFlag(env['GEMINI_TELEMETRY_LOG_PROMPTS']) ?? // Legacy support
        settings.logPrompts;
    const outfile = argv.telemetryOutfile ??
        env['OLLAMA_TELEMETRY_OUTFILE'] ??
        env['GEMINI_TELEMETRY_OUTFILE'] ?? // Legacy support
        settings.outfile;
    const useCollector = parseBooleanEnvFlag(env['OLLAMA_TELEMETRY_USE_COLLECTOR']) ??
        parseBooleanEnvFlag(env['GEMINI_TELEMETRY_USE_COLLECTOR']) ?? // Legacy support
        settings.useCollector;
    return {
        enabled,
        target,
        otlpEndpoint,
        otlpProtocol,
        logPrompts,
        outfile,
        useCollector,
    };
}
//# sourceMappingURL=config.js.map